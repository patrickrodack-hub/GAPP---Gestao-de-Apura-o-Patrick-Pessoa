import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import zlib from 'zlib';
import { PdfSalesImportResult, PdfSalesParsedCutItem, PdfSalesStoreTotal } from '../types/erp';
import { INITIAL_STORES } from '../data/initialData';
import {
  decodePdfStreamsAndExtractText,
  extractRawPdfStreamSlices,
} from './pdfSalesClientParser';
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

interface GeminiExtractedStoreTotal {
  storeName: string;
  storeCode?: string;
  rawLabel?: string;
  totalQtyKg: number;
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

function inferMimeType(fileName: string, providedMime?: string): string {
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

/**
 * Descompacta streams FlateDecode de PDFs e decodifica operadores BT..ET e tabelas ToUnicode CMap
 * como fallback determinístico caso GEMINI_API_KEY não esteja configurada no servidor.
 */
function extractPlainTextFallbackFromPdfBuffer(buf: Buffer): string {
  const rawSlices = extractRawPdfStreamSlices(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  const decompressedTexts: string[] = [];

  for (const slice of rawSlices) {
    const sliceBuf = Buffer.from(slice.buffer, slice.byteOffset, slice.byteLength);
    let inflated: Buffer | null = null;
    try {
      inflated = zlib.inflateSync(sliceBuf);
    } catch {
      try {
        inflated = zlib.inflateRawSync(sliceBuf);
      } catch {
        inflated = null;
      }
    }
    if (inflated && inflated.length > 0) {
      decompressedTexts.push(inflated.toString('latin1'));
    } else {
      decompressedTexts.push(sliceBuf.toString('latin1'));
    }
  }

  decompressedTexts.push(buf.toString('latin1'));
  return decodePdfStreamsAndExtractText(decompressedTexts);
}

export async function parseSalesPdfDocument(params: {
  fileName: string;
  fileBase64?: string;
  pdfBase64?: string;
  mimeType?: string;
  rawText?: string;
  stores?: StoreRefLike[];
}): Promise<PdfSalesImportResult> {
  const { fileName, rawText } = params;
  const rawBase64 = params.fileBase64 || params.pdfBase64 || '';
  const storeList: StoreRefLike[] =
    Array.isArray(params.stores) && params.stores.length > 0
      ? params.stores
      : INITIAL_STORES.map(s => ({ id: s.id, code: s.code, name: s.name, city: s.city }));

  // 1. Se o usuário enviou texto tabular explícito para leitura direta
  if (rawText && rawText.trim().length > 0 && !rawBase64) {
    const parsed = parseRawSalesText(rawText, storeList);
    if (parsed.items.length === 0 && parsed.storeTotals.length === 0) {
      throw new Error(
        'Não foi possível identificar cortes bovinos ou linhas de "TOTAL DE <LOJA>" com peso/QTDE no texto informado.'
      );
    }
    const storeMeta = buildRecognizedStoresMetadata(parsed.items);
    return {
      fileName: fileName || 'relatorio-vendas.txt',
      parsedAt: Date.now(),
      parserEngine: 'text_parser',
      rawSummaryNote: `Leitura tabular determinística: ${parsed.items.length} corte(s) e ${parsed.storeTotals.length} total(is) por loja identificado(s).`,
      recognizedStores: storeMeta.recognizedStores,
      storeTotals: parsed.storeTotals,
      unassignedCount: storeMeta.unassignedCount,
      items: parsed.items,
      unclassifiedLines: parsed.unclassifiedLines,
    };
  }

  if (!rawBase64 || rawBase64.trim().length === 0) {
    throw new Error('Nenhum arquivo (PDF ou Imagem) ou texto de relatório de vendas foi enviado para análise.');
  }

  // Detecta data-URL se houver (ex.: data:image/png;base64,...)
  let detectedDataUrlMime = '';
  if (rawBase64.startsWith('data:') && rawBase64.includes(';base64,')) {
    detectedDataUrlMime = rawBase64.slice(5, rawBase64.indexOf(';base64,'));
  }

  const cleanBase64 = rawBase64.includes('base64,')
    ? rawBase64.split('base64,')[1].trim()
    : rawBase64.trim();

  if (cleanBase64.length < 32) {
    throw new Error('O arquivo enviado está vazio ou corrompido.');
  }

  const resolvedMimeType = inferMimeType(fileName, params.mimeType || detectedDataUrlMime);
  if (!SUPPORTED_INLINE_MIME_TYPES.has(resolvedMimeType)) {
    throw new Error(
      `Formato de arquivo não suportado (${resolvedMimeType}). Envie um arquivo PDF, PNG, JPG ou WEBP.`
    );
  }

  const isImageUpload = resolvedMimeType.startsWith('image/');
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  let geminiErrorMsg = '';

  // 2. Motor principal multimodal (PDF ou Imagem) via Gemini API (server-side)
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
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
3. LINHAS DE TOTAL POR LOJA (CRÍTICO — NÃO DUPLICAR EM "cuts"):
   - Sempre que houver uma linha totalizadora de loja/filial no relatório — como "TOTAL DE CM SANTA ROSA", "TOTAL CM SANTA ROSA", "TOTAL DA FILIAL ...", "TOTAL LOJA ..." — NÃO coloque essa linha dentro de "cuts".
   - Em vez disso, extraia OBRIGATORIAMENTE cada linha de total de loja no array "storeTotals", capturando exatamente o valor numérico da coluna "QTDE" / "QTD" / "QUANTIDADE" (em KG) no campo "totalQtyKg", o nome oficial da loja em "storeName" e o texto original da linha em "rawLabel".
   - Ignore apenas o "Total Geral" / "Total da Rede" (soma de todas as lojas juntas).
4. Converta pesos expressos em gramas ou toneladas para KG (ex.: 500g = 0.5). Padrão brasileiro (ex.: 1.350,45) deve virar número decimal 1350.45.
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
              storeTotals: {
                type: Type.ARRAY,
                description: 'Totais individuais por filial encontrados em linhas como "TOTAL DE CM SANTA ROSA" na coluna "QTDE". Nunca inclua "Total Geral" da rede aqui.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    storeName: { type: Type.STRING },
                    storeCode: { type: Type.STRING },
                    rawLabel: { type: Type.STRING },
                    totalQtyKg: { type: Type.NUMBER },
                    revenueR$: { type: Type.NUMBER },
                  },
                  required: ['storeName', 'totalQtyKg'],
                },
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
        storeTotals?: GeminiExtractedStoreTotal[];
        cuts?: GeminiExtractedCut[];
      }>(response.text || '');

      const rawCuts = Array.isArray(parsedJson.cuts) ? parsedJson.cuts : [];
      const rawStoreTotals = Array.isArray(parsedJson.storeTotals) ? parsedJson.storeTotals : [];
      const distinctItemStores = new Set(
        rawCuts
          .map(c => [c?.storeCode, c?.storeName].filter(Boolean).join(' ').trim().toLowerCase())
          .filter(Boolean)
      );
      // Só aplica documentStoreName como fallback se o corte não tiver loja própria E o documento não for multifilial
      const docLevelStore =
        distinctItemStores.size <= 1 && rawStoreTotals.length <= 1
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

      const storeTotals: PdfSalesStoreTotal[] = rawStoreTotals
        .filter(st => st && Number(st.totalQtyKg) > 0)
        .map(st => {
          const rawTextRef = [st.storeCode, st.storeName, st.rawLabel].filter(Boolean).join(' ').trim();
          const matched = matchStoreReference(rawTextRef, storeList);
          return {
            storeId: matched?.storeId,
            storeName: matched?.storeName || String(st.storeName || st.rawLabel || '').trim(),
            rawLabel: st.rawLabel?.trim() || st.storeName?.trim() || undefined,
            totalQtyKg: Number(Number(st.totalQtyKg).toFixed(2)),
            revenueR$: st.revenueR$ && Number(st.revenueR$) > 0 ? Number(st.revenueR$) : undefined,
            source: 'report_total_row' as const,
          };
        })
        .filter(st => st.storeName.length > 0);

      if (items.length > 0 || storeTotals.length > 0) {
        const storeMeta = buildRecognizedStoresMetadata(items);
        return {
          fileName: fileName || (isImageUpload ? 'relatorio-vendas.png' : 'relatorio-vendas.pdf'),
          parsedAt: Date.now(),
          parserEngine: 'gemini',
          rawSummaryNote:
            parsedJson.summaryNote ||
            `${items.length} corte(s) e ${storeTotals.length} total(is) de loja extraído(s) em ${Math.max(storeMeta.recognizedStores.length, storeTotals.length)} filial(is).`,
          recognizedStores: storeMeta.recognizedStores,
          storeTotals,
          unassignedCount: storeMeta.unassignedCount,
          items,
          unclassifiedLines: [],
        };
      }

      geminiErrorMsg =
        'A análise do documento não localizou cortes bovinos com peso em KG válidos.';
    } catch (err: any) {
      console.error('[pdfSalesParserServer] Erro Gemini:', err);
      geminiErrorMsg = err?.message || 'Falha na leitura inteligente do documento.';
    }
  } else {
    geminiErrorMsg = 'Chave GEMINI_API_KEY não configurada no servidor.';
  }

  // 3. Fallback determinístico textual apenas para PDFs ou rawText anexo
  if (!isImageUpload) {
    try {
      const buffer = Buffer.from(cleanBase64, 'base64');
      const extractedText = [rawText || '', extractPlainTextFallbackFromPdfBuffer(buffer)]
        .join('\n')
        .trim();
      if (extractedText.length > 10) {
        const parsed = parseRawSalesText(extractedText, storeList);
        if (parsed.items.length > 0 || parsed.storeTotals.length > 0) {
          const storeMeta = buildRecognizedStoresMetadata(parsed.items);
          return {
            fileName: fileName || 'relatorio-vendas.pdf',
            parsedAt: Date.now(),
            parserEngine: 'text_parser',
            rawSummaryNote: `Extração textual direta do PDF: ${parsed.items.length} corte(s) e ${parsed.storeTotals.length} total(is) por loja identificado(s).`,
            recognizedStores: storeMeta.recognizedStores,
            storeTotals: parsed.storeTotals,
            unassignedCount: storeMeta.unassignedCount,
            items: parsed.items,
            unclassifiedLines: parsed.unclassifiedLines,
          };
        }
      }
    } catch (fallbackErr) {
      console.warn('[pdfSalesParserServer] Fallback textual sem correspondências:', fallbackErr);
    }
  }

  throw new Error(
    geminiErrorMsg ||
      'Não foi possível extrair os cortes vendidos deste arquivo. Verifique a nitidez da imagem/PDF ou cole os dados na aba de importação textual.'
  );
}
