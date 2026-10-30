import React, { useState, useMemo } from 'react';
import { PrimaryDesmembramentoMesa, YieldAnalysisCuts } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { PieChart, Boxes, Layers, Scale, Bone, Flame } from 'lucide-react';

interface BeefYieldDonutChartProps {
  carcassWeight: number;
  costPerKg: number;
  primaryMesas: PrimaryDesmembramentoMesa[];
  cuts: YieldAnalysisCuts[];
  breakagePercent: number;
  selectedMesaFilter?: string;
  onSelectMesaFilter?: (filter: any) => void;
}

interface DonutSlice {
  id: string;
  label: string;
  sublabel: string;
  weightKg: number;
  percent: number;
  costKg?: number;
  totalCostR$?: number;
  color: string;
  textColor: string;
  filterCode?: string;
  category?: string;
}

export const BeefYieldDonutChart: React.FC<BeefYieldDonutChartProps> = ({
  carcassWeight,
  costPerKg,
  primaryMesas,
  cuts,
  breakagePercent,
  selectedMesaFilter,
  onSelectMesaFilter
}) => {
  const [viewMode, setViewMode] = useState<'MESAS' | 'COMPOSICAO'>('MESAS');
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  // 1. Dados dos Slices para o Modo "Mesas de Desmembramento Primário"
  const mesaSlices: DonutSlice[] = useMemo(() => {
    const colors: Record<string, { color: string; textColor: string }> = {
      'BOI-DIANT': { color: '#f59e0b', textColor: 'text-amber-500' }, // Amber
      'BOI-COXAO': { color: '#3b82f6', textColor: 'text-blue-500' },  // Blue
      'BOI-ALCAT': { color: '#10b981', textColor: 'text-emerald-500' }, // Emerald
      'BOI-COST-GAU': { color: '#8b5cf6', textColor: 'text-purple-500' } // Purple
    };

    // Filtra as 4 mesas primárias componentes da carcaça (Dianteiro, Coxão, Alcatrão, Costela)
    // Nota: Traseiro Especial (48%) é a união de Coxão (30%) + Alcatrão (18%)
    const distinctMesas = primaryMesas.filter(m => ['BOI-DIANT', 'BOI-COXAO', 'BOI-ALCAT', 'BOI-COST-GAU'].includes(m.code));

    return distinctMesas.map(m => {
      const palette = colors[m.code] || { color: '#64748b', textColor: 'text-slate-500' };
      return {
        id: m.code,
        label: m.alias,
        sublabel: m.name,
        weightKg: m.weightKg,
        percent: m.carcassPercent,
        costKg: m.calculatedCostKg,
        totalCostR$: m.totalCostR$,
        color: palette.color,
        textColor: palette.textColor,
        filterCode: m.code,
        category: 'MESA'
      };
    });
  }, [primaryMesas]);

  // 2. Dados dos Slices para o Modo "Composição Comercial & Quebra"
  const composicaoSlices: DonutSlice[] = useMemo(() => {
    // Agrupa cortes por tipo comercial
    const nobreKg = cuts.filter(c => c.category === 'NOBRE' && !c.isPrimaryPiece).reduce((acc, c) => acc + c.weightKg, 0);
    const tradicionalKg = cuts.filter(c => ['PRIMEIRA', 'SEGUNDA', 'COXAO', 'DIANTEIRO'].includes(c.category) && !c.isPrimaryPiece).reduce((acc, c) => acc + c.weightKg, 0);
    const ossoKg = cuts.find(c => c.name.toLowerCase().includes('osso'))?.weightKg || (carcassWeight * 0.17);
    const seboKg = cuts.find(c => c.name.toLowerCase().includes('sebo'))?.weightKg || (carcassWeight * 0.065);
    const quebraAparasKg = carcassWeight - (nobreKg + tradicionalKg + ossoKg + seboKg);

    return [
      {
        id: 'CAT_NOBRE',
        label: 'Cortes Nobres & Especiais',
        sublabel: 'Picanha, Mignon, Alcatra, Contra Filé, etc.',
        weightKg: nobreKg,
        percent: (nobreKg / carcassWeight) * 100,
        color: '#10b981',
        textColor: 'text-emerald-500',
        category: 'CARNE_LIMPA'
      },
      {
        id: 'CAT_TRADICIONAL',
        label: 'Cortes Comerciais / Segunda',
        sublabel: 'Coxões, Patinho, Acém, Paleta, Peito, Músculo',
        weightKg: tradicionalKg,
        percent: (tradicionalKg / carcassWeight) * 100,
        color: '#3b82f6',
        textColor: 'text-blue-500',
        category: 'CARNE_LIMPA'
      },
      {
        id: 'CAT_OSSO',
        label: 'Osso Industrial (Graxaria)',
        sublabel: 'Subproduto aproveitável para Rendering',
        weightKg: ossoKg,
        percent: (ossoKg / carcassWeight) * 100,
        color: '#e11d48',
        textColor: 'text-rose-500',
        filterCode: 'WASTE',
        category: 'QUEBRA'
      },
      {
        id: 'CAT_SEBO',
        label: 'Sebo Industrial (Graxaria)',
        sublabel: 'Gorduras residuais com cotação de mercado',
        weightKg: seboKg,
        percent: (seboKg / carcassWeight) * 100,
        color: '#f97316',
        textColor: 'text-orange-500',
        filterCode: 'WASTE',
        category: 'QUEBRA'
      },
      {
        id: 'CAT_QUEBRA',
        label: 'Aparas & Quebra de Balcão',
        sublabel: 'Evaporação e resíduos de limpeza na desossa',
        weightKg: Math.max(0, quebraAparasKg),
        percent: Math.max(0, (quebraAparasKg / carcassWeight) * 100),
        color: '#94a3b8',
        textColor: 'text-slate-400',
        filterCode: 'WASTE',
        category: 'QUEBRA'
      }
    ];
  }, [cuts, carcassWeight]);

  const activeSlices = viewMode === 'MESAS' ? mesaSlices : composicaoSlices;

  // Cálculo dos arcos SVG do gráfico de rosca
  const radius = 90;
  const strokeWidth = 32;
  const center = 120;
  const circumference = 2 * Math.PI * radius;

  // Prepara posições de cada fatia com offset
  let accumulatedAngle = 0;
  const sliceAngles = activeSlices.map(slice => {
    const sliceAngle = (slice.percent / 100) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += sliceAngle;
    return {
      ...slice,
      startAngle,
      sliceAngle,
      strokeDasharray: `${(slice.percent / 100) * circumference} ${circumference}`,
      strokeDashoffset: -((startAngle / 360) * circumference)
    };
  });

  const activeHoveredSlice = hoveredSliceId 
    ? activeSlices.find(s => s.id === hoveredSliceId)
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg transition-colors">
      
      {/* Header do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Distribuição de Peso da Desossa • Rendimento por Peça</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Gráfico de Rosca Analítico
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Proporção zootécnica de cada peça sobre o peso total da carcaça ({formatNumberBR(carcassWeight, 1)} kg)
            </p>
          </div>
        </div>

        {/* Alternador de Modo de Visão */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { setViewMode('MESAS'); setHoveredSliceId(null); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'MESAS'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Por Mesa Primária</span>
          </button>

          <button
            type="button"
            onClick={() => { setViewMode('COMPOSICAO'); setHoveredSliceId(null); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'COMPOSICAO'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Por Tipo de Rendimento</span>
          </button>
        </div>
      </div>

      {/* Área Central: Gráfico de Rosca SVG + Legenda Interativa */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Gráfico SVG Centralizado */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative select-none">
          <div className="relative w-64 h-64 flex items-center justify-center">
            
            <svg 
              className="w-full h-full -rotate-90 transform" 
              viewBox="0 0 240 240"
            >
              {/* Círculo de Fundo Suave */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth={strokeWidth}
              />

              {/* Fatias da Rosca com transição e interatividade */}
              {sliceAngles.map((slice) => {
                const isHovered = hoveredSliceId === slice.id;
                const isSelected = selectedMesaFilter && slice.filterCode === selectedMesaFilter;
                
                return (
                  <circle
                    key={slice.id}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 6 : isSelected ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      opacity: hoveredSliceId ? (isHovered ? 1 : 0.45) : 0.95,
                      filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))' : 'none'
                    }}
                    onMouseEnter={() => setHoveredSliceId(slice.id)}
                    onMouseLeave={() => setHoveredSliceId(null)}
                    onClick={() => {
                      if (onSelectMesaFilter && slice.filterCode) {
                        onSelectMesaFilter(selectedMesaFilter === slice.filterCode ? 'ALL' : slice.filterCode);
                      }
                    }}
                  />
                );
              })}
            </svg>

            {/* Conteúdo Central da Rosca (Total ou Detalhe do Hover) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
              {activeHoveredSlice ? (
                <div className="animate-fadeIn">
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${activeHoveredSlice.textColor}`}>
                    {activeHoveredSlice.label}
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {activeHoveredSlice.percent.toFixed(1)}%
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                    {formatNumberBR(activeHoveredSlice.weightKg, 1)} kg
                  </div>
                  {activeHoveredSlice.costKg && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      {formatCurrencyBRL(activeHoveredSlice.costKg)}/kg
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    PESO TOTAL
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {formatNumberBR(carcassWeight, 1)}
                    <span className="text-xs font-semibold text-slate-500"> kg</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                    100.0% carcaça
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                    {(carcassWeight / 15).toFixed(1)} @
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Passe o mouse para destacar ou clique na fatia para filtrar os cortes da tabela
          </p>
        </div>

        {/* Legenda Detalhada em Grid de Cards */}
        <div className="lg:col-span-7 space-y-2.5">
          {activeSlices.map((slice) => {
            const isHovered = hoveredSliceId === slice.id;
            const isSelected = selectedMesaFilter && slice.filterCode === selectedMesaFilter;

            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredSliceId(slice.id)}
                onMouseLeave={() => setHoveredSliceId(null)}
                onClick={() => {
                  if (onSelectMesaFilter && slice.filterCode) {
                    onSelectMesaFilter(selectedMesaFilter === slice.filterCode ? 'ALL' : slice.filterCode);
                  }
                }}
                className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                  isHovered
                    ? 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-600 shadow-sm scale-[1.01]'
                    : isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Nome & Indicador de Cor */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4 h-4 rounded-md shrink-0 shadow-xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {slice.label}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                          Filtro Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {slice.sublabel}
                    </p>
                  </div>
                </div>

                {/* Métricas: Percentual, Peso e Custo */}
                <div className="flex items-center gap-4 text-right shrink-0 font-mono">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {slice.percent.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {formatNumberBR(slice.weightKg, 1)} kg
                    </span>
                  </div>

                  {slice.costKg !== undefined && (
                    <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                        {formatCurrencyBRL(slice.costKg)}
                        <span className="text-[9px] font-normal text-slate-400">/kg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Total: {formatCurrencyBRL(slice.totalCostR$ || (slice.costKg * slice.weightKg))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Resumo Rodapé da Rosca */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            Balanço Zootécnico: <strong>75% Carne Comercializável</strong> ({formatNumberBR(carcassWeight * 0.75, 1)} kg) • <strong>25% Quebra Técnica</strong> ({formatNumberBR(carcassWeight * 0.25, 1)} kg)
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Traseiro Especial (Coxão 30% + Alcatrão 18%): <strong>48,0%</strong></span>
          <span>•</span>
          <span>Dianteiro: <strong>39,0%</strong></span>
          <span>•</span>
          <span>Ponta de Agulha: <strong>13,0%</strong></span>
        </div>
      </div>

    </div>
  );
};
