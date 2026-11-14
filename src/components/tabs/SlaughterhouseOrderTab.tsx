import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Truck,
  FileUp,
  FileText,
  Printer,
  Save,
  Calculator,
  Building2,
  RefreshCw,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  X,
  Scale,
  History,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  PdfSalesImportResult,
  PdfSalesParsedCutItem,
  SheetRowData,
  SlaughterhouseCategoryStandard,
  SlaughterhouseCutCategory,
  SlaughterhouseOrderDraft,
  SlaughterhouseOrderRecord,
  SlaughterhouseStoreOrderRow,
  Store,
  Supplier,
  SystemUser,
  YieldParams,
} from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { PdfReportService } from '../../services/pdfReportService';
import { PrintEngineService } from '../../services/printEngineService';
import {
  SLAUGHTERHOUSE_CATEGORY_META,
  SLAUGHTERHOUSE_CATEGORY_ORDER,
  buildSlaughterhouseReportRows,
  buildSlaughterhouseStandardsFromDesossa,
  calculateStoreStockFromSheetRow,
  convertSalesKgToPieces,
  createInitialSlaughterhouseDraft,
  getSalesPiecesBreakdown,
  summarizePdfSalesByCategory,
  summarizePdfSalesByStore,
} from '../../services/slaughterhouseOrderService';

interface SlaughterhouseOrderTabProps {
  stores: Store[];
  suppliers: Supplier[];
  sheetRows: SheetRowData[];
  yieldParams: Partial<YieldParams> | null;
  currentUser?: SystemUser | null;
  onOpenSupplierManager: () => void;
  showToast: (msg: string) => void;
}

const SALES_FIELD_BY_CATEGORY: Record<
  SlaughterhouseCutCategory,
  keyof SlaughterhouseStoreOrderRow['sales']
> = {
  dianteiro: 'dianteiroKg',
  traseiro: 'traseiroKg',
  coxao: 'coxaoKg',
  alcatrao: 'alcatraoKg',
  costela: 'costelaKg',
};

const ORDER_FIELD_BY_CATEGORY: Record<
  SlaughterhouseCutCategory,
  'pedidoDianteiro' | 'pedidoTraseiro' | 'pedidoCoxao' | 'pedidoAlcatrao' | 'pedidoCostela'
> = {
  dianteiro: 'pedidoDianteiro',
  traseiro: 'pedidoTraseiro',
  coxao: 'pedidoCoxao',
  alcatrao: 'pedidoAlcatrao',
  costela: 'pedidoCostela',
};

export const SlaughterhouseOrderTab: React.FC<SlaughterhouseOrderTabProps> = ({
  stores,
  suppliers,
  sheetRows,
  yieldParams,
  currentUser,
  onOpenSupplierManager,
  showToast,
}) => {
  const [draft, setDraft] = useState<SlaughterhouseOrderDraft>(() => {
    const saved = StorageService.getSlaughterhouseDraft();
    if (saved && saved.storeRows && saved.storeRows.length > 0) {
      // Garante que todas as lojas atuais existam no rascunho
      const syncedRows: SlaughterhouseStoreOrderRow[] = stores.map((store) => {
        const existing = saved.storeRows.find((r) => r.storeId === store.id);
        if (existing) {
          return { ...existing, storeName: store.name };
        }
        const sheetRow = sheetRows.find((r) => r.storeId === store.id);
        return {
          storeId: store.id,
          storeName: store.name,
          pedidoDianteiro: 0,
          pedidoTraseiro: 0,
          pedidoCoxao: 0,
          pedidoAlcatrao: Number(sheetRow?.pedidoAlcatraoReal || 0),
          pedidoCostela: Number(sheetRow?.pedidoCostelaReal || 0),
          sales: {
            dianteiroKg: 0,
            traseiroKg: 0,
            coxaoKg: 0,
            alcatraoKg: 0,
            costelaKg: 0,
          },
        };
      });
      return { ...saved, storeRows: syncedRows };
    }
    return createInitialSlaughterhouseDraft(stores, suppliers, sheetRows, yieldParams);
  });

  const [savedOrders, setSavedOrders] = useState<SlaughterhouseOrderRecord[]>(() =>
    StorageService.getSlaughterhouseOrders()
  );
  const [isStandardsOpen, setIsStandardsOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [orderStatus, setOrderStatus] = useState<'RASCUNHO' | 'ENVIADO' | 'CONFIRMADO'>('RASCUNHO');

  // Estado do Modal Importador de PDF / Imagem de Vendas
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfMode, setPdfMode] = useState<'file' | 'text'>('file');
  const [rawSalesText, setRawSalesText] = useState('');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfParseError, setPdfParseError] = useState<string | null>(null);
  const [pendingPdfResult, setPendingPdfResult] = useState<PdfSalesImportResult | null>(
    draft.lastPdfImport || null
  );
  const [applyTargetMode, setApplyTargetMode] = useState<'by_store' | 'single' | 'equal'>('by_store');
  const [applyTargetStoreId, setApplyTargetStoreId] = useState<string>(stores[0]?.id || '');
  const [clearAbsentStores, setClearAbsentStores] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hidrata rascunho e histórico da nuvem Firestore no mount
  useEffect(() => {
    let active = true;
    StorageService.syncSlaughterhouseDataFromCloud()
      .then(({ draft: cloudDraft, orders: cloudOrders }) => {
        if (!active) return;
        if (cloudOrders && cloudOrders.length > 0) {
          setSavedOrders(cloudOrders);
        }
        if (cloudDraft && cloudDraft.updatedAt > (draft.updatedAt || 0)) {
          setDraft(cloudDraft);
          if (cloudDraft.lastPdfImport) {
            setPendingPdfResult(cloudDraft.lastPdfImport);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Persiste rascunho localmente e na nuvem
  useEffect(() => {
    const timer = setTimeout(() => {
      StorageService.saveSlaughterhouseDraft(draft, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [draft]);

  // Sincroniza lojas se houver adição/edição em Parâmetros
  useEffect(() => {
    if (!stores.length) return;
    setDraft((prev) => {
      const missingOrRenamed = stores.some((s) => {
        const found = prev.storeRows.find((r) => r.storeId === s.id);
        return !found || found.storeName !== s.name;
      });
      if (!missingOrRenamed && prev.storeRows.length === stores.length) return prev;

      const updatedRows: SlaughterhouseStoreOrderRow[] = stores.map((store) => {
        const existing = prev.storeRows.find((r) => r.storeId === store.id);
        if (existing) return { ...existing, storeName: store.name };
        return {
          storeId: store.id,
          storeName: store.name,
          pedidoDianteiro: 0,
          pedidoTraseiro: 0,
          pedidoCoxao: 0,
          pedidoAlcatrao: 0,
          pedidoCostela: 0,
          sales: {
            dianteiroKg: 0,
            traseiroKg: 0,
            coxaoKg: 0,
            alcatraoKg: 0,
            costelaKg: 0,
          },
        };
      });
      return { ...prev, storeRows: updatedRows };
    });
  }, [stores]);

  // Mapa rápido de estoque por loja calculado a partir da Planilha + Desossa
  const storeStockMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateStoreStockFromSheetRow>>();
    draft.storeRows.forEach((sr) => {
      const matchedSheet = sheetRows.find((r) => r.storeId === sr.storeId);
      if (matchedSheet) {
        map.set(
          sr.storeId,
          calculateStoreStockFromSheetRow(matchedSheet, draft.standards, yieldParams)
        );
      } else {
        map.set(
          sr.storeId,
          calculateStoreStockFromSheetRow(
            {
              storeId: sr.storeId,
              storeName: sr.storeName,
              pedidoDianteiro: 0,
              pedidoTraseiro: 0,
              pedidoCoxao: 0,
              pedidoAlcatrao: 0,
              pedidoCostelaGaucha: 0,
              boiAVenda: 0,
              sugestaoPedido: 0,
              pTransito: 0,
              camaraDianteiro: 0,
              camaraTraseiro: 0,
              camaraCoxao: 0,
              camaraAlcatrao: 0,
              somaDoTraseiro: 0,
              camaraCostelaGaucha: 0,
              alcatra: 0,
              contraFile: 0,
              costelaCong: 0,
              totalAlcatrao: 0,
              picanha: 0,
              fileMignon: 0,
              totalDianteiro: 0,
              paletaKg: 0,
              paletaPecas: 0,
              acemKg: 0,
              acemPecas: 0,
              peitoKg: 0,
              peitoPecas: 0,
              musculoKg: 0,
              musculoPecas: 0,
              totalCoxao: 0,
              chaKg: 0,
              chaPecas: 0,
              patinhoKg: 0,
              patinhoPecas: 0,
              lagartoRedondoKg: 0,
              lagartoRedondoPecas: 0,
              lagartoPlanoKg: 0,
              lagartoPlanoPecas: 0,
              bandaKg: 0,
              bandaPecas: 0,
              costelaSuinaPecas: 0,
              pernilPecas: 0,
            },
            draft.standards,
            yieldParams
          )
        );
      }
    });
    return map;
  }, [draft.storeRows, draft.standards, sheetRows, yieldParams]);

  // Cálculo consolidado de todas as colunas e totais do pedido
  const { reportRows, totals } = useMemo(
    () => buildSlaughterhouseReportRows(draft.storeRows, sheetRows, draft.standards, yieldParams),
    [draft.storeRows, sheetRows, draft.standards, yieldParams]
  );

  const avgCostPerKg = totals.totalWeightKg > 0 ? totals.totalCostR$ / totals.totalWeightKg : 0;
  const carcassWeightRef = Number(yieldParams?.carcassWeight || 240);
  const equivalentBois = totals.totalWeightKg > 0 ? Math.round(totals.totalWeightKg / carcassWeightRef) : 0;

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === draft.supplierId),
    [suppliers, draft.supplierId]
  );

  const handleSelectSupplier = (supplierId: string) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    setDraft((prev) => ({
      ...prev,
      supplierId,
      supplierName: sup?.tradeName || sup?.name || 'Selecionar Frigorífico',
      paymentTerms: sup?.paymentTerms || prev.paymentTerms,
    }));
  };

  const handleUpdateStandard = (
    cat: SlaughterhouseCutCategory,
    field: 'standardWeightKg' | 'costPerKg',
    val: string
  ) => {
    const num = parseFloat(val.replace(',', '.'));
    const safe = Number.isFinite(num) && num >= 0 ? num : 0;
    setDraft((prev) => ({
      ...prev,
      standards: {
        ...prev.standards,
        [cat]: {
          ...prev.standards[cat],
          [field]: safe,
        },
      },
    }));
  };

  const handleSyncCostsFromDesossa = () => {
    const fresh = buildSlaughterhouseStandardsFromDesossa(yieldParams, false);
    setDraft((prev) => {
      const next = { ...prev.standards };
      SLAUGHTERHOUSE_CATEGORY_ORDER.forEach((cat) => {
        next[cat] = {
          ...next[cat],
          costPerKg: fresh[cat].costPerKg,
          carcassPercent: fresh[cat].carcassPercent,
        };
      });
      return { ...prev, standards: next };
    });
    showToast('Custos e % de Carcaça sincronizados com o módulo Desossa.');
  };

  const handleApplyCarcassWeightsFromDesossa = () => {
    const exact = buildSlaughterhouseStandardsFromDesossa(yieldParams, true);
    setDraft((prev) => {
      const next = { ...prev.standards };
      SLAUGHTERHOUSE_CATEGORY_ORDER.forEach((cat) => {
        next[cat] = {
          ...next[cat],
          standardWeightKg: exact[cat].standardWeightKg,
          carcassPercent: exact[cat].carcassPercent,
        };
      });
      return { ...prev, standards: next };
    });
    showToast('Pesos padrão recalculados proporcionalmente pelo % da Desossa.');
  };

  const handleRestoreCommercialWeights = () => {
    setDraft((prev) => {
      const next = { ...prev.standards };
      SLAUGHTERHOUSE_CATEGORY_ORDER.forEach((cat) => {
        next[cat] = {
          ...next[cat],
          standardWeightKg: SLAUGHTERHOUSE_CATEGORY_META[cat].defaultWeightKg,
        };
      });
      return { ...prev, standards: next };
    });
    showToast('Pesos padrão comerciais restaurados (Dianteiro 45 kg).');
  };

  const handleUpdateOrderQty = (
    storeId: string,
    field: 'pedidoDianteiro' | 'pedidoTraseiro' | 'pedidoCoxao' | 'pedidoAlcatrao' | 'pedidoCostela',
    rawVal: string
  ) => {
    const parsed = parseInt(rawVal, 10);
    const qty = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setDraft((prev) => ({
      ...prev,
      storeRows: prev.storeRows.map((row) =>
        row.storeId === storeId ? { ...row, [field]: qty } : row
      ),
    }));
  };

  const handleUpdateSalesKg = (
    storeId: string,
    field: keyof SlaughterhouseStoreOrderRow['sales'],
    rawVal: string
  ) => {
    const parsed = parseFloat(rawVal.replace(',', '.'));
    const kg = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setDraft((prev) => ({
      ...prev,
      storeRows: prev.storeRows.map((row) =>
        row.storeId === storeId
          ? {
              ...row,
              sales: {
                ...row.sales,
                [field]: kg,
              },
            }
          : row
      ),
    }));
  };

  // Navegação estilo Excel entre filiais na mesma coluna
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: string
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = document.querySelector<HTMLInputElement>(
        `input[data-sh-row="${rowIndex + 1}"][data-sh-col="${colKey}"]`
      );
      if (next) {
        next.focus();
        next.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = document.querySelector<HTMLInputElement>(
        `input[data-sh-row="${rowIndex - 1}"][data-sh-col="${colKey}"]`
      );
      if (prev) {
        prev.focus();
        prev.select();
      }
    }
  };

  // Sugestão automática de pedido = max(0, round(Venda em Peças - Estoque Atual em Peças))
  const handleSuggestOrdersFromSalesAndStock = () => {
    setDraft((prev) => ({
      ...prev,
      storeRows: prev.storeRows.map((row) => {
        const stock = storeStockMap.get(row.storeId);
        const salesPc = getSalesPiecesBreakdown(row.sales, prev.standards);
        if (!stock) return row;

        return {
          ...row,
          pedidoDianteiro: Math.max(0, Math.round(salesPc.dianteiroPecas - stock.dianteiro.pieces)),
          pedidoTraseiro: Math.max(0, Math.round(salesPc.traseiroPecas - stock.traseiro.pieces)),
          pedidoCoxao: Math.max(0, Math.round(salesPc.coxaoPecas - stock.coxao.pieces)),
          pedidoAlcatrao: Math.max(0, Math.round(salesPc.alcatraoPecas - stock.alcatrao.pieces)),
          pedidoCostela: Math.max(0, Math.round(salesPc.costelaPecas - stock.costela.pieces)),
        };
      }),
    }));
    showToast('Sugestão de pedido calculada (Venda em Peças − Estoque Atual).');
  };

  const handleClearOrderQuantities = () => {
    setDraft((prev) => ({
      ...prev,
      storeRows: prev.storeRows.map((row) => ({
        ...row,
        pedidoDianteiro: 0,
        pedidoTraseiro: 0,
        pedidoCoxao: 0,
        pedidoAlcatrao: 0,
        pedidoCostela: 0,
      })),
    }));
    showToast('Quantidades de pedido zeradas (estoque e vendas preservados).');
  };

  // Constrói snapshot oficial do pedido atual para Relatório PDF / Impressão / Gravação
  const buildOrderSnapshot = (
    overrideStatus?: 'RASCUNHO' | 'ENVIADO' | 'CONFIRMADO'
  ): SlaughterhouseOrderRecord => {
    const now = Date.now();
    return {
      id: `pf-${now}-${Math.random().toString(36).slice(2, 7)}`,
      orderType: 'FRIGORIFICO_CORTES',
      orderNumber: draft.orderNumber.trim() || `PF-${now}`,
      date: draft.orderDate,
      deliveryDate: draft.deliveryDate,
      supplier: draft.supplierName || selectedSupplier?.tradeName || 'Frigorífico não informado',
      supplierId: draft.supplierId || undefined,
      supplierDetails: selectedSupplier,
      buyer: draft.buyer || currentUser?.name || 'Patrick Pessoa',
      paymentTerms: draft.paymentTerms || '14 dias',
      totalBois: equivalentBois,
      totalPieces: totals.totalPieces,
      totalWeightKg: totals.totalWeightKg,
      totalCostR$: totals.totalCostR$,
      status: overrideStatus || orderStatus,
      notes: draft.notes,
      standards: JSON.parse(JSON.stringify(draft.standards)),
      rows: reportRows,
      lastPdfImport: draft.lastPdfImport || null,
      createdAt: now,
    };
  };

  const handleSaveOrderRecord = () => {
    if (totals.totalPieces <= 0) {
      showToast('Informe ao menos 1 peça nos campos de pedido antes de salvar.');
      return;
    }
    const record = buildOrderSnapshot(orderStatus);
    const updated = StorageService.saveSlaughterhouseOrder(record);
    setSavedOrders(updated);
    showToast(`Pedido por Frigorífico ${record.orderNumber} salvo no histórico e na nuvem.`);
  };

  const handleDownloadOrderPdf = async (orderToPrint?: SlaughterhouseOrderRecord) => {
    const order = orderToPrint || buildOrderSnapshot(orderStatus);
    try {
      await PdfReportService.generateAndDownloadSlaughterhouseOrderPdf(order);
      showToast(`Relatório PDF ${order.orderNumber} gerado com sucesso.`);
    } catch (err: any) {
      showToast(`Erro ao gerar PDF: ${err?.message || 'falha inesperada'}`);
    }
  };

  const handlePrintOrder = (orderToPrint?: SlaughterhouseOrderRecord) => {
    const order = orderToPrint || buildOrderSnapshot(orderStatus);
    const html = PrintEngineService.generateSlaughterhouseOrderHtml(order);
    PrintEngineService.printDocument(html, {
      documentTitle: `Pedido_Frigorifico_${order.orderNumber}`,
      landscape: true,
    });
  };

  const handleLoadOrderIntoDraft = (record: SlaughterhouseOrderRecord) => {
    setDraft((prev) => ({
      ...prev,
      supplierId: record.supplierId || prev.supplierId,
      supplierName: record.supplier,
      orderNumber: record.orderNumber,
      orderDate: record.date,
      deliveryDate: record.deliveryDate,
      buyer: record.buyer,
      paymentTerms: record.paymentTerms || prev.paymentTerms,
      notes: record.notes || '',
      standards: record.standards,
      lastPdfImport: record.lastPdfImport || null,
      storeRows: stores.map((store) => {
        const matched = record.rows.find((r) => r.storeId === store.id);
        return {
          storeId: store.id,
          storeName: store.name,
          pedidoDianteiro: matched?.order.pedidoDianteiro || 0,
          pedidoTraseiro: matched?.order.pedidoTraseiro || 0,
          pedidoCoxao: matched?.order.pedidoCoxao || 0,
          pedidoAlcatrao: matched?.order.pedidoAlcatrao || 0,
          pedidoCostela: matched?.order.pedidoCostela || 0,
          sales: {
            dianteiroKg: matched?.sales.dianteiroKg || 0,
            traseiroKg: matched?.sales.traseiroKg || 0,
            coxaoKg: matched?.sales.coxaoKg || 0,
            alcatraoKg: matched?.sales.alcatraoKg || 0,
            costelaKg: matched?.sales.costelaKg || 0,
          },
        };
      }),
    }));
    setOrderStatus(record.status);
    showToast(`Pedido ${record.orderNumber} carregado na planilha.`);
  };

  const handleDeleteOrderRecord = (id: string) => {
    const updated = StorageService.deleteSlaughterhouseOrder(id);
    setSavedOrders(updated);
    showToast('Pedido removido do histórico.');
  };

  // ==========================================
  // IMPORTADOR DE PDF / IMAGEM DE VENDAS (REAL & POR FILIAL)
  // ==========================================
  const storeRefsPayload = useMemo(
    () => stores.map((s) => ({ id: s.id, code: s.code, name: s.name, city: s.city })),
    [stores]
  );

  const safeReadApiResponse = async (response: Response): Promise<any> => {
    const rawText = await response.text();
    if (!rawText || rawText.trim().length === 0) {
      throw new Error(
        `O servidor retornou uma resposta vazia (HTTP ${response.status}). Tente novamente com uma imagem mais leve ou cole os dados na aba textual.`
      );
    }
    try {
      return JSON.parse(rawText);
    } catch {
      const snippet = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
      throw new Error(
        `Resposta inválida do servidor (HTTP ${response.status}): ${snippet || 'formato não JSON'}`
      );
    }
  };

  const prepareFilePayload = async (
    file: File
  ): Promise<{ base64: string; mimeType: string }> => {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Falha ao ler arquivo selecionado no navegador.'));
      reader.readAsDataURL(file);
    });

    const isImage =
      file.type.startsWith('image/') ||
      /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);

    // Se for imagem muito pesada (> 2.5 MB), otimiza resolução/qualidade mantendo nitidez da tabela
    if (isImage && file.size > 2.5 * 1024 * 1024) {
      try {
        const compressed = await new Promise<{ base64: string; mimeType: string }>(
          (resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const maxDim = 2200;
              let { width, height } = img;
              if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Canvas indisponível'));
                return;
              }
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              const outUrl = canvas.toDataURL('image/jpeg', 0.88);
              resolve({
                base64: outUrl.split(',')[1] || '',
                mimeType: 'image/jpeg',
              });
            };
            img.onerror = () => reject(new Error('Falha ao otimizar imagem'));
            img.src = rawDataUrl;
          }
        );
        if (compressed.base64) return compressed;
      } catch {
        // Segue com original se o canvas falhar
      }
    }

    const base64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : rawDataUrl;
    const inferredMime =
      file.type ||
      (isImage
        ? file.name.toLowerCase().endsWith('.png')
          ? 'image/png'
          : file.name.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg'
        : 'application/pdf');

    return { base64, mimeType: inferredMime };
  };

  const applyParsedResultDefaults = (parsed: PdfSalesImportResult) => {
    setPendingPdfResult(parsed);
    const matchedCount = parsed.items.filter((it) => Boolean(it.matchedStoreId)).length;
    if (matchedCount > 0) {
      setApplyTargetMode('by_store');
    } else {
      setApplyTargetMode('single');
    }
  };

  const handlePdfFileSelected = async (file: File | null) => {
    if (!file) return;
    setPdfParseError(null);

    if (file.size > 15 * 1024 * 1024) {
      setPdfParseError('O arquivo excede o limite de 15 MB. Reduza o tamanho ou cole os dados em texto.');
      return;
    }

    setIsParsingPdf(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const { base64, mimeType } = await prepareFilePayload(file);

      const response = await fetch('/api/slaughterhouse-order/parse-sales-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          fileBase64: base64,
          mimeType,
          fileName: file.name,
          stores: storeRefsPayload,
        }),
      });

      const payload = await safeReadApiResponse(response);
      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Não foi possível extrair os cortes deste documento.'
        );
      }

      const parsed = (payload?.data ?? payload) as PdfSalesImportResult;
      if (!parsed || !Array.isArray(parsed.items)) {
        throw new Error('Resposta inválida ao processar o documento de vendas.');
      }

      applyParsedResultDefaults(parsed);
      const storesCount = parsed.recognizedStores?.length || 0;
      showToast(
        storesCount > 0
          ? `Documento analisado: ${parsed.items.length} cortes em ${storesCount} filial(is) reconhecida(s).`
          : `Documento analisado: ${parsed.items.length} cortes extraídos.`
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setPdfParseError('Tempo limite excedido ao processar o documento. Tente uma imagem mais nítida/leve ou cole o texto.');
      } else {
        setPdfParseError(err?.message || 'Falha ao processar o documento de vendas.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsParsingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleParseRawText = async () => {
    if (!rawSalesText.trim()) {
      setPdfParseError('Cole as linhas do relatório de vendas (filial, corte + KG) para analisar.');
      return;
    }
    setPdfParseError(null);
    setIsParsingPdf(true);
    try {
      const response = await fetch('/api/slaughterhouse-order/parse-sales-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawSalesText,
          fileName: 'Relatorio_Vendas_Colado.txt',
          stores: storeRefsPayload,
        }),
      });
      const payload = await safeReadApiResponse(response);
      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Não foi possível identificar cortes e pesos no texto.'
        );
      }
      const parsed = (payload?.data ?? payload) as PdfSalesImportResult;
      if (!parsed || !Array.isArray(parsed.items)) {
        throw new Error('Resposta inválida ao analisar o texto de vendas.');
      }
      applyParsedResultDefaults(parsed);
      const storesCount = parsed.recognizedStores?.length || 0;
      showToast(
        storesCount > 0
          ? `${parsed.items.length} cortes classificados em ${storesCount} filial(is).`
          : `${parsed.items.length} cortes classificados pela base Desossa.`
      );
    } catch (err: any) {
      setPdfParseError(err?.message || 'Erro ao analisar texto de vendas.');
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleReclassifyPdfItem = (itemId: string, newCat: SlaughterhouseCutCategory) => {
    if (!pendingPdfResult) return;
    const desossaGroup = SLAUGHTERHOUSE_CATEGORY_META[newCat].desossaGroup;
    setPendingPdfResult({
      ...pendingPdfResult,
      items: pendingPdfResult.items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              category: newCat,
              desossaGroup,
              matchedBy: `Ajuste manual (${desossaGroup})`,
            }
          : it
      ),
    });
  };

  const handleReassignPdfItemStore = (itemId: string, storeId: string) => {
    if (!pendingPdfResult) return;
    const matched = stores.find((s) => s.id === storeId);
    setPendingPdfResult({
      ...pendingPdfResult,
      items: pendingPdfResult.items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              matchedStoreId: matched ? matched.id : undefined,
              matchedStoreName: matched ? matched.name : undefined,
            }
          : it
      ),
    });
  };

  const handleRemovePdfItem = (itemId: string) => {
    if (!pendingPdfResult) return;
    setPendingPdfResult({
      ...pendingPdfResult,
      items: pendingPdfResult.items.filter((it) => it.id !== itemId),
    });
  };

  const pdfSummary = useMemo(() => {
    if (!pendingPdfResult) return null;
    return summarizePdfSalesByCategory(pendingPdfResult.items, draft.standards);
  }, [pendingPdfResult, draft.standards]);

  const pdfByStoreSummary = useMemo(() => {
    if (!pendingPdfResult) return null;
    return summarizePdfSalesByStore(pendingPdfResult.items, draft.standards, stores);
  }, [pendingPdfResult, draft.standards, stores]);

  const handleApplyPdfSalesToSheet = () => {
    if (!pendingPdfResult || !pdfSummary) return;
    const { salesEntry } = pdfSummary;
    const count = Math.max(1, draft.storeRows.length);

    if (applyTargetMode === 'by_store') {
      const storeSummaries = pdfByStoreSummary?.storeSummaries || [];
      if (storeSummaries.length === 0) {
        setPdfParseError(
          'Nenhuma filial foi vinculada aos cortes extraídos. Selecione a filial na tabela acima ou escolha "Aplicar em filial específica".'
        );
        return;
      }

      const byStoreMap = new Map(storeSummaries.map((s) => [s.storeId, s.salesEntry]));

      setDraft((prev) => ({
        ...prev,
        lastPdfImport: {
          ...pendingPdfResult,
          targetStoreId: 'BY_STORE_EXACT',
        },
        storeRows: prev.storeRows.map((row) => {
          const matchedSales = byStoreMap.get(row.storeId);
          if (matchedSales) {
            return {
              ...row,
              sales: { ...matchedSales },
            };
          }
          if (clearAbsentStores) {
            return {
              ...row,
              sales: {
                dianteiroKg: 0,
                traseiroKg: 0,
                coxaoKg: 0,
                alcatraoKg: 0,
                costelaKg: 0,
              },
            };
          }
          return row;
        }),
      }));

      setIsPdfModalOpen(false);
      showToast(
        `Vendas aplicadas fielmente em ${storeSummaries.length} filial(is) reconhecida(s)!`
      );
      return;
    }

    setDraft((prev) => ({
      ...prev,
      lastPdfImport: {
        ...pendingPdfResult,
        targetStoreId: applyTargetMode === 'single' ? applyTargetStoreId : 'ALL_EQUAL',
      },
      storeRows: prev.storeRows.map((row) => {
        if (applyTargetMode === 'single') {
          if (row.storeId !== applyTargetStoreId) return row;
          return {
            ...row,
            sales: { ...salesEntry },
          };
        }
        return {
          ...row,
          sales: {
            dianteiroKg: Number((salesEntry.dianteiroKg / count).toFixed(2)),
            traseiroKg: Number((salesEntry.traseiroKg / count).toFixed(2)),
            coxaoKg: Number((salesEntry.coxaoKg / count).toFixed(2)),
            alcatraoKg: Number((salesEntry.alcatraoKg / count).toFixed(2)),
            costelaKg: Number((salesEntry.costelaKg / count).toFixed(2)),
          },
        };
      }),
    }));

    setIsPdfModalOpen(false);
    showToast(
      applyTargetMode === 'single'
        ? 'Vendas aplicadas na filial selecionada!'
        : `Vendas distribuídas igualmente nas ${count} filiais e convertidas para peças.`
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. CABEÇALHO OPERACIONAL & METADADOS DO FRIGORÍFICO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#113829] text-[#b5e550] flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Pedido por Frigorífico
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  16 Filiais • Estoque Planilha + Venda PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Soma de cortes da Planilha de Compras pela base Desossa, conversão de venda (KG ÷ Peso Padrão) e emissão de pedido oficial.
              </p>
            </div>
          </div>

          {/* Barra de Ações Principais */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Importar PDF / Imagem</span>
            </button>

            <button
              type="button"
              onClick={handleSuggestOrdersFromSalesAndStock}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
              title="Sugere Pedido = Venda em Peças − Estoque Atual"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sugerir Pedido</span>
            </button>

            <button
              type="button"
              onClick={handleSaveOrderRecord}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#113829] hover:bg-[#194d38] text-[#b5e550] text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Pedido</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadOrderPdf()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Relatório PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrintOrder()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Metadados do Pedido e Fornecedor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-4">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Frigorífico / Fornecedor
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={draft.supplierId}
                onChange={(e) => handleSelectSupplier(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {suppliers.length === 0 && <option value="">Nenhum frigorífico cadastrado</option>}
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.tradeName || sup.name} {sup.sifNumber ? `(${sup.sifNumber})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onOpenSupplierManager}
                className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
                title="Gerenciar Fornecedores e Frigoríficos"
              >
                <Building2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              N° do Pedido
            </label>
            <input
              type="text"
              value={draft.orderNumber}
              onChange={(e) => setDraft((p) => ({ ...p, orderNumber: e.target.value }))}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Data Pedido / Entrega
            </label>
            <div className="flex gap-1">
              <input
                type="date"
                value={draft.orderDate}
                onChange={(e) => setDraft((p) => ({ ...p, orderDate: e.target.value }))}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-900 dark:text-white outline-none"
                title="Data do Pedido"
              />
              <input
                type="date"
                value={draft.deliveryDate}
                onChange={(e) => setDraft((p) => ({ ...p, deliveryDate: e.target.value }))}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-900 dark:text-white outline-none"
                title="Previsão de Entrega"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Condição Pagto & Status
            </label>
            <div className="flex gap-1">
              <input
                type="text"
                value={draft.paymentTerms}
                onChange={(e) => setDraft((p) => ({ ...p, paymentTerms: e.target.value }))}
                placeholder="14 dias"
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
              />
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as typeof orderStatus)}
                className="w-1/2 px-1.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="RASCUNHO">RASCUNHO</option>
                <option value="ENVIADO">ENVIADO</option>
                <option value="CONFIRMADO">CONFIRMADO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Comprador / Observações
            </label>
            <input
              type="text"
              value={draft.buyer}
              onChange={(e) => setDraft((p) => ({ ...p, buyer: e.target.value }))}
              placeholder="Comprador responsável"
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#113829] text-white rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-200/80 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Peças Pedidas</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-[#b5e550] font-mono text-[10px]">
              16 Lojas
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-black tabular-nums">
            {formatNumberBR(totals.totalPieces, 0)} <span className="text-sm font-semibold text-emerald-200">peças</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-emerald-100/90">
            <span>Diant: {totals.pedidoDianteiro}</span>
            <span>•</span>
            <span>Tras: {totals.pedidoTraseiro}</span>
            <span>•</span>
            <span>Cox: {totals.pedidoCoxao}</span>
            <span>•</span>
            <span>Alc: {totals.pedidoAlcatrao}</span>
            <span>•</span>
            <span>Cost: {totals.pedidoCostela}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Peso Total do Pedido
          </div>
          <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatNumberBR(totals.totalWeightKg, 1)} <span className="text-sm font-semibold text-slate-500">kg</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Equiv. aproximado: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{equivalentBois} carcaças</strong> ({carcassWeightRef} kg)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Custo Médio Negociado
          </div>
          <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatCurrencyBRL(avgCostPerKg)} <span className="text-sm font-semibold text-slate-500">/kg</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Equiv. @ limpa: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrencyBRL(avgCostPerKg * 15)}/@</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Valor Total do Pedido
          </div>
          <div className="mt-1.5 text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatCurrencyBRL(totals.totalCostR$)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Frigorífico: <strong className="text-slate-800 dark:text-slate-200">{draft.supplierName}</strong>
          </div>
        </div>
      </div>

      {/* 3. MOTOR DE PESOS PADRÃO & CUSTOS (BASE DESOSSA) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsStandardsOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Motor de Pesos Padrão, % Carcaça e Custos por Categoria (Base Desossa)</span>
            {isStandardsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncCostsFromDesossa}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sincronizar Custos Desossa</span>
            </button>

            <button
              type="button"
              onClick={handleApplyCarcassWeightsFromDesossa}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Calculator className="w-3 h-3" />
              <span>Aplicar Pesos % Carcaça</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreCommercialWeights}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              title="Dianteiro 45kg, Traseiro 60kg, Coxão 35kg, Alcatrão 22kg, Costela 20kg"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Padrão (Diant. 45kg)</span>
            </button>
          </div>
        </div>

        {isStandardsOpen && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {SLAUGHTERHOUSE_CATEGORY_ORDER.map((cat) => {
              const std: SlaughterhouseCategoryStandard = draft.standards[cat];
              const meta = SLAUGHTERHOUSE_CATEGORY_META[cat];
              const examplePieces = convertSalesKgToPieces(350, std.standardWeightKg);

              return (
                <div
                  key={cat}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {std.label}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {std.desossaGroup} • {formatNumberBR(std.carcassPercent, 1)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2" title={meta.includedCutsLabel}>
                      {meta.includedCutsLabel}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                        Peso Padrão (kg/pç)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={std.standardWeightKg}
                        onChange={(e) => handleUpdateStandard(cat, 'standardWeightKg', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                        Custo (R$/kg)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={std.costPerKg}
                        onChange={(e) => handleUpdateStandard(cat, 'costPerKg', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Eq. @: {formatCurrencyBRL(std.costPerKg * 15)}</span>
                    <span className="font-mono" title="Simulação 350kg ÷ Peso Padrão">
                      350kg = {formatNumberBR(examplePieces, 2)} pç
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. PLANILHA PRINCIPAL — 16 FILIAIS (ESTOQUE DESOSSA + VENDA KG/PÇ + PEDIDO POR FRIGORÍFICO) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Matriz de Pedido por Frigorífico — 16 Filiais
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Passe o mouse sobre o Estoque para ver os cortes somados da Planilha. Vendas em KG convertem automaticamente em peças pelo Peso Padrão.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearOrderQuantities}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3 h-3" />
              <span>Zerar Campos Pedido</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* Super Cabeçalho Agrupado */}
              <tr className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-20 bg-slate-900 text-left px-3 py-2 border-b border-r border-slate-700 min-w-[165px]"
                >
                  Filial ({draft.storeRows.length})
                </th>
                <th
                  colSpan={5}
                  className="bg-slate-700 text-center py-1.5 border-b border-r border-slate-600"
                >
                  Estoque Atual (Planilha + Cortes Desossa)
                </th>
                <th
                  colSpan={5}
                  className="bg-indigo-800 text-center py-1.5 border-b border-r border-indigo-700"
                >
                  Venda Informada (KG → Peças Padrão)
                </th>
                <th
                  colSpan={5}
                  className="bg-[#113829] text-[#b5e550] text-center py-1.5 border-b border-r border-emerald-800"
                >
                  Campos de Pedido (Peças)
                </th>
                <th
                  colSpan={2}
                  className="bg-slate-800 text-center py-1.5 border-b border-slate-700"
                >
                  Totais do Pedido
                </th>
              </tr>

              {/* Sub-cabeçalho das colunas */}
              <tr className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                {/* Estoque */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Dianteiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Traseiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Coxão</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Alcatrão</th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Costela</th>

                {/* Venda KG */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-indigo-50/70 dark:bg-indigo-950/30 whitespace-nowrap">V. Dianteiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-indigo-50/70 dark:bg-indigo-950/30 whitespace-nowrap">V. Traseiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-indigo-50/70 dark:bg-indigo-950/30 whitespace-nowrap">V. Coxão</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-indigo-50/70 dark:bg-indigo-950/30 whitespace-nowrap">V. Alcatrão</th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-600 bg-indigo-50/70 dark:bg-indigo-950/30 whitespace-nowrap">V. Costela</th>

                {/* Pedido */}
                <th className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 whitespace-nowrap">
                  PEDIDO DIANTEIRO
                </th>
                <th className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 whitespace-nowrap">
                  PEDIDO TRASEIRO
                </th>
                <th className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 whitespace-nowrap">
                  PEDIDO COXAO
                </th>
                <th className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 whitespace-nowrap">
                  PEDIDO ALCATRAO
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 whitespace-nowrap">
                  PEDIDO COSTELA
                </th>

                {/* Totais */}
                <th className="px-2 py-2 text-right border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Peso (kg)</th>
                <th className="px-3 py-2 text-right whitespace-nowrap">Total (R$)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {draft.storeRows.map((row, rowIdx) => {
                const stock = storeStockMap.get(row.storeId);
                const report = reportRows[rowIdx];

                return (
                  <tr
                    key={row.storeId}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-3 py-2 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {row.storeName}
                    </td>

                    {/* ESTOQUE ATUAL POR CATEGORIA */}
                    {SLAUGHTERHOUSE_CATEGORY_ORDER.map((cat, idx) => {
                      const st = stock ? stock[cat] : null;
                      return (
                        <td
                          key={`st-${cat}`}
                          title={st ? st.breakdown.join(' | ') : ''}
                          className={`px-2 py-1.5 text-center tabular-nums cursor-help ${
                            idx === 4
                              ? 'border-r border-slate-300 dark:border-slate-600'
                              : 'border-r border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {st ? st.pieces : 0} <span className="text-[9px] font-normal text-slate-400">pç</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {st ? formatNumberBR(st.kg, 0) : 0}kg
                          </div>
                        </td>
                      );
                    })}

                    {/* VENDA INFORMADA (KG -> PEÇAS PADRÃO) */}
                    {SLAUGHTERHOUSE_CATEGORY_ORDER.map((cat, idx) => {
                      const field = SALES_FIELD_BY_CATEGORY[cat];
                      const kgVal = row.sales[field] || 0;
                      const piecesEq = convertSalesKgToPieces(
                        kgVal,
                        draft.standards[cat].standardWeightKg
                      );
                      return (
                        <td
                          key={`sl-${cat}`}
                          className={`px-1.5 py-1 text-center bg-indigo-50/30 dark:bg-indigo-950/15 ${
                            idx === 4
                              ? 'border-r border-slate-300 dark:border-slate-600'
                              : 'border-r border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            data-sh-row={rowIdx}
                            data-sh-col={`sale-${cat}`}
                            value={kgVal || ''}
                            placeholder="0 kg"
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleCellKeyDown(e, rowIdx, `sale-${cat}`)}
                            onChange={(e) => handleUpdateSalesKg(row.storeId, field, e.target.value)}
                            className="w-16 px-1.5 py-1 text-center rounded border border-indigo-200 dark:border-indigo-800/70 bg-white dark:bg-slate-900 text-[11px] font-mono font-bold text-indigo-900 dark:text-indigo-200 tabular-nums focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <div className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 tabular-nums">
                            = {formatNumberBR(piecesEq, 2)} pç
                          </div>
                        </td>
                      );
                    })}

                    {/* CAMPOS DE PEDIDO (PEÇAS) */}
                    {SLAUGHTERHOUSE_CATEGORY_ORDER.map((cat, idx) => {
                      const field = ORDER_FIELD_BY_CATEGORY[cat];
                      const val = row[field] || 0;
                      return (
                        <td
                          key={`ord-${cat}`}
                          className={`px-1.5 py-1 text-center bg-emerald-50/40 dark:bg-emerald-950/20 ${
                            idx === 4
                              ? 'border-r border-slate-300 dark:border-slate-600'
                              : 'border-r border-emerald-100 dark:border-emerald-900/40'
                          }`}
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            data-sh-row={rowIdx}
                            data-sh-col={`ord-${cat}`}
                            value={val || ''}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleCellKeyDown(e, rowIdx, `ord-${cat}`)}
                            onChange={(e) => handleUpdateOrderQty(row.storeId, field, e.target.value)}
                            className="w-16 px-1.5 py-1.5 text-center rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-mono font-black text-emerald-900 dark:text-emerald-300 tabular-nums focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                      );
                    })}

                    {/* TOTAIS DA LOJA */}
                    <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 tabular-nums whitespace-nowrap">
                      {formatNumberBR(report?.order.totalWeightKg || 0, 1)} kg
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      {formatCurrencyBRL(report?.order.totalCostR$ || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-400 dark:border-slate-600 text-[11px] tabular-nums">
                <td className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 border-r border-slate-300 dark:border-slate-600">
                  TOTAL GERAL ({draft.storeRows.length} FILIAIS)
                </td>

                {/* Soma Estoque */}
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700">{totals.stockDianteiroPc} pç</td>
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700">{totals.stockTraseiroPc} pç</td>
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700">{totals.stockCoxaoPc} pç</td>
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700">{totals.stockAlcatraoPc} pç</td>
                <td className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-600">{totals.stockCostelaPc} pç</td>

                {/* Soma Vendas */}
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 text-indigo-800 dark:text-indigo-300">
                  <div>{formatNumberBR(totals.salesDianteiroKg, 1)}kg</div>
                  <div className="text-[9px] font-mono">{formatNumberBR(totals.salesDianteiroPc, 2)} pç</div>
                </td>
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 text-indigo-800 dark:text-indigo-300">
                  <div>{formatNumberBR(totals.salesTraseiroKg, 1)}kg</div>
                  <div className="text-[9px] font-mono">{formatNumberBR(totals.salesTraseiroPc, 2)} pç</div>
                </td>
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 text-indigo-800 dark:text-indigo-300">
                  <div>{formatNumberBR(totals.salesCoxaoKg, 1)}kg</div>
                  <div className="text-[9px] font-mono">{formatNumberBR(totals.salesCoxaoPc, 2)} pç</div>
                </td>
                <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-700 text-indigo-800 dark:text-indigo-300">
                  <div>{formatNumberBR(totals.salesAlcatraoKg, 1)}kg</div>
                  <div className="text-[9px] font-mono">{formatNumberBR(totals.salesAlcatraoPc, 2)} pç</div>
                </td>
                <td className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-600 text-indigo-800 dark:text-indigo-300">
                  <div>{formatNumberBR(totals.salesCostelaKg, 1)}kg</div>
                  <div className="text-[9px] font-mono">{formatNumberBR(totals.salesCostelaPc, 2)} pç</div>
                </td>

                {/* Soma Pedidos */}
                <td className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">
                  {totals.pedidoDianteiro}
                </td>
                <td className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">
                  {totals.pedidoTraseiro}
                </td>
                <td className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">
                  {totals.pedidoCoxao}
                </td>
                <td className="px-2 py-2 text-center border-r border-emerald-200 dark:border-emerald-900 bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">
                  {totals.pedidoAlcatrao}
                </td>
                <td className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-600 bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">
                  {totals.pedidoCostela}
                </td>

                <td className="px-2 py-2 text-right font-mono border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  {formatNumberBR(totals.totalWeightKg, 1)} kg
                </td>
                <td className="px-3 py-2 text-right font-mono text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                  {formatCurrencyBRL(totals.totalCostR$)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Observações do Pedido */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Observações Comerciais & Logísticas para o Frigorífico
          </label>
          <input
            type="text"
            value={draft.notes}
            onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Instruções de entrega, temperatura de câmara, SIF ou prazo de pagamento..."
          />
        </div>
      </div>

      {/* 5. HISTÓRICO DE PEDIDOS POR FRIGORÍFICO EMITIDOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsHistoryOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Histórico de Pedidos por Frigorífico Emitidos ({savedOrders.length})</span>
            {isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isHistoryOpen && (
          <div className="p-4">
            {savedOrders.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                Nenhum pedido salvo ainda. Preencha os campos de pedido e clique em <strong>Salvar Pedido</strong> para registrar no histórico.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-2 text-left">N° Pedido</th>
                      <th className="py-2 px-2 text-left">Data / Entrega</th>
                      <th className="py-2 px-2 text-left">Frigorífico</th>
                      <th className="py-2 px-2 text-right">Peças</th>
                      <th className="py-2 px-2 text-right">Peso (kg)</th>
                      <th className="py-2 px-2 text-right">Total (R$)</th>
                      <th className="py-2 px-2 text-center">Status</th>
                      <th className="py-2 px-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {savedOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2 font-mono font-bold text-slate-900 dark:text-white">
                          {ord.orderNumber}
                        </td>
                        <td className="py-2 px-2 text-slate-600 dark:text-slate-300 tabular-nums">
                          {ord.date} → {ord.deliveryDate}
                        </td>
                        <td className="py-2 px-2 font-semibold text-slate-800 dark:text-slate-200">
                          {ord.supplier}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {formatNumberBR(ord.totalPieces, 0)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {formatNumberBR(ord.totalWeightKg, 1)} kg
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatCurrencyBRL(ord.totalCostR$)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleLoadOrderIntoDraft(ord)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                            >
                              Carregar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadOrderPdf(ord)}
                              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
                            >
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintOrder(ord)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
                            >
                              Imprimir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrderRecord(ord.id)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Excluir pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. MODAL IMPORTADOR DE PDF / IMAGEM DE VENDAS (RECONHECIMENTO POR FILIAL + MOTOR DESOSSA) */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Importador de Documento de Vendas (PDF / Imagem) & Reconhecimento por Filial
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reconhece cada filial automaticamente, classifica cortes pela Desossa e preserva fielmente os valores de KG de cada loja.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Modo de entrada: Upload PDF/Imagem vs Colar Texto */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setPdfMode('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    pdfMode === 'file'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Enviar PDF ou Imagem (.pdf, .png, .jpg)
                </button>
                <button
                  type="button"
                  onClick={() => setPdfMode('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    pdfMode === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Colar Relatório Tabular de Vendas
                </button>
              </div>

              {pdfMode === 'file' ? (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-slate-50/70 dark:bg-slate-800/30">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => handlePdfFileSelected(e.target.files?.[0] || null)}
                  />
                  <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Selecione o relatório de vendas em PDF ou Imagem/Print de tela (máx. 15 MB)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                    O sistema identifica cada filial listada no documento, separa os cortes pela Desossa e respeita o peso em KG de cada loja.
                  </p>
                  <button
                    type="button"
                    disabled={isParsingPdf}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    {isParsingPdf ? 'Analisando Documento...' : 'Escolher Arquivo (PDF ou Imagem)'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Cole o relatório por filial (ex.: nome/código da filial seguido dos cortes e KG vendidos):
                  </label>
                  <textarea
                    rows={5}
                    value={rawSalesText}
                    onChange={(e) => setRawSalesText(e.target.value)}
                    placeholder={'FILIAL 01 - CM SANTA ROSA\nPALETA BOVINA   180,00 kg\nACÉM BOVINO     170,00 kg\n\nFILIAL 02 - RN ARARUAMA II\nPICANHA         65,00 kg\nCHÃ DE DENTRO   140,00 kg'}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isParsingPdf}
                      onClick={handleParseRawText}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                    >
                      {isParsingPdf ? 'Classificando...' : 'Analisar e Reconhecer Filiais'}
                    </button>
                  </div>
                </div>
              )}

              {pdfParseError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pdfParseError}</span>
                </div>
              )}

              {/* Resumo da Conversão KG -> Peças Padrão + Quebra Fiel por Filial */}
              {pendingPdfResult && pdfSummary && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Documento: {pendingPdfResult.fileName} • {pendingPdfResult.items.length} cortes •{' '}
                        {pdfByStoreSummary?.storeSummaries.length || 0} filial(is) reconhecida(s)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                      Motor: {pendingPdfResult.parserEngine === 'gemini' ? 'Leitura Inteligente Multimodal' : 'Parser Tabular'}
                    </span>
                  </div>

                  {/* Resumo Consolidado das 5 Categorias */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {SLAUGHTERHOUSE_CATEGORY_ORDER.map((cat) => {
                      const sum = pdfSummary.summaries[cat];
                      return (
                        <div
                          key={`sum-${cat}`}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {sum.label}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              {sum.desossaGroup}
                            </span>
                          </div>
                          <div className="mt-2 text-sm font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                            {formatNumberBR(sum.totalKg, 2)} kg
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            ÷ {sum.standardWeightKg} kg/pç ={' '}
                            <strong className="text-emerald-700 dark:text-emerald-400">
                              {formatNumberBR(sum.exactPieces, 2)} pçs
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo Fiel por Filial Reconhecida */}
                  {pdfByStoreSummary && pdfByStoreSummary.storeSummaries.length > 0 && (
                    <div className="border border-emerald-200 dark:border-emerald-900/60 rounded-xl overflow-hidden bg-emerald-50/30 dark:bg-emerald-950/15">
                      <div className="px-3 py-2 bg-emerald-100/70 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                          Vendas Reconhecidas por Filial (Valores Individuais Preservados)
                        </span>
                        {pdfByStoreSummary.unassignedItems.length > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            {pdfByStoreSummary.unassignedItems.length} item(ns) sem filial vinculada
                          </span>
                        )}
                      </div>
                      <div className="overflow-x-auto max-h-48">
                        <table className="w-full text-[11px]">
                          <thead className="bg-white/80 dark:bg-slate-900/80 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-emerald-200/70 dark:border-emerald-900/40">
                            <tr>
                              <th className="py-1.5 px-3 text-left">Filial Reconhecida</th>
                              <th className="py-1.5 px-2 text-right">Dianteiro</th>
                              <th className="py-1.5 px-2 text-right">Traseiro</th>
                              <th className="py-1.5 px-2 text-right">Coxão</th>
                              <th className="py-1.5 px-2 text-right">Alcatrão</th>
                              <th className="py-1.5 px-2 text-right">Costela</th>
                              <th className="py-1.5 px-3 text-right">Total KG</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/30 tabular-nums">
                            {pdfByStoreSummary.storeSummaries.map((st) => (
                              <tr key={st.storeId} className="hover:bg-white/60 dark:hover:bg-slate-900/40">
                                <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  {st.storeName}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {formatNumberBR(st.salesEntry.dianteiroKg, 1)}kg{' '}
                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                                    ({formatNumberBR(st.pieces.dianteiroPecas, 2)}pç)
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {formatNumberBR(st.salesEntry.traseiroKg, 1)}kg{' '}
                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                                    ({formatNumberBR(st.pieces.traseiroPecas, 2)}pç)
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {formatNumberBR(st.salesEntry.coxaoKg, 1)}kg{' '}
                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                                    ({formatNumberBR(st.pieces.coxaoPecas, 2)}pç)
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {formatNumberBR(st.salesEntry.alcatraoKg, 1)}kg{' '}
                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                                    ({formatNumberBR(st.pieces.alcatraoPecas, 2)}pç)
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {formatNumberBR(st.salesEntry.costelaKg, 1)}kg{' '}
                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                                    ({formatNumberBR(st.pieces.costelaPecas, 2)}pç)
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                                  {formatNumberBR(st.totalKg, 2)} kg
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tabela de Cortes Extraídos (Reclassificável por Corte e por Filial) */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="py-2 px-3 text-left">Filial / Loja</th>
                            <th className="py-2 px-3 text-left">Corte Extraído</th>
                            <th className="py-2 px-3 text-left">Classificação Desossa</th>
                            <th className="py-2 px-3 text-right">Peso (kg)</th>
                            <th className="py-2 px-3 text-left">Regra Identificada</th>
                            <th className="py-2 px-2 text-center">Remover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pendingPdfResult.items.map((item: PdfSalesParsedCutItem) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-1.5 px-3">
                                <select
                                  value={item.matchedStoreId || ''}
                                  onChange={(e) => handleReassignPdfItemStore(item.id, e.target.value)}
                                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${
                                    item.matchedStoreId
                                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                                      : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                                  }`}
                                >
                                  <option value="">Sem filial vinculada</option>
                                  {stores.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                                {item.rawStore && !item.matchedStoreId && (
                                  <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                                    Lido: {item.rawStore}
                                  </div>
                                )}
                              </td>
                              <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-white">
                                {item.cutName}
                              </td>
                              <td className="py-1.5 px-3">
                                <select
                                  value={item.category}
                                  onChange={(e) =>
                                    handleReclassifyPdfItem(
                                      item.id,
                                      e.target.value as SlaughterhouseCutCategory
                                    )
                                  }
                                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-800 dark:text-slate-100"
                                >
                                  <option value="dianteiro">Dianteiro (Segunda)</option>
                                  <option value="traseiro">Traseiro (Nobre + Coxão)</option>
                                  <option value="coxao">Coxão (Coxão)</option>
                                  <option value="alcatrao">Alcatrão (Nobre)</option>
                                  <option value="costela">Costela (Costela)</option>
                                </select>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold tabular-nums">
                                {formatNumberBR(item.weightKg, 2)} kg
                              </td>
                              <td className="py-1.5 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                                {item.matchedBy}
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePdfItem(item.id)}
                                  className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>

            {/* Footer Modal: Aplicar na Planilha */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-700 dark:text-emerald-400">
                  <input
                    type="radio"
                    name="applyTargetMode"
                    checked={applyTargetMode === 'by_store'}
                    onChange={() => setApplyTargetMode('by_store')}
                  />
                  <span>
                    Respeitar cada filial identificada ({pdfByStoreSummary?.storeSummaries.length || 0})
                  </span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="applyTargetMode"
                    checked={applyTargetMode === 'single'}
                    onChange={() => setApplyTargetMode('single')}
                  />
                  <span>Aplicar total em filial específica:</span>
                </label>

                {applyTargetMode === 'single' && (
                  <select
                    value={applyTargetStoreId}
                    onChange={(e) => setApplyTargetStoreId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name="applyTargetMode"
                    checked={applyTargetMode === 'equal'}
                    onChange={() => setApplyTargetMode('equal')}
                  />
                  <span>Dividir igualmente ({draft.storeRows.length} filiais)</span>
                </label>

                {applyTargetMode === 'by_store' && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-3">
                    <input
                      type="checkbox"
                      checked={clearAbsentStores}
                      onChange={(e) => setClearAbsentStores(e.target.checked)}
                    />
                    <span>Zerar vendas das filiais ausentes</span>
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={!pendingPdfResult || pendingPdfResult.items.length === 0}
                  onClick={handleApplyPdfSalesToSheet}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Aplicar Venda na Planilha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
