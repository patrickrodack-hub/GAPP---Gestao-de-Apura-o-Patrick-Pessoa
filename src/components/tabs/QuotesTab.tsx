import React, { useState, useEffect, useMemo } from 'react';
import { 
  MarketQuotesSnapshot, 
  MarketIndicator, 
  RegionalQuote, 
  WholesaleCarcassQuote, 
  WholesaleCutQuote,
  RJRetailBenchmark
} from '../../types/marketQuotes';
import { YieldParams } from '../../types/erp';
import { MarketQuotesService } from '../../services/marketQuotesService';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  FileDown, 
  MessageCircle, 
  CheckCircle2, 
  Building2, 
  DollarSign, 
  Scale, 
  SlidersHorizontal, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Activity, 
  Flame, 
  Check, 
  Calendar,
  Layers,
  BarChart3,
  HelpCircle,
  ShoppingBag,
  Store,
  Calculator,
  Percent,
  AlertTriangle,
  Info,
  Beef,
  PieChart,
  Tag
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
    'cortes' | 'suino' | 'varejo_rj' | 'carcacas' | 'pracas' | 'graxaria' | 'indicadores' | 'calculadora_rj' | 'arbitragem'
  >('cortes');
  const [simSuinoLiveWeight, setSimSuinoLiveWeight] = useState<number>(115);
  const [cutSearchQuery, setCutSearchQuery] = useState('');
  const [selectedCutCategory, setSelectedCutCategory] = useState<'all' | 'nobres' | 'traseiro' | 'coxao' | 'alcatrao' | 'dianteiro' | 'suino' | 'graxaria'>('all');
  const [isApplyingQuote, setIsApplyingQuote] = useState(false);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Simulador de Margem Varejo RJ
  const [simCostArroba, setSimCostArroba] = useState<number>(328.00);
  const [simTargetMargin, setSimTargetMargin] = useState<number>(24.0);

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
      if (showToast) showToast('Cotações de mercado e indicadores RJ sincronizados com fontes oficiais!');
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

  // Card unificado de Corte / Carcaça
  const renderCutCard = (cut: WholesaleCutQuote) => (
    <div 
      key={cut.id}
      className={`bg-white dark:bg-slate-900 border ${
        cut.id === 'cut-banda-suina' || cut.id === 'cut-suino-vivo'
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
              Giro Scantec: {cut.scantecGiroRating}
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
              {cut.id === 'cut-suino-vivo' ? 'Equivalente Balcão' : 'Média Varejo RJ (Nielsen)'}
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

        {/* Sugestão GAPP e Share de Vendas */}
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

  // Painel de Destaque Executivo de Suíno (Carcaça / Banda Suína & Suíno Vivo)
  const renderSuinoDashboard = () => (
    <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border border-rose-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-lg space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 bg-rose-500/20 rounded-2xl border border-rose-500/30">
            🐖
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-400/40">
                CADEIA SUINÍCOLA OFICIAL • SC / PR / MG / SP / RJ
              </span>
              <span className="text-[10px] text-slate-400 font-mono">CEPEA/ESALQ • ASEMG • SCOT CONSULTORIA</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
              Cotação Oficial de Suínos: Carcaça (Banda Suína) & Suíno Vivo
            </h3>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Preços de referência da carcaça/banda suína resfriada posta no atacado e do animal terminado vivo ao produtor independente e integrado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Compartilhar Boletim Suíno</span>
          </button>
        </div>
      </div>

      {/* 3 CARDS DE DESTAQUE: BANDA SUÍNA, SUÍNO VIVO E DESOSSA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Card 1: Carcaça Suína / Banda Suína */}
        <div className="bg-slate-900/90 border border-rose-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider">
                CARCAÇA • BANDA SUÍNA
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                Atacado Estável
              </span>
            </div>
            <h4 className="font-extrabold text-white text-sm mt-1">
              Carcaça Suína Especial (Banda Fria)
            </h4>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-rose-400">
                R$ 13,80
              </span>
              <span className="text-xs text-slate-400 font-mono">/kg atacado</span>
              <span className="text-[11px] text-slate-300 font-mono ml-auto">
                (~R$ 207,00/@)
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Varejo Médio Balcão RJ:</span>
                <strong className="text-emerald-400 font-mono">R$ 20,90/kg</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Margem Bruta Estimada:</span>
                <strong className="text-emerald-300 font-mono">33,97%</strong>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Peso Médio Meia Banda:</span>
                <span className="font-mono text-slate-200">35 a 42 kg / peça</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            Frigoríficos: <strong>Seara, Aurora, Sadia, Saudali, Frimesa</strong>
          </div>
        </div>

        {/* Card 2: Suíno Vivo */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                PRODUTOR • GRANJA / INDÚSTRIA
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50">
                +0.65% Sem.
              </span>
            </div>
            <h4 className="font-extrabold text-white text-sm mt-1">
              Suíno Vivo Terminado (Kg Vivo)
            </h4>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-amber-400">
                R$ 7,85
              </span>
              <span className="text-xs text-slate-400 font-mono">/kg vivo</span>
              <span className="text-[11px] text-slate-300 font-mono ml-auto">
                (~R$ 117,75/@ viva)
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Rendimento Carcaça (RC):</span>
                <strong className="text-amber-300 font-mono">74,0%</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Paridade Carcaça / Vivo:</span>
                <strong className="text-slate-200 font-mono">1,76x (R$ 13,80 ÷ 7,85)</strong>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Faixa ao Produtor:</span>
                <span className="font-mono text-slate-200">R$ 7,40 a R$ 8,40/kg vivo</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            Fontes: <strong>CEPEA/ESALQ • ASEMG (Bolsa de MG) • Scot</strong>
          </div>
        </div>

        {/* Card 3: Paridade e Desossa da Banda */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                ZOOTECNIA • DESOSSA EM LOJA
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                Margem 35.8%
              </span>
            </div>
            <h4 className="font-extrabold text-white text-sm mt-1">
              Rendimento Padrão da Banda Suína
            </h4>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>• Pernil c/ Osso (25%):</span>
                <span className="font-mono text-white">R$ 18,90/kg balcão</span>
              </div>
              <div className="flex justify-between">
                <span>• Paleta c/ Osso (18%):</span>
                <span className="font-mono text-white">R$ 17,90/kg balcão</span>
              </div>
              <div className="flex justify-between">
                <span>• Costela Suína (8,5%):</span>
                <span className="font-mono text-emerald-400 font-bold">R$ 28,90/kg balcão</span>
              </div>
              <div className="flex justify-between">
                <span>• Lombo Limpo (10%):</span>
                <span className="font-mono text-white">R$ 23,90/kg balcão</span>
              </div>
              <div className="flex justify-between">
                <span>• Toucinho / Papada (14%):</span>
                <span className="font-mono text-slate-400">R$ 9,50/kg</span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-emerald-300">
            Dica GAPP: Compra em banda inteira garante custo 28% menor que cortes embalados.
          </div>
        </div>

      </div>

      {/* SIMULADOR RÁPIDO: CONVERSÃO VIVO X CARCAÇA / BANDA */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-bold text-slate-200">
            Simulador de Conversão Zootécnica (Vivo ⇄ Banda):
          </span>
          <span className="text-slate-400 hidden lg:inline">
            Digite o peso vivo do animal para calcular o rendimento estimado de carcaça e meias bandas:
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Peso Vivo:</span>
            <input
              type="number"
              min="80"
              max="180"
              step="1"
              value={simSuinoLiveWeight}
              onChange={(e) => setSimSuinoLiveWeight(Number(e.target.value) || 115)}
              className="w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs font-bold text-center focus:outline-rose-400"
            />
            <span className="text-slate-400 font-mono">kg</span>
          </div>

          <div className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-mono text-[11px] text-slate-200">
            Carcaça (74%): <strong className="text-amber-400">{(simSuinoLiveWeight * 0.74).toFixed(1)} kg</strong>
          </div>

          <div className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 font-mono text-[11px] text-slate-200">
            Meia Banda: <strong className="text-rose-400">{(simSuinoLiveWeight * 0.37).toFixed(1)} kg</strong>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 font-sans pb-10">
      
      {/* 1. TICKER SUPERIOR DE COTAÇÕES EM TEMPO REAL */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-lg border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${snapshot.marketStatus === 'ABERTO' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${snapshot.marketStatus === 'ABERTO' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-extrabold text-[11px] tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
              <span>Cotação em Tempo Real</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-normal">Fontes: CEPEA/ESALQ • B3 • Scot • IMEA • NielsenIQ RJ • Scantec RJ</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden sm:inline">
              Status: <strong className={snapshot.marketStatus === 'ABERTO' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {snapshot.marketStatus === 'ABERTO' ? '🟢 Pregão Aberto' : '🔴 Mercado Fechado'}
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
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 shrink-0 transition"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[140px]">
                  {ind.name.split('(')[0]}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-sm text-white">
                    {ind.unit.includes('R$') ? `R$ ${ind.price.toFixed(2)}` : ind.price.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {ind.unit.replace('R$/', '')}
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
          
          {/* Título e Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  MÓDULO OFICIAL • COTAÇÃO EM TEMPO REAL & VAREJO RJ
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  v10.6 GAPP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Cotações de Bovino, Arroba & Cortes no Atacado e Varejo RJ
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Monitoramento com base real dos principais frigoríficos (JBS, Marfrig, Minerva), CEPEA/B3 e balcão supermercadista RJ (NielsenIQ / Scantec).
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
              title="Sincronizar e buscar novas oscilações do mercado"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}</span>
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
                  <span>Boletim em PDF</span>
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
              <span>Enviar no WhatsApp</span>
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
                  SINCRONIZAÇÃO MATRIZ & ERP
                </span>
                <span className="text-[11px] text-slate-300">
                  Cotação CEPEA SP: <strong className="text-white font-mono">R$ {marketBenchmarkArroba.toFixed(2)}/@</strong> • Entrada RJ: <strong className="text-emerald-300 font-mono">R$ {rjBenchmarkArroba.toFixed(2)}/@</strong>
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Custo vigente no ERP: <strong>R$ {systemArrobaPrice.toFixed(2)}/@</strong> (R$ {systemCostPerKg.toFixed(2)}/kg carcaça).
                {spreadDiff > 0 ? (
                  <span className="text-emerald-300 font-semibold ml-1">
                    (Você está comprando R$ {spreadDiff.toFixed(2)}/@ abaixo da cotação CEPEA SP!)
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
              onClick={() => handleApplyQuote(rjBenchmarkArroba, 'Entrada Rio de Janeiro')}
              disabled={isApplyingQuote}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Entrada RJ (R$ {rjBenchmarkArroba.toFixed(2)}/@)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuote(marketBenchmarkArroba, 'CEPEA/B3 SP')}
              disabled={isApplyingQuote}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar CEPEA (R$ {marketBenchmarkArroba.toFixed(2)}/@)</span>
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
          { id: 'cortes', label: '1. Cotação Real dos Cortes', count: snapshot.cutQuotes.length, badge: 'RJ & BR' },
          { id: 'suino', label: '2. Suíno (Carcaça, Vivo & Cortes)', count: snapshot.cutQuotes.filter(c => c.category === 'suino').length, badge: 'Banda & Vivo' },
          { id: 'varejo_rj', label: '3. Varejo RJ (NielsenIQ & Scantec)', count: snapshot.rjRetailBenchmarks.length, badge: 'Supermercados RJ' },
          { id: 'carcacas', label: '4. Carcaças & Quartos Atacado', count: snapshot.carcassQuotes.length },
          { id: 'pracas', label: '5. Praças Pecuárias & Frigoríficos', count: snapshot.regionalQuotes.length },
          { id: 'graxaria', label: '6. Subprodutos & Graxaria (Sebo/Osso)', count: 3, badge: 'Custo Real' },
          { id: 'indicadores', label: '7. Indicadores Oficiais & B3', count: snapshot.indicators.length },
          { id: 'calculadora_rj', label: '8. Simulador de Margem Varejo RJ', badge: 'Simulador' },
          { id: 'arbitragem', label: '9. Oportunidades & Arbitragem', badge: 'GAPP' }
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

      {/* SEÇÃO 1: CORTES DESOSSADOS (DIANTEIRO, TRASEIRO, COXÃO, ALCATRÃO, SUÍNO, GRAXARIA) */}
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
                placeholder="Buscar corte (ex: Picanha, Mignon, Alcatra, Acém, Chã, Paleta, Costela, Suíno, Sebo)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Todos os Cortes' },
                { id: 'dianteiro', label: 'Dianteiro' },
                { id: 'nobres', label: 'Traseiro Nobre' },
                { id: 'coxao', label: 'Coxão' },
                { id: 'alcatrao', label: 'Alcatrão' },
                { id: 'suino', label: 'Suíno (Banda, Vivo & Cortes)' },
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

          {/* BANNER ESPECIAL DE SUÍNO QUANDO FILTRO SUÍNO ESTIVER ATIVO */}
          {selectedCutCategory === 'suino' && renderSuinoDashboard()}

          {/* Grid de Cards de Alta Fidelidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCuts.map((cut) => renderCutCard(cut))}
          </div>
        </div>
      )}

      {/* SEÇÃO 2 DEDICADA: COTAÇÃO SUÍNA COMPLETA (CARCAÇA / BANDA, SUÍNO VIVO & CORTES) */}
      {activeSection === 'suino' && (
        <div className="space-y-4">
          {renderSuinoDashboard()}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Lista Completa de Itens Suínos (Atacado, Produtor & Balcão Supermercadista RJ):
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
              {snapshot.cutQuotes.filter(c => c.category === 'suino').length} Cotações Oficiais
            </span>
          </div>

          {/* Cards Suínos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshot.cutQuotes.filter(c => c.category === 'suino').map((cut) => renderCutCard(cut))}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: BENCHMARK VAREJO SUPERMERCADOS RJ (NIELSENIQ & SCANTEC) */}
      {activeSection === 'varejo_rj' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  Preços Praticados no Balcão das Principais Redes do Rio de Janeiro
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Amostragem em tempo real de preços nos supermercados do Grande Rio, Baixada Fluminense e Niterói para balizamento de compras e vendas.
                </p>
              </div>
            </div>

            {/* Tabela Comparativa de Redes do RJ */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rede Supermercadista RJ</th>
                    <th className="py-3 px-4">Perfil</th>
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
                      <td className="py-3 px-4 font-sans">
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

      {/* SEÇÃO 3: CARCAÇAS E QUARTOS NO ATACADO */}
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

      {/* SEÇÃO 4: PRAÇAS PECUÁRIAS & POLOS FRIGORÍFICOS */}
      {activeSection === 'pracas' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cotações por Praça Pecuária & Frigoríficos Habilitados
              </h3>
              <p className="text-xs text-slate-500">
                Preços de balcão do gado gordo em pé, a prazo, vaca gorda e spread em relação a São Paulo.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total: <strong>{snapshot.regionalQuotes.length} Praças Ativas</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Praça / Polo Frigorífico</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Boi Gordo À Vista (@)</th>
                  <th className="py-3 px-4 text-right">30 Dias (@)</th>
                  <th className="py-3 px-4 text-right">Kg Vivo Estimado</th>
                  <th className="py-3 px-4 text-right">Vaca Gorda (@)</th>
                  <th className="py-3 px-4 text-right">Novilha (@)</th>
                  <th className="py-3 px-4 text-right">Spread vs SP</th>
                  <th className="py-3 px-4 text-center">Escala (Dias)</th>
                  <th className="py-3 px-4">Frigoríficos Ofertantes</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-mono">
                {snapshot.regionalQuotes.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{reg.region}</span>
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                      {reg.slaughterScaleDays} d
                    </td>
                    <td className="py-3 px-4 font-sans text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[160px]" title={reg.mainPackers}>
                      {reg.mainPackers}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleApplyQuote(reg.cashPriceArroba, `${reg.region} (${reg.stateCode})`)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 font-bold text-[10px] transition cursor-pointer"
                        title={`Assumir cotação de ${reg.region} como custo padrão no ERP`}
                      >
                        Aplicar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEÇÃO 5: SUBPRODUTOS & GRAXARIA (SEBO & OSSO RECALCULADOS COM VALOR REAL) */}
      {activeSection === 'graxaria' && (
        <div className="space-y-4">
          
          {/* Card de Esclarecimento Contábil da Graxaria */}
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

            {/* Matriz de Impacto Financeiro da Graxaria */}
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

          {/* Cards de Subprodutos */}
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

      {/* SEÇÃO 6: INDICADORES GERAIS */}
      {activeSection === 'indicadores' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshot.indicators.map((ind) => (
              <div 
                key={ind.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      ind.category === 'suino' ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-500'
                    }`}>
                      {ind.category === 'suino' ? '🐖 SUÍNO • ' : ''}{ind.code}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      ind.changeDay > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      ind.changeDay < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {ind.changeDay > 0 ? `+${ind.changeDay.toFixed(2)}% Dia` : `${ind.changeDay.toFixed(2)}% Dia`}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-2 leading-tight">
                    {ind.name}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {ind.unit.includes('R$') ? `R$ ${ind.price.toFixed(2)}` : ind.price.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      {ind.unit}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {ind.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Fonte: <strong>{ind.source}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleApplyQuote(ind.price, ind.name)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Usar no ERP →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 7: SIMULADOR DE MARGEM VAREJO RJ */}
      {activeSection === 'calculadora_rj' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Simulador de Margem & Markup para o Varejo Supermercadista do Rio de Janeiro
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simule o preço de compra do gado e visualize instantaneamente os preços sugeridos de venda no balcão das lojas comparando com o mercado RJ.
                </p>
              </div>
            </div>

            {/* Controles de Simulação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase">
                  Cotação de Compra da Arroba (R$/@)
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="1"
                    value={simCostArroba}
                    onChange={(e) => setSimCostArroba(Number(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-500">R$/@</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Equivale a R$ {(simCostArroba / 15).toFixed(2)}/kg na carcaça
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase">
                  Margem Alvo sobre Venda (%)
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="0.5"
                    value={simTargetMargin}
                    onChange={(e) => setSimTargetMargin(Number(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Markup equivalente: +{((simTargetMargin / (100 - simTargetMargin)) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-300 dark:border-emerald-700 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                    RECEITA RECUPERADA DE GRAXARIA
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                    +R$ 109,14 / boi
                  </div>
                </div>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium mt-2">
                  Abate R$ 0,45/kg no custo total da carne
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 8: ANÁLISE DE ARBITRAGEM & OPORTUNIDADE GAPP */}
      {activeSection === 'arbitragem' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Análise Comparativa: Cotação de Mercado CEPEA vs Custo Real Grupo GAPP
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Avaliação de arbitragem e economia obtida na compra de lotes de gado em relação ao indicador oficial da B3.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              
              {/* Card 1: Cotação CEPEA SP */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500">Cotação Oficial CEPEA/B3 SP</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  R$ {marketBenchmarkArroba.toFixed(2)}/@
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Equivalente: R$ {(marketBenchmarkArroba / 15).toFixed(2)}/kg carcaça
                </span>
              </div>

              {/* Card 2: Custo Vigente ERP */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500">Custo Base Parametrizado GAPP</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  R$ {systemArrobaPrice.toFixed(2)}/@
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Equivalente: R$ {systemCostPerKg.toFixed(2)}/kg carcaça
                </span>
              </div>

              {/* Card 3: Spread Obtido */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500">Spread / Ganho de Arbitragem</span>
                <div className={`text-2xl font-black font-mono mt-1 ${spreadDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {spreadDiff >= 0 ? `+R$ ${spreadDiff.toFixed(2)}/@` : `-R$ ${Math.abs(spreadDiff).toFixed(2)}/@`}
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Variação: {spreadPercent.toFixed(2)}% sobre o mercado
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
