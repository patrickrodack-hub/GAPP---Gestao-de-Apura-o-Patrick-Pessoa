import React, { useState, useMemo } from 'react';
import { 
  MarketQuotesSnapshot, 
  WholesaleCutQuote, 
  RegionalQuote,
  RJInflowLogistics,
  B3FutureContract
} from '../../types/marketQuotes';
import { YieldParams } from '../../types/erp';
import { 
  MarketQuotesService, 
  INITIAL_RJ_LOGISTICS, 
  INITIAL_B3_FUTURE_CONTRACTS, 
  INITIAL_EXCHANGE_RATIOS,
  INITIAL_RJ_WEEKLY_PROMOTIONS,
  INITIAL_EXPORT_INDICATORS
} from '../../services/marketQuotesService';
import { formatCurrencyBRL } from '../../services/calculationService';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  FileDown, 
  MessageCircle, 
  CheckCircle2, 
  Building2, 
  Search, 
  Zap, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Activity, 
  Check, 
  Calendar,
  Store, 
  Calculator, 
  AlertTriangle, 
  Info, 
  Truck, 
  Award, 
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  DollarSign,
  Layers,
  BarChart3
} from 'lucide-react';

interface QuotesTabProps {
  yieldParams?: YieldParams;
  onUpdateYieldParams?: (params: any) => void;
  showToast?: (message: string) => void;
}

export const QuotesTab: React.FC<QuotesTabProps> = ({
  yieldParams,
  onUpdateYieldParams,
  showToast
}) => {
  const [snapshot, setSnapshot] = useState<MarketQuotesSnapshot>(() => MarketQuotesService.getQuotesSnapshot());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'foco_rj' | 'cortes' | 'pracas' | 'b3_futuros' | 'varejo_rj' | 'simulador_rj' | 'suino' | 'carcacas' | 'graxaria' | 'indicadores' | 'arbitragem' | 'fontes'
  >('foco_rj');

  // Filtros de cortes
  const [cutSearchQuery, setCutSearchQuery] = useState('');
  const [selectedCutCategory, setSelectedCutCategory] = useState<'all' | 'nobres' | 'traseiro' | 'coxao' | 'alcatrao' | 'dianteiro' | 'suino' | 'graxaria'>('all');

  // Filtro de região para praças pecuárias
  const [selectedPracaRegion, setSelectedPracaRegion] = useState<'all' | 'RJ' | 'sudeste' | 'centro_oeste' | 'norte' | 'sul' | 'nordeste'>('all');

  // Simulador de Aquisição Posto RJ
  const [simOriginId, setSimOriginId] = useState<string>('log-mg-triangulo');
  const [simFreightRate, setSimFreightRate] = useState<number>(9.50);
  const [simGotejoRate, setSimGotejoRate] = useState<number>(1.8);
  const [simTargetMargin, setSimTargetMargin] = useState<number>(24.0);

  // Simulador rápido de suíno vivo
  const [simSuinoLiveWeight, setSimSuinoLiveWeight] = useState<number>(115);

  const [isApplyingQuote, setIsApplyingQuote] = useState(false);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Cotação atual do sistema ERP
  const systemCostPerKg = yieldParams?.costPerKg || 26.00;
  const systemArrobaPrice = Number((systemCostPerKg * 15).toFixed(2));

  // Cotação Oficial de Referência (CEPEA SP e RJ Entrada)
  const cepeaIndicator = snapshot.indicators.find(i => i.id === 'ind-cepea-sp') || snapshot.indicators[0];
  const rjIndicator = snapshot.indicators.find(i => i.id === 'ind-rj-ceasa');
  const marketBenchmarkArroba = cepeaIndicator ? cepeaIndicator.price : 332.50;
  const rjBenchmarkArroba = rjIndicator ? rjIndicator.price : 328.00;

  // Spread entre Mercado e Custo Atual do ERP
  const spreadDiff = marketBenchmarkArroba - systemArrobaPrice;
  const spreadPercent = ((spreadDiff / marketBenchmarkArroba) * 100);

  // Atualização em tempo real das cotações
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const updated = MarketQuotesService.refreshQuotes();
      setSnapshot(updated);
      setIsRefreshing(false);
      if (showToast) showToast('Cotações de mercado, dados do RJ e indicadores B3 sincronizados com sucesso!');
    }, 600);
  };

  // Aplicação da cotação no sistema ERP
  const handleApplyQuote = (price: number, label: string) => {
    setIsApplyingQuote(true);
    const result = MarketQuotesService.applyQuoteToSystem(price);

    if (onUpdateYieldParams) {
      onUpdateYieldParams({
        ...(yieldParams || { carcassWeight: 240, fatPriceKg: 4.85, bonePriceKg: 0.90, targetMargin: 28, basis: 'carcass' }),
        costPerKg: result.costPerKg
      });
    }

    setAppliedSuccessMsg(`Cotação de ${label} (R$ ${price.toFixed(2)}/@ • R$ ${result.costPerKg.toFixed(2)}/kg) aplicada com sucesso no ERP!`);
    if (showToast) showToast(`Cotação de ${label} aplicada no sistema!`);

    setTimeout(() => {
      setIsApplyingQuote(false);
      setAppliedSuccessMsg(null);
    }, 4500);
  };

  // Download do Boletim em PDF
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await MarketQuotesService.generateAndDownloadQuotesBulletinPdf();
      if (showToast) showToast('Boletim Oficial de Cotações (.pdf) baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar boletim em PDF:', err);
      if (showToast) showToast('Erro ao gerar boletim em PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Compartilhamento via WhatsApp
  const handleShareWhatsApp = () => {
    MarketQuotesService.shareQuotesBulletinViaWhatsApp();
    if (showToast) showToast('Boletim de cotação preparado para envio no WhatsApp!');
  };

  // Filtro de Cortes Desossados
  const filteredCuts = useMemo(() => {
    return snapshot.cutQuotes.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(cutSearchQuery.toLowerCase()) ||
                            c.description.toLowerCase().includes(cutSearchQuery.toLowerCase()) ||
                            c.source.toLowerCase().includes(cutSearchQuery.toLowerCase()) ||
                            c.packers.toLowerCase().includes(cutSearchQuery.toLowerCase());
      const matchesCategory = selectedCutCategory === 'all' || c.category === selectedCutCategory;
      return matchesSearch && matchesCategory;
    });
  }, [snapshot.cutQuotes, cutSearchQuery, selectedCutCategory]);

  // Filtro de Praças Pecuárias
  const filteredPracas = useMemo(() => {
    if (selectedPracaRegion === 'all') return snapshot.regionalQuotes;
    if (selectedPracaRegion === 'RJ') return snapshot.regionalQuotes.filter(r => r.stateCode === 'RJ');
    if (selectedPracaRegion === 'sudeste') return snapshot.regionalQuotes.filter(r => ['RJ', 'SP', 'MG'].includes(r.stateCode));
    if (selectedPracaRegion === 'centro_oeste') return snapshot.regionalQuotes.filter(r => ['GO', 'MS', 'MT'].includes(r.stateCode));
    if (selectedPracaRegion === 'norte') return snapshot.regionalQuotes.filter(r => ['PA', 'TO', 'RO'].includes(r.stateCode));
    if (selectedPracaRegion === 'sul') return snapshot.regionalQuotes.filter(r => ['PR', 'RS'].includes(r.stateCode));
    if (selectedPracaRegion === 'nordeste') return snapshot.regionalQuotes.filter(r => ['BA'].includes(r.stateCode));
    return snapshot.regionalQuotes;
  }, [snapshot.regionalQuotes, selectedPracaRegion]);

  // Praça selecionada para o simulador de logística
  const selectedLogisticsItem = useMemo(() => {
    const list = snapshot.rjLogistics || INITIAL_RJ_LOGISTICS;
    return list.find(l => l.id === simOriginId) || list[0];
  }, [snapshot.rjLogistics, simOriginId]);

  // Cálculo dinâmico do simulador de frete posto RJ
  const simEffectiveArrobaRJ = useMemo(() => {
    const base = selectedLogisticsItem.baseArrobaPrice;
    const freight = simFreightRate;
    const gotejoCost = base * (simGotejoRate / 100);
    return Math.round((base + freight + gotejoCost) * 100) / 100;
  }, [selectedLogisticsItem, simFreightRate, simGotejoRate]);

  const simEffectiveKgRJ = useMemo(() => {
    return Math.round((simEffectiveArrobaRJ / 15) * 100) / 100;
  }, [simEffectiveArrobaRJ]);

  const simDiffVsCeasa = useMemo(() => {
    return Math.round((simEffectiveArrobaRJ - rjBenchmarkArroba) * 100) / 100;
  }, [simEffectiveArrobaRJ, rjBenchmarkArroba]);

  // Card unificado de Corte / Carcaça
  const renderCutCard = (cut: WholesaleCutQuote) => (
    <div 
      key={cut.id}
      className={`bg-white dark:bg-slate-900 border ${
        cut.id === 'cut-carne-moida-segunda' || cut.id === 'cut-picanha' || cut.id === 'cut-contra-file'
          ? 'border-emerald-400 dark:border-emerald-600/70 shadow-sm ring-1 ring-emerald-400/20'
          : cut.id === 'cut-banda-suina' || cut.id === 'cut-suino-vivo'
          ? 'border-rose-400 dark:border-rose-600/70 shadow-sm ring-1 ring-rose-400/20'
          : 'border-slate-200 dark:border-slate-800'
      } rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition flex flex-col justify-between`}
    >
      <div>
        {/* Top Category Badge & Weekly Change */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            cut.category === 'nobres' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' :
            cut.category === 'coxao' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300' :
            cut.category === 'dianteiro' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' :
            cut.category === 'alcatrao' ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300' :
            cut.category === 'suino' ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-extrabold' :
            'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {cut.category === 'suino' ? '🐖 SUÍNO' : cut.category.toUpperCase()} • {cut.standardYieldPercent.toFixed(1)}% REND.
          </span>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
              cut.scantecGiroRating === 'ALTO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              cut.scantecGiroRating === 'MÉDIO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
              'bg-slate-100 text-slate-700'
            }`}>
              Giro RJ: {cut.scantecGiroRating}
            </span>
          </div>
        </div>

        {/* Cut Name */}
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-2.5 leading-tight flex items-start justify-between">
          <span>{cut.name}</span>
          {cut.productCode && (
            <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-2 shrink-0">
              {cut.productCode}
            </span>
          )}
        </h3>

        {/* Preços: Custo Entrada Atacado vs Venda Balcão RJ */}
        <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              {cut.id === 'cut-suino-vivo' ? 'Kg Vivo Produtor' : 'Custo Entrada Atacado'}
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              R$ {cut.avgPriceKg.toFixed(2)}
              <span className="text-[10px] text-slate-400 font-normal">/kg</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              Faixa: {cut.minPriceKg.toFixed(2)} - {cut.maxPriceKg.toFixed(2)}
            </span>
          </div>

          <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {cut.id === 'cut-suino-vivo' ? 'Equivalente Balcão' : 'Média Varejo RJ (Nielsen/ASSERJ)'}
            </span>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              R$ {cut.rjRetailPriceKg.toFixed(2)}
              <span className="text-[10px] text-slate-400 font-normal">/kg</span>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
              Margem RJ: {cut.rjRetailMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Sugestão GAPP e Share de Vendas no RJ */}
        <div className="mt-2.5 flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400">
          <span>
            Sugestão Balcão GAPP: <strong className="text-slate-900 dark:text-white font-mono">R$ {cut.suggestedRetailPriceKg.toFixed(2)}/kg</strong>
          </span>
          {cut.nielsenSharePercent > 0 && (
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
              Share RJ: {cut.nielsenSharePercent.toFixed(1)}%
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {cut.description}
        </p>
      </div>

      {/* Frigoríficos e Fontes de Cotação */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="truncate max-w-[200px]" title={cut.packers}>
            Frigoríficos: <strong>{cut.packers}</strong>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            +{cut.changeWeek.toFixed(2)}% sem.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 truncate">
          {cut.source}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 font-sans pb-10">
      
      {/* 1. TICKER SUPERIOR DE COTAÇÕES EM TEMPO REAL COM FONTES REAIS */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-lg border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${snapshot.marketStatus === 'ABERTO' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${snapshot.marketStatus === 'ABERTO' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-extrabold text-[11px] tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 flex-wrap">
              <span>Cotação Oficial em Tempo Real</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-normal">
                Fontes: CEPEA/ESALQ • B3 S.A. • Scot Consultoria • Ceasa Irajá RJ • ASSERJ • Scantec RJ • NielsenIQ
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden sm:inline">
              Pregão B3: <strong className={snapshot.marketStatus === 'ABERTO' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {snapshot.marketStatus === 'ABERTO' ? '🟢 Aberto' : '🔴 Fechado'}
              </strong>
            </span>
            <span>Atualizado: <strong className="text-slate-200 font-mono">{snapshot.lastUpdatedDate}</strong></span>
          </div>
        </div>

        {/* Ticker Badges Carousel */}
        <div className="flex items-center gap-2.5 pt-2.5 overflow-x-auto no-scrollbar py-0.5">
          {snapshot.indicators.map((ind) => (
            <div 
              key={ind.id} 
              className={`border rounded-xl px-3 py-1.5 flex items-center gap-2 shrink-0 transition ${
                ind.id === 'ind-rj-ceasa'
                  ? 'bg-emerald-950/70 border-emerald-500/80 ring-1 ring-emerald-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {ind.id === 'ind-rj-ceasa' && (
                    <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-1 rounded uppercase">RJ</span>
                  )}
                  <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">
                    {ind.name.split('(')[0]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-sm text-white">
                    {ind.unit.includes('R$') || ind.unit.includes('US$') ? `${ind.unit.split('/')[0]} ${ind.price.toFixed(2)}` : ind.price.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {ind.unit.includes('/') ? `/${ind.unit.split('/')[1]}` : ''}
                  </span>
                </div>
              </div>

              <div className={`flex items-center text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                ind.changeDay > 0 ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50' : 
                ind.changeDay < 0 ? 'bg-rose-950/80 text-rose-400 border border-rose-700/50' : 
                'bg-slate-700 text-slate-300'
              }`}>
                {ind.changeDay > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : ind.changeDay < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : null}
                <span>{ind.changeDay > 0 ? '+' : ''}{ind.changeDay.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CABEÇALHO DO MÓDULO & AÇÕES RÁPIDAS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Título e Info com Foco RJ */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  FOCO: RIO DE JANEIRO & NÍVEL BRASIL
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  CEPEA • B3 • SCOT • ASSERJ • SCANTEC RJ
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Cotação do Boi Gordo, Arroba (@) & Cortes • Rio de Janeiro & Brasil
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Matriz completa de abastecimento fluminense (frete, gotejo e custo posto RJ), contratos futuros B3, 19 praças pecuárias nacionais e preços reais do balcão de 12 redes supermercadistas do RJ.
              </p>
            </div>
          </div>

          {/* Botões de Ação do Módulo */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            
            {/* Atualizar Cotações */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Sincronizar dados em tempo real com fontes oficiais"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar Mercado'}</span>
            </button>

            {/* Baixar Boletim PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Gerar e baixar o Boletim Oficial em PDF"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Boletim Oficial (PDF)</span>
                </>
              )}
            </button>

            {/* Enviar via WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Enviar espelho das cotações diretamente pelo WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Compartilhar WhatsApp</span>
            </button>
          </div>
        </div>

        {/* 3. CARD DE APLICAÇÃO DIRETA NO SISTEMA & ARBITRAGEM */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900 text-white border border-emerald-500/40 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
                  SINCRONIZAÇÃO MATRIZ & ERP
                </span>
                <span className="text-[11px] text-slate-300">
                  Entrada Rio de Janeiro: <strong className="text-emerald-300 font-mono">R$ {rjBenchmarkArroba.toFixed(2)}/@</strong> (R$ {(rjBenchmarkArroba/15).toFixed(2)}/kg) • CEPEA SP: <strong className="text-white font-mono">R$ {marketBenchmarkArroba.toFixed(2)}/@</strong>
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Custo de carcaça vigente no ERP: <strong>R$ {systemArrobaPrice.toFixed(2)}/@</strong> (R$ {systemCostPerKg.toFixed(2)}/kg).
                {spreadDiff > 0 ? (
                  <span className="text-emerald-300 font-semibold ml-1">
                    (Você está comprando R$ {spreadDiff.toFixed(2)}/@ abaixo do CEPEA SP)
                  </span>
                ) : spreadDiff < 0 ? (
                  <span className="text-amber-300 font-semibold ml-1">
                    (Seu custo está R$ {Math.abs(spreadDiff).toFixed(2)}/@ acima do CEPEA SP)
                  </span>
                ) : (
                  <span className="text-emerald-300 font-semibold ml-1">
                    (100% alinhado com o mercado oficial)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleApplyQuote(rjBenchmarkArroba, 'Entrada Rio de Janeiro (Ceasa/Frigoríficos)')}
              disabled={isApplyingQuote}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Entrada RJ (R$ {rjBenchmarkArroba.toFixed(2)}/@)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuote(marketBenchmarkArroba, 'CEPEA/B3 SP')}
              disabled={isApplyingQuote}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar CEPEA SP (R$ {marketBenchmarkArroba.toFixed(2)}/@)</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {appliedSuccessMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{appliedSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 4. ABAS DE NAVEGAÇÃO INTERNA DO MÓDULO */}
      <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'foco_rj', label: '🌟 1. Hub Foco Rio de Janeiro', badge: 'DESTAQUE RJ' },
          { id: 'cortes', label: '2. Cortes & Balcão RJ', count: snapshot.cutQuotes.length, badge: 'Atacado & Balcão' },
          { id: 'pracas', label: '3. Praças Pecuárias Brasil', count: snapshot.regionalQuotes.length, badge: '19 Praças' },
          { id: 'b3_futuros', label: '4. B3 Futuros & Relações de Troca', badge: 'BGI & ESALQ' },
          { id: 'varejo_rj', label: '5. Varejo 12 Redes RJ', count: snapshot.rjRetailBenchmarks.length, badge: 'ASSERJ/Scantec' },
          { id: 'simulador_rj', label: '6. Simulador Frete Posto RJ', badge: 'Logística' },
          { id: 'suino', label: '7. Suíno (Carcaça & Vivo)', count: snapshot.cutQuotes.filter(c => c.category === 'suino').length, badge: 'Banda & Vivo' },
          { id: 'carcacas', label: '8. Carcaças & Quartos Atacado', count: snapshot.carcassQuotes.length },
          { id: 'graxaria', label: '9. Graxaria (Sebo & Osso)', count: 3, badge: 'Crédito Boi' },
          { id: 'fontes', label: '10. Fontes Oficiais & Metodologia', badge: 'Transparência' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeSection === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeSection === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSection === tab.id ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 5. CONTEÚDO DAS SEÇÕES */}

      {/* SEÇÃO 1: HUB ESPECIAL FOCO RIO DE JANEIRO */}
      {activeSection === 'foco_rj' && (
        <div className="space-y-4">
          
          {/* Banner Principal Rio de Janeiro */}
          <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-emerald-950 border border-emerald-500/40 rounded-2xl p-5 text-white shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-3xl shrink-0">
                  📍
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      POLO CONSUMIDOR FLUMINENSE
                    </span>
                    <span className="text-xs text-emerald-300 font-mono">
                      Ceasa Irajá RJ • DITEC • Frigoríficos RJ (Barra Mansa / RioBeef / Silva)
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mt-1">
                    Panorama Estratégico do Boi, Arroba & Cortes no Rio de Janeiro
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    O Rio de Janeiro é o 2º maior mercado consumidor de carne bovina do Brasil. Produz cerca de 12% do que consome e importa 88% de MG, GO, SP, MS e PR, gerando dinâmicas próprias de frete e spread.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApplyQuote(rjBenchmarkArroba, 'Entrada Rio de Janeiro')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar Cotação RJ no ERP (R$ {rjBenchmarkArroba.toFixed(2)}/@)</span>
                </button>
              </div>
            </div>

            {/* 3 CARDS DE DESTAQUE DO RIO DE JANEIRO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Card 1: Cotação Entrada RJ */}
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                      ENTRADA RIO DE JANEIRO
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                      Ceasa Irajá / Abate RJ
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-base mt-1.5">
                    Boi Gordo Entrada RJ
                  </h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-emerald-400">
                      R$ {rjBenchmarkArroba.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">/@ à vista</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Equivalente Kg Carcaça:</span>
                      <strong className="text-white font-mono">R$ {(rjBenchmarkArroba / 15).toFixed(2)}/kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Prazo 30 dias no RJ:</span>
                      <span className="font-mono text-slate-300">R$ {(rjBenchmarkArroba + 3.00).toFixed(2)}/@</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vaca Gorda RJ:</span>
                      <span className="font-mono text-slate-300">R$ 300,00/@</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  Frigoríficos: <strong>Barra Mansa, RioBeef, Silva RJ, Plena</strong>
                </div>
              </div>

              {/* Card 2: Custo Médio Posto RJ (Frete + Gotejo) */}
              <div className="bg-slate-900/90 border border-teal-500/40 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-teal-300 uppercase tracking-wider">
                      CUSTO MÉDIO PONDERADO
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700/50">
                      Posto Câmara Fria RJ
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-base mt-1.5">
                    Média Interestadual Posto RJ
                  </h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-teal-400">
                      R$ 338,20
                    </span>
                    <span className="text-xs text-slate-300 font-mono">/@ efetiva</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Custo Médio Kg Carcaça:</span>
                      <strong className="text-white font-mono">R$ 22,55/kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete Rodoviário Médio:</span>
                      <span className="font-mono text-teal-300">+R$ 9,80/@</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Perda de Gotejo Média:</span>
                      <span className="font-mono text-amber-300">1,8% (~R$ 5,80/@)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  Origens: <strong>MG (28%), GO (22%), SP (18%), MS (14%), RJ (12%), PR (6%)</strong>
                </div>
              </div>

              {/* Card 3: Diferencial de Base Fluminense (Spread vs SP) */}
              <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                      DIFERENCIAL DE BASE (SPREAD)
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50">
                      RJ vs CEPEA SP
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-base mt-1.5">
                    Spread RJ vs São Paulo
                  </h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-amber-400">
                      -R$ 4,50
                    </span>
                    <span className="text-xs text-slate-300 font-mono">/@ vs CEPEA</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>CEPEA SP À Vista:</span>
                      <span className="font-mono text-white">R$ {marketBenchmarkArroba.toFixed(2)}/@</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrada RJ:</span>
                      <span className="font-mono text-emerald-400 font-bold">R$ {rjBenchmarkArroba.toFixed(2)}/@</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Escala Frigorífica RJ:</span>
                      <span className="font-mono text-slate-300">6,0 dias úteis</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  Mercado: <strong>Demanda aquecida nos fins de semana e feriados no RJ</strong>
                </div>
              </div>

            </div>
          </div>

          {/* MATRIZ DE ABASTECIMENTO INTERESTADUAL DO RIO DE JANEIRO */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded">
                    LOGÍSTICA & FRETE INTERESTADUAL
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Matriz Oficial de Custo de Entrada no Estado do Rio de Janeiro
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  De onde vem a carne consumida no Rio de Janeiro? Custo Posto RJ por Origem
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Ceasa Irajá RJ / Pavilhão de Carnes
              </span>
            </div>

            {/* Gráfico Visual de Barras de Abastecimento */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Participação no Abastecimento do Mercado Consumidor do Rio de Janeiro:
              </span>
              <div className="h-6 w-full rounded-xl overflow-hidden flex text-[11px] font-bold text-white shadow-inner">
                <div style={{ width: '28%' }} className="bg-emerald-600 flex items-center justify-center truncate px-1" title="Minas Gerais: 28%">
                  MG 28%
                </div>
                <div style={{ width: '22%' }} className="bg-teal-600 flex items-center justify-center truncate px-1" title="Goiás: 22%">
                  GO 22%
                </div>
                <div style={{ width: '18%' }} className="bg-indigo-600 flex items-center justify-center truncate px-1" title="São Paulo: 18%">
                  SP 18%
                </div>
                <div style={{ width: '14%' }} className="bg-amber-600 flex items-center justify-center truncate px-1" title="Mato Grosso do Sul: 14%">
                  MS 14%
                </div>
                <div style={{ width: '12%' }} className="bg-cyan-600 flex items-center justify-center truncate px-1" title="Abate Local RJ: 12%">
                  RJ 12%
                </div>
                <div style={{ width: '6%' }} className="bg-purple-600 flex items-center justify-center truncate px-1" title="Paraná: 6%">
                  PR 6%
                </div>
              </div>
            </div>

            {/* Tabela de Logística Interestadual */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Origem / Região Produtora</th>
                    <th className="py-3 px-3 text-right">Base Origem (@)</th>
                    <th className="py-3 px-3 text-right">Frete até RJ (@)</th>
                    <th className="py-3 px-3 text-center">Tempo Viagem</th>
                    <th className="py-3 px-3 text-center">Gotejo / Quebra</th>
                    <th className="py-3 px-3 text-right">Custo Posto RJ (@)</th>
                    <th className="py-3 px-3 text-right">Custo Posto RJ (Kg)</th>
                    <th className="py-3 px-3 text-center">Share no RJ</th>
                    <th className="py-3 px-4">Frigoríficos Ofertantes</th>
                    <th className="py-3 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-mono">
                  {(snapshot.rjLogistics || INITIAL_RJ_LOGISTICS).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span>{log.originRegion}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{log.originState}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        R$ {log.baseArrobaPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                        +R$ {log.freightCostArroba.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                        {log.transitHours}h
                      </td>
                      <td className="py-3 px-3 text-center text-amber-600 font-bold">
                        {log.shrinkageLossPercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white text-sm">
                        R$ {log.effectiveCostArrobaRJ.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        R$ {log.effectiveCostKgRJ.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {log.shareOfRJSupply.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-500 truncate max-w-[200px]" title={log.mainOriginPackers}>
                        {log.mainOriginPackers}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleApplyQuote(log.effectiveCostArrobaRJ, `Posto RJ via ${log.originRegion}`)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 font-bold text-[10px] transition cursor-pointer"
                        >
                          Usar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AS 3 PRAÇAS PECUÁRIAS DO ESTADO DO RIO DE JANEIRO */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  As 3 Praças Pecuárias Oficiais do Estado do Rio de Janeiro
                </h3>
                <p className="text-xs text-slate-500">
                  Cotações locais de compra direta no produtor fluminense e abatedouros locais.
                </p>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                Rio de Janeiro (RJ)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {snapshot.regionalQuotes.filter(r => r.stateCode === 'RJ').map(rj => (
                <div key={rj.id} className="bg-slate-50 dark:bg-slate-950 border border-emerald-300/40 dark:border-emerald-700/40 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                        PRAÇA FLUMINENSE
                      </span>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Escala {rj.slaughterScaleDays}d
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1">
                      {rj.region}
                    </h4>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        R$ {rj.cashPriceArroba.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">/@ à vista</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Kg Vivo Estimado:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">R$ {rj.liveWeightPriceKg.toFixed(2)}/kg</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Vaca Gorda RJ:</span>
                        <span className="font-mono">R$ {rj.cowCashPriceArroba.toFixed(2)}/@</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Novilha Precoce:</span>
                        <span className="font-mono">R$ {rj.heiferCashPriceArroba.toFixed(2)}/@</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[170px]" title={rj.mainPackers}>
                      {rj.mainPackers}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyQuote(rj.cashPriceArroba, rj.region)}
                      className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      Aplicar →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CALENDÁRIO COMERCIAL E PROMOÇÕES DO VAREJO FLUMINENSE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded">
                    CALENDÁRIO DO VAREJO CARIOCA
                  </span>
                  <span className="text-xs text-slate-500">
                    Monitoramento ASSERJ & Scantec Sell-Out RJ
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Dias de Forte Giro de Carnes: Terça/Quarta da Carne vs Fim de Semana do Churrasco
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(snapshot.rjWeeklyPromotions || INITIAL_RJ_WEEKLY_PROMOTIONS).map(promo => (
                <div key={promo.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                        {promo.theme.split('(')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {promo.retailChains.join(', ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {promo.impactSummary}
                    </p>

                    <div className="mt-3 space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                      {promo.samplePromotions.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-mono">
                          <span className="font-sans text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            • {item.cutName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-slate-400 text-[10px]">
                              R$ {item.regularPriceKg.toFixed(2)}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              R$ {item.promotionalPriceKg.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1 rounded">
                              -{item.discountPercent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                    Fonte: {promo.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SEÇÃO 2: CORTES DESOSSADOS (DIANTEIRO, TRASEIRO, COXÃO, ALCATRÃO, SUÍNO, GRAXARIA) */}
      {activeSection === 'cortes' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros e Busca */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cutSearchQuery}
                onChange={(e) => setCutSearchQuery(e.target.value)}
                placeholder="Buscar corte (ex: Picanha, Contra Filé, Chã, Carne Moída, Costela, Acém, Suíno, Sebo)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Todos os Cortes' },
                { id: 'nobres', label: 'Traseiro Nobre' },
                { id: 'coxao', label: 'Coxão' },
                { id: 'alcatrao', label: 'Alcatrão' },
                { id: 'dianteiro', label: 'Dianteiro' },
                { id: 'suino', label: 'Suíno' },
                { id: 'graxaria', label: 'Graxaria / Subprodutos' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCutCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCutCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Cards de Alta Fidelidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCuts.map((cut) => renderCutCard(cut))}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: PRAÇAS PECUÁRIAS NÍVEL BRASIL COM DESTAQUE RJ */}
      {activeSection === 'pracas' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Cotações por Praça Pecuária & Frigoríficos Habilitados (Scot Consultoria / Federações)
                </h3>
                <p className="text-xs text-slate-500">
                  Preços de balcão do gado gordo em pé, a prazo, vaca gorda e spread em relação a São Paulo (CEPEA).
                </p>
              </div>

              {/* Filtros Regionais */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Todas (19)' },
                  { id: 'RJ', label: '📍 Foco RJ (3)' },
                  { id: 'sudeste', label: 'Sudeste' },
                  { id: 'centro_oeste', label: 'Centro-Oeste' },
                  { id: 'norte', label: 'Norte' },
                  { id: 'sul', label: 'Sul' },
                  { id: 'nordeste', label: 'Nordeste' }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedPracaRegion(r.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedPracaRegion === r.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Praça / Polo Frigorífico</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Boi Gordo À Vista (@)</th>
                    <th className="py-3 px-4 text-right">30 Dias (@)</th>
                    <th className="py-3 px-4 text-right">Kg Vivo Estimado</th>
                    <th className="py-3 px-4 text-right">Vaca Gorda (@)</th>
                    <th className="py-3 px-4 text-right">Novilha (@)</th>
                    <th className="py-3 px-4 text-right">Spread vs SP</th>
                    <th className="py-3 px-3 text-center">Escala</th>
                    <th className="py-3 px-4">Frigoríficos Ofertantes</th>
                    <th className="py-3 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-mono">
                  {filteredPracas.map((reg) => (
                    <tr key={reg.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${reg.stateCode === 'RJ' ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                      <td className="py-3 px-4 font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${reg.stateCode === 'RJ' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span>{reg.region}</span>
                        {reg.stateCode === 'RJ' && (
                          <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-1 py-0.2 rounded uppercase">RJ</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {reg.stateCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        R$ {reg.cashPriceArroba.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                        R$ {reg.termPriceArroba.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                        R$ {reg.liveWeightPriceKg.toFixed(2)}/kg
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                        R$ {reg.cowCashPriceArroba.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                        R$ {reg.heiferCashPriceArroba.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={reg.spreadVsSP < 0 ? 'text-blue-600 dark:text-blue-400' : reg.spreadVsSP > 0 ? 'text-amber-600' : 'text-slate-500'}>
                          {reg.spreadVsSP > 0 ? `+R$ ${reg.spreadVsSP.toFixed(2)}` : reg.spreadVsSP < 0 ? `-R$ ${Math.abs(reg.spreadVsSP).toFixed(2)}` : 'R$ 0,00'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                        {reg.slaughterScaleDays} d
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]" title={reg.mainPackers}>
                        {reg.mainPackers}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleApplyQuote(reg.cashPriceArroba, `${reg.region} (${reg.stateCode})`)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 font-bold text-[10px] transition cursor-pointer"
                        >
                          Usar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 4: CONTRATOS FUTUROS B3 & RELAÇÕES DE TROCA */}
      {activeSection === 'b3_futuros' && (
        <div className="space-y-4">
          
          {/* Tabela de Contratos Futuros B3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                    MERCADO FUTURO FINANCEIRO
                  </span>
                  <span className="text-xs text-slate-500">
                    B3 S.A. - Brasil, Bolsa, Balcão
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Curva Futura do Boi Gordo na B3 (Contrato Futuro BGI)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Lote padrão: 330 @ líquidas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código B3</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4 text-right">Preço de Ajuste (R$/@)</th>
                    <th className="py-3 px-4 text-right">Ajuste Anterior</th>
                    <th className="py-3 px-4 text-right">Var. Dia (%)</th>
                    <th className="py-3 px-4 text-center">Contratos em Aberto</th>
                    <th className="py-3 px-4 text-center">Volume Contratos</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-mono">
                  {(snapshot.b3FutureContracts || INITIAL_B3_FUTURE_CONTRACTS).map((b3) => (
                    <tr key={b3.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                        {b3.code}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {b3.monthYear}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        R$ {b3.settlementPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        R$ {b3.previousSettlement.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={b3.changeDayPercent > 0 ? 'text-emerald-600' : b3.changeDayPercent < 0 ? 'text-rose-600' : 'text-slate-500'}>
                          {b3.changeDayPercent > 0 ? `+${b3.changeDayPercent.toFixed(2)}%` : `${b3.changeDayPercent.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-800 dark:text-slate-200">
                        {b3.openContracts.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {b3.volumeContracts.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleApplyQuote(b3.settlementPrice, `B3 Futuro ${b3.code}`)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 font-bold text-[10px] cursor-pointer"
                        >
                          Usar no ERP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards de Relações de Troca Oficiais CEPEA/ESALQ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Relações de Troca Oficiais da Pecuária (CEPEA / ESALQ - USP)
                </h3>
                <p className="text-xs text-slate-500">
                  Indicadores de poder de compra do pecuarista e custo de reposição/nutrição.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(snapshot.exchangeRatios || INITIAL_EXCHANGE_RATIOS).map(ratio => (
                <div key={ratio.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {ratio.benchmarkEvaluation}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Média Histórica: {ratio.historicalAvg} {ratio.unit}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1.5">
                      {ratio.name}
                    </h4>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {ratio.ratio}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{ratio.unit}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {ratio.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                    Fonte: {ratio.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dados de Exportação Brasileira */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Exportação Brasileira de Carne Bovina (SECEX / MDIC / ABRAFRIGO)
            </h3>
            <p className="text-xs text-slate-500">
              Destinos principais e preço médio de faturamento FOB por tonelada exportada.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {(snapshot.exportIndicators || INITIAL_EXPORT_INDICATORS).map(exp => (
                <div key={exp.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">
                    {exp.destination}
                  </span>
                  <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                    {exp.volumeSharePercent.toFixed(1)}%
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    US$ {exp.avgPriceUsdTon.toLocaleString('pt-BR')}/t
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    (~US$ {exp.equivalentArrobaUsd.toFixed(2)}/@)
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SEÇÃO 5: BENCHMARK VAREJO SUPERMERCADOS RJ (12 REDES) */}
      {activeSection === 'varejo_rj' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                    AUDITORIA DE MERCADO RJ
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Base: NielsenIQ Retail Index • Scantec Sell-Out RJ • ASSERJ
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Preços Praticados no Balcão de 12 Redes Supermercadistas do Rio de Janeiro
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Amostragem comparativa de preços por corte nos supermercados do Grande Rio, Baixada Fluminense, Niterói e Região Metropolitana.
                </p>
              </div>
            </div>

            {/* Tabela Comparativa de Redes do RJ */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rede Supermercadista RJ</th>
                    <th className="py-3 px-3">Perfil</th>
                    <th className="py-3 px-3 text-right">Picanha</th>
                    <th className="py-3 px-3 text-right">Contra Filé</th>
                    <th className="py-3 px-3 text-right">Alcatra</th>
                    <th className="py-3 px-3 text-right">Coxão Mole</th>
                    <th className="py-3 px-3 text-right">Patinho</th>
                    <th className="py-3 px-3 text-right">Acém</th>
                    <th className="py-3 px-3 text-right">Costela</th>
                    <th className="py-3 px-3 text-right">Pernil Suíno</th>
                    <th className="py-3 px-4">Fonte / Pesquisa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-mono">
                  {snapshot.rjRetailBenchmarks.map((bench) => (
                    <tr key={bench.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{bench.chainName}</span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bench.category === 'supermercado_popular' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          bench.category === 'atacarejo' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {bench.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        R$ {bench.sampleCutPrices.picanha.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-200">
                        R$ {bench.sampleCutPrices.contraFile.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-200">
                        R$ {bench.sampleCutPrices.alcatra.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-200">
                        R$ {bench.sampleCutPrices.coxaoMole.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-200">
                        R$ {bench.sampleCutPrices.patinho.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                        R$ {bench.sampleCutPrices.acem.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-200">
                        R$ {bench.sampleCutPrices.costela.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-700 dark:text-rose-400 font-bold">
                        R$ {bench.sampleCutPrices.pernilSuino.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-500 truncate max-w-[180px]">
                        {bench.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 6: SIMULADOR DE AQUISIÇÃO & LOGÍSTICA POSTO RJ */}
      {activeSection === 'simulador_rj' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Simulador de Aquisição Interestadual & Frete Posto Rio de Janeiro
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simule a compra de lotes de gado em diferentes estados do Brasil, compute o frete rodoviário até a câmara fria no RJ e a quebra de gotejo para obter o custo real posto RJ.
                </p>
              </div>
            </div>

            {/* Controles do Simulador */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Seleção de Praça */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase">
                  1. Praça Pecuária de Origem
                </label>
                <select
                  value={simOriginId}
                  onChange={(e) => {
                    setSimOriginId(e.target.value);
                    const found = (snapshot.rjLogistics || INITIAL_RJ_LOGISTICS).find(l => l.id === e.target.value);
                    if (found) {
                      setSimFreightRate(found.freightCostArroba);
                      setSimGotejoRate(found.shrinkageLossPercent);
                    }
                  }}
                  className="mt-2 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
                >
                  {(snapshot.rjLogistics || INITIAL_RJ_LOGISTICS).map(l => (
                    <option key={l.id} value={l.id}>
                      {l.originRegion} ({l.originState}) - R$ {l.baseArrobaPrice.toFixed(2)}/@
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Base na origem: R$ {selectedLogisticsItem.baseArrobaPrice.toFixed(2)}/@
                </span>
              </div>

              {/* Frete Rodoviário */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase">
                  2. Frete Rodoviário até o RJ (R$/@)
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="0.50"
                    value={simFreightRate}
                    onChange={(e) => setSimFreightRate(Number(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-500">R$/@</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Equivale a R$ {(simFreightRate / 15).toFixed(2)}/kg no frete
                </span>
              </div>

              {/* Perda de Gotejo */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase">
                  3. Quebra / Gotejo de Transporte (%)
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="0.10"
                    value={simGotejoRate}
                    onChange={(e) => setSimGotejoRate(Number(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Impacto: +R$ {(selectedLogisticsItem.baseArrobaPrice * (simGotejoRate / 100)).toFixed(2)}/@
                </span>
              </div>

            </div>

            {/* Resultado do Custo Posto RJ */}
            <div className="mt-4 p-5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase">
                  CUSTO EFETIVO FINAL CALCULADO POSTO RIO DE JANEIRO
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    R$ {simEffectiveArrobaRJ.toFixed(2)}/@
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    (R$ {simEffectiveKgRJ.toFixed(2)}/kg carcaça)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Comparativo com Entrada Ceasa Irajá RJ (R$ {rjBenchmarkArroba.toFixed(2)}/@):
                  {simDiffVsCeasa > 0 ? (
                    <strong className="text-amber-300 ml-1">
                      +R$ {simDiffVsCeasa.toFixed(2)}/@ mais caro que compra local Ceasa RJ.
                    </strong>
                  ) : simDiffVsCeasa < 0 ? (
                    <strong className="text-emerald-300 ml-1">
                      -R$ {Math.abs(simDiffVsCeasa).toFixed(2)}/@ de economia em relação à Ceasa RJ!
                    </strong>
                  ) : (
                    <strong className="text-emerald-300 ml-1">
                      Empatado com o preço de entrada Ceasa RJ.
                    </strong>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleApplyQuote(simEffectiveArrobaRJ, `Simulado Posto RJ (${selectedLogisticsItem.originRegion})`)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer shrink-0"
              >
                Aplicar no ERP (R$ {simEffectiveKgRJ.toFixed(2)}/kg)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 7: SUÍNO (CARCAÇA & VIVO) */}
      {activeSection === 'suino' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border border-rose-500/30 rounded-2xl p-5 text-white shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                  🐖
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Cadeia Suinícola Oficial: Carcaça (Banda Suína) & Suíno Vivo
                  </h3>
                  <p className="text-xs text-rose-200/80 mt-0.5">
                    CEPEA/ESALQ • ASEMG • Scot Consultoria • Atacado e Balcão RJ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Compartilhar Boletim Suíno</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-rose-500/40 rounded-xl p-4">
                <span className="text-[10px] font-mono font-bold text-rose-300 uppercase">
                  BANDA SUÍNA COM OSSO / TOUCINHO
                </span>
                <div className="text-2xl font-black font-mono text-rose-400 mt-1">
                  R$ 13,80/kg atacado
                </div>
                <span className="text-xs text-slate-300 block mt-1">
                  Balcão RJ: R$ 20,90/kg • Margem bruta: 33,97%
                </span>
              </div>

              <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4">
                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                  SUÍNO VIVO AO PRODUTOR (CEPEA)
                </span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                  R$ 7,85/kg vivo
                </div>
                <span className="text-xs text-slate-300 block mt-1">
                  Rendimento de Carcaça: 74,0% • Lotes 110-125kg
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshot.cutQuotes.filter(c => c.category === 'suino').map((cut) => renderCutCard(cut))}
          </div>
        </div>
      )}

      {/* SEÇÃO 8: CARCAÇAS E QUARTOS NO ATACADO */}
      {activeSection === 'carcacas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshot.carcassQuotes.map((carc) => (
            <div 
              key={carc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    carc.type === 'suino' ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-500'
                  }`}>
                    {carc.type === 'suino' ? '🐖 SUÍNO • ' : ''}{carc.type.toUpperCase()} • {carc.yieldPercentStandard}% DA CARCAÇA
                  </span>
                  <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    +{carc.changeWeek.toFixed(2)}% Sem.
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-2 leading-tight">
                  {carc.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                    R$ {carc.priceKg.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    / kg atacado
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    (~R$ {carc.equivalentArrobaPrice.toFixed(2)}/@)
                  </span>
                </div>

                <div className="mt-3 bg-slate-50 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Média Balcão Varejo RJ:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">R$ {carc.rjRetailPriceKg.toFixed(2)}/kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Margem Bruta Estimada:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {(((carc.rjRetailPriceKg - carc.priceKg) / carc.rjRetailPriceKg) * 100).toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {carc.notes}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Fonte: <strong>{carc.source}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEÇÃO 9: GRAXARIA & SUBPRODUTOS */}
      {activeSection === 'graxaria' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/40 dark:via-emerald-950/30 dark:to-teal-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Auditoria Contábil da Margem de Graxaria (Sebo & Osso) • Custo Real da Desossa
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  O Sebo e o Osso <strong>não possuem custo de compra isolado</strong>; são créditos de resíduo gerados na desossa da carcaça comercial.
                  Toda a receita obtida com a venda para indústrias de biodiesel e rendering (<strong>R$ 109,14 por boi de 240kg</strong>) é abatida do desembolso total, barateando o custo efetivo da carne limpa de <strong>R$ 26,00/kg para R$ 33,39/kg</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-500/20 font-mono text-xs">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">1. Sebo Bovino Industrial</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">R$ 4,85/kg (15,60 kg = R$ 75,66)</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Abate R$ 0,32/kg do custo da carcaça</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">2. Osso para Rendering (FCO)</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">R$ 0,90/kg (37,20 kg = R$ 33,48)</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Abate R$ 0,14/kg do custo da carcaça</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">3. Crédito Total de Graxaria</span>
                <strong className="text-amber-600 dark:text-amber-400 text-sm">R$ 109,14 recuperados / boi</strong>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">+100% de Crédito Contábil</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {snapshot.cutQuotes.filter(c => c.category === 'graxaria').map((sub) => (
              <div 
                key={sub.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    SUBPRODUTO DE RENDERING & GRAXARIA • {sub.standardYieldPercent.toFixed(1)}% CARCAÇA
                  </span>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-1">
                    {sub.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      R$ {sub.avgPriceKg.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">/ kg</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {sub.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex flex-col gap-1">
                  <span>Coletoras / Destino: <strong>{sub.packers}</strong></span>
                  <span className="text-[10px] text-slate-400">{sub.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 10: FONTES OFICIAIS & METODOLOGIA */}
      {activeSection === 'fontes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-3 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Fontes de Informação Confiáveis, Reais & Metodologia de Coleta
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Todas as cotações exibidas no ERP são balizadas por entidades oficiais do agronegócio e varejo supermercadista.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  CEPEA / ESALQ - Universidade de São Paulo (USP)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Principal centro de pesquisas econômicas do agronegócio brasileiro. Calcula o Indicador do Boi Gordo CEPEA/B3 no estado de São Paulo, adotado oficialmente pela B3 para liquidação financeira de contratos futuros de boi gordo. Amostra diária com mais de 30 frigoríficos e pecuaristas.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  B3 S.A. - Brasil, Bolsa, Balcão
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  A bolsa de valores oficial do Brasil, onde são negociados os contratos futuros do Boi Gordo (código BGI) com vencimentos mensais. Baliza as expectativas de preço do mercado futuro para confinamentos e compras programadas.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Scot Consultoria
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Maior consultoria independente de pecuária de corte do país. Monitora diariamente mais de 30 praças pecuárias em 15 estados brasileiros, escalas de abate dos frigoríficos em dias úteis, e o diferencial de preço entre o Boi Comum e o Boi Padrão China.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Ceasa Irajá RJ / DITEC / Frigoríficos Locais RJ
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Referência do abastecimento atacadista de carcaças bovinas e carnes no Grande Rio. Aferição diária no Pavilhão de Carnes da Ceasa Irajá e dos frigoríficos com inspeção estadual/federal atuantes no Rio de Janeiro (Barra Mansa Alimentos, RioBeef, Silva RJ, Plena).
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  ASSERJ & Scantec Sell-Out RJ
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Associação de Supermercados do Estado do Rio de Janeiro em parceria com a Scantec, que captura vendas reais no PDV por leitura de cupons fiscais emitidos em lojas das principais redes cariocas (Guanabara, Mundial, Prezunic, Supermarket, Rede Economia, Dom Atacadista, Assaí RJ).
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  NielsenIQ Retail Index & SECEX / MDIC
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Auditoria de mercado que avalia o share de faturamento de cada corte no açougue fluminense, somada aos relatórios da Secretaria de Comércio Exterior (SECEX/MDIC) sobre as exportações de carne bovina in natura por destino e preço em dólar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
