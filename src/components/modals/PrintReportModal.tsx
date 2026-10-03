import React from 'react';
import { SheetRowData, Store } from '../../types/erp';
import { formatCurrencyBRL, calculateSheetTotals } from '../../services/calculationService';
import { PrintEngineService } from '../../services/printEngineService';
import { StorageService } from '../../services/storageService';
import { Printer, X, Beef, FileCheck } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  stores: Store[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  rows,
  stores,
}) => {
  if (!isOpen) return null;

  const totals = calculateSheetTotals(rows);

  const handlePrint = () => {
    const params = StorageService.getYieldParams();
    const printHtml = PrintEngineService.generateSheetReportHtml({
      rows,
      stores,
      yieldBasis: params.basis || 'carcass',
      title: 'Relatório Gerencial de Apuração do Boi',
    });

    PrintEngineService.printDocument(printHtml, {
      documentTitle: 'Relatorio_Apuracao_Boi_GIPP',
      landscape: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-8 shadow-2xl space-y-6 my-8">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <Beef className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-slate-800">
              Relatório Gerencial de Apuração do Boi – Visualização para Impressão
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 printable-content">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                ERP APURAÇÃO DO BOI
              </h1>
              <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                Grupo GAPP Sistemas • Por Patrick Pessoa
              </p>
              <p className="text-xs text-slate-600 font-semibold">
                DIREÇÃO DA EMPRESA • PLANILHA MATRIZ v10.1
              </p>
              <p className="text-xs text-slate-500">
                Data do Lote: quinta-feira, 1 de outubro de 2026
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-500 block">Total do Lote</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                R$ 376.311,95
              </span>
              <span className="text-xs text-slate-600 block">16 Filiais Abastecidas</span>
            </div>
          </div>

          {/* Highlights summary */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Volume Total (Kg)</span>
              <strong className="text-base font-mono text-slate-900">14.473,5 kg</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Peças Pedido</span>
              <strong className="text-base font-mono text-slate-900">
                {totals.pedidoDianteiro + totals.pedidoTraseiro + totals.pedidoCoxao + totals.pedidoAlcatrao + totals.pedidoCostelaGaucha} pç
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Preço Médio Quarto</span>
              <strong className="text-base font-mono text-slate-900">R$ 26,00 /kg</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Margem s/ Venda</span>
              <strong className="text-base font-mono text-emerald-700">32.7%</strong>
            </div>
          </div>

          {/* Store Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
              Demonstrativo Consolidado por Filial (16 Lojas)
            </h4>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[9px] font-bold">
                <tr>
                  <th className="border border-slate-300 p-1.5">Filial</th>
                  <th className="border border-slate-300 p-1.5 text-center">Ped. Diant.</th>
                  <th className="border border-slate-300 p-1.5 text-center">Ped. Tras.</th>
                  <th className="border border-slate-300 p-1.5 text-center">Ped. Coxão</th>
                  <th className="border border-slate-300 p-1.5 text-center">Ped. Alcatrão</th>
                  <th className="border border-slate-300 p-1.5 text-center">Boi à Venda</th>
                  <th className="border border-slate-300 p-1.5 text-center">Sugestão</th>
                  <th className="border border-slate-300 p-1.5 text-center">Câm. Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
                {rows.map((r) => {
                  const camaraTotal = r.camaraDianteiro + r.somaDoTraseiro + r.camaraCostelaGaucha;
                  return (
                    <tr key={r.storeId}>
                      <td className="border border-slate-300 p-1.5 font-sans font-semibold text-slate-800">
                        {r.storeName}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">{r.pedidoDianteiro}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{r.pedidoTraseiro}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{r.pedidoCoxao}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{r.pedidoAlcatrao}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{r.boiAVenda}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-800">{r.sugestaoPedido}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{camaraTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold font-mono text-[10px]">
                <tr>
                  <td className="border border-slate-300 p-1.5 font-sans">TOTAL GERAL</td>
                  <td className="border border-slate-300 p-1.5 text-center">{totals.pedidoDianteiro}</td>
                  <td className="border border-slate-300 p-1.5 text-center">{totals.pedidoTraseiro}</td>
                  <td className="border border-slate-300 p-1.5 text-center">{totals.pedidoCoxao}</td>
                  <td className="border border-slate-300 p-1.5 text-center">{totals.pedidoAlcatrao}</td>
                  <td className="border border-slate-300 p-1.5 text-center">{totals.boiAVenda}</td>
                  <td className="border border-slate-300 p-1.5 text-center">{totals.sugestaoPedido}</td>
                  <td className="border border-slate-300 p-1.5 text-center">
                    {rows.reduce((acc, r) => acc + r.camaraDianteiro + r.somaDoTraseiro + r.camaraCostelaGaucha, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <span>Diretoria Operacional</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <span>Gerência de Carnes & Desossa</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
