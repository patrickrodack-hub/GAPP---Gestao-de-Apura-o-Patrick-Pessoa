import { perishablesTvPromoScraperService } from '../../../src/services/perishablesTvPromoScraper';

export default async function handler(req: any, res: any) {
  try {
    const forceFresh = req.query?.fresh === 'true';
    const data = await perishablesTvPromoScraperService.scrapeTvPromosRealTime(forceFresh);
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Vercel API /api/perishables/tv-promos/scrape] Erro:', err);
    return res.status(500).json({
      error: 'Erro ao executar scraping de ofertas de TV e Encartes RJ',
      message: err?.message || 'Falha de comunicação',
    });
  }
}
