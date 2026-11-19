import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ClipboardPaste,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Scissors,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PdfSalesImportResult, SheetRowData, Store } from '../../types/erp';
import { parseSalesDocumentClientSide } from '../../services/pdfSalesClientParser';
import {
  SheetStoreVendaResolution,
  calculateSheetVendaFromReportQty,
  resolveStoreTotalsForSheetVenda,
} from '../../services/slaughterhouseOrderService';

interface SheetSalesImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  stores: Store[];
  effectiveCarcassWeight: number;
  yieldBasis: 'carcass' | 'piece';
  onApplyStoreSales: (
    storeVendaMap: Record<string, { venda: number; totalQtyKg: number; exactBois: number }>,
    options: { clearAbsentStores: boolean }
  ) => void;
}

interface EditableStoreVendaRow extends SheetStoreVendaResolution {
  customQtyKg?: number;
}

const fmtQty = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SheetSalesImportModal: React.FC<SheetSalesImportModalProps> = ({
  isOpen,
  onClose,
  rows,
  stores,
  effectiveCarcassWeight,
  yieldBasis,
  onApplyStoreSales,
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [rawTextInput, setRawTextInput] = useState('');
  const [accumulateImports, setAccumulateImports] = useState(true);
  const [clearAbsentStores, setClearAbsentStores] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatusText, setParseStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedFiles, setParsedFiles] = useState<string[]>([]);
  const [resolvedRows, setResolvedRows] = useState<EditableStoreVendaRow[]>([]);
  const [lastEngine, setLastEngine] = useState<'gemini' | 'text_parser' | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storeRefsPayload = useMemo(
    () =>
      stores.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        city: s.city,
      })),
    [stores]
  );

  const sheetRowByStoreId = useMemo(() => {
    const map = new Map<string, SheetRowData>();
    for (const r of rows) {
      map.set(r.storeId, r);
    }
    return map;
  }, [rows]);

  const safeDivisor = Math.max(1, Number(effectiveCarcassWeight) || 1);

  if (!isOpen) return null;

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

    if (isImage && file.size > 2.5 * 1024 * 1024) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('Não foi possível decodificar a imagem.'));
          el.src = rawDataUrl;
        });

        const maxDim = 2200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.88);
          return {
            base64: compressedUrl.split('base64,')[1] || '',
            mimeType: 'image/jpeg',
          };
        }
      } catch {
        // Mantém payload original caso otimização não seja suportada
      }
    }

    const base64 = rawDataUrl.includes('base64,')
      ? rawDataUrl.split('base64,')[1]
      : rawDataUrl;
    return {
      base64,
      mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
    };
  };

  const executeSalesDocumentParse = async (params: {
    fileName: string;
    fileBase64?: string;
    mimeType?: string;
    rawText?: string;
  }): Promise<PdfSalesImportResult> => {
    // Texto puro vai direto para o parser determinístico local
    if (params.rawText && !params.fileBase64) {
      return parseSalesDocumentClientSide({
        fileName: params.fileName,
        rawText: params.rawText,
        stores: storeRefsPayload,
      });
    }

    let serverErrorMsg = '';
    // Camada 1: Servidor Express (/api/slaughterhouse-order/parse-sales-pdf)
    try {
      const response = await fetch('/api/slaughterhouse-order/parse-sales-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: params.fileBase64,
          mimeType: params.mimeType,
          rawText: params.rawText,
          fileName: params.fileName,
          stores: storeRefsPayload,
        }),
      });

      const rawBody = await response.text();
      const trimmed = (rawBody || '').trim();
      if (trimmed.length > 0 && !trimmed.startsWith('<!') && !trimmed.startsWith('<html')) {
        const payload = JSON.parse(trimmed);
        if (response.ok) {
          const parsed = (payload?.data ?? payload) as PdfSalesImportResult;
          if (
            parsed &&
            ((Array.isArray(parsed.storeTotals) && parsed.storeTotals.length > 0) ||
              (Array.isArray(parsed.items) && parsed.items.length > 0))
          ) {
            return parsed;
          }
        } else {
          serverErrorMsg = payload?.message || payload?.error || '';
        }
      }
    } catch {
      // Fallback automático client-side em ambientes estáticos/preview (HTTP 405)
    }

    // Camada 2 & 3: Gemini Multimodal Client-Side + Descompressor Nativo de PDF
    try {
      return await parseSalesDocumentClientSide({
        fileName: params.fileName,
        fileBase64: params.fileBase64,
        mimeType: params.mimeType,
        rawText: params.rawText,
        stores: storeRefsPayload,
      });
    } catch (clientErr: any) {
      throw new Error(
        clientErr?.message ||
          serverErrorMsg ||
          `Não foi possível extrair os totais de vendas de ${params.fileName}.`
      );
    }
  };

  const mergeResolutions = (
    existing: EditableStoreVendaRow[],
    incoming: SheetStoreVendaResolution[],
    shouldAccumulate: boolean
  ): EditableStoreVendaRow[] => {
    if (!shouldAccumulate || existing.length === 0) {
      return incoming.map((row) => ({ ...row }));
    }

    const byKey = new Map<string, EditableStoreVendaRow>();
    for (const row of existing) {
      byKey.set(row.key, { ...row });
    }
    for (const row of incoming) {
      // Ao importar um novo arquivo contendo a mesma filial, substitui pelo valor mais recente do relatório importado
      byKey.set(row.key, { ...row });
    }

    // Mantém ordem oficial das lojas cadastradas + não vinculadas ao final
    const ordered: EditableStoreVendaRow[] = [];
    for (const store of stores) {
      const hit = byKey.get(store.id);
      if (hit) {
        ordered.push(hit);
        byKey.delete(store.id);
      }
    }
    for (const leftover of byKey.values()) {
      ordered.push(leftover);
    }
    return ordered;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (fileList.length === 0) return;

    setIsParsing(true);
    setErrorMsg(null);
    let workingRows = accumulateImports ? [...resolvedRows] : [];
    const newlyParsedNames: string[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setParseStatusText(
          `Analisando ${file.name} (${i + 1}/${fileList.length}) — lendo linhas "TOTAL DE <LOJA>" e coluna QTDE...`
        );
        const { base64, mimeType } = await prepareFilePayload(file);
        const result = await executeSalesDocumentParse({
          fileName: file.name,
          fileBase64: base64,
          mimeType,
        });

        const nextResolved = resolveStoreTotalsForSheetVenda(
          result,
          storeRefsPayload,
          safeDivisor
        );

        if (nextResolved.length === 0) {
          throw new Error(
            `Nenhuma filial com quantidade (QTDE) foi identificada em "${file.name}". Verifique se o relatório exibe o nome da loja e a coluna QTDE.`
          );
        }

        workingRows = mergeResolutions(
          workingRows,
          nextResolved,
          accumulateImports || i > 0
        );
        newlyParsedNames.push(file.name);
        setLastEngine(result.parserEngine);
      }

      setResolvedRows(workingRows);
      setParsedFiles((prev) =>
        accumulateImports ? [...prev, ...newlyParsedNames] : newlyParsedNames
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao analisar o relatório de vendas.');
    } finally {
      setIsParsing(false);
      setParseStatusText('');
    }
  };

  const handleParsePastedText = async () => {
    const trimmed = rawTextInput.trim();
    if (!trimmed) {
      setErrorMsg('Cole o texto do relatório de vendas (incluindo as linhas TOTAL DE <LOJA> e QTDE).');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setParseStatusText('Processando texto colado e localizando totais por loja...');

    try {
      const result = await executeSalesDocumentParse({
        fileName: 'relatorio-colado.txt',
        rawText: trimmed,
      });

      const nextResolved = resolveStoreTotalsForSheetVenda(
        result,
        storeRefsPayload,
        safeDivisor
      );

      if (nextResolved.length === 0) {
        throw new Error(
          'Nenhuma loja com QTDE foi reconhecida no texto colado. Exemplo aceito: "TOTAL DE CM SANTA ROSA  1.450,80".'
        );
      }

      setResolvedRows((prev) => mergeResolutions(prev, nextResolved, accumulateImports));
      setParsedFiles((prev) =>
        accumulateImports ? [...prev, 'Texto colado'] : ['Texto colado']
      );
      setLastEngine(result.parserEngine);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Não foi possível ler os totais no texto colado.');
    } finally {
      setIsParsing(false);
      setParseStatusText('');
    }
  };

  const handleEditStoreQty = (rowKey: string, rawVal: string) => {
    const normalized = rawVal.replace(',', '.');
    const numeric = Math.max(0, Number(normalized) || 0);
    setResolvedRows((prev) =>
      prev.map((item) => {
        if (item.key !== rowKey) return item;
        const { exactBois, roundedVenda } = calculateSheetVendaFromReportQty(numeric, safeDivisor);
        return {
          ...item,
          customQtyKg: numeric,
          totalQtyKg: numeric,
          exactBois,
          roundedVenda,
        };
      })
    );
  };

  const handleLinkStore = (rowKey: string, targetStoreId: string) => {
    const targetStore = stores.find((s) => s.id === targetStoreId);
    if (!targetStore) return;

    setResolvedRows((prev) => {
      const updated = prev.map((item) => {
        if (item.key !== rowKey) return item;
        return {
          ...item,
          key: targetStore.id,
          storeId: targetStore.id,
          storeName: targetStore.name,
          isUnmappedStore: false,
        };
      });
      // Deduplica caso o usuário vincule a uma loja já presente na lista
      const dedup = new Map<string, EditableStoreVendaRow>();
      for (const row of updated) {
        const existing = dedup.get(row.key);
        if (existing) {
          const summedQty = Number((existing.totalQtyKg + row.totalQtyKg).toFixed(2));
          const { exactBois, roundedVenda } = calculateSheetVendaFromReportQty(
            summedQty,
            safeDivisor
          );
          dedup.set(row.key, {
            ...existing,
            totalQtyKg: summedQty,
            exactBois,
            roundedVenda,
          });
        } else {
          dedup.set(row.key, row);
        }
      }
      return Array.from(dedup.values());
    });
  };

  const handleRemoveRow = (rowKey: string) => {
    setResolvedRows((prev) => prev.filter((item) => item.key !== rowKey));
  };

  const mappedRows = resolvedRows.filter((r) => !r.isUnmappedStore && r.storeId);
  const unmappedRows = resolvedRows.filter((r) => r.isUnmappedStore || !r.storeId);

  const summaryStats = useMemo(() => {
    const totalQtyKg = mappedRows.reduce((acc, r) => acc + r.totalQtyKg, 0);
    const totalRoundedVenda = mappedRows.reduce((acc, r) => acc + r.roundedVenda, 0);
    const reportRowCount = mappedRows.filter((r) => r.source === 'report_total_row').length;
    return {
      totalQtyKg,
      totalRoundedVenda,
      reportRowCount,
    };
  }, [mappedRows]);

  const handleConfirmApply = () => {
    if (mappedRows.length === 0) {
      setErrorMsg('Vincule ao menos uma filial cadastrada antes de aplicar na coluna VENDA.');
      return;
    }

    const map: Record<string, { venda: number; totalQtyKg: number; exactBois: number }> = {};
    for (const row of mappedRows) {
      if (!row.storeId) continue;
      const { exactBois, roundedVenda } = calculateSheetVendaFromReportQty(
        row.totalQtyKg,
        safeDivisor
      );
      map[row.storeId] = {
        venda: roundedVenda,
        totalQtyKg: row.totalQtyKg,
        exactBois,
      };
    }

    onApplyStoreSales(map, { clearAbsentStores });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10030] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[1160px] max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <FileUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                Importar Vendas do Relatório → Coluna VENDA
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Lê o <strong className="text-slate-800 dark:text-slate-200">TOTAL DE CADA LOJA (coluna QTDE)</strong>, divide pelo padrão de{' '}
                <strong className="text-purple-700 dark:text-purple-300">
                  Desossa: {yieldBasis === 'carcass' ? `Carcaça ${safeDivisor}kg` : `Meia Carcaça ${safeDivisor}kg`}
                </strong>{' '}
                e arredonda para o número exato de bois na coluna <strong className="text-amber-700 dark:text-amber-400">VENDA</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Fechar importador de vendas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com barra de rolagem visível */}
        <div className="flex-1 overflow-y-auto erp-scrollbar p-4 sm:p-5 space-y-4">
          {/* Regra ativa e seletor de entrada */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  inputMode === 'file'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Enviar PDF ou Imagem (.pdf, .png, .jpg)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  inputMode === 'text'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Colar Relatório Tabular</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Divisor Ativo:</span>
                <span className="font-mono underline">
                  {yieldBasis === 'carcass'
                    ? `Carcaça ${safeDivisor}kg`
                    : `Meia Carcaça ${safeDivisor}kg`}
                </span>
              </div>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accumulateImports}
                  onChange={(e) => setAccumulateImports(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Acumular lojas ao importar novos arquivos</span>
              </label>
            </div>
          </div>

          {/* Área de upload ou colagem */}
          {inputMode === 'file' ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  {isParsing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    {isParsing
                      ? parseStatusText || 'Lendo relatório de vendas...'
                      : 'Selecione um ou mais relatórios de vendas do sistema (PDF ou Print/Imagem)'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Ex.: linha <strong>&ldquo;TOTAL DE CM SANTA ROSA&rdquo;</strong> coluna <strong>&ldquo;QTDE&rdquo;</strong> → dividida automaticamente por{' '}
                    <strong>{safeDivisor}kg</strong> e arredondada para inteiro exato.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition cursor-pointer shrink-0 flex items-center gap-2"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analisando...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4" />
                    <span>Escolher Arquivo (PDF / Imagem)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <textarea
                rows={5}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder={`Cole aqui as linhas do relatório de vendas do sistema. Exemplo:\nTOTAL DE CM SANTA ROSA        785,40    R$ 26.410,00\nTOTAL DE RN RIO BONITO        312,00    R$ 10.520,00\nTOTAL DE RN ITAIPU            910,25    R$ 30.890,00`}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 erp-scrollbar"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isParsing || !rawTextInput.trim()}
                  onClick={handleParsePastedText}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calcular Coluna VENDA do Texto</span>
                </button>
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resumo da leitura e tabela de prévia */}
          {resolvedRows.length > 0 && (
            <div className="space-y-3">
              {/* Faixa de KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Lojas Reconhecidas
                  </div>
                  <div className="text-lg font-extrabold font-mono text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {mappedRows.length}{' '}
                    <span className="text-xs font-semibold text-emerald-700/80 dark:text-emerald-400">
                      / {stores.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                    {summaryStats.reportRowCount > 0
                      ? `${summaryStats.reportRowCount} via linha "TOTAL DE <LOJA>"`
                      : 'Via soma de cortes por loja'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    QTDE Total (Lojas Vinculadas)
                  </div>
                  <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                    {fmtQty(summaryStats.totalQtyKg)} <span className="text-xs font-semibold">kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {parsedFiles.length} arquivo(s) •{' '}
                    {lastEngine === 'gemini' ? 'Leitura Multimodal' : 'Leitura Tabular'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    Padrão Desossa (Divisor)
                  </div>
                  <div className="text-lg font-extrabold font-mono text-purple-900 dark:text-purple-200 mt-0.5">
                    {safeDivisor} <span className="text-xs font-semibold">kg</span>
                  </div>
                  <div className="text-[10px] text-purple-700/80 dark:text-purple-300/80">
                    Fórmula: ARRED(QTDE ÷ {safeDivisor})
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Total Coluna VENDA (Exato)
                  </div>
                  <div className="text-lg font-extrabold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
                    {summaryStats.totalRoundedVenda}{' '}
                    <span className="text-xs font-semibold">bois</span>
                  </div>
                  <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
                    Arredondado individualmente por loja
                  </div>
                </div>
              </div>

              {unmappedRows.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{unmappedRows.length} loja(s)</strong> encontrada(s) no relatório ainda não vinculada(s) ao cadastro oficial. Selecione a filial correspondente na primeira coluna para aplicá-la na planilha.
                  </span>
                </div>
              )}

              {/* Tabela de Prévia do Cálculo por Loja */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Prévia do Preenchimento — Coluna VENDA (QTDE ÷ Carcaça {safeDivisor}kg)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Você pode ajustar a QTDE manualmente antes de confirmar
                  </span>
                </div>

                <div className="overflow-auto max-h-[340px] erp-scrollbar">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3 text-left font-bold">Filial / Loja</th>
                        <th className="py-2.5 px-3 text-left font-bold">Origem no Relatório</th>
                        <th className="py-2.5 px-3 text-right font-bold">Total QTDE (kg)</th>
                        <th className="py-2.5 px-3 text-center font-bold">
                          Cálculo (÷ {safeDivisor}kg)
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                          VENDA (Exato)
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold">Boi (Calc)</th>
                        <th className="py-2.5 px-3 text-center font-bold">Nova Sugestão</th>
                        <th className="py-2.5 px-2 text-center font-bold w-10">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {resolvedRows.map((row) => {
                        const existingSheetRow = row.storeId
                          ? sheetRowByStoreId.get(row.storeId)
                          : undefined;
                        const currentBoi = existingSheetRow ? Number(existingSheetRow.boi || 0) : 0;
                        const { exactBois, roundedVenda } = calculateSheetVendaFromReportQty(
                          row.totalQtyKg,
                          safeDivisor
                        );
                        const nextSugestao = Math.round(roundedVenda - currentBoi);

                        return (
                          <tr
                            key={row.key}
                            className={`transition-colors ${
                              row.isUnmappedStore
                                ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-100">
                              {row.isUnmappedStore ? (
                                <div className="space-y-1">
                                  <div className="text-[11px] text-amber-700 dark:text-amber-300">
                                    Lido: &ldquo;{row.storeName}&rdquo;
                                  </div>
                                  <select
                                    defaultValue=""
                                    onChange={(e) => handleLinkStore(row.key, e.target.value)}
                                    className="w-full max-w-[210px] px-2 py-1 rounded-lg border border-amber-400 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-100"
                                  >
                                    <option value="" disabled>
                                      Vincular à filial oficial...
                                    </option>
                                    {stores.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>{row.storeName}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-2 px-3">
                              {row.source === 'report_total_row' ? (
                                <div className="inline-flex flex-col">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 w-fit">
                                    TOTAL DE {row.storeName} (QTDE)
                                  </span>
                                  {row.sumOfCutsKg > 0 &&
                                    Math.abs(row.sumOfCutsKg - row.totalQtyKg) > 0.5 && (
                                      <span className="text-[10px] text-slate-400 mt-0.5">
                                        Soma dos cortes: {fmtQty(row.sumOfCutsKg)} kg
                                      </span>
                                    )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                  Soma dos {row.itemsCount} corte(s)
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={row.totalQtyKg}
                                  onChange={(e) => handleEditStoreQty(row.key, e.target.value)}
                                  className="w-24 text-right font-mono font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">kg</span>
                              </div>
                            </td>

                            <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {fmtQty(row.totalQtyKg)} ÷ {safeDivisor} ={' '}
                              <span className="font-bold text-slate-900 dark:text-white">
                                {exactBois.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-center bg-amber-50/50 dark:bg-amber-950/20">
                              <span className="inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 border border-amber-400/60 text-amber-800 dark:text-amber-300 font-mono text-sm font-extrabold">
                                {roundedVenda}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                              {row.isUnmappedStore ? '—' : currentBoi}
                            </td>

                            <td className="py-2 px-3 text-center font-mono font-extrabold">
                              {row.isUnmappedStore ? (
                                <span className="text-slate-400">—</span>
                              ) : (
                                <span
                                  className={
                                    nextSugestao > 0
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : nextSugestao < 0
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-slate-500'
                                  }
                                >
                                  {nextSugestao > 0 ? `+${nextSugestao}` : nextSugestao}
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.key)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                title="Remover esta loja da importação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={clearAbsentStores}
              onChange={(e) => setClearAbsentStores(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span>Zerar coluna VENDA das filiais ausentes no relatório</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {resolvedRows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setResolvedRows([]);
                  setParsedFiles([]);
                  setErrorMsg(null);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Limpar Leitura
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={mappedRows.length === 0}
              onClick={handleConfirmApply}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 text-xs font-extrabold shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Aplicar na Coluna VENDA ({mappedRows.length} loja{mappedRows.length === 1 ? '' : 's'})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
