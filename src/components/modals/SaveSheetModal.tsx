import React, { useState } from 'react';
import { SheetRowData } from '../../types/erp';
import { calculateSheetTotals } from '../../services/calculationService';
import { 
  Save, 
  X, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Beef, 
  Scale, 
  FileSpreadsheet, 
  CheckCircle2,
  FileText
} from 'lucide-react';

interface SaveSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  onConfirmSave: (name: string, author: string, notes?: string) => void;
}

export const SaveSheetModal: React.FC<SaveSheetModalProps> = ({
  isOpen,
  onClose,
  rows,
  onConfirmSave
}) => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [versionName, setVersionName] = useState(`Planilha de Compras - ${formattedDate}`);
  const [authorName, setAuthorName] = useState('Patrick Pessoa (Direção)');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totals = calculateSheetTotals(rows);
  const totalPieces = rows.reduce((acc, r) => 
    acc + (r.pedidoDianteiro || 0) + (r.pedidoTraseiro || 0) + (r.pedidoCoxao || 0) + (r.pedidoAlcatrao || 0) + (r.pedidoCostelaGaucha || 0), 0
  );
  const totalBois = Math.round(totals.boi || 0);
  const totalWeightKg = 14473.5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSave(
      versionName.trim() || `Planilha de Compras - ${formattedDate}`,
      authorName.trim() || 'Direção de Carnes',
      notes.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Salvar Versão da Planilha de Compras
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grava um registro permanente no histórico com data e hora para localização
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Quick Metrics Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80">
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Resumo dos Dados que Serão Gravados ({rows.length} Filiais)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Total de Peças</span>
                <strong className="text-xs font-mono font-bold text-slate-900 dark:text-white">{totalPieces} pç</strong>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Bois Equivalentes</span>
                <strong className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">{totalBois} bois</strong>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Peso Estimado</span>
                <strong className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{totalWeightKg.toFixed(1)} kg</strong>
              </div>
            </div>
          </div>

          {/* Data e Hora Automática (Destaque para Localização) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Data & Hora do Registro:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {formattedDate}
            </span>
          </div>

          {/* Nome da Versão */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Título / Identificação da Versão *
            </label>
            <input
              type="text"
              required
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Ex: Planilha Oficial Semana 40 - Fechamento Frigorífico"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Responsável / Autor */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Responsável pela Gravação</span>
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Nome do operador ou gestor"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observações / Notas da Semana (Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Contagem de câmara conferida após desossa das filiais..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gravar e Salvar Versão</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
