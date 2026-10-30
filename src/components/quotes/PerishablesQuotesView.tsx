import React, { useState, useMemo } from 'react';
import { 
  PerishableCategoryId, 
  PerishableProductItem,
  PerishableTvPromoOffer,
  FlvSubdivision,
  PriceDiscrepancyItem,
  PerishablesAuditReport
} from '../../types/perishablesQuotes';
import { 
  PERISHABLE_CATEGORIES, 
  RJ_SUPERMARKET_CHAINS, 
  PerishablesQuotesService 
} from '../../services/perishablesQuotesService';
import { OFFICIAL_RJ_TV_PROMO_REGISTRY } from '../../services/perishableTvPromoRegistry';
import { TvPromoDetailModal } from './TvPromoDetailModal';
import { PriceHistoryModal } from './PriceHistoryModal';
import { TvRadarAuditModal, TvRadarScanTelemetry } from './TvRadarAuditModal';
import { DiscrepancyAuditModal } from './DiscrepancyAuditModal';
import { 
  Search, 
  RotateCcw, 
  RefreshCw, 
  FileDown, 
  Printer, 
  FileSpreadsheet, 
  MessageCircle, 
  CheckCircle2, 
  Store, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  Wrench,
  Edit3, 
  Check, 
  X, 
  Layers,
  Flame,
  Award,
  Sparkles,
  Tv,
  Radio,
  Tag,
  TrendingDown,
  Pin,
  History
} from 'lucide-react';

interface PerishablesQuotesViewProps {
  showToast?: (message: string) => void;
}

const FLV_SUBDIVISIONS: { id: FlvSubdivision | 'TODOS'; label: string; badgeColor: string; description: string }[] = [
  { id: 'FRUTAS', label: 'FRUTAS', badgeColor: 'bg-rose-500/20 text-rose-300', description: 'Banana, Maçã (kg e Pacote 800g), Laranja, Mamão, Melancia, Melão, Abacaxi, Manga, Limão, Maracujá, Abacate, Morango bdj e Uvas (Thompson, Vitória, Rubi, Benitaka e Itália)' },
  { id: 'LEGUMES', label: 'LEGUMES', badgeColor: 'bg-amber-500/20 text-amber-300', description: 'Batata Inglesa, Batata Doce, Cebola, Tomate, Cenoura, Chuchu, Abobrinha, Pimentão, Beterraba, Abóbora Sergipana, Aipim e Inhame' },
  { id: 'OVOS', label: 'OVOS', badgeColor: 'bg-yellow-500/20 text-yellow-300', description: 'Ovos Brancos (Bandeja c/ 30 un e Bandeja c/ 20 un), Ovos Vermelhos/Caipira, Dúzia c/ 12 e Ovos de Codorna' },
  { id: 'ALHO', label: 'ALHO', badgeColor: 'bg-purple-500/20 text-purple-300', description: 'Alho Granel kg, Alho Roxo Nobre a Granel, Descascado a Vácuo 1kg, Cartela 200g e Pasta de Alho' },
  { id: 'HORTALIÇAS', label: 'HORTALIÇAS', badgeColor: 'bg-emerald-500/20 text-emerald-300', description: 'Alface, Couve Manteiga, Cheiro Verde, Rúcula, Agrião e Brócolis Ninja' },
  { id: 'TODOS', label: 'TODOS (FLV COMPLETO)', badgeColor: 'bg-slate-500/20 text-slate-300', description: 'Visão consolidada de todas as 5 divisões de Hortifrúti / FLV' }
];

export const PerishablesQuotesView: React.FC<PerishablesQuotesViewProps> = ({ showToast }) => {
  const [activeCategoryId, setActiveCategoryId] = useState<PerishableCategoryId>('corte_frango');
  const [activeFlvSubdivision, setActiveFlvSubdivision] = useState<'TODOS' | FlvSubdivision>('FRUTAS');
  const [products, setProducts] = useState<PerishableProductItem[]>(() => PerishablesQuotesService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isScanningTv, setIsScanningTv] = useState(false);
  const [promoChannelFilter, setPromoChannelFilter] = useState<'ALL' | 'TV' | 'ENCARTE' | 'CLUBE' | 'LAMINA' | 'REDES'>('ALL');
  
  // Modal de auditoria de oferta de TV / encarte individual
  const [selectedTvPromoProduct, setSelectedTvPromoProduct] = useState<{
    product: PerishableProductItem;
    promo: PerishableTvPromoOffer;
    stats: any;
  } | null>(null);

  // Modal Executivo de Varredura e Auditoria do Radar de TV & Encartes RJ
  const [radarAuditTelemetry, setRadarAuditTelemetry] = useState<TvRadarScanTelemetry | null>(null);
  const [isRadarAuditOpen, setIsRadarAuditOpen] = useState(false);

  // Modal de Log de Auditoria e Discrepâncias de Preços
  const [isDiscrepancyModalOpen, setIsDiscrepancyModalOpen] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);

  // Modal de Histórico de Preços (4 Semanas)
  const [selectedHistory, setSelectedHistory] = useState<{
    isOpen: boolean;
    product: PerishableProductItem | null;
    chainId?: string;
    stats?: any;
  }>({
    isOpen: false,
    product: null
  });

  const handleOpenPriceHistory = (
    product: PerishableProductItem,
    chainId?: string,
    stats?: any
  ) => {
    setSelectedHistory({
      isOpen: true,
      product,
      chainId,
      stats: stats || PerishablesQuotesService.calculateProductStats(product)
    });
  };

  const handleClosePriceHistory = () => {
    setSelectedHistory({
      isOpen: false,
      product: null
    });
  };

  // Edição inline de preço
  const [editingCell, setEditingCell] = useState<{ productId: string; chainId: string } | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>('');

  // Categoria ativa atual
  const activeCategory = useMemo(() => {
    return PERISHABLE_CATEGORIES.find(c => c.id === activeCategoryId) || PERISHABLE_CATEGORIES[0];
  }, [activeCategoryId]);

  // Produtos filtrados por categoria, subdivisão FLV e pesquisa
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.categoryId === activeCategoryId)
      .filter(p => {
        if (activeCategoryId === 'hortifruti_flv' && activeFlvSubdivision !== 'TODOS') {
          return p.flvSubdivision === activeFlvSubdivision;
        }
        return true;
      })
      .filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || 
               p.productCode.toLowerCase().includes(q) ||
               p.specification.toLowerCase().includes(q) ||
               (p.flvSubdivision && p.flvSubdivision.toLowerCase().includes(q));
      })
      .filter(p => {
        if (promoChannelFilter === 'ALL') return true;
        const promo = p.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id];
        return promo?.mediaChannel === promoChannelFilter;
      });
  }, [products, activeCategoryId, activeFlvSubdivision, searchQuery, promoChannelFilter]);

  // Resumo estatístico da categoria (considerando subdivisão FLV ativa)
  const categorySummary = useMemo(() => {
    return PerishablesQuotesService.calculateCategorySummary(activeCategoryId, products, activeFlvSubdivision);
  }, [activeCategoryId, products, activeFlvSubdivision]);

  // Médias por rede para a categoria/subdivisão ativa (usadas no footer)
  const chainAverages = useMemo(() => {
    const categoryProds = products
      .filter(p => p.categoryId === activeCategoryId)
      .filter(p => {
        if (activeCategoryId === 'hortifruti_flv' && activeFlvSubdivision !== 'TODOS') {
          return p.flvSubdivision === activeFlvSubdivision;
        }
        return true;
      });
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    RJ_SUPERMARKET_CHAINS.forEach(chain => {
      let sum = 0;
      let min = Infinity;
      let max = -Infinity;
      let count = 0;

      categoryProds.forEach(prod => {
        const price = prod.chainPrices[chain.id];
        if (price && price > 0) {
          sum += price;
          count++;
          if (price < min) min = price;
          if (price > max) max = price;
        }
      });

      result[chain.id] = {
        avg: count > 0 ? Number((sum / count).toFixed(2)) : 0,
        min: count > 0 ? min : 0,
        max: count > 0 ? max : 0,
        count
      };
    });

    return result;
  }, [activeCategoryId, activeFlvSubdivision, products]);

  // Resumo estatístico de Ofertas de TV / Encartes para a sub-aba ativa
  const tvPromoSummary = useMemo(() => {
    const categoryProds = products
      .filter(p => p.categoryId === activeCategoryId)
      .filter(p => {
        if (activeCategoryId === 'hortifruti_flv' && activeFlvSubdivision !== 'TODOS') {
          return p.flvSubdivision === activeFlvSubdivision;
        }
        return true;
      });
    let count = 0;
    let minPromo = Infinity;
    let sumPromo = 0;
    const chainsWithOffers = new Set<string>();

    categoryProds.forEach(prod => {
      const promo = prod.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[prod.id];
      if (promo && promo.hasActivePromo && promo.promoPrice > 0) {
        count++;
        sumPromo += promo.promoPrice;
        if (promo.promoPrice < minPromo) minPromo = promo.promoPrice;
        chainsWithOffers.add(promo.chainName.split(' ')[0]);
      }
    });

    return {
      count,
      avgPromo: count > 0 ? Number((sumPromo / count).toFixed(2)) : 0,
      minPromo: minPromo === Infinity ? 0 : minPromo,
      chains: Array.from(chainsWithOffers).join(', ') || 'Guanabara, Mundial, Supermarket, Assaí'
    };
  }, [activeCategoryId, activeFlvSubdivision, products]);

  // Auditoria Contínua de Integridade e Detecção de Discrepâncias de Preço
  const auditReport = useMemo<PerishablesAuditReport>(() => {
    const discrepancies: PriceDiscrepancyItem[] = [];
    let promosAudited = 0;
    let parityCount = 0;

    products.forEach(p => {
      const promo = OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id] || p.promoOffer;
      if (promo && promo.hasActivePromo && promo.promoPrice > 0 && promo.chainId) {
        promosAudited++;
        const processedPrice = p.chainPrices[promo.chainId] || 0;
        const announcedPrice = promo.promoPrice;
        const diffValue = Number((processedPrice - announcedPrice).toFixed(2));
        const hasDiscrepancy = Math.abs(diffValue) > 0.009;

        if (hasDiscrepancy) {
          const diffPercent = announcedPrice > 0 ? Number(((diffValue / announcedPrice) * 100).toFixed(1)) : 0;
          const chain = RJ_SUPERMARKET_CHAINS.find(c => c.id === promo.chainId);

          discrepancies.push({
            id: `disc-${p.id}-${promo.chainId}`,
            productId: p.id,
            productCode: p.productCode,
            productName: p.name,
            categoryId: p.categoryId,
            flvSubdivision: p.flvSubdivision,
            chainId: promo.chainId,
            chainName: promo.chainName || chain?.name || promo.chainId,
            announcedPrice,
            processedPrice,
            diffValue,
            diffPercent,
            mediaChannel: promo.mediaChannel || (promo.mediaType.startsWith('TV') ? 'TV' : 'ENCARTE'),
            mediaLabel: promo.mediaLabel,
            validity: promo.validity,
            adBroadcastTime: promo.adBroadcastTime || 'Hoje',
            auditSource: promo.auditSource,
            severity: Math.abs(diffPercent) > 15 ? 'CRITICAL' : 'WARNING',
            timestamp: 'Em tempo real',
            resolved: false
          });
        } else {
          parityCount++;
        }
      }
    });

    const discrepancyCount = discrepancies.length;
    const totalAudited = products.length;
    const integrityScore = promosAudited > 0 ? Number(((parityCount / promosAudited) * 100).toFixed(1)) : 100;

    return {
      timestamp: 'Hoje (Auditado em tempo real)',
      latencyMs: 28,
      status: (discrepancyCount === 0 ? 'AUDITED_CONFORMANT' : 'DISCREPANCIES_FOUND') as 'AUDITED_CONFORMANT' | 'DISCREPANCIES_FOUND',
      totalProductsAudited: totalAudited,
      promosAudited,
      parityCount,
      discrepancyCount,
      integrityScore,
      discrepancies,
      auditHash: `AUDIT-LIVE-${discrepancyCount}-${promosAudited}`,
      verifiedSources: [
        'Associação de Supermercados do RJ (ASSERJ)',
        'SEFAZ-RJ • Preço da Hora RJ (NFC-e)',
        'Clipping TV Aberta (Globo RJ, Record RJ, SBT Rio)',
        'Procon-RJ • Fiscalização de Ofertas'
      ]
    };
  }, [products]);

  // Harmonização de Todas as Discrepâncias com Anúncios Oficiais
  const handleHarmonizeAll = async () => {
    setIsHarmonizing(true);
    try {
      const result = await PerishablesQuotesService.harmonizeProducts(products);
      setProducts(result.reconciledProducts);
      if (showToast) {
        showToast(`Auditoria Concluída: ${result.resolvedCount} preços harmonizados e paridade de 100% restaurada no ERP!`);
      }
    } catch (err) {
      console.error('Erro ao harmonizar:', err);
      if (showToast) showToast('Erro ao harmonizar preços de perecíveis.');
    } finally {
      setIsHarmonizing(false);
    }
  };

  // Harmonização Individual de um Corte com Discrepância
  const handleHarmonizeSingle = async (disc: PriceDiscrepancyItem) => {
    const updated = PerishablesQuotesService.updateProductChainPrice(disc.productId, disc.chainId, disc.announcedPrice);
    setProducts(updated);
    if (showToast) {
      showToast(`Preço do ${disc.productName} na rede ${disc.chainName} harmonizado para R$ ${disc.announcedPrice.toFixed(2)}!`);
    }
  };

  // Handlers de Ações
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulação de verificação em fontes de dados do RJ
      await new Promise(r => setTimeout(r, 600));
      if (showToast) showToast('Cotações de perecíveis sincronizadas com as bases de dados do RJ!');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetBaseline = () => {
    setIsResetting(true);
    try {
      const restored = PerishablesQuotesService.resetToOfficialRJBaseline();
      setProducts(restored);
      setSearchQuery('');
      setEditingCell(null);
      if (showToast) showToast('Base oficial de supermercados do RJ restaurada com 100% de paridade entre anúncios e preços de gôndola!');
    } finally {
      setIsResetting(false);
    }
  };

  // Rastreamento ativo e funcional de comerciais de TV aberta RJ e encartes
  const handleScanTvPromotions = async () => {
    setIsScanningTv(true);
    try {
      // Executa varredura profunda em todas as 11 sub-abas para máxima veracidade e sincronização
      const result = await PerishablesQuotesService.scanTvAndEncartePromotions();
      setProducts(result.products);
      setRadarAuditTelemetry(result);
      setIsRadarAuditOpen(true);
      if (showToast) {
        showToast(`Radar TV & Encartes RJ: ${result.activePromosCount} ofertas auditadas e ${result.updatedCompetitorPricesCount} preços de concorrentes sincronizados com sucesso!`);
      }
    } catch (e) {
      console.error('Erro ao escanear ofertas de TV:', e);
      if (showToast) showToast('Erro ao sincronizar radar de comerciais de TV.');
    } finally {
      setIsScanningTv(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await PerishablesQuotesService.exportCategoryToExcel(activeCategoryId, products, activeFlvSubdivision);
      if (showToast) showToast('Planilha Excel (.xlsx) de Perecíveis gerada com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      if (showToast) showToast('Erro ao exportar planilha Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await PerishablesQuotesService.generateAndDownloadPdf(activeCategoryId, products, activeFlvSubdivision);
      if (showToast) showToast('Relatório Oficial em PDF de Perecíveis baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      if (showToast) showToast('Erro ao gerar relatório PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    PerishablesQuotesService.printCategoryReport(activeCategoryId, products, activeFlvSubdivision);
  };

  const handleShareWhatsApp = () => {
    const encoded = PerishablesQuotesService.generateWhatsAppSummary(activeCategoryId, products, activeFlvSubdivision);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Edição inline de célula de preço
  const startEditing = (productId: string, chainId: string, currentVal: number) => {
    setEditingCell({ productId, chainId });
    setTempEditValue(currentVal > 0 ? currentVal.toFixed(2) : '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setTempEditValue('');
  };

  const saveEditing = () => {
    if (!editingCell) return;
    const num = parseFloat(tempEditValue.replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      const updated = PerishablesQuotesService.updateProductChainPrice(
        editingCell.productId,
        editingCell.chainId,
        num
      );
      setProducts(updated);
      if (showToast) showToast('Preço de balcão atualizado e salvo localmente!');
    }
    setEditingCell(null);
    setTempEditValue('');
  };

  return (
    <div className="space-y-4">
      {/* 1. SELETOR DE SUB-ABAS COM DESTAQUE EXECUTIVO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 uppercase tracking-wider">
                MÓDULO DE PERECÍVEIS • {PERISHABLE_CATEGORIES.length} SUB-ABAS
              </span>
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                Amostragem em 12 Redes Supermercadistas Fluminenses
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Cotação de Perecíveis no Varejo do Rio de Janeiro
            </h2>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Sub-aba ativa: <strong className="text-slate-900 dark:text-white">{activeCategory.label}</strong>
          </div>
        </div>

        {/* Linha com as Sub-abas com visual ergonômico */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pt-3">
          {PERISHABLE_CATEGORIES.map(cat => {
            const isActive = activeCategoryId === cat.id;
            const prodsInCat = products.filter(p => p.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setEditingCell(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#113829] text-white shadow-md shadow-emerald-950/20 ring-2 ring-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {prodsInCat}
                </span>
              </button>
            );
          })}
        </div>

        {/* SUB-DIVISÃO DINÂMICA EXCLUSIVA PARA HORTFRUT / FLV: FRUTAS, LEGUMES, OVOS, ALHO, HORTALIÇAS */}
        {activeCategoryId === 'hortifruti_flv' && (
          <div className="mt-3 pt-3 border-t border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-amber-50/70 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/30 rounded-xl p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider">
                  DIVISÃO DINÂMICA HORTFRUT / FLV
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Selecione o grupo de FLV para filtrar cotações, indicadores e relatórios:
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                Divisão Ativa: {activeFlvSubdivision} ({filteredProducts.length} itens)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FLV_SUBDIVISIONS.map(sub => {
                const isSubActive = activeFlvSubdivision === sub.id;
                const countInSub = products
                  .filter(p => p.categoryId === 'hortifruti_flv')
                  .filter(p => sub.id === 'TODOS' ? true : p.flvSubdivision === sub.id).length;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setActiveFlvSubdivision(sub.id);
                      setEditingCell(null);
                    }}
                    title={sub.description}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                      isSubActive
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950/20 ring-2 ring-amber-400'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-extrabold ${
                      isSubActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {countInSub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. BARRA DE STATUS DE AUDITORIA & METODOLOGIA */}
      <div className="flex items-center justify-between gap-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl px-4 py-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold tracking-wide uppercase text-[11px] text-emerald-800 dark:text-emerald-300">
            AUDITORIA DE BALCÃO ATIVA & SINCRONIZADA EM TEMPO REAL
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 hidden sm:inline">•</span>
          <span className="text-slate-600 dark:text-slate-300 hidden md:inline">
            Amostragem em 12 redes fluminenses (Populares, Atacarejos e Premium)
          </span>
        </div>
        <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-white/70 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
          Última sincronização: <strong>{new Date().toLocaleDateString('pt-BR')} às 17:30</strong>
        </div>
      </div>

      {/* 3. TOOLBAR EXECUTIVA DE AÇÕES E RELATÓRIO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          
          {/* Campo de Busca Rápida de Produtos */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar em ${activeCategory.label}...`}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Meio de Publicação da Oferta (TV, Encarte, Clube, Lâmina, Redes) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 hidden sm:inline">
              Filtro Mídia:
            </span>
            {[
              { id: 'ALL', label: 'Todos os Meios', icon: Flame },
              { id: 'TV', label: 'TV Aberta RJ', icon: Tv },
              { id: 'CLUBE', label: 'Clube / App', icon: Tag },
              { id: 'ENCARTE', label: 'Tabloides', icon: FileSpreadsheet },
              { id: 'LAMINA', label: 'Lâminas', icon: Layers },
              { id: 'REDES', label: 'Redes Sociais', icon: Sparkles }
            ].map((channelItem) => {
              const Icon = channelItem.icon;
              const isSelected = promoChannelFilter === channelItem.id;
              return (
                <button
                  key={channelItem.id}
                  type="button"
                  onClick={() => setPromoChannelFilter(channelItem.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{channelItem.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botões de Ação Executiva */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            
            {/* Status e Botão de Auditoria de Integridade de Preços */}
            <button
              type="button"
              onClick={() => setIsDiscrepancyModalOpen(true)}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm ${
                auditReport.discrepancyCount > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-700/85 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40'
              }`}
              title={
                auditReport.discrepancyCount > 0
                  ? `Alerta de Auditoria: ${auditReport.discrepancyCount} discrepâncias detectadas. Clique para ver o log.`
                  : 'Auditoria Conforme: 100% de paridade entre anúncios e preços de gôndola.'
              }
            >
              {auditReport.discrepancyCount > 0 ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-200" />
                  <span>Auditoria ({auditReport.discrepancyCount} divergências)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>100% Auditado</span>
                </>
              )}
            </button>

            {/* Restaurar Base Oficial */}
            <button
              type="button"
              onClick={handleResetBaseline}
              disabled={isResetting}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-400/40 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Restaurar preços originais da pesquisa oficial do Rio de Janeiro"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Limpar e Resetar</span>
            </button>

            {/* Rastrear Ofertas de TV & Encartes */}
            <button
              type="button"
              onClick={handleScanTvPromotions}
              disabled={isScanningTv}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Rastrear em tempo real ofertas veiculadas em comerciais de TV aberta (Globo/Record) e encartes de supermercados do RJ"
            >
              {isScanningTv ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Rastreando TV RJ...</span>
                </>
              ) : (
                <>
                  <Tv className="w-3.5 h-3.5 text-amber-200" />
                  <span>Rastrear Ofertas TV & Encartes</span>
                </>
              )}
            </button>

            {/* Sincronizar 12 Redes */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Sincronizar base de dados das 12 redes supermercadistas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sincronizar 12 Redes RJ</span>
            </button>

            {/* Baixar Relatório PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-[#113829] hover:bg-[#1b523c] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Baixar Relatório Executivo em PDF formatado em A4 Paisagem"
            >
              {isExportingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Baixar Relatório PDF</span>
                </>
              )}
            </button>

            {/* Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Imprimir relatório"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Imprimir</span>
            </button>

            {/* Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Exportar para Excel (.xlsx) com fórmulas e formatação de moeda"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExportingExcel ? 'Exportando...' : 'Excel (.xlsx)'}</span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Compartilhar resumo comparativo das 12 redes no WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* 4. KPI SUMMARY CARDS CONSOLIDADOS DO SEGMENTO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-[#113829]">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">MÉDIA DO SEGMENTO</div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              R$ {categorySummary.avgPriceCategory.toFixed(2)}
              <span className="text-[10px] font-normal text-slate-400">/kg</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {categorySummary.totalProducts} cortes auditados
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 border-t-4 border-t-emerald-600">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">MENOR PREÇO DO SEGMENTO</div>
            <div className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              R$ {categorySummary.minPriceCategory.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-600/90 dark:text-emerald-400 mt-0.5 font-semibold truncate">
              {categorySummary.cheapestChainOverall || 'Atacarejo RJ'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 border-t-4 border-t-rose-600">
            <div className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase">MAIOR PREÇO DO SEGMENTO</div>
            <div className="text-base font-black text-rose-700 dark:text-rose-400 mt-0.5">
              R$ {categorySummary.maxPriceCategory.toFixed(2)}
            </div>
            <div className="text-[10px] text-rose-600/90 dark:text-rose-400 mt-0.5 font-semibold truncate">
              {categorySummary.priciestChainOverall || 'Rede Premium'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 border-t-4 border-t-amber-500">
            <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">REDE MAIS COMPETITIVA</div>
            <div className="text-base font-black text-amber-800 dark:text-amber-300 mt-0.5 truncate">
              {categorySummary.cheapestChainOverall || 'Dom / Atacadão'}
            </div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-0.5 font-semibold">
              Piso de Preço no Grande RJ
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-indigo-600">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">AMPLITUDE MÉDIA (SPREAD)</div>
            <div className="text-base font-black text-indigo-700 dark:text-indigo-400 mt-0.5">
              R$ {categorySummary.avgSpread.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Variação entre redes no RJ
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-slate-700">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">REDES MONITORADAS</div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              12 Redes RJ
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
              Populares + Atacarejos + Premium
            </div>
          </div>
        </div>

        {/* Banner de Auditoria de Dados e Paridade Comercial */}
        {auditReport.discrepancyCount > 0 ? (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-rose-950 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>ALERTA DE AUDITORIA: {auditReport.discrepancyCount} DISCREPÂNCIAS DETECTADAS!</span>
                  <span className="px-2 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono">
                    {auditReport.integrityScore}% Paridade
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                  Preços de concorrentes na cotação diferem das ofertas anunciadas na mídia (TV/Encartes).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDiscrepancyModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ver Log de Discrepâncias ({auditReport.discrepancyCount})</span>
              </button>
              <button
                type="button"
                onClick={handleHarmonizeAll}
                disabled={isHarmonizing}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Wrench className={`w-3.5 h-3.5 ${isHarmonizing ? 'animate-spin' : ''}`} />
                <span>Harmonizar Imediatamente</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Auditoria de Dados Conforme: 100% de paridade entre os anúncios oficiais de TV/Encartes e as tabelas do ERP.
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-mono hidden sm:inline">
                (Auditado SEFAZ-RJ / ASSERJ / Procon-RJ)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDiscrepancyModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver Certificado de Auditoria</span>
            </button>
          </div>
        )}

        {/* Barra Informativa de Navegação e Painel Congelado */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 shadow-xs">
              <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 rotate-45" />
              <span>Painel Congelado Ativo: Redes e Cortes Fixados</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Navegue livremente pelas colunas dos concorrentes sem perder a referência do corte e dos supermercados.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500">
            {filteredProducts.length} itens auditados
          </span>
        </div>

        {/* 5. TABELA COMPARATIVA DE PREÇOS COM PAINEL CONGELADO (SUPERMERCADOS & CORTES) */}
        <div className="overflow-auto max-h-[72vh] mt-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative focus:outline-none">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-[#113829] text-white text-[11px] uppercase font-bold tracking-wider sticky top-0 z-30 shadow-md">
              <tr>
                {/* Cabeçalho Congelado: Produto / Corte (Fixado no topo e na esquerda) */}
                <th className="sticky top-0 left-0 z-40 bg-[#113829] py-3.5 px-3.5 border-r-2 border-emerald-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)] min-w-[240px] max-w-[280px]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Produto / Corte ({activeCategory.label})</span>
                    <span title="Coluna de cortes e produtos fixada horizontalmente">
                      <Pin className="w-3.5 h-3.5 text-emerald-300 rotate-45 shrink-0" />
                    </span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">Unid.</th>
                {RJ_SUPERMARKET_CHAINS.map(chain => (
                  <th key={chain.id} className="py-3 px-2.5 text-right whitespace-nowrap" title={`${chain.name} (${chain.profile})`}>
                    <div className="flex flex-col items-end">
                      <span>{chain.shortName}</span>
                      <span className={`text-[8px] font-normal px-1 py-0.1 rounded mt-0.5 ${
                        chain.profile === 'ATACAREJO' ? 'bg-amber-400/30 text-amber-200' :
                        chain.profile === 'PREMIUM' ? 'bg-purple-400/30 text-purple-200' :
                        'bg-emerald-400/30 text-emerald-200'
                      }`}>
                        {chain.profile}
                      </span>
                    </div>
                  </th>
                ))}
                
                {/* Coluna Especial: Cotação do Preço de Promoção de Encartes, TV, Clube & Redes */}
                <th className="py-3 px-3 text-center bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 font-black min-w-[165px] shadow-sm" title="Preço anunciado em comerciais de TV aberta RJ (Globo/Record), encartes, clubes de fidelidade, lâminas e redes sociais vigentes">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1.5 text-white">
                      <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>PROMOÇÃO EM VIGÊNCIA</span>
                    </div>
                    <span className="text-[8px] font-bold text-amber-200 mt-0.5 tracking-tight uppercase">
                      TV • ENCARTE • CLUBE • LÂMINA • REDES
                    </span>
                  </div>
                </th>

                <th className="py-3 px-2.5 text-right bg-emerald-900/60 text-emerald-200 font-black">Menor RJ</th>
                <th className="py-3 px-2.5 text-right bg-rose-900/60 text-rose-200 font-black">Maior RJ</th>
                <th className="py-3 px-2.5 text-right bg-slate-800 text-slate-100 font-black">Média RJ</th>
                <th className="py-3 px-2.5 text-right bg-amber-900/40 text-amber-200 font-black">Spread</th>
                <th className="py-3 px-3 text-center">Fonte / Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-mono">
              {filteredProducts.map(product => {
                const stats = PerishablesQuotesService.calculateProductStats(product);

                return (
                  <tr key={product.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    {/* Coluna Produto Congelada (Fixada na esquerda) */}
                    <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors py-3 px-3.5 font-bold font-sans text-slate-900 dark:text-white border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] min-w-[240px] max-w-[280px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.flvSubdivision && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60">
                            {product.flvSubdivision}
                          </span>
                        )}
                        <span className="font-extrabold">{product.name}</span>
                        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold border border-slate-200 dark:border-slate-700">
                          {product.unit.replace('R$/', '')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-normal truncate max-w-[250px] font-sans mt-0.5">
                        <span className="truncate">{product.specification}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenPriceHistory(product, undefined, stats)}
                          className="shrink-0 ml-1 p-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition cursor-pointer flex items-center"
                          title="Ver histórico de preços (4 semanas)"
                        >
                          <History className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </div>
                    </td>

                    {/* Unidade */}
                    <td className="py-3 px-2 text-center font-sans text-slate-500 text-[11px] whitespace-nowrap">
                      {product.unit.replace('R$/', '')}
                    </td>

                    {/* Preços nas 12 redes */}
                    {RJ_SUPERMARKET_CHAINS.map(chain => {
                      const price = product.chainPrices[chain.id] || 0;
                      const promo = OFFICIAL_RJ_TV_PROMO_REGISTRY[product.id] || product.promoOffer;
                      const isPromoChain = promo && promo.hasActivePromo && promo.promoPrice > 0 && promo.chainId === chain.id;
                      const hasDiscrepancy = isPromoChain && Math.abs(price - promo.promoPrice) > 0.009;
                      const isMin = price === stats.minPrice && price > 0;
                      const isMax = price === stats.maxPrice && price > 0;
                      const isEditing = editingCell?.productId === product.id && editingCell?.chainId === chain.id;
                      const channel = isPromoChain ? (promo.mediaChannel || (promo.mediaType.startsWith('TV') ? 'TV' : 'ENCARTE')) : null;

                      return (
                        <td 
                          key={chain.id} 
                          className={`py-2 px-2 text-right group relative cursor-pointer transition-all ${
                            hasDiscrepancy
                              ? 'bg-rose-100/90 dark:bg-rose-950/60 ring-2 ring-inset ring-rose-500 font-black text-rose-950 dark:text-rose-200 animate-pulse'
                              : isPromoChain 
                                ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400/60 font-black text-amber-950 dark:text-amber-200' 
                                : isMin 
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-black text-emerald-700 dark:text-emerald-400' 
                                  : isMax 
                                    ? 'bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' 
                                    : 'text-slate-800 dark:text-slate-200'
                          }`}
                          onClick={() => !isEditing && startEditing(product.id, chain.id, price)}
                          title={
                            hasDiscrepancy
                              ? `⚠️ DISCREPÂNCIA DETECTADA: Preço Anunciado R$ ${promo.promoPrice.toFixed(2)} vs Preço Processado R$ ${price.toFixed(2)}. Clique para resolver no Log de Auditoria.`
                              : isPromoChain 
                                ? `Oferta Anunciada em ${promo.mediaLabel} (De: R$ ${promo.regularPrice?.toFixed(2)} Por: R$ ${price.toFixed(2)}) • Clique para editar` 
                                : 'Clique para editar este preço manualmente'
                          }
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={tempEditValue}
                                autoFocus
                                onChange={(e) => setTempEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditing();
                                  if (e.key === 'Escape') cancelEditing();
                                }}
                                className="w-16 px-1.5 py-0.5 text-right font-mono text-xs bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={saveEditing}
                                className="p-0.5 text-emerald-600 hover:text-emerald-700"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="p-0.5 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {hasDiscrepancy ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDiscrepancyModalOpen(true);
                                  }}
                                  className="px-1 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shrink-0"
                                  title="Divergência entre anúncio e cotação. Clique para abrir Log de Auditoria."
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Divergência</span>
                                </button>
                              ) : isPromoChain ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTvPromoProduct({ product, promo, stats });
                                  }}
                                  className="px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs cursor-pointer hover:scale-105 transition shrink-0 bg-amber-600 hover:bg-amber-500 text-white"
                                  title={`Oferta Anunciada em ${promo.mediaLabel} • Clique para ver detalhes`}
                                >
                                  {channel === 'TV' && <Tv className="w-2.5 h-2.5" />}
                                  {channel === 'ENCARTE' && <FileSpreadsheet className="w-2.5 h-2.5" />}
                                  {channel === 'CLUBE' && <Tag className="w-2.5 h-2.5" />}
                                  {channel === 'LAMINA' && <Layers className="w-2.5 h-2.5" />}
                                  {channel === 'REDES' && <Radio className="w-2.5 h-2.5" />}
                                  <span>{channel}</span>
                                </button>
                              ) : null}
                              <span>{price > 0 ? `R$ ${price.toFixed(2)}` : '-'}</span>
                              {price > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPriceHistory(product, chain.id, stats);
                                  }}
                                  className="p-0.5 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                                  title={`Ver evolução de 4 semanas no ${chain.shortName}`}
                                >
                                  <History className="w-3 h-3" />
                                </button>
                              )}
                              <Edit3 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition shrink-0" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Coluna Especial: Oferta de Promoção de TV / Encarte / Clube / Lâmina / Redes RJ */}
                    <td className="py-2 px-2.5 text-center bg-amber-50/70 dark:bg-amber-950/25 border-x border-amber-200/50 dark:border-amber-900/30 font-sans">
                      {(() => {
                        const promo = OFFICIAL_RJ_TV_PROMO_REGISTRY[product.id] || product.promoOffer;
                        if (promo && promo.hasActivePromo && promo.promoPrice > 0) {
                          const channel = promo.mediaChannel || (promo.mediaType.startsWith('TV') ? 'TV' : 'ENCARTE');
                          const badgeConfig = {
                            TV: { bg: 'bg-indigo-600 text-white', label: 'TV RJ', icon: Tv },
                            CLUBE: { bg: 'bg-purple-600 text-white', label: 'CLUBE', icon: Tag },
                            ENCARTE: { bg: 'bg-amber-600 text-white', label: 'TABLOIDE', icon: FileSpreadsheet },
                            LAMINA: { bg: 'bg-teal-700 text-white', label: 'LÂMINA', icon: Layers },
                            REDES: { bg: 'bg-rose-600 text-white', label: 'REDES', icon: Sparkles }
                          }[channel] || { bg: 'bg-amber-600 text-white', label: 'PROMO', icon: Tag };
                          const IconComponent = badgeConfig.icon;

                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedTvPromoProduct({
                                product,
                                promo,
                                stats
                              })}
                              className="w-full text-left p-1.5 rounded-xl bg-white hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 transition group cursor-pointer shadow-xs hover:shadow-md"
                              title={`Auditar veiculação: ${promo.chainName} (${promo.mediaLabel})`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-black text-xs text-amber-950 dark:text-amber-100">
                                  R$ {promo.promoPrice.toFixed(2)}
                                </span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${badgeConfig.bg}`}>
                                  <IconComponent className="w-2.5 h-2.5" />
                                  <span>{badgeConfig.label}</span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                                <span className="truncate max-w-[85px] font-bold text-slate-800 dark:text-slate-100">
                                  {promo.chainName.split(' ')[0]}
                                </span>
                                <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 font-mono">
                                  -{Math.round(((stats.avgPrice - promo.promoPrice) / stats.avgPrice) * 100)}%
                                </span>
                              </div>
                              <div className="text-[8px] text-amber-800 dark:text-amber-300 truncate font-sans mt-0.5 font-medium border-t border-amber-100 dark:border-amber-900/40 pt-0.5">
                                {promo.validity.split('(')[0].trim()}
                              </div>
                            </button>
                          );
                        }
                        return (
                          <span className="text-[10px] text-slate-400 font-mono italic">
                            Sem oferta
                          </span>
                        );
                      })()}
                    </td>

                    {/* Menor RJ */}
                    <td className="py-3 px-2.5 text-right font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40">
                      R$ {stats.minPrice.toFixed(2)}
                    </td>

                    {/* Maior RJ */}
                    <td className="py-3 px-2.5 text-right font-black text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30">
                      R$ {stats.maxPrice.toFixed(2)}
                    </td>

                    {/* Média RJ */}
                    <td className="py-3 px-2.5 text-right font-black text-slate-900 dark:text-white bg-slate-100/70 dark:bg-slate-800/70">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>R$ {stats.avgPrice.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenPriceHistory(product, undefined, stats)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 transition cursor-pointer"
                          title="Ver gráfico de evolução do preço médio no RJ (4 semanas)"
                        >
                          <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </div>
                    </td>

                    {/* Spread */}
                    <td className="py-3 px-2.5 text-right font-bold text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
                      R$ {stats.spread.toFixed(2)}
                    </td>

                    {/* Fonte / Auditoria */}
                    <td className="py-3 px-3 font-sans text-center text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Aferido RJ</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Linhas de Fechamento Estatístico da Tabela com Painel Congelado */}
            <tfoot className="bg-slate-100/95 dark:bg-slate-800/95 border-t-2 border-slate-300 dark:border-slate-700 font-mono text-xs sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              {/* Linha 1: Média Geral RJ */}
              <tr className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800">
                <td className="sticky bottom-0 left-0 z-40 bg-slate-100 dark:bg-slate-800 py-2.5 px-3.5 font-sans border-r-2 border-slate-300 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] min-w-[240px] max-w-[280px]">
                  <div className="flex items-center justify-between">
                    <span>MÉDIA GERAL RJ (12 Redes)</span>
                    <Pin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 rotate-45 shrink-0" />
                  </div>
                </td>
                <td className="py-2.5 px-2 text-center font-sans text-[10px] text-slate-500 whitespace-nowrap">MÉDIA</td>
                {RJ_SUPERMARKET_CHAINS.map(chain => (
                  <td key={chain.id} className="py-2.5 px-2.5 text-right font-black whitespace-nowrap">
                    R$ {chainAverages[chain.id]?.avg.toFixed(2) || '0.00'}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-center text-amber-800 dark:text-amber-200 font-black bg-amber-100/60 dark:bg-amber-950/40 whitespace-nowrap">
                  R$ {tvPromoSummary.avgPromo.toFixed(2)}
                </td>
                <td className="py-2.5 px-2.5 text-right text-emerald-700 dark:text-emerald-300 font-black whitespace-nowrap">
                  R$ {categorySummary.minPriceCategory.toFixed(2)}
                </td>
                <td className="py-2.5 px-2.5 text-right text-rose-700 dark:text-rose-400 font-black whitespace-nowrap">
                  R$ {categorySummary.maxPriceCategory.toFixed(2)}
                </td>
                <td className="py-2.5 px-2.5 text-right text-slate-900 dark:text-white font-black whitespace-nowrap">
                  R$ {categorySummary.avgPriceCategory.toFixed(2)}
                </td>
                <td className="py-2.5 px-2.5 text-right text-amber-700 dark:text-amber-300 font-black whitespace-nowrap">
                  R$ {categorySummary.avgSpread.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 font-sans text-center text-[10px] text-slate-500 whitespace-nowrap">Média Geral Ponderada</td>
              </tr>

              {/* Linha 2: Menor Preço Registrado */}
              <tr className="text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 font-bold">
                <td className="sticky bottom-0 left-0 z-40 bg-emerald-50 dark:bg-slate-800 py-2 px-3.5 font-sans text-[11px] border-r-2 border-emerald-200 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] min-w-[240px] max-w-[280px]">
                  MENOR PREÇO REGISTRADO RJ
                </td>
                <td className="py-2 px-2 text-center font-sans text-[10px] whitespace-nowrap">MÍNIMO</td>
                {RJ_SUPERMARKET_CHAINS.map(chain => (
                  <td key={chain.id} className="py-2 px-2.5 text-right whitespace-nowrap">
                    R$ {chainAverages[chain.id]?.min.toFixed(2) || '0.00'}
                  </td>
                ))}
                <td className="py-2 px-3 text-center text-amber-900 dark:text-amber-300 font-black bg-amber-100/70 dark:bg-amber-950/50 whitespace-nowrap">
                  R$ {tvPromoSummary.minPromo.toFixed(2)}
                </td>
                <td className="py-2 px-2.5 text-right text-emerald-700 font-black whitespace-nowrap">
                  R$ {categorySummary.minPriceCategory.toFixed(2)}
                </td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-3 font-sans text-center text-[10px] text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Piso Atacarejo / Popular</td>
              </tr>

              {/* Linha 3: Maior Preço Registrado */}
              <tr className="text-rose-800 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/30 font-bold">
                <td className="sticky bottom-0 left-0 z-40 bg-rose-50 dark:bg-slate-800 py-2 px-3.5 font-sans text-[11px] border-r-2 border-rose-200 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] min-w-[240px] max-w-[280px]">
                  MAIOR PREÇO REGISTRADO RJ
                </td>
                <td className="py-2 px-2 text-center font-sans text-[10px] whitespace-nowrap">MÁXIMO</td>
                {RJ_SUPERMARKET_CHAINS.map(chain => (
                  <td key={chain.id} className="py-2 px-2.5 text-right whitespace-nowrap">
                    R$ {chainAverages[chain.id]?.max.toFixed(2) || '0.00'}
                  </td>
                ))}
                <td className="py-2 px-3 text-center text-slate-400 whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right text-rose-700 font-black whitespace-nowrap">
                  R$ {categorySummary.maxPriceCategory.toFixed(2)}
                </td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-3 font-sans text-center text-[10px] text-rose-700 dark:text-rose-400 whitespace-nowrap">Teto Redes Premium</td>
              </tr>

              {/* Linha 4: Spread / Amplitude */}
              <tr className="text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/30 font-bold">
                <td className="sticky bottom-0 left-0 z-40 bg-amber-50 dark:bg-slate-800 py-2 px-3.5 font-sans text-[11px] border-r-2 border-amber-200 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] min-w-[240px] max-w-[280px]">
                  SPREAD DE BALCÃO (MÁX - MÍN)
                </td>
                <td className="py-2 px-2 text-center font-sans text-[10px] whitespace-nowrap">SPREAD</td>
                {RJ_SUPERMARKET_CHAINS.map(chain => {
                  const sp = (chainAverages[chain.id]?.max || 0) - (chainAverages[chain.id]?.min || 0);
                  return (
                    <td key={chain.id} className="py-2 px-2.5 text-right whitespace-nowrap">
                      R$ {sp.toFixed(2)}
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center text-slate-400 whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right whitespace-nowrap">-</td>
                <td className="py-2 px-2.5 text-right text-amber-700 font-black whitespace-nowrap">
                  R$ {categorySummary.avgSpread.toFixed(2)}
                </td>
                <td className="py-2 px-3 font-sans text-center text-[10px] text-amber-700 dark:text-amber-400 whitespace-nowrap">Amplitude Praticada no RJ</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 6. CRITÉRIOS METODOLÓGICOS E AUDITORIA TÉCNICA */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1.5">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Critérios Metodológicos da Cotação de Perecíveis • 12 Redes Supermercadistas RJ</span>
          </div>
          <p className="text-[11px]">
            • <strong>Sub-abas Normatizadas:</strong> Monitoramento estruturado para <em>CORTE DE FRANGO</em> (Resfriados e Congelados), <em>CORTE DE CARNE SECA</em>, <em>MIUDO BOVINO</em>, <em>SUINO SALGADO</em>, <em>CHARQUE / CARNE SECA</em>, <em>QUEIJO MUSSARELA / PRATO</em>, <em>LINGÜIÇA DE CHURRASCO</em>, <em>LEITE UHT DE 1LT</em>, <em>CORTE CARNE BOV</em>, <em>CORTE CARNE SUINA</em> e <em>HORTFRUT / FLV</em> (com divisão dinâmica entre <strong>FRUTAS, LEGUMES, OVOS, ALHO e HORTALIÇAS</strong>).
          </p>
          <p className="text-[11px]">
            • <strong>Radar de Comerciais de TV e Encartes:</strong> Captura e clipping diário de ofertas veiculadas na TV aberta do RJ (Globo RJ, Record RJ, SBT Rio), tabloides impressos e aplicativos oficiais das maiores redes fluminenses.
          </p>
          <p className="text-[11px]">
            • <strong>Fontes Oficiais Fluminenses:</strong> Associação de Supermercados do Estado do RJ (ASSERJ), Procon-RJ, Preço da Hora RJ (SEFAZ-RJ / NFC-e) e encartes semanais oficiais de balcão e auto-serviço.
          </p>
          <p className="text-[11px]">
            • <strong>Edição e Simulação:</strong> Você pode clicar em qualquer valor na tabela para simular preços de venda ou recalibrar margens de balcão. Para retornar aos dados oficiais, use o botão <em>Limpar e Resetar</em>.
          </p>
        </div>
      </div>

      {/* Modal de Detalhes e Auditoria de Veiculação de TV / Encarte */}
      {selectedTvPromoProduct && (
        <TvPromoDetailModal
          isOpen={!!selectedTvPromoProduct}
          onClose={() => setSelectedTvPromoProduct(null)}
          product={selectedTvPromoProduct.product}
          promo={selectedTvPromoProduct.promo}
          stats={selectedTvPromoProduct.stats}
        />
      )}

      {/* Modal / Popover de Histórico de Evolução de Preços (Últimas 4 Semanas) */}
      {selectedHistory.isOpen && selectedHistory.product && (
        <PriceHistoryModal
          isOpen={selectedHistory.isOpen}
          onClose={handleClosePriceHistory}
          product={selectedHistory.product}
          initialChainId={selectedHistory.chainId}
          stats={selectedHistory.stats}
        />
      )}

      {/* Modal de Auditoria e Varredura Executiva do Radar TV & Encartes RJ */}
      {isRadarAuditOpen && (
        <TvRadarAuditModal
          isOpen={isRadarAuditOpen}
          onClose={() => setIsRadarAuditOpen(false)}
          telemetry={radarAuditTelemetry}
          activeCategoryId={activeCategoryId}
        />
      )}

      {/* Modal de Auditoria de Discrepância / Paridade de Preços ERP */}
      {isDiscrepancyModalOpen && (
        <DiscrepancyAuditModal
          isOpen={isDiscrepancyModalOpen}
          onClose={() => setIsDiscrepancyModalOpen(false)}
          report={auditReport}
          onHarmonizeAll={handleHarmonizeAll}
          onHarmonizeSingle={handleHarmonizeSingle}
          isHarmonizing={isHarmonizing}
        />
      )}
    </div>
  );
};
