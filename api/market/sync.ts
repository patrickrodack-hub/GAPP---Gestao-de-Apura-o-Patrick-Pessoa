import { marketQuotesCacheService } from '../../src/services/marketQuotesCacheService';

export default async function handler(_req: any, res: any) {
  try {
    const data = await marketQuotesCacheService.forceSync();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Vercel API /api/market/sync] Erro:', err);
    return res.status(500).json({
      error: 'Erro ao forçar sincronização de mercado',
      message: err?.message || 'Falha de comunicação',
    });
  }
}
