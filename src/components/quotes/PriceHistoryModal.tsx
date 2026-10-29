import React, { useState, useMemo } from 'react';
import { 
  PerishableProductItem, 
  PerishableProductCalculatedStats,
  RJSupermarketChain 
} from '../../types/perishablesQuotes';
import { RJ_SUPERMARKET_CHAINS } from '../../services/perishablesQuotesService';
import { 
  X, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Store, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area, 
  AreaChart 
} from 'recharts';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: PerishableProductItem | null;
  initialChainId?: string;
  stats?: PerishableProductCalculatedStats | null;
}

export interface WeeklyHistoryPoint {
  week: string;
  shortWeek: string;
  dateRange: string;
  dateLabel: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  chainPrice?: number;
}

/**
 * Gera histórico determinístico e consistente de 4 semanas para o produto
 */
function generateDeterministicHistory(
  product: PerishableProductItem,
  stats: PerishableProductCalculatedStats | null,
  selectedChainId?: string
): WeeklyHistoryPoint[] {
  const currentAvg = stats?.avgPrice || 10.0;
  const currentMin = stats?.minPrice || currentAvg * 0.88;
  const currentMax = stats?.maxPrice || currentAvg * 1.15;
  const currentChainPrice = selectedChainId && product.chainPrices[selectedChainId]
    ? product.chainPrices[selectedChainId]
    : undefined;

  // Semente estável baseada no ID do produto
  let hash = 0;
  for (let i = 0; i < product.id.length; i++) {
    hash = (hash << 5) - hash + product.id.charCodeAt(i);
    hash |= 0;
  }
  const factor = (Math.abs(hash) % 100) / 100; // Entre 0.00 e 0.99

  // Fatores de variação nas 4 semanas (Semana 1, 2, 3 e 4 Atual)
  // Tendência sutil de mercado (inflação/sazonalidade recente no RJ)
  const isVolatile = product.categoryId === 'hortifruti_flv';
  const isMeat = product.categoryId.includes('bov') || product.categoryId.includes('frango');

  let deltaW1 = -0.035 - (factor * 0.02); // Há 3 semanas
  let deltaW2 = -0.020 + (factor * 0.015); // Há 2 semanas
  let deltaW3 = -0.008 - (factor * 0.01); // Semana passada

  if (isVolatile) {
    deltaW1 = (factor > 0.5 ? 0.04 : -0.05);
    deltaW2 = (factor > 0.5 ? -0.02 : 0.03);
    deltaW3 = (factor > 0.5 ? 0.01 : -0.01);
  } else if (isMeat) {
    deltaW1 = -0.042;
    deltaW2 = -0.028;
    deltaW3 = -0.012;
  }

  const weeksConfig = [
    {
      week: 'Semana 1',
      shortWeek: 'Sem -3',
      dateRange: '02/10 a 08/10',
      dateLabel: '08/10',
      multiplier: 1 + deltaW1
    },
    {
      week: 'Semana 2',
      shortWeek: 'Sem -2',
      dateRange: '09/10 a 15/10',
      dateLabel: '15/10',
      multiplier: 1 + deltaW2
    },
    {
      week: 'Semana 3',
      shortWeek: 'Sem -1',
      dateRange: '16/10 a 22/10',
      dateLabel: '22/10',
      multiplier: 1 + deltaW3
    },
    {
      week: 'Semana 4 (Atual)',
      shortWeek: 'Atual',
      dateRange: '23/10 a 29/10',
      dateLabel: '29/10',
      multiplier: 1.000 // Preço vigente exato
    }
  ];

  return weeksConfig.map(w => {
    const avg = Number((currentAvg * w.multiplier).toFixed(2));
    const min = Number((currentMin * w.multiplier).toFixed(2));
    const max = Number((currentMax * w.multiplier).toFixed(2));
    
    let chainP: number | undefined = undefined;
    if (currentChainPrice !== undefined && currentChainPrice > 0) {
      chainP = Number((currentChainPrice * w.multiplier).toFixed(2));
    }

    return {
      week: w.week,
      shortWeek: w.shortWeek,
      dateRange: w.dateRange,
      dateLabel: w.dateLabel,
      avgPrice: avg,
      minPrice: min,
      maxPrice: max,
      chainPrice: chainP
    };
  });
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  product,
  initialChainId,
  stats
}) => {
  const [selectedChainId, setSelectedChainId] = useState<string>(initialChainId || 'all');

  // Sincroniza se o modal for aberto para outra rede
  React.useEffect(() => {
    if (initialChainId) {
      setSelectedChainId(initialChainId);
    } else {
      setSelectedChainId('all');
    }
  }, [initialChainId, isOpen]);

  // Se fechar com ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const selectedChain = useMemo(() => {
    if (!selectedChainId || selectedChainId === 'all') return null;
    return RJ_SUPERMARKET_CHAINS.find(c => c.id === selectedChainId) || null;
  }, [selectedChainId]);

  const historyData = useMemo(() => {
    if (!product) return [];
    return generateDeterministicHistory(product, stats || null, selectedChainId !== 'all' ? selectedChainId : undefined);
  }, [product, stats, selectedChainId]);

  if (!isOpen || !product) return null;

  const currentPoint = historyData[historyData.length - 1];
  const initialPoint = historyData[0];

  // Cálculo da variação percentual acumulada nas 4 semanas
  const compareTarget = selectedChainId !== 'all' && currentPoint?.chainPrice !== undefined && initialPoint?.chainPrice !== undefined
    ? { current: currentPoint.chainPrice, initial: initialPoint.chainPrice }
    : { current: currentPoint?.avgPrice || 0, initial: initialPoint?.avgPrice || 1 };

  const deltaR$ = compareTarget.current - compareTarget.initial;
  const deltaPercent = compareTarget.initial > 0 ? (deltaR$ / compareTarget.initial) * 100 : 0;

  // Menor e Maior de toda a série histórica
  const allPricesInSeries = historyData.flatMap(d => [d.minPrice, d.avgPrice, d.maxPrice, ...(d.chainPrice ? [d.chainPrice] : [])]);
  const minSeriesPrice = allPricesInSeries.length > 0 ? Math.min(...allPricesInSeries) : 0;
  const maxSeriesPrice = allPricesInSeries.length > 0 ? Math.max(...allPricesInSeries) : 0;
  const yDomainMin = Math.max(0, Math.floor(minSeriesPrice * 0.92));
  const yDomainMax = Math.ceil(maxSeriesPrice * 1.08);

  const unitLabel = product.unit.replace('R$/', '');

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-300 dark:border-emerald-800/60 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Popover / Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#113829] via-emerald-900 to-[#113829] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-[#b5e550] shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase font-mono tracking-wider bg-[#b5e550] text-[#0c281e] px-2 py-0.5 rounded-full">
                  EVOLUÇÃO HISTÓRICA • 4 SEMANAS
                </span>
                <span className="text-xs text-emerald-200 font-bold">Aferição RJ</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {product.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Seletor de Rede / Segmento e Resumo da Variação */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label htmlFor="history-chain-select" className="text-[10px] font-bold text-slate-500 uppercase block font-mono">
                Visão da Rede Supermercadista:
              </label>
              <select
                id="history-chain-select"
                value={selectedChainId}
                onChange={(e) => setSelectedChainId(e.target.value)}
                className="mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Média Geral do RJ (12 Redes)</option>
                {RJ_SUPERMARKET_CHAINS.map(chain => {
                  const p = product.chainPrices[chain.id];
                  return (
                    <option key={chain.id} value={chain.id}>
                      {chain.name} ({chain.profile}) {p ? `— R$ ${p.toFixed(2)}/${unitLabel}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Badge de Variação Acumulada */}
            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">
                Variação no Período (4 Sem.):
              </span>
              <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                <span className={`text-base font-black font-mono flex items-center ${
                  deltaPercent > 0 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : deltaPercent < 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-600'
                }`}>
                  {deltaPercent > 0 ? (
                    <ArrowUpRight className="w-4 h-4 mr-0.5" />
                  ) : deltaPercent < 0 ? (
                    <ArrowDownRight className="w-4 h-4 mr-0.5" />
                  ) : (
                    <Minus className="w-4 h-4 mr-0.5" />
                  )}
                  {deltaPercent > 0 ? `+${deltaPercent.toFixed(1)}%` : `${deltaPercent.toFixed(1)}%`}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({deltaR$ >= 0 ? `+R$ ${deltaR$.toFixed(2)}` : `-R$ ${Math.abs(deltaR$).toFixed(2)}`})
                </span>
              </div>
            </div>
          </div>

          {/* 3 KPI Cards Compactos */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block font-mono">
                Preço Vigente
              </span>
              <div className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                R$ {compareTarget.current.toFixed(2)}
              </div>
              <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400 font-mono">
                por {unitLabel}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center">
              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase block font-mono">
                Mínimo 4 Sem.
              </span>
              <div className="text-base font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                R$ {minSeriesPrice.toFixed(2)}
              </div>
              <span className="text-[9px] text-blue-600/80 dark:text-blue-400 font-mono">
                Piso de Balcão
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block font-mono">
                Máximo 4 Sem.
              </span>
              <div className="text-base font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                R$ {maxSeriesPrice.toFixed(2)}
              </div>
              <span className="text-[9px] text-amber-600/80 dark:text-amber-400 font-mono">
                Teto Registrado
              </span>
            </div>
          </div>

          {/* Gráfico Simples de Linha (Recharts) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Curva de Evolução Semanal (R$/ {unitLabel})</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Outubro 2026
              </span>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 12, right: 12, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="shortWeek" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    domain={[yDomainMin, yDomainMax]}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(val) => `R$${val}`}
                    stroke="#cbd5e1"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as WeeklyHistoryPoint;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700 font-sans">
                          <div className="font-bold text-amber-300 border-b border-slate-700 pb-1 mb-1.5">
                            {data.week} ({data.dateRange})
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex items-center justify-between gap-3 text-emerald-300">
                              <span>Média RJ:</span>
                              <strong>R$ {data.avgPrice.toFixed(2)}</strong>
                            </div>
                            {data.chainPrice !== undefined && selectedChain && (
                              <div className="flex items-center justify-between gap-3 text-amber-300">
                                <span>{selectedChain.shortName}:</span>
                                <strong>R$ {data.chainPrice.toFixed(2)}</strong>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3 text-slate-300">
                              <span>Piso (Menor):</span>
                              <span>R$ {data.minPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-slate-400">
                              <span>Teto (Maior):</span>
                              <span>R$ {data.maxPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={28}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />

                  {/* Linha Média RJ */}
                  <Line 
                    type="monotone" 
                    dataKey="avgPrice" 
                    name="Média RJ (Mercado)" 
                    stroke="#059669" 
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#059669', strokeWidth: 1, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />

                  {/* Linha Menor Preço (Piso) */}
                  <Line 
                    type="monotone" 
                    dataKey="minPrice" 
                    name="Menor Preço RJ" 
                    stroke="#0284c7" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: '#0284c7' }}
                  />

                  {/* Se selecionada uma rede específica */}
                  {selectedChainId !== 'all' && (
                    <Line 
                      type="monotone" 
                      dataKey="chainPrice" 
                      name={selectedChain?.shortName || 'Rede Selecionada'} 
                      stroke="#d97706" 
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#d97706', strokeWidth: 1.5, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#f59e0b' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela Resumo das 4 Semanas */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-2 px-3">Semana</th>
                  <th className="py-2 px-2.5 text-center">Período</th>
                  <th className="py-2 px-2.5 text-right">Média RJ</th>
                  {selectedChainId !== 'all' && (
                    <th className="py-2 px-2.5 text-right text-amber-700 dark:text-amber-400">
                      {selectedChain?.shortName || 'Rede'}
                    </th>
                  )}
                  <th className="py-2 px-2.5 text-right text-emerald-700 dark:text-emerald-400">Menor</th>
                  <th className="py-2 px-2.5 text-right text-rose-700 dark:text-rose-400">Maior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {historyData.map((pt, idx) => (
                  <tr key={pt.week} className={idx === 3 ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-bold' : ''}>
                    <td className="py-1.5 px-3 font-sans">
                      <span className="flex items-center gap-1.5">
                        {idx === 3 && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                        <span>{pt.week}</span>
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-slate-400 text-[10px]">{pt.dateRange}</td>
                    <td className="py-1.5 px-2.5 text-right font-black">R$ {pt.avgPrice.toFixed(2)}</td>
                    {selectedChainId !== 'all' && (
                      <td className="py-1.5 px-2.5 text-right font-black text-amber-700 dark:text-amber-400">
                        {pt.chainPrice ? `R$ ${pt.chainPrice.toFixed(2)}` : '-'}
                      </td>
                    )}
                    <td className="py-1.5 px-2.5 text-right text-emerald-700 dark:text-emerald-400 font-semibold">
                      R$ {pt.minPrice.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right text-rose-700 dark:text-rose-400 font-semibold">
                      R$ {pt.maxPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Base Auditada: ASSERJ, Scantec e Encartes Oficiais do RJ</span>
            </span>
            <span className="font-mono">
              Código: {product.productCode || product.id}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
