import { parseSalesPdfDocument } from '../../src/services/pdfSalesParserServer';

export default async function handler(req: any, res: any) {
  try {
    const { fileName, fileBase64, pdfBase64, mimeType, rawText, stores } = req.body || {};
    const result = await parseSalesPdfDocument({
      fileName: String(fileName || 'vendas-cortes.pdf'),
      fileBase64: typeof fileBase64 === 'string' ? fileBase64 : undefined,
      pdfBase64: typeof pdfBase64 === 'string' ? pdfBase64 : undefined,
      mimeType: typeof mimeType === 'string' ? mimeType : undefined,
      rawText: typeof rawText === 'string' ? rawText : undefined,
      stores: Array.isArray(stores) ? stores : undefined,
    });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Vercel API /api/slaughterhouse-order/parse-sales-pdf] Erro:', err);
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 422;
    return res.status(status).json({
      error: 'Não foi possível processar o documento de vendas',
      message: err?.message || 'Falha ao extrair cortes vendidos do documento',
    });
  }
}
