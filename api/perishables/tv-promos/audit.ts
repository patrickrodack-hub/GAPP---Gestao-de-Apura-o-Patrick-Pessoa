import { perishablesTvPromoScraperService } from '../../../src/services/perishablesTvPromoScraper';

export default async function handler(req: any, res: any) {
  if (req.method && req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const products = req.body?.products;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Array de produtos é obrigatório para auditoria' });
    }
    const report = perishablesTvPromoScraperService.auditProductParity(products);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(report);
  } catch (err: any) {
    console.error('[Vercel API /api/perishables/tv-promos/audit] Erro:', err);
    return res.status(500).json({
      error: 'Erro ao executar auditoria de dados de perecíveis',
      message: err?.message || 'Falha de processamento',
    });
  }
}
