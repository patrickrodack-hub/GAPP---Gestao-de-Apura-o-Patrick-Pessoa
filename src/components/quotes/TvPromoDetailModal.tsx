import React from 'react';
import { PerishableProductItem, PerishableTvPromoOffer, PerishableProductCalculatedStats } from '../../types/perishablesQuotes';
import { 
  Tv, 
  X, 
  ShieldCheck, 
  Tag, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Building2, 
  CheckCircle2, 
  Award, 
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-react';

interface TvPromoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: PerishableProductItem;
  promo: PerishableTvPromoOffer;
  stats: PerishableProductCalculatedStats;
}

export const TvPromoDetailModal: React.FC<TvPromoDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  promo,
  stats
}) => {
  if (!isOpen) return null;

  const diffR$ = stats.avgPrice - promo.promoPrice;
  const discountPercent = stats.avgPrice > 0 ? Math.round((diffR$ / stats.avgPrice) * 100) : 0;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-700/60 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Corporativo do Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-[#113829] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Tv className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase font-mono tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  RADAR PROMOÇÕES RJ (TV • ENCARTE • CLUBE • REDES)
                </span>
                <span className="text-xs text-amber-200 font-bold">Vigência Verificada</span>
              </div>
              <h3 className="text-base font-black tracking-tight leading-tight mt-0.5">
                Comprovante de Promoção Publicada
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Documento de Auditoria */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-100 text-xs">
          
          {/* Card do Produto */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 block uppercase">
                  Código: {product.productCode}
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {product.specification}
                </p>
              </div>
              <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs shrink-0">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Destaque do Preço Promocional vs Balcão */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600/60">
              <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                Preço Promocional em Vigência
              </span>
              <div className="text-2xl font-black text-amber-900 dark:text-amber-100 font-mono mt-1">
                R$ {promo.promoPrice.toFixed(2)}
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1 mt-1">
                <Tag className="w-3 h-3" />
                {promo.highlightTag}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-600/60">
              <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                Economia vs Média das 12 Redes
              </span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                -{discountPercent}%
              </div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" />
                Economia de R$ {diffR$ > 0 ? diffR$.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Condições & Regras da Promoção */}
          {promo.conditionNotes && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs">
              <strong>Regra de Oferta / Condições:</strong> {promo.conditionNotes}
            </div>
          )}

          {/* Ficha Técnica da Veiculação / Clipping */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Rede Anunciante:</span>
              </div>
              <span className="font-black text-slate-900 dark:text-white">
                {promo.chainName}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Tv className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold">Canal / Meio de Publicação:</span>
              </div>
              <span className="font-bold text-indigo-700 dark:text-indigo-400 text-right">
                {promo.mediaLabel}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">Horário / Registro de Transmissão:</span>
              </div>
              <span className="font-mono text-slate-800 dark:text-slate-200 text-right">
                {promo.adBroadcastTime || 'Hoje • Publicação Monitorada'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span className="font-semibold">Vigência Legal da Oferta:</span>
              </div>
              <span className="font-bold text-rose-700 dark:text-rose-400 text-right">
                {promo.validity}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Base de Auditoria & Clipping:</span>
              </div>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 text-right">
                {promo.auditSource}
              </span>
            </div>
          </div>

          {/* Comparativo com os limites do mercado RJ */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Menor preço gôndola regular (12 redes):</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                R$ {stats.minPrice.toFixed(2)} ({stats.cheapestChain})
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Média de mercado balcão RJ:</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                R$ {stats.avgPrice.toFixed(2)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Maior preço gôndola regular:</span>
              <strong className="text-rose-700 dark:text-rose-400 font-mono">
                R$ {stats.maxPrice.toFixed(2)} ({stats.priciestChain})
              </strong>
            </div>
          </div>

          {/* Selo de Veracidade Institucional GAPP */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-[11px]">
              <strong className="text-emerald-900 dark:text-emerald-200 block">
                Auditoria de Veracidade Garantida • GAPP - PATRICK PESSOA
              </strong>
              <span className="text-emerald-700 dark:text-emerald-400">
                Dados rastreados automaticamente através de monitoramento de mídia de TV aberta, encartes oficiais e base SEFAZ-RJ / ASSERJ.
              </span>
            </div>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            Autenticação: GAPP-TV-AUDIT-{product.id.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#113829] hover:bg-[#1b523c] text-white font-bold text-xs transition cursor-pointer"
          >
            Entendido / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
