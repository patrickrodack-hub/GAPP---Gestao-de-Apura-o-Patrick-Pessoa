import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { INITIAL_STORES } from '../data/initialData';
import { PdfSalesImportResult, PdfSalesParsedCutItem } from '../types/erp';
import {
  StoreRefLike,
  buildRecognizedStoresMetadata,
  classifyBeefCut,
  matchStoreReference,
  parseRawSalesText,
} from './slaughterhouseOrderService';

interface GeminiExtractedCut {
  cutName: string;
  rawCategory?: string;
  storeName?: string;
  storeCode?: string;
  weightKg: number;
  units?: number;
  revenueR$?: number;
}

const SUPPORTED_INLINE_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function inferSalesDocumentMimeType(fileName: string, providedMime?: string): string {
  const cleanMime = String(providedMime || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (cleanMime === 'image/jpg') return 'image/jpeg';
  if (cleanMime && SUPPORTED_INLINE_MIME_TYPES.has(cleanMime)) {
    return cleanMime;
  }

  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  if (lower.endsWith('.pdf')) return 'application/pdf';

  return cleanMime || 'application/pdf';
}

function safeParseModelJson<T>(rawText: string): T {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!cleaned) {
    throw new Error('O leitor retornou uma resposta vazia.');
  }
  return JSON.parse(cleaned) as T;
}

function decodePdfLiteralString(str: string): string {
  return str
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function decodeHexTokenWithCMap(hexStr: string, cmap: Map<string, string>): string {
  const clean = hexStr.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  if (!clean) return '';

  // Se houver mapeamento CMap ToUnicode, tenta casar códigos de 4 ou 2 dígitos hexadecimais
  if (cmap.size > 0) {
    const step = cmap.has(clean.slice(0, 4)) ? 4 : cmap.has(clean.slice(0, 2)) ? 2 : 0;
    if (step > 0) {
      let out = '';
      for (let i = 0; i < clean.length; i += step) {
        const code = clean.slice(i, i + step);
        if (cmap.has(code)) {
          out += cmap.get(code);
        } else {
          const codeNum = parseInt(code, 16);
          if (Number.isFinite(codeNum) && codeNum >= 32) {
            out += String.fromCharCode(codeNum);
          }
        }
      }
      return out;
    }
  }

  // Fallback UTF-16BE ou Latin-1 em hex
  if (clean.length % 4 === 0 && clean.startsWith('00')) {
    let out = '';
    for (let i = 0; i < clean.length; i += 4) {
      const code = parseInt(clean.slice(i, i + 4), 16);
      if (Number.isFinite(code) && code >= 32) {
        out += String.fromCharCode(code);
      }
    }
    if (out.trim()) return out;
  }

  let out = '';
  for (let i = 0; i < clean.length; i += 2) {
    const code = parseInt(clean.slice(i, i + 2), 16);
    if (Number.isFinite(code) && code >= 32) {
      out += String.fromCharCode(code);
    }
  }
  return out;
}

function parseHexToUnicodeString(unicodeHex: string): string {
  const clean = unicodeHex.replace(/[^0-9A-Fa-f]/g, '');
  if (!clean) return '';
  let out = '';
  for (let i = 0; i < clean.length; i += 4) {
    const chunk = clean.slice(i, i + 4);
    const cp = parseInt(chunk, 16);
    if (Number.isFinite(cp) && cp > 0) {
      out += String.fromCharCode(cp);
    }
  }
  return out;
}

/**
 * Decodifica tabelas ToUnicode (beginbfchar / beginbfrange) e operadores de texto PDF (BT ... ET, Tj, TJ, Td, TD, Tm, T*)
 * a partir de uma lista de streams já descompactados.
 */
export function decodePdfStreamsAndExtractText(decompressedStreams: string[]): string {
  const cmap = new Map<string, string>();

  // 1. Extrai mapeamentos ToUnicode CMap (beginbfchar / beginbfrange)
  for (const streamText of decompressedStreams) {
    if (!streamText.includes('beginbfchar') && !streamText.includes('beginbfrange')) continue;

    const bfCharBlocks = streamText.match(/beginbfchar([\s\S]*?)endbfchar/g) || [];
    for (const block of bfCharBlocks) {
      const pairs = block.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g);
      for (const match of pairs) {
        const src = match[1].toUpperCase();
        const dst = parseHexToUnicodeString(match[2]);
        if (dst) cmap.set(src, dst);
      }
    }

    const bfRangeBlocks = streamText.match(/beginbfrange([\s\S]*?)endbfrange/g) || [];
    for (const block of bfRangeBlocks) {
      const ranges = block.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g);
      for (const match of ranges) {
        const startHex = match[1].toUpperCase();
        const endHex = match[2].toUpperCase();
        const targetStart = parseInt(match[3], 16);
        const startCode = parseInt(startHex, 16);
        const endCode = parseInt(endHex, 16);
        const width = startHex.length;
        if (
          Number.isFinite(startCode) &&
          Number.isFinite(endCode) &&
          Number.isFinite(targetStart) &&
          endCode >= startCode &&
          endCode - startCode <= 512
        ) {
          for (let c = startCode; c <= endCode; c++) {
            const key = c.toString(16).toUpperCase().padStart(width, '0');
            cmap.set(key, String.fromCharCode(targetStart + (c - startCode)));
          }
        }
      }
    }
  }

  // 2. Percorre cada stream extraindo blocos de texto (BT ... ET) e reconstruindo linhas por coordenada Y
  const lines: string[] = [];

  for (const streamText of decompressedStreams) {
    if (streamText.includes('beginbfchar') || streamText.includes('beginbfrange')) continue;

    const btBlocks = streamText.match(/BT[\s\S]*?ET/g) || [streamText];
    let currentLineTokens: string[] = [];
    let lastY: number | null = null;

    const flushLine = () => {
      if (currentLineTokens.length > 0) {
        const joined = currentLineTokens.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) lines.push(joined);
        currentLineTokens = [];
      }
    };

    for (const block of btBlocks) {
      // Tokeniza operadores relevantes: posicionamento (Tm, Td, TD, T*) e pintura de texto (Tj, TJ, ', ")
      const tokenRegex =
        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(?:Td|TD)|(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm|\bT\*|\[([\s\S]*?)\]\s*TJ|\((?:\\.|[^\\()])*\)\s*(?:Tj|'|")|<([0-9A-Fa-f\s]+)>\s*Tj/g;

      let match: RegExpExecArray | null;
      while ((match = tokenRegex.exec(block)) !== null) {
        const full = match[0];

        if (match[1] !== undefined && match[2] !== undefined) {
          // Td / TD: deslocamento relativo (dx, dy)
          const dy = parseFloat(match[2]);
          if (Math.abs(dy) > 1.5) {
            flushLine();
          }
          continue;
        }

        if (match[7] !== undefined && match[8] !== undefined) {
          // Tm: matriz absoluta (a b c d e f), onde f = match[8] é a coordenada Y
          const y = parseFloat(match[8]);
          if (lastY !== null && Math.abs(y - lastY) > 2.5) {
            flushLine();
          }
          lastY = y;
          continue;
        }

        if (full === 'T*') {
          flushLine();
          continue;
        }

        if (match[9] !== undefined) {
          // Array [...] TJ
          const arrBody = match[9];
          const subRegex = /\((?:\\.|[^\\()])*\)|<([0-9A-Fa-f\s]+)>|(-?\d+(?:\.\d+)?)/g;
          let piece = '';
          let subMatch: RegExpExecArray | null;
          while ((subMatch = subRegex.exec(arrBody)) !== null) {
            const subFull = subMatch[0];
            if (subFull.startsWith('(')) {
              piece += decodePdfLiteralString(subFull.slice(1, -1));
            } else if (subMatch[1] !== undefined) {
              piece += decodeHexTokenWithCMap(subMatch[1], cmap);
            } else if (subMatch[2] !== undefined) {
              const kern = parseFloat(subMatch[2]);
              // Espaçamento negativo grande no TJ representa separação entre palavras/colunas
              if (kern < -180) piece += ' ';
            }
          }
          if (piece.trim()) currentLineTokens.push(piece.trim());
          continue;
        }

        if (match[10] !== undefined) {
          // <hex> Tj
          const decoded = decodeHexTokenWithCMap(match[10], cmap);
          if (decoded.trim()) currentLineTokens.push(decoded.trim());
          continue;
        }

        if (full.startsWith('(')) {
          const closeIdx = full.lastIndexOf(')');
          if (closeIdx > 0) {
            const decoded = decodePdfLiteralString(full.slice(1, closeIdx));
            if (decoded.trim()) currentLineTokens.push(decoded.trim());
          }
        }
      }
      flushLine();
    }
  }

  return lines.join('\n');
}

/**
 * Localiza todos os blocos `stream ... endstream` dentro de um array de bytes de PDF.
 */
export function extractRawPdfStreamSlices(pdfBytes: Uint8Array): Uint8Array[] {
  const latin = new TextDecoder('latin1').decode(pdfBytes);
  const slices: Uint8Array[] = [];
  let cursor = 0;

  while (cursor < latin.length) {
    const streamIdx = latin.indexOf('stream', cursor);
    if (streamIdx === -1) break;

    // Garante que não é 'endstream'
    if (streamIdx >= 3 && latin.slice(streamIdx - 3, streamIdx) === 'end') {
      cursor = streamIdx + 6;
      continue;
    }

    let dataStart = streamIdx + 6;
    if (latin[dataStart] === '\r' && latin[dataStart + 1] === '\n') {
      dataStart += 2;
    } else if (latin[dataStart] === '\n' || latin[dataStart] === '\r') {
      dataStart += 1;
    } else {
      cursor = streamIdx + 6;
      continue;
    }

    const endIdx = latin.indexOf('endstream', dataStart);
    if (endIdx === -1) break;

    let dataEnd = endIdx;
    if (latin[dataEnd - 2] === '\r' && latin[dataEnd - 1] === '\n') {
      dataEnd -= 2;
    } else if (latin[dataEnd - 1] === '\n' || latin[dataEnd - 1] === '\r') {
      dataEnd -= 1;
    }

    if (dataEnd > dataStart) {
      slices.push(pdfBytes.subarray(dataStart, dataEnd));
    }
    cursor = endIdx + 9;
  }

  return slices;
}

async function tryDecompressInBrowser(
  slice: Uint8Array,
  format: 'deflate' | 'deflate-raw'
): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const ds = new DecompressionStream(format);
    const writer = ds.writable.getWriter();
    writer.write(new Uint8Array(slice)).catch(() => {});
    writer.close().catch(() => {});

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let totalLen = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalLen += value.byteLength;
      }
    }

    if (totalLen === 0) return null;
    const out = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    return out;
  } catch {
    return null;
  }
}

export async function extractTextFromPdfBase64InBrowser(cleanBase64: string): Promise<string> {
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const rawSlices = extractRawPdfStreamSlices(bytes);
  const decompressedTexts: string[] = [];
  const decoder = new TextDecoder('latin1');

  for (const slice of rawSlices) {
    const inflated =
      (await tryDecompressInBrowser(slice, 'deflate')) ||
      (await tryDecompressInBrowser(slice, 'deflate-raw'));
    if (inflated && inflated.byteLength > 0) {
      decompressedTexts.push(decoder.decode(inflated));
    } else {
      decompressedTexts.push(decoder.decode(slice));
    }
  }

  // Inclui também o corpo bruto caso haja texto fora de streams comprimidos
  decompressedTexts.push(decoder.decode(bytes));

  return decodePdfStreamsAndExtractText(decompressedTexts);
}

/**
 * Executa a análise completa do documento (PDF, Imagem ou Texto) diretamente no navegador (Client-Side).
 * Garante funcionamento 100% operacional tanto no ambiente de desenvolvimento quanto no link publicado/preview (onde POST /api/* pode retornar HTTP 405).
 */
export async function parseSalesDocumentClientSide(params: {
  fileName: string;
  fileBase64?: string;
  mimeType?: string;
  rawText?: string;
  stores?: StoreRefLike[];
}): Promise<PdfSalesImportResult> {
  const { fileName, rawText } = params;
  const rawBase64 = params.fileBase64 || '';
  const storeList: StoreRefLike[] =
    Array.isArray(params.stores) && params.stores.length > 0
      ? params.stores
      : INITIAL_STORES.map(s => ({ id: s.id, code: s.code, name: s.name, city: s.city }));

  // 1. Texto colado diretamente
  if (rawText && rawText.trim().length > 0 && !rawBase64) {
    const parsed = parseRawSalesText(rawText, storeList);
    if (parsed.items.length === 0) {
      throw new Error(
        'Não foi possível identificar cortes bovinos com peso (KG) no texto informado. Verifique se cada linha contém o nome do corte e a quantidade em KG.'
      );
    }
    const storeMeta = buildRecognizedStoresMetadata(parsed.items);
    return {
      fileName: fileName || 'relatorio-vendas.txt',
      parsedAt: Date.now(),
      parserEngine: 'text_parser',
      rawSummaryNote: `Leitura tabular determinística: ${parsed.items.length} corte(s) identificado(s) em ${storeMeta.recognizedStores.length} filial(is).`,
      recognizedStores: storeMeta.recognizedStores,
      unassignedCount: storeMeta.unassignedCount,
      items: parsed.items,
      unclassifiedLines: parsed.unclassifiedLines,
    };
  }

  const cleanBase64 = rawBase64.includes('base64,')
    ? rawBase64.split('base64,')[1].trim()
    : rawBase64.trim();

  if (!cleanBase64 || cleanBase64.length < 32) {
    throw new Error('O arquivo enviado está vazio ou corrompido.');
  }

  const resolvedMimeType = inferSalesDocumentMimeType(fileName, params.mimeType);
  const isImageUpload = resolvedMimeType.startsWith('image/');

  // 2. Motor Multimodal Gemini no Navegador (quando GEMINI_API_KEY está disponível no bundle)
  const clientApiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    '';

  let geminiErrorMsg = '';
  if (clientApiKey && String(clientApiKey).trim().length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey: String(clientApiKey).trim(),
      });

      const storeCatalogPrompt = storeList
        .map((s, i) => `${i + 1}. Código: ${s.code || s.id} | Nome oficial: "${s.name}" (${s.city || 'RJ'})`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          {
            inlineData: {
              mimeType: resolvedMimeType,
              data: cleanBase64,
            },
          },
          `Você é um analista técnico de açougue e controladoria de rede supermercadista.
Analise este ${isImageUpload ? 'print/imagem de relatório de vendas' : 'documento PDF de vendas'} de carnes/cortes bovinos do início ao fim (TODAS as páginas, tabelas e blocos) e extraia TODOS os cortes vendidos com seus respectivos pesos em KG e a FILIAL / LOJA correspondente.

CATÁLOGO OFICIAL DAS FILIAIS DA REDE (USE PARA IDENTIFICAR A FILIAL EXATA DE CADA LINHA/SEÇÃO):
${storeCatalogPrompt}

REGRAS ESTRITAS E OBRIGATÓRIAS:
1. Extraia SOMENTE cortes reais e valores reais visíveis no documento/imagem. Nunca invente, estime ou arredonde artificialmente os pesos.
2. LEITURA COMPLETA DE TODAS AS FILIAIS E PÁGINAS:
   - Percorra TODAS as páginas e seções do documento sem omitir ou resumir nenhuma loja. Todas as filiais presentes no arquivo devem ter seus cortes listados integralmente em "cuts".
   - Se o documento mostrar vendas separadas por loja/filial (em blocos/seções por filial, colunas por filial ou uma coluna de loja), informe em CADA item os campos storeName e storeCode exatamente da filial a que aquele valor pertence.
   - Somente preencha documentStoreName se o documento inteiro pertencer a uma única loja; se houver 2 ou mais lojas no documento, deixe documentStoreName em branco e preencha storeName/storeCode em cada item.
   - NUNCA misture ou divida valores entre lojas: cada filial deve manter estritamente o seu próprio valor vendido em KG.
3. Ignore linhas de subtotais gerais ou totalizadores finais ("Total Geral", "Total Rede") para não duplicar o peso vendido.
4. Converta pesos expressos em gramas ou toneladas para KG (ex.: 500g = 0.5). Padrão brasileiro (ex.: 350,45 kg) deve virar número decimal 350.45.
5. Preserve o nome original do corte em cutName e, se houver seção/grupo (Segunda, Nobre, Traseiro, Coxão, Costela), preencha rawCategory.`,
        ],
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryNote: {
                type: Type.STRING,
                description: 'Breve resumo factual do documento analisado (período, quantidade total de filiais encontradas).',
              },
              documentStoreName: {
                type: Type.STRING,
                description: 'Preencha SOMENTE se o arquivo inteiro for de uma única filial. Deixe vazio se houver múltiplas filiais.',
              },
              cuts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cutName: { type: Type.STRING },
                    rawCategory: { type: Type.STRING },
                    storeName: { type: Type.STRING },
                    storeCode: { type: Type.STRING },
                    weightKg: { type: Type.NUMBER },
                    units: { type: Type.NUMBER },
                    revenueR$: { type: Type.NUMBER },
                  },
                  required: ['cutName', 'weightKg'],
                },
              },
            },
            required: ['cuts'],
          },
        },
      });

      const parsedJson = safeParseModelJson<{
        summaryNote?: string;
        documentStoreName?: string;
        cuts?: GeminiExtractedCut[];
      }>(response.text || '');

      const rawCuts = Array.isArray(parsedJson.cuts) ? parsedJson.cuts : [];
      const distinctItemStores = new Set(
        rawCuts
          .map(c => [c?.storeCode, c?.storeName].filter(Boolean).join(' ').trim().toLowerCase())
          .filter(Boolean)
      );
      const docLevelStore =
        distinctItemStores.size <= 1
          ? matchStoreReference(parsedJson.documentStoreName, storeList)
          : null;

      const items: PdfSalesParsedCutItem[] = rawCuts
        .filter(c => c && typeof c.cutName === 'string' && Number(c.weightKg) > 0)
        .map((c, idx) => {
          const classified = classifyBeefCut(c.cutName, c.rawCategory);
          const rawStoreText = [c.storeCode, c.storeName].filter(Boolean).join(' ').trim();
          const itemStoreMatch =
            matchStoreReference(rawStoreText, storeList) || (!rawStoreText ? docLevelStore : null);

          return {
            id: `doc-cut-${Date.now()}-${idx}`,
            cutName: c.cutName.trim(),
            rawCategory: c.rawCategory?.trim() || undefined,
            rawStore:
              rawStoreText ||
              (!rawStoreText && distinctItemStores.size <= 1
                ? parsedJson.documentStoreName?.trim()
                : undefined) ||
              undefined,
            matchedStoreId: itemStoreMatch?.storeId,
            matchedStoreName: itemStoreMatch?.storeName,
            category: classified.category,
            desossaGroup: classified.desossaGroup,
            weightKg: Number(Number(c.weightKg).toFixed(2)),
            units: c.units && Number(c.units) > 0 ? Number(c.units) : undefined,
            revenueR$: c.revenueR$ && Number(c.revenueR$) > 0 ? Number(c.revenueR$) : undefined,
            matchedBy: classified.matchedBy,
          };
        });

      if (items.length > 0) {
        const storeMeta = buildRecognizedStoresMetadata(items);
        return {
          fileName: fileName || (isImageUpload ? 'relatorio-vendas.png' : 'relatorio-vendas.pdf'),
          parsedAt: Date.now(),
          parserEngine: 'gemini',
          rawSummaryNote:
            parsedJson.summaryNote ||
            `${items.length} corte(s) extraído(s) e vinculados a ${storeMeta.recognizedStores.length} filial(is).`,
          recognizedStores: storeMeta.recognizedStores,
          unassignedCount: storeMeta.unassignedCount,
          items,
          unclassifiedLines: [],
        };
      }
    } catch (err: any) {
      console.warn('[pdfSalesClientParser] Falha no motor multimodal client-side:', err);
      geminiErrorMsg = err?.message || '';
    }
  }

  // 3. Descompressor nativo de PDF no navegador (FlateDecode + ToUnicode CMap + Parser Tabular)
  if (!isImageUpload) {
    try {
      const extractedText = await extractTextFromPdfBase64InBrowser(cleanBase64);
      if (extractedText && extractedText.trim().length > 5) {
        const parsed = parseRawSalesText(extractedText, storeList);
        if (parsed.items.length > 0) {
          const storeMeta = buildRecognizedStoresMetadata(parsed.items);
          return {
            fileName: fileName || 'relatorio-vendas.pdf',
            parsedAt: Date.now(),
            parserEngine: 'text_parser',
            rawSummaryNote: `Extração nativa do PDF: ${parsed.items.length} corte(s) identificado(s) em ${storeMeta.recognizedStores.length} filial(is).`,
            recognizedStores: storeMeta.recognizedStores,
            unassignedCount: storeMeta.unassignedCount,
            items: parsed.items,
            unclassifiedLines: parsed.unclassifiedLines,
          };
        }
      }
    } catch (pdfErr) {
      console.warn('[pdfSalesClientParser] Erro na descompressão nativa do PDF:', pdfErr);
    }
  }

  throw new Error(
    geminiErrorMsg ||
      'Não foi possível extrair automaticamente os cortes deste arquivo. Verifique se o PDF/imagem está legível ou cole as linhas na aba "Colar Relatório Tabular de Vendas".'
  );
}
