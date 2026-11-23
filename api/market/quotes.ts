import { marketQuotesCacheService } from '../../src/services/marketQuotesCacheService';

export default async function handler(_req: any, res: any) {
  try {
    const data = await marketQuotesCacheService.getQuotes();
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Vercel API /api/market/quotes] Erro:', err);
    return res.status(500).json({
      error: 'Erro ao carregar cotações com cache TTL',
      message: err?.message || 'Falha de comunicação',
    });
  }
}
