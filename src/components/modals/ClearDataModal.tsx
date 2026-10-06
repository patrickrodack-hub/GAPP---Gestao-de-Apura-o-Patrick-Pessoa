import React, { useState } from 'react';
import { SheetRowData } from '../../types/erp';
import { recalculateRowOrderFormulas, CutYieldWeights } from '../../services/calculationService';
import { INITIAL_SHEET_ROWS } from '../../data/initialData';
import { 
  Eraser, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  CheckSquare, 
  Square,
  Sparkles
} from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  onUpdateMultiple: (updatedRows: SheetRowData[]) => void;
  currentCutWeights: CutYieldWeights;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  rows,
  onUpdateMultiple,
  currentCutWeights,
}) => {
  const [selectedMode, setSelectedMode] = useState<'all' | 'custom' | 'restore'>('all');
  
  // Custom section selectors
  const [clearSections, setClearSections] = useState({
    orders: true,        // Pedidos e Vendas
    chamber: true,       // Peça Inteira Câmara
    nobles: true,        // Nobres (Alcatra, Contra Filé, Picanha, Mignon)
    dianteiro: true,    // Balcão Dianteiro (Paleta, Acém, Peito, Músculo)
    coxao: true,        // Balcão Traseiro (Chã, Patinho, Lagartos)
    suino: true,        // Suíno / Banda
  });

  if (!isOpen) return null;

  const toggleSection = (key: keyof typeof clearSections) => {
    setClearSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllSections = (val: boolean) => {
    setClearSections({
      orders: val,
      chamber: val,
      nobles: val,
      dianteiro: val,
      coxao: val,
      suino: val,
    });
  };

  const handleExecuteClear = () => {
    if (selectedMode === 'restore') {
      // Restore initial demo data
      const restored = INITIAL_SHEET_ROWS.map(r => recalculateRowOrderFormulas(r, currentCutWeights));
      onUpdateMultiple(restored);
      onClose();
      return;
    }

    if (selectedMode === 'all') {
      // Clear all editable fields for all rows
      const cleared = rows.map(row => {
        const emptyRow: SheetRowData = {
          storeId: row.storeId,
          storeName: row.storeName,
          
          // DADOS PEDIDO
          pedidoDianteiro: 0,
          pedidoTraseiro: 0,
          pedidoCoxao: 0,
          pedidoAlcatrao: 0,
          pedidoCostelaGaucha: 0,
          venda: 0,
          boiAVenda: 0,
          boi: 0,
          sugestaoPedido: 0,
          pedidoFinal: 0,
          pTransito: 0,

          // PEÇA INTEIRA CÂMARA
          camaraDianteiro: 0,
          camaraTraseiro: 0,
          camaraCoxao: 0,
          camaraAlcatrao: 0,
          somaDoTraseiro: 0,
          camaraCostelaGaucha: 0,

          // NOBRES
          alcatra: 0,
          alcatraPecas: 0,
          alcatraKg: 0,
          contraFile: 0,
          contraFilePecas: 0,
          contraFileKg: 0,
          costelaCong: 0,
          totalAlcatrao: 0,
          picanha: 0,
          picanhaPecas: 0,
          picanhaKg: 0,
          fileMignon: 0,
          fileMignonPecas: 0,
          fileMignonKg: 0,

          // DIANTEIRO
          totalDianteiro: 0,
          paletaKg: 0,
          paletaPecas: 0,
          acemKg: 0,
          acemPecas: 0,
          peitoKg: 0,
          peitoPecas: 0,
          musculoKg: 0,
          musculoPecas: 0,

          // COXÃO / TRASEIRO
          totalCoxao: 0,
          chaKg: 0,
          chaPecas: 0,
          patinhoKg: 0,
          patinhoPecas: 0,
          lagartoRedondoKg: 0,
          lagartoRedondoPecas: 0,
          lagartoPlanoKg: 0,
          lagartoPlanoPecas: 0,

          // SUÍNO
          bandaKg: 0,
          bandaPecas: 0,
          bandaVenda: 0,
          vendaSuino: 0,
          bandaSugestao: 0,
          bandaPedido: 0,
          pedidoSuino: 0,
          costelaSuinaPecas: 0,
          pernilPecas: 0,
        };
        return recalculateRowOrderFormulas(emptyRow, currentCutWeights);
      });
      onUpdateMultiple(cleared);
      onClose();
      return;
    }

    if (selectedMode === 'custom') {
      // Clear selected sections only
      const updated = rows.map(row => {
        const r = { ...row };

        if (clearSections.orders) {
          r.pedidoDianteiro = 0;
          r.pedidoTraseiro = 0;
          r.pedidoCoxao = 0;
          r.pedidoAlcatrao = 0;
          r.pedidoCostelaGaucha = 0;
          r.venda = 0;
          r.boiAVenda = 0;
          r.pedidoFinal = 0;
          r.pTransito = 0;
        }

        if (clearSections.chamber) {
          r.camaraDianteiro = 0;
          r.camaraTraseiro = 0;
          r.camaraCoxao = 0;
          r.camaraAlcatrao = 0;
          r.somaDoTraseiro = 0;
          r.camaraCostelaGaucha = 0;
        }

        if (clearSections.nobles) {
          r.alcatra = 0;
          r.alcatraPecas = 0;
          r.alcatraKg = 0;
          r.contraFile = 0;
          r.contraFilePecas = 0;
          r.contraFileKg = 0;
          r.costelaCong = 0;
          r.picanha = 0;
          r.picanhaPecas = 0;
          r.picanhaKg = 0;
          r.fileMignon = 0;
          r.fileMignonPecas = 0;
          r.fileMignonKg = 0;
        }

        if (clearSections.dianteiro) {
          r.paletaKg = 0;
          r.paletaPecas = 0;
          r.acemKg = 0;
          r.acemPecas = 0;
          r.peitoKg = 0;
          r.peitoPecas = 0;
          r.musculoKg = 0;
          r.musculoPecas = 0;
        }

        if (clearSections.coxao) {
          r.chaKg = 0;
          r.chaPecas = 0;
          r.patinhoKg = 0;
          r.patinhoPecas = 0;
          r.lagartoRedondoKg = 0;
          r.lagartoRedondoPecas = 0;
          r.lagartoPlanoKg = 0;
          r.lagartoPlanoPecas = 0;
        }

        if (clearSections.suino) {
          r.bandaPecas = 0;
          r.bandaKg = 0;
          r.bandaVenda = 0;
          r.vendaSuino = 0;
          r.bandaPedido = 0;
          r.pedidoSuino = 0;
          r.costelaSuinaPecas = 0;
          r.pernilPecas = 0;
        }

        return recalculateRowOrderFormulas(r, currentCutWeights);
      });

      onUpdateMultiple(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <Eraser className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Limpar Dados da Planilha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zere os lançamentos ou personalize as seções para iniciar um novo ciclo
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSelectedMode('all')}
              className={`py-2 px-3 rounded-lg font-semibold text-xs transition flex flex-col items-center gap-1 ${
                selectedMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Zerar Tudo</span>
            </button>

            <button
              onClick={() => setSelectedMode('custom')}
              className={`py-2 px-3 rounded-lg font-semibold text-xs transition flex flex-col items-center gap-1 ${
                selectedMode === 'custom'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Personalizado</span>
            </button>

            <button
              onClick={() => setSelectedMode('restore')}
              className={`py-2 px-3 rounded-lg font-semibold text-xs transition flex flex-col items-center gap-1 ${
                selectedMode === 'restore'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          {/* Mode 1: Zerar Tudo */}
          {selectedMode === 'all' && (
            <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-rose-900 dark:text-rose-200">
                    Atenção: Zerar todos os lançamentos
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    Esta ação irá <strong>zerar todos os valores numéricos</strong> das 16 lojas em todas as colunas (Pedidos, Vendas, Câmara, Nobres, Desossa Dianteiro, Coxão e Suíno).
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    • A lista das lojas e a estrutura da planilha serão <strong>preservadas</strong>.
                    <br />
                    • Todas as fórmulas e totais do rodapé serão recalculados automaticamente para 0.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Personalizado */}
          {selectedMode === 'custom' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selecione os blocos que deseja zerar:
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => selectAllSections(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Marcar Todos
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    onClick={() => selectAllSections(false)}
                    className="text-slate-500 hover:underline"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Pedidos e Vendas */}
                <div
                  onClick={() => toggleSection('orders')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    clearSections.orders
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      1. Pedido e Venda
                    </div>
                    <div className="text-[11px] text-slate-500">
                      D, T, C, A, Venda, Pedido Real
                    </div>
                  </div>
                  {clearSections.orders ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* 2. Câmara */}
                <div
                  onClick={() => toggleSection('chamber')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    clearSections.chamber
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      2. Peça Inteira Câmara
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Câm. Diant, Tras, Coxão, Alcatrão
                    </div>
                  </div>
                  {clearSections.chamber ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* 3. Nobres */}
                <div
                  onClick={() => toggleSection('nobles')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    clearSections.nobles
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      3. Balcão / Nobres
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Alcatra, Contra Filé, Picanha, Mignon
                    </div>
                  </div>
                  {clearSections.nobles ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* 4. Dianteiro */}
                <div
                  onClick={() => toggleSection('dianteiro')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    clearSections.dianteiro
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      4. Balcão Dianteiro
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Paleta, Acém, Peito, Músculo
                    </div>
                  </div>
                  {clearSections.dianteiro ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* 5. Coxão */}
                <div
                  onClick={() => toggleSection('coxao')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    clearSections.coxao
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      5. Balcão Coxão / Traseiro
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Chã, Patinho, Lagarto Red./Plano
                    </div>
                  </div>
                  {clearSections.coxao ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* 6. Suíno */}
                <div
                  onClick={() => toggleSection('suino')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    clearSections.suino
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      6. Suíno / Banda
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Banda Pç, Venda, Pedido, Cost., Pernil
                    </div>
                  </div>
                  {clearSections.suino ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Restaurar Padrão */}
          {selectedMode === 'restore' && (
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                    Restaurar Dados Padrão da Planilha v10.4
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    Restaura todos os lançamentos originais de referência da planilha oficial (pedidos, estoque de câmara, desossa e suíno de todas as 16 lojas).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold text-xs transition"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleExecuteClear}
            className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95 ${
              selectedMode === 'all'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : selectedMode === 'custom'
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
            }`}
          >
            {selectedMode === 'all' ? (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirmar e Zerar Planilha</span>
              </>
            ) : selectedMode === 'custom' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Limpar Seções Selecionadas</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Dados Padrão</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
