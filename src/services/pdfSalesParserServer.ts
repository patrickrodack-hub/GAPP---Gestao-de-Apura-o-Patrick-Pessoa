import { GoogleGenAI, Type } from '@google/genai';
import { PdfSalesImportResult, PdfSalesParsedCutItem } from '../types/erp';
import { classifyBeefCut, parseRawSalesText } from './slaughterhouseOrderService';

interface GeminiExtractedCut {
  cutName: string;
  rawCategory?: string;
  weightKg: number;
  units?: number;
  revenueR$?: number;
}

/**
 * Extrai texto básico legível de streams não compactados de PDF como fallback determinístico
 * caso GEMINI_API_KEY não esteja configurada no ambiente local.
 */
function extractPlainTextFallbackFromPdfBuffer(buf: Buffer): string {
  const latin = buf.toString('latin1');
  const chunks: string[] = [];
  const tjMatches = latin.match(/\(([^()\\]{2,120})\)\s*Tj/g) || [];
  for (const m of tjMatches) {
    const inner = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
    chunks.push(inner);
  }
  const tjArrayMatches = latin.match(/\[(.*?)\]\s*TJ/g) || [];
  for (const arr of tjArrayMatches) {
    const innerStrings = arr.match(/\(([^()\\]{1,120})\)/g) || [];
    chunks.push(innerStrings.map(s => s.slice(1, -1)).join(''));
  }
  return chunks.join('\n');
}

export async function parseSalesPdfDocument(params: {
  fileName: string;
  pdfBase64?: string;
  rawText?: string;
}): Promise<PdfSalesImportResult> {
  const { fileName, pdfBase64, rawText } = params;

  // 1. Se o usuário enviou texto tabular explícito para leitura direta
  if (rawText && rawText.trim().length > 0 && !pdfBase64) {
    const parsed = parseRawSalesText(rawText);
    if (parsed.items.length === 0) {
      throw new Error(
        'Não foi possível identificar cortes bovinos com peso (KG) no texto informado. Verifique se cada linha contém o nome do corte e a quantidade em KG.'
      );
    }
    return {
      fileName: fileName || 'relatorio-vendas.txt',
      parsedAt: Date.now(),
      parserEngine: 'text_parser',
      rawSummaryNote: `Leitura tabular determinística: ${parsed.items.length} corte(s) identificado(s).`,
      items: parsed.items,
      unclassifiedLines: parsed.unclassifiedLines,
    };
  }

  if (!pdfBase64 || pdfBase64.trim().length === 0) {
    throw new Error('Nenhum arquivo PDF ou texto de relatório de vendas foi enviado para análise.');
  }

  const cleanBase64 = pdfBase64.includes('base64,')
    ? pdfBase64.split('base64,')[1].trim()
    : pdfBase64.trim();

  if (cleanBase64.length < 32) {
    throw new Error('O arquivo PDF enviado está vazio ou inválido.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let geminiErrorMsg = '';

  // 2. Motor principal de leitura inteligente de PDF via Gemini API (server-side)
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

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64,
            },
          },
          `Você é um analista técnico de açougue e controladoria de frigorífico.
Analise este documento PDF de relatório de vendas de carnes/cortes bovinos e extraia TODOS os itens/cortes vendidos listados no documento.

REGRAS ESTRITAS:
1. Extraia SOMENTE cortes reais que aparecem explicitamente no documento. Nunca invente, estime ou simule números.
2. Ignore linhas de subtotais gerais, rodapés ou cabeçalhos para não duplicar o peso vendido.
3. Converta pesos expressos em gramas ou toneladas para KG (ex.: 500g = 0.5). Se o peso estiver em padrão brasileiro com vírgula (ex.: 350,45 kg), retorne como número decimal 350.45.
4. Preserve o nome original do corte em cutName e, se houver seção/grupo no relatório (ex.: Segunda, Nobre, Traseiro, Coxão, Costela), informe em rawCategory.`,
        ],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryNote: {
                type: Type.STRING,
                description: 'Breve resumo factual do relatório encontrado no PDF (período, loja se houver, total de linhas).',
              },
              cuts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cutName: { type: Type.STRING },
                    rawCategory: { type: Type.STRING },
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

      const jsonText = response.text?.trim() || '{}';
      const parsedJson = JSON.parse(jsonText) as {
        summaryNote?: string;
        cuts?: GeminiExtractedCut[];
      };

      const rawCuts = Array.isArray(parsedJson.cuts) ? parsedJson.cuts : [];
      const items: PdfSalesParsedCutItem[] = rawCuts
        .filter(c => c && typeof c.cutName === 'string' && Number(c.weightKg) > 0)
        .map((c, idx) => {
          const classified = classifyBeefCut(c.cutName, c.rawCategory);
          return {
            id: `pdf-cut-${Date.now()}-${idx}`,
            cutName: c.cutName.trim(),
            rawCategory: c.rawCategory?.trim() || undefined,
            category: classified.category,
            desossaGroup: classified.desossaGroup,
            weightKg: Number(Number(c.weightKg).toFixed(2)),
            units: c.units && Number(c.units) > 0 ? Number(c.units) : undefined,
            revenueR$: c.revenueR$ && Number(c.revenueR$) > 0 ? Number(c.revenueR$) : undefined,
            matchedBy: classified.matchedBy,
          };
        });

      if (items.length > 0) {
        return {
          fileName: fileName || 'relatorio-vendas.pdf',
          parsedAt: Date.now(),
          parserEngine: 'gemini',
          rawSummaryNote: parsedJson.summaryNote || `${items.length} corte(s) extraído(s) do PDF e classificado(s) pela Desossa.`,
          items,
          unclassifiedLines: [],
        };
      }

      geminiErrorMsg = 'A análise do PDF não localizou cortes bovinos com peso em KG no documento.';
    } catch (err: any) {
      console.error('[pdfSalesParserServer] Erro Gemini:', err);
      geminiErrorMsg = err?.message || 'Falha na leitura inteligente do PDF.';
    }
  } else {
    geminiErrorMsg = 'Chave GEMINI_API_KEY não configurada no servidor.';
  }

  // 3. Fallback determinístico para PDFs com stream de texto legível ou rawText anexo
  try {
    const buffer = Buffer.from(cleanBase64, 'base64');
    const extractedText = [rawText || '', extractPlainTextFallbackFromPdfBuffer(buffer)].join('\n').trim();
    if (extractedText.length > 10) {
      const parsed = parseRawSalesText(extractedText);
      if (parsed.items.length > 0) {
        return {
          fileName: fileName || 'relatorio-vendas.pdf',
          parsedAt: Date.now(),
          parserEngine: 'text_parser',
          rawSummaryNote: `Extração textual direta do PDF: ${parsed.items.length} corte(s) identificado(s).`,
          items: parsed.items,
          unclassifiedLines: parsed.unclassifiedLines,
        };
      }
    }
  } catch (fallbackErr) {
    console.warn('[pdfSalesParserServer] Fallback textual sem correspondências:', fallbackErr);
  }

  throw new Error(
    geminiErrorMsg ||
      'Não foi possível extrair os cortes vendidos deste PDF. Tente colar o texto das linhas de vendas na aba de importação textual.'
  );
}
