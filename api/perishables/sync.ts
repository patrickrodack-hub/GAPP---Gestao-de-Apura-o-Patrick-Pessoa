import { perishablesTvPromoScraperService } from '../../src/services/perishablesTvPromoScraper';

export default async function handler(req: any, res: any) {
  try {
    const products = req.body?.products;
    const data = await perishablesTvPromoScraperService.syncAllPerishablesRealTime(products);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Vercel API /api/perishables/sync] Erro:', err);
    return res.status(500).json({
      error: 'Erro ao executar sincronização de perecíveis com fontes do RJ',
      message: err?.message || 'Falha de comunicação',
    });
  }
}
