import React, { useState } from 'react';
import { PurchaseBatch, Supplier, Store, SheetRowData } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { 
  ShoppingCart, 
  Plus, 
  FileText, 
  Truck, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Scale,
  Building2,
  Eye,
  Edit,
  Trash2,
  Printer,
  Search,
  AlertTriangle
} from 'lucide-react';
import { ViewPurchaseBatchModal } from '../modals/ViewPurchaseBatchModal';
import { EditPurchaseBatchModal } from '../modals/EditPurchaseBatchModal';
import { PrintPurchaseOrderModal } from '../modals/PrintPurchaseOrderModal';

interface PurchasesTabProps {
  batches: PurchaseBatch[];
  suppliers?: Supplier[];
  stores?: Store[];
  sheetRows?: SheetRowData[];
  onAddBatch: (batch: PurchaseBatch) => void;
  onUpdateBatch?: (batch: PurchaseBatch) => void;
  onDeleteBatch?: (batchId: string) => void;
  onOpenSupplierManager?: () => void;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = ({ 
  batches, 
  suppliers = [],
  stores = [],
  sheetRows = [],
  onAddBatch,
  onUpdateBatch,
  onDeleteBatch,
  onOpenSupplierManager
}) => {
  const [showModal, setShowModal] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [headsCount, setHeadsCount] = useState(40);
  const [totalGrossWeightKg, setTotalGrossWeightKg] = useState(9600);
  const [arrobaPrice, setArrobaPrice] = useState(312.00);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for View, Edit, Print, Delete
  const [viewingBatch, setViewingBatch] = useState<PurchaseBatch | null>(null);
  const [editingBatch, setEditingBatch] = useState<PurchaseBatch | null>(null);
  const [printingBatch, setPrintingBatch] = useState<PurchaseBatch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<PurchaseBatch | null>(null);

  const costPerKg = arrobaPrice / 15;
  const totalCost = totalGrossWeightKg * costPerKg;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !invoiceNumber) {
      alert('Preencha os campos obrigatórios (Fornecedor e Nota Fiscal).');
      return;
    }

    const newBatch: PurchaseBatch = {
      id: `batch-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supplier,
      invoiceNumber,
      headsCount: Math.round(headsCount),
      totalGrossWeightKg: Math.round(totalGrossWeightKg),
      arrobaPrice,
      costPerKg: Number(costPerKg.toFixed(2)),
      totalCostR$: Number(totalCost.toFixed(2)),
      targetStoreId: 'TODAS',
      status: 'RECEBIDO',
      notes: 'Lote de compra registrado pelo ERP'
    };

    onAddBatch(newBatch);
    setShowModal(false);
    setSupplier('');
    setInvoiceNumber('');
  };

  const handleConfirmDelete = () => {
    if (deletingBatch && onDeleteBatch) {
      onDeleteBatch(deletingBatch.id);
      setDeletingBatch(null);
    }
  };

  const filteredBatches = batches.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.invoiceNumber.toLowerCase().includes(q) ||
      b.supplier.toLowerCase().includes(q) ||
      (b.notes && b.notes.toLowerCase().includes(q))
    );
  });

  // Prepare order items for print modal when printing a batch
  const getPrintItems = (b: PurchaseBatch) => {
    if (b.items && b.items.length > 0) {
      return b.items.map(it => ({
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
      }));
    }

    // Fallback: distribute evenly among stores
    const effectiveStores = stores.length > 0 ? stores : sheetRows.map(r => ({ id: r.storeId, name: r.storeName }));
    const storeCount = effectiveStores.length || 1;
    const avgHeads = Math.round(b.headsCount / storeCount);
    const avgWeight = Math.round(b.totalGrossWeightKg / storeCount);
    const avgCost = avgWeight * (b.costPerKg || b.arrobaPrice / 15);

    return effectiveStores.map((s, idx) => ({
      storeId: s.id,
      storeName: s.name,
      dianteiro: Math.round(avgHeads * 0.4),
      traseiro: Math.round(avgHeads * 0.2),
      coxao: Math.round(avgHeads * 0.2),
      alcatrao: Math.round(avgHeads * 0.2),
      costela: Math.round(avgHeads * 0.1),
      boi: avgHeads,
      venda: avgHeads + 2,
      sugestao: avgHeads,
      pedido: avgHeads,
      estimatedWeightKg: avgWeight,
      estimatedTotalR$: avgCost,
      bandaKg: 0,
      bandaPecas: 0,
      bandaVenda: 0,
      bandaSugestao: 0,
      bandaPedido: 0,
      costelaSuina: 0,
      pernil: 0,
    }));
  };

  const printingSupplierObj = printingBatch ? suppliers.find(
    s => s.name === printingBatch.supplier || 
    (s.tradeName && `${s.name} (${s.tradeName})` === printingBatch.supplier) ||
    printingBatch.supplier.includes(s.name)
  ) : undefined;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Gestão de Compras de Gado e Lotes de Carcaça
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle de aquisições em frigoríficos, cotação da arroba (@), histórico de pedidos, emissão e conferência
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSupplierManager && (
            <button
              onClick={onOpenSupplierManager}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Cadastro e Gestão de Frigoríficos Fornecedores (Adicionar, Editar, Excluir, Imprimir)"
            >
              <Building2 className="w-4 h-4" />
              <span>Fornecedores</span>
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lote de Compra</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
            Total Comprado (Lotes)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrencyBRL(batches.reduce((acc, b) => acc + b.totalCostR$, 0))}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {batches.length} pedidos e notas fiscais registradas
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
            Volume em Cabeças / Bois
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {batches.reduce((acc, b) => acc + b.headsCount, 0)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">cabeças</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {(batches.reduce((acc, b) => acc + b.totalGrossWeightKg, 0)).toLocaleString('pt-BR')} kg de carcaça
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
            Cotação Média da Arroba (@)
          </span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {batches.length > 0 
              ? formatCurrencyBRL(batches.reduce((acc, b) => acc + b.arrobaPrice, 0) / batches.length)
              : 'R$ 312,00'} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(@)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Preço médio de carcaça: R$ 20,80 a R$ 26,00/kg
          </span>
        </div>
      </div>

      {/* Batches Table with Search & Actions (Visualizar, Editar, Excluir, Imprimir) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Histórico de Lotes & Entradas de Frigoríficos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredBatches.length} registros
            </span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por NF, pedido ou frigorífico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Data / NF</th>
                <th className="px-4 py-3">Frigorífico Fornecedor</th>
                <th className="px-3 py-3 text-center">Bois / Cabeças</th>
                <th className="px-3 py-3 text-right">Peso Total (kg)</th>
                <th className="px-3 py-3 text-right">Preço da @</th>
                <th className="px-3 py-3 text-right">Preço por Kg</th>
                <th className="px-3 py-3 text-right">Valor Total</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans text-xs">
                    Nenhum pedido ou lote encontrado com o termo informado.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{batch.invoiceNumber}</span>
                        {batch.invoiceNumber.startsWith('PC-') && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                            Pedido
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{batch.date}</div>
                    </td>

                    <td className="px-4 py-3 font-sans font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      <div className="truncate font-semibold">{batch.supplier}</div>
                      {batch.notes && <div className="text-[10px] text-slate-500 truncate">{batch.notes}</div>}
                    </td>

                    <td className="px-3 py-3 text-center text-slate-900 dark:text-white font-bold">
                      {batch.headsCount}
                    </td>

                    <td className="px-3 py-3 text-right text-slate-800 dark:text-slate-200 font-bold">
                      {formatNumberBR(batch.totalGrossWeightKg, 0)} kg
                    </td>

                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrencyBRL(batch.arrobaPrice)}
                    </td>

                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrencyBRL(batch.costPerKg)}
                    </td>

                    <td className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyBRL(batch.totalCostR$)}
                    </td>

                    <td className="px-3 py-3 text-center font-sans">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        batch.status === 'RECEBIDO'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : batch.status === 'PENDENTE'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                      }`}>
                        {batch.status === 'RECEBIDO' && <CheckCircle className="w-3 h-3" />}
                        {batch.status === 'PENDENTE' && <Clock className="w-3 h-3" />}
                        {batch.status}
                      </span>
                    </td>

                    {/* 4 Action Buttons: Visualizar, Editar, Imprimir, Excluir */}
                    <td className="px-4 py-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        {/* 1. Visualizar */}
                        <button
                          onClick={() => setViewingBatch(batch)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 transition"
                          title="Visualizar detalhes do pedido e distribuição por filial"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* 2. Editar */}
                        <button
                          onClick={() => setEditingBatch(batch)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 dark:hover:text-amber-400 transition"
                          title="Editar dados e quantidades deste pedido/lote"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* 3. Imprimir */}
                        <button
                          onClick={() => setPrintingBatch(batch)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition"
                          title="Imprimir documento oficial do pedido (PDF)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* 4. Excluir */}
                        <button
                          onClick={() => setDeletingBatch(batch)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition"
                          title="Excluir este pedido / lote do histórico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualizar Pedido */}
      {viewingBatch && (
        <ViewPurchaseBatchModal
          isOpen={!!viewingBatch}
          onClose={() => setViewingBatch(null)}
          batch={viewingBatch}
          suppliers={suppliers}
          stores={stores}
          onEdit={(b) => setEditingBatch(b)}
          onPrint={(b) => setPrintingBatch(b)}
        />
      )}

      {/* Modal Editar Pedido */}
      {editingBatch && onUpdateBatch && (
        <EditPurchaseBatchModal
          isOpen={!!editingBatch}
          onClose={() => setEditingBatch(null)}
          batch={editingBatch}
          suppliers={suppliers}
          stores={stores}
          onSave={(updated) => {
            onUpdateBatch(updated);
            setEditingBatch(null);
          }}
        />
      )}

      {/* Modal Imprimir Pedido */}
      {printingBatch && (
        <PrintPurchaseOrderModal
          isOpen={!!printingBatch}
          onClose={() => setPrintingBatch(null)}
          rows={sheetRows}
          stores={stores}
          supplierName={printingBatch.supplier}
          supplierDetails={printingSupplierObj}
          orderNumber={printingBatch.invoiceNumber}
          todayStr={printingBatch.date}
          deliveryDateStr={printingBatch.deliveryDate || printingBatch.date}
          arrobaPrice={printingBatch.arrobaPrice}
          pricePerKg={printingBatch.costPerKg || printingBatch.arrobaPrice / 15}
          carcassWeightPerBoiKg={Math.round(printingBatch.totalGrossWeightKg / (printingBatch.headsCount || 1))}
          notes={printingBatch.notes || ''}
          orderItems={getPrintItems(printingBatch)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingBatch && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Excluir Pedido / Lote</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 mb-5 font-mono">
              <div>Número: <strong className="text-slate-900 dark:text-white">{deletingBatch.invoiceNumber}</strong></div>
              <div>Fornecedor: <strong className="text-slate-900 dark:text-white">{deletingBatch.supplier}</strong></div>
              <div>Data: <strong>{deletingBatch.date}</strong> • Total: <strong className="text-emerald-600">{formatCurrencyBRL(deletingBatch.totalCostR$)}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeletingBatch(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Pedido</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lote */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>Cadastrar Novo Lote de Compra</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">Frigorífico Fornecedor</label>
                  {onOpenSupplierManager && (
                    <button
                      type="button"
                      onClick={onOpenSupplierManager}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Cadastros</span>
                    </button>
                  )}
                </div>

                {suppliers.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Selecione um fornecedor homologado --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.tradeName ? `${s.name} (${s.tradeName})` : s.name}>
                          {s.code} • {s.name} {s.sifNumber ? `(${s.sifNumber})` : ''} - {s.city}/{s.state}
                        </option>
                      ))}
                      <option value="__custom__">Outro (digitar manualmente)</option>
                    </select>

                    {supplier === '__custom__' && (
                      <input
                        type="text"
                        required
                        placeholder="Digite o nome do frigorífico..."
                        onChange={(e) => setSupplier(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Ex: Frigorífico Minerva, JBS Friboi..."
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Número da Nota Fiscal (NF)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NF-98432"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Quantidade de Bois (Cabeças)</label>
                  <input
                    type="number"
                    min="1"
                    value={headsCount}
                    onChange={(e) => setHeadsCount(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso Total Carcaça (kg)</label>
                  <input
                    type="number"
                    min="100"
                    step="10"
                    value={totalGrossWeightKg}
                    onChange={(e) => setTotalGrossWeightKg(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço da Arroba (@ em R$)</label>
                  <input
                    type="number"
                    min="100"
                    step="1"
                    value={arrobaPrice}
                    onChange={(e) => setArrobaPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço Resultante por Kg</label>
                  <div className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {formatCurrencyBRL(costPerKg)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Valor Total da Nota Fiscal:</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyBRL(totalCost)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Salvar Lote de Compra
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
