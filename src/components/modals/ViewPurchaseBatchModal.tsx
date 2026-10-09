import React from 'react';
import { PurchaseBatch, PurchaseBatchItem, Supplier, Store } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { 
  X, 
  Printer, 
  Edit, 
  Copy, 
  Check, 
  ShoppingCart, 
  Building2, 
  Calendar, 
  Truck, 
  CheckCircle, 
  Clock, 
  FileText,
  Scale
} from 'lucide-react';

interface ViewPurchaseBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: PurchaseBatch;
  suppliers: Supplier[];
  stores: Store[];
  onEdit: (batch: PurchaseBatch) => void;
  onPrint: (batch: PurchaseBatch) => void;
}

export const ViewPurchaseBatchModal: React.FC<ViewPurchaseBatchModalProps> = ({
  isOpen,
  onClose,
  batch,
  suppliers,
  stores,
  onEdit,
  onPrint,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const supplierObj = suppliers.find(
    s => s.name === batch.supplier || 
    (s.tradeName && `${s.name} (${s.tradeName})` === batch.supplier) ||
    batch.supplier.includes(s.name)
  );

  const isPedidoPadrao = batch.invoiceNumber.startsWith('PC-') || !!batch.items;

  // Fallback or actual items
  const items: PurchaseBatchItem[] = batch.items || stores.map((s, idx) => {
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
      pedidoAlcatraoReal: 0,
      costela: Math.round(defaultBois * 0.1),
      pedidoCostelaReal: 0,
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

  const totalBois = items.reduce((acc, i) => acc + (i.pedido || 0), 0) || batch.headsCount;
  const totalDianteiro = items.reduce((acc, i) => acc + (i.dianteiro || 0), 0);
  const totalTraseiro = items.reduce((acc, i) => acc + (i.traseiro || 0), 0);
  const totalCoxao = items.reduce((acc, i) => acc + (i.coxao || 0), 0);
  const totalAlcatrao = items.reduce((acc, i) => acc + (i.alcatrao || 0), 0);
  const totalPedAlcatrao = items.reduce((acc, i) => acc + (i.pedidoAlcatraoReal || 0), 0);
  const totalCostela = items.reduce((acc, i) => acc + (i.costela || 0), 0);
  const totalPedCostela = items.reduce((acc, i) => acc + (i.pedidoCostelaReal || 0), 0);
  const totalBoiEquivalente = items.reduce((acc, i) => acc + (i.boi || 0), 0);
  const totalVenda = items.reduce((acc, i) => acc + (i.venda || 0), 0);
  const totalSugestao = items.reduce((acc, i) => acc + (i.sugestao || 0), 0);
  const totalWeightKg = items.reduce((acc, i) => acc + (i.estimatedWeightKg || 0), 0) || batch.totalGrossWeightKg;
  const totalCostR$ = items.reduce((acc, i) => acc + (i.estimatedTotalR$ || 0), 0) || batch.totalCostR$;

  // Suino
  const totalBandas = items.reduce((acc, i) => acc + (i.bandaPedido || 0), 0);
  const totalBandaKg = items.reduce((acc, i) => acc + (i.bandaKg || 0), 0);
  const totalBandaPecas = items.reduce((acc, i) => acc + (i.bandaPecas || 0), 0);
  const totalBandaVenda = items.reduce((acc, i) => acc + (i.bandaVenda || 0), 0);
  const totalBandaSugestao = items.reduce((acc, i) => acc + (i.bandaSugestao || 0), 0);
  const totalCostelaSuina = items.reduce((acc, i) => acc + (i.costelaSuina || 0), 0);
  const totalPernil = items.reduce((acc, i) => acc + (i.pernil || 0), 0);

  const handleCopy = () => {
    let text = `*GRUPO GAPP SISTEMAS - DETALHES DO PEDIDO / LOTE*\n`;
    text += `*Número / NF:* ${batch.invoiceNumber} | *Data:* ${batch.date}\n`;
    text += `*Fornecedor:* ${batch.supplier}\n`;
    text += `*Preço da Arroba:* R$ ${batch.arrobaPrice.toFixed(2)}/@ (R$ ${batch.costPerKg.toFixed(2)}/kg)\n`;
    text += `*Total de Bois:* ${batch.headsCount} cabeças | *Peso Total:* ${formatNumberBR(batch.totalGrossWeightKg, 0)} kg\n`;
    text += `*Valor Total:* ${formatCurrencyBRL(batch.totalCostR$)}\n`;
    text += `*Status:* ${batch.status}\n`;
    if (batch.notes) text += `*Observações:* ${batch.notes}\n`;

    if (items && items.length > 0) {
      text += `\n*DISTRIBUIÇÃO POR LOJA:*\n`;
      items.forEach((item, idx) => {
        text += `${idx + 1}. *${item.storeName}*: ${item.pedido} bois (${formatNumberBR(item.estimatedWeightKg, 0)} kg - ${formatCurrencyBRL(item.estimatedTotalR$)})`;
        if ((item.bandaPedido || 0) > 0) {
          text += ` | Suíno: ${item.bandaPedido} bandas`;
        }
        text += `\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-amber-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <ShoppingCart className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Visualização do Pedido de Compra / Lote</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                  {batch.invoiceNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  batch.status === 'RECEBIDO' 
                    ? 'bg-emerald-400 text-emerald-950' 
                    : batch.status === 'PENDENTE'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-blue-400 text-blue-950'
                }`}>
                  {batch.status}
                </span>
              </div>
              <p className="text-xs text-white/80">
                Data de Entrada / Emissão: {batch.date} {batch.deliveryDate ? `• Previsão: ${batch.deliveryDate}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(batch)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              title="Imprimir pedido timbrado ou salvar PDF"
            >
              <Printer className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(batch);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Editar dados deste pedido / lote"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              title="Copiar dados para WhatsApp"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-white" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Supplier & Commercial Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                Frigorífico Fornecedor
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {supplierObj?.name || batch.supplier}
              </div>
              {supplierObj && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 mt-1 font-mono">
                  <div>CNPJ: <strong>{supplierObj.cnpj}</strong> {supplierObj.sifNumber ? `• SIF: ${supplierObj.sifNumber}` : ''}</div>
                  <div>Planta: {supplierObj.city}/{supplierObj.state} {supplierObj.contactName ? `• Contato: ${supplierObj.contactName}` : ''}</div>
                  {supplierObj.phone && <div>Telefone: {supplierObj.phone}</div>}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                Condições Comerciais & Financeiras
              </span>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Preço da Arroba (@):</span>
                  <strong className="text-red-600 dark:text-red-500 font-mono text-xs font-bold">
                    {formatCurrencyBRL(batch.arrobaPrice)}
                  </strong>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                    (= {formatCurrencyBRL(batch.costPerKg)}/kg)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Valor Financeiro Total:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                    {formatCurrencyBRL(batch.totalCostR$)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider block">
                Total de Bois
              </span>
              <span className="text-lg font-bold font-mono text-blue-950 dark:text-blue-100">
                {batch.headsCount} <span className="text-xs font-normal text-slate-500">cabeças</span>
              </span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 tracking-wider block">
                Peso Total Carcaça
              </span>
              <span className="text-lg font-bold font-mono text-purple-950 dark:text-purple-100">
                {formatNumberBR(batch.totalGrossWeightKg, 0)} <span className="text-xs font-normal text-slate-500">kg</span>
              </span>
            </div>

            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 tracking-wider block">
                Bandas Suínas
              </span>
              <span className="text-lg font-bold font-mono text-teal-950 dark:text-teal-100">
                {totalBandas} <span className="text-xs font-normal text-slate-500">peças</span>
              </span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider block">
                Valor Total do Lote
              </span>
              <span className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-300">
                {formatCurrencyBRL(batch.totalCostR$)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {batch.notes && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                Observações do Lote / Pedido:
              </span>
              <p className="text-slate-700 dark:text-slate-300">{batch.notes}</p>
            </div>
          )}

          {/* Detailed Per-Store Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Detalhamento da Distribuição por Filial (16 Lojas)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-slate-100 dark:bg-slate-900">Filial</th>
                    <th colSpan={13} className="px-3 py-1.5 text-center bg-blue-100/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-r border-slate-200 dark:border-slate-800 font-bold">
                      DADOS PARA A GERAÇÃO DE PEDIDO (BOVINO)
                    </th>
                    <th colSpan={6} className="px-3 py-1.5 text-center bg-teal-100/70 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-bold">
                      CÂMARA / BALCÃO E DESOSSA (SUÍNO / BANDA)
                    </th>
                  </tr>
                  <tr>
                    {/* Bovino */}
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800">Diant</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800">Tras</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800">Coxão</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800">Alcat</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-extrabold whitespace-nowrap">
                      Ped. Alcat
                    </th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800">Cost. G</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-extrabold whitespace-nowrap">
                      Ped. Cost
                    </th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold">Boi</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400">Venda</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-400">Sug.</th>
                    <th className="px-2 py-1 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold">
                      Ped. Boi
                    </th>
                    <th className="px-2 py-1 text-right border-r border-slate-200 dark:border-slate-800">Peso (kg)</th>
                    <th className="px-2 py-1 text-right border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-800 dark:text-emerald-300">Valor (R$)</th>

                    {/* Suíno */}
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-teal-700 dark:text-teal-300">Banda Pç</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400">Venda</th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800 font-bold">Sug.</th>
                    <th className="px-2 py-1 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold">
                      Ped. Banda
                    </th>
                    <th className="px-1.5 py-1 text-center border-r border-slate-200 dark:border-slate-800">Costela</th>
                    <th className="px-1.5 py-1 text-center">Pernil</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                  {items.map((item, idx) => (
                    <tr key={item.storeId} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/40'}>
                      <td className="px-3 py-1.5 font-sans font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-inherit whitespace-nowrap">
                        {item.storeName}
                      </td>
                      {/* Bovino */}
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.dianteiro}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.traseiro}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.coxao}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.alcatrao}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 bg-purple-50/60 dark:bg-purple-950/40 font-bold text-purple-900 dark:text-purple-200">
                        {item.pedidoAlcatraoReal || 0}
                      </td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.costela}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 bg-purple-50/60 dark:bg-purple-950/40 font-bold text-purple-900 dark:text-purple-200">
                        {item.pedidoCostelaReal || 0}
                      </td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-blue-700 dark:text-blue-300 bg-blue-50/30">
                        {item.boi}
                      </td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400">{item.venda}</td>
                      <td className={`px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold ${
                        (item.sugestao || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {(item.sugestao || 0) > 0 ? `+${item.sugestao}` : item.sugestao}
                      </td>
                      <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30">
                        {item.pedido}
                      </td>
                      <td className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-800">
                        {formatNumberBR(item.estimatedWeightKg, 0)}
                      </td>
                      <td className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrencyBRL(item.estimatedTotalR$)}
                      </td>

                      {/* Suíno */}
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-teal-700 dark:text-teal-300">{item.bandaPecas || 0}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.bandaVenda || 0}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.bandaSugestao || 0}</td>
                      <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30">
                        {item.bandaPedido || 0}
                      </td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{item.costelaSuina || 0}</td>
                      <td className="px-1.5 py-1.5 text-center">{item.pernil || 0}</td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="px-3 py-2.5 font-sans font-bold border-r border-slate-300 dark:border-slate-700 sticky left-0 z-10 bg-inherit">
                      TOTAL CONSOLIDADO
                    </td>
                    {/* Bovino */}
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalDianteiro}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalTraseiro}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalCoxao}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalAlcatrao}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-purple-900 dark:text-purple-200 bg-purple-100/70 dark:bg-purple-950/60 font-black">
                      {totalPedAlcatrao}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalCostela}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-purple-900 dark:text-purple-200 bg-purple-100/70 dark:bg-purple-950/60 font-black">
                      {totalPedCostela}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-950/50">
                      {Math.round(totalBoiEquivalente)}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-400">{totalVenda}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{Math.round(totalSugestao)}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-950/50">
                      {totalBois}
                    </td>
                    <td className="px-2 py-2 text-right border-r border-slate-300 dark:border-slate-700 text-purple-700 dark:text-purple-300">
                      {formatNumberBR(totalWeightKg, 0)}
                    </td>
                    <td className="px-2 py-2 text-right border-r border-slate-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 font-bold">
                      {formatCurrencyBRL(totalCostR$)}
                    </td>

                    {/* Suíno */}
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-teal-700 dark:text-teal-300">{totalBandaPecas}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-amber-700 dark:text-amber-400">{totalBandaVenda}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{Math.round(totalBandaSugestao)}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-950/50 font-bold">
                      {totalBandas}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalCostelaSuina}</td>
                    <td className="px-1.5 py-2 text-center">{totalPernil}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(batch)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Pedido Oficial</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(batch);
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Pedido</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
