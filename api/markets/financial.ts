import { getRealFinancialMarkets } from '../../src/services/financialMarketsServerService';
import type { FinancialPeriod } from '../../src/services/financialMarketsService';

export default async function handler(req: any, res: any) {
  try {
    const rawRange = String(req.query?.range || '1mo');
    const allowed: FinancialPeriod[] = ['1d', '5d', '1mo', '3mo', '6mo', '1y'];
    const period: FinancialPeriod = allowed.includes(rawRange as FinancialPeriod)
      ? (rawRange as FinancialPeriod)
      : '1mo';
    const forceFresh = req.query?.fresh === 'true';

    const data = await getRealFinancialMarkets(period, forceFresh);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Vercel API /api/markets/financial] Erro:', err);
    return res.status(500).json({
      error: 'Erro ao consultar cotações financeiras em tempo real',
      message: err?.message || 'Falha de comunicação externa',
    });
  }
}
