import { scrapeCepeaRealTime } from '../../src/services/cepeaScraper';
import { marketQuotesCacheService } from '../../src/services/marketQuotesCacheService';

export default async function handler(_req: any, res: any) {
  try {
    const cachedMarket = await marketQuotesCacheService.getQuotes();
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(cachedMarket.cepea);
  } catch {
    try {
      const directScrape = await scrapeCepeaRealTime();
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json(directScrape);
    } catch (fallbackErr: any) {
      console.error('[Vercel API /api/cepea/scrape] Erro durante scraping:', fallbackErr);
      return res.status(500).json({
        error: 'Erro ao executar scraping das cotações CEPEA',
        message: fallbackErr?.message || 'Falha de comunicação',
      });
    }
  }
}
