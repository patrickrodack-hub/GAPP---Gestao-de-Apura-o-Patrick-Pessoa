import React, { useState } from 'react';
import { PurchaseBatch, Supplier, Store, PurchaseBatchItem, SheetRowData } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { Edit, X, Save, Building2, Calendar, FileText, CheckCircle, Clock, Printer } from 'lucide-react';
import { PrintPurchaseOrderModal } from './PrintPurchaseOrderModal';

interface EditPurchaseBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: PurchaseBatch;
  suppliers: Supplier[];
  stores: Store[];
  sheetRows?: SheetRowData[];
  yieldParams?: { carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' };
  onSave: (updatedBatch: PurchaseBatch) => void;
  onUpdateSheetRows?: (rows: SheetRowData[]) => void;
  onUpdateYieldParams?: (params: any) => void;
}

export const EditPurchaseBatchModal: React.FC<EditPurchaseBatchModalProps> = ({
  isOpen,
  onClose,
  batch,
  suppliers,
  stores,
  sheetRows,
  yieldParams,
  onSave,
  onUpdateSheetRows,
  onUpdateYieldParams
}) => {
  const [supplier, setSupplier] = useState(batch.supplier);
  const [invoiceNumber, setInvoiceNumber] = useState(batch.invoiceNumber);
  const [date, setDate] = useState(batch.date);
  const [deliveryDate, setDeliveryDate] = useState(batch.deliveryDate || '');
  const [headsCount, setHeadsCount] = useState(batch.headsCount);
  const [totalGrossWeightKg, setTotalGrossWeightKg] = useState(batch.totalGrossWeightKg);
  const [arrobaPrice, setArrobaPrice] = useState(batch.arrobaPrice);
  const [status, setStatus] = useState<'PENDENTE' | 'RECEBIDO' | 'DESOSSADO'>(batch.status);
  const [notes, setNotes] = useState(batch.notes || '');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Per store quantities state
  const initialItems: PurchaseBatchItem[] = batch.items || stores.map(s => {
    const defaultBois = Math.round(batch.headsCount / (stores.length || 1));
    const estimatedWeightKg = Math.round(batch.totalGrossWeightKg / (stores.length || 1));
    const estimatedTotalR$ = estimatedWeightKg * (batch.costPerKg || batch.arrobaPrice / 15);
    return {
      storeId: s.id,
      storeName: s.name,
      dianteiro: Math.round(defaultBois * 0.4),
      traseiro: Math.round(defaultBois * 0.2),
      coxao: Math.round(defaultBois * 0.2),
      alcatrao: Math.round(defaultBois * 0.2),
      costela: Math.round(defaultBois * 0.1),
      boi: defaultBois,
      venda: defaultBois + 2,
      sugestao: defaultBois,
      pedido: defaultBois,
      estimatedWeightKg,
      estimatedTotalR$,
      bandaKg: 0,
      bandaPecas: 0,
      bandaVenda: 0,
      bandaSugestao: 0,
      bandaPedido: 0,
      costelaSuina: 0,
      pernil: 0
    };
  });

  const [items, setItems] = useState<PurchaseBatchItem[]>(initialItems);

  if (!isOpen) return null;

  const costPerKg = arrobaPrice / 15;
  const totalCost = totalGrossWeightKg * costPerKg;

  const handleItemQuantityChange = (storeId: string, newPedido: number) => {
    const updated = items.map(it => {
      if (it.storeId === storeId) {
        const estWeight = Math.round(newPedido * (headsCount > 0 ? totalGrossWeightKg / headsCount : 260));
        return {
          ...it,
          pedido: newPedido,
          estimatedWeightKg: estWeight,
          estimatedTotalR$: Math.round(estWeight * costPerKg * 100) / 100
        };
      }
      return it;
    });
    setItems(updated);
    const newTotalBois = updated.reduce((acc, i) => acc + (i.pedido || 0), 0);
    setHeadsCount(newTotalBois);
  };

  const handleItemSuinoChange = (storeId: string, newBandaPedido: number) => {
    const updated = items.map(it => {
      if (it.storeId === storeId) {
        return {
          ...it,
          bandaPedido: newBandaPedido,
        };
      }
      return it;
    });
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !invoiceNumber) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const updatedBatch: PurchaseBatch = {
      ...batch,
      supplier,
      invoiceNumber,
      date,
      deliveryDate,
      headsCount: Math.round(headsCount),
      totalGrossWeightKg: Math.round(totalGrossWeightKg),
      arrobaPrice: Number(arrobaPrice),
      costPerKg: Math.round(costPerKg * 100) / 100,
      totalCostR$: Math.round(totalCost * 100) / 100,
      status,
      notes,
      items
    };

    onSave(updatedBatch);

    // Assume as informações nos demais campos:
    // 1. Se houver itens por filial e sheetRows, propaga as quantidades para a Planilha Oficial
    if (items && items.length > 0 && sheetRows && onUpdateSheetRows) {
      const updatedRows = StorageService.propagateOrderToSheetRows(sheetRows, items.map(it => ({
        storeId: it.storeId,
        pedido: it.pedido,
        bandaPedido: it.bandaPedido
      })), { updateTransit: status !== 'RECEBIDO' && status !== 'DESOSSADO' });
      onUpdateSheetRows(updatedRows);
    }

    // 2. Atualiza os parâmetros de rendimento e desossa com o novo preço da arroba e custo
    const avgWeight = headsCount > 0 ? Math.round(totalGrossWeightKg / headsCount) : 260;
    const newYieldParams = {
      carcassWeight: avgWeight,
      costPerKg: Math.round(costPerKg * 100) / 100,
      fatPriceKg: yieldParams?.fatPriceKg || 2.10,
      bonePriceKg: yieldParams?.bonePriceKg || 0.70,
      targetMargin: yieldParams?.targetMargin || 28,
      basis: yieldParams?.basis || ('carcass' as const)
    };
    StorageService.saveYieldParams(newYieldParams);
    if (onUpdateYieldParams) {
      onUpdateYieldParams(newYieldParams);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-indigo-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Editar Pedido de Compra / Lote</h3>
              <p className="text-xs text-white/80 font-mono">
                {invoiceNumber} • Modifique condições comerciais, quantidades e dados cadastrais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintPreviewOpen(true)}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold transition shadow-sm border border-white/25 active:scale-95"
              title="Visualizar e Imprimir Pedido de Compra Oficial (PDF)"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Imprimir Pedido</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-900 dark:text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Frigorífico Fornecedor *
              </label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.tradeName ? `${s.name} (${s.tradeName})` : s.name}>
                    {s.code} • {s.name} - {s.city}/{s.state}
                  </option>
                ))}
                <option value={supplier}>{supplier} (Atual)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Número do Pedido / Nota Fiscal (NF) *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Data de Emissão / Entrada
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Previsão de Entrega
              </label>
              <input
                type="text"
                placeholder="Ex: 04/10/2026"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Preço da Arroba (@ em R$)
              </label>
              <input
                type="number"
                step="0.5"
                value={arrobaPrice}
                onChange={(e) => setArrobaPrice(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Status do Lote / Pedido
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold"
              >
                <option value="PENDENTE">🟡 PENDENTE</option>
                <option value="RECEBIDO">🟢 RECEBIDO</option>
                <option value="DESOSSADO">🔵 DESOSSADO</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Volume em Cabeças (Bois)
              </label>
              <input
                type="number"
                min="0"
                value={headsCount}
                onChange={(e) => setHeadsCount(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Peso Total de Carcaça (kg)
              </label>
              <input
                type="number"
                step="10"
                value={totalGrossWeightKg}
                onChange={(e) => setTotalGrossWeightKg(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
              />
            </div>
          </div>

          {/* Computed Summary */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Preço Resultante por Kg:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">
                {formatCurrencyBRL(costPerKg)} / kg
              </strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Valor Financeiro Total:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                {formatCurrencyBRL(totalCost)}
              </strong>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Observações Operacionais
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
              placeholder="Instruções de entrega, notas adicionais..."
            />
          </div>

          {/* Per-store quick edit */}
          {items && items.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <span>Ajustar Quantidades Pedidas por Filial</span>
                <span className="text-[10px] text-slate-500">16 Lojas</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-[11px] border-collapse font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-sans">Loja</th>
                      <th className="px-2 py-1.5 text-center">Boi (Qtd Pedida)</th>
                      <th className="px-2 py-1.5 text-center">Suíno / Banda (Qtd)</th>
                      <th className="px-3 py-1.5 text-right">Peso Estimado (kg)</th>
                      <th className="px-3 py-1.5 text-right">Valor Estimado (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {items.map(item => (
                      <tr key={item.storeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-1.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {item.storeName}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.pedido}
                            onChange={(e) => handleItemQuantityChange(item.storeId, Number(e.target.value) || 0)}
                            className="w-16 text-center py-0.5 rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold text-indigo-700 dark:text-indigo-300"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.bandaPedido || 0}
                            onChange={(e) => handleItemSuinoChange(item.storeId, Number(e.target.value) || 0)}
                            className="w-16 text-center py-0.5 rounded border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 font-bold text-teal-700 dark:text-teal-300"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600 dark:text-slate-300">
                          {formatNumberBR(item.estimatedWeightKg, 0)} kg
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyBRL(item.estimatedTotalR$)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPrintPreviewOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-95"
              title="Gerar e imprimir relatório oficial em PDF com a configuração padrão deste pedido"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Pedido (PDF)</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Impressão Oficial do Pedido com Configuração Padrão do ERP */}
      {isPrintPreviewOpen && (
        <PrintPurchaseOrderModal
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          rows={[]}
          stores={stores}
          supplierName={supplier}
          supplierDetails={suppliers.find(
            s => s.name === supplier || 
            (s.tradeName && `${s.name} (${s.tradeName})` === supplier) ||
            s.tradeName === supplier ||
            (s.code && s.code === supplier)
          )}
          orderNumber={invoiceNumber}
          todayStr={date}
          deliveryDateStr={deliveryDate || date}
          arrobaPrice={Number(arrobaPrice) || 0}
          pricePerKg={costPerKg}
          carcassWeightPerBoiKg={headsCount > 0 ? Math.round(totalGrossWeightKg / headsCount) : 240}
          notes={notes}
          orderItems={items.map(it => ({
            storeId: it.storeId,
            storeName: it.storeName,
            dianteiro: it.dianteiro || 0,
            traseiro: it.traseiro || 0,
            coxao: it.coxao || 0,
            alcatrao: it.alcatrao || 0,
            costela: it.costela || 0,
            boi: it.boi || 0,
            venda: it.venda || 0,
            sugestao: it.sugestao || 0,
            pedido: it.pedido || 0,
            estimatedWeightKg: it.estimatedWeightKg || 0,
            estimatedTotalR$: it.estimatedTotalR$ || 0,
            bandaKg: it.bandaKg || 0,
            bandaPecas: it.bandaPecas || 0,
            bandaVenda: it.bandaVenda || 0,
            bandaSugestao: it.bandaSugestao || 0,
            bandaPedido: it.bandaPedido || 0,
            costelaSuina: it.costelaSuina || 0,
            pernil: it.pernil || 0,
          }))}
        />
      )}
    </div>
  );
};
