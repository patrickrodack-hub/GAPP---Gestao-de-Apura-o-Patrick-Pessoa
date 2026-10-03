import React from 'react';
import { X, CheckCircle2, ShieldCheck, Keyboard, Info, Database, Layers, Check } from 'lucide-react';

interface ERPMenuDialogsProps {
  dialogType: 'about' | 'shortcuts' | 'diagnostics' | null;
  onClose: () => void;
  storeCount: number;
}

export const ERPMenuDialogs: React.FC<ERPMenuDialogsProps> = ({
  dialogType,
  onClose,
  storeCount,
}) => {
  if (!dialogType) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      
      {/* 1. SOBRE O SISTEMA */}
      {dialogType === 'about' && (
        <div className="w-full max-w-md bg-[#eceff1] border-2 border-[#005a9e] rounded shadow-2xl overflow-hidden font-sans">
          {/* Title Bar */}
          <div className="h-7 px-2.5 bg-gradient-to-r from-[#005a9e] via-[#0078d7] to-[#1084d8] text-white flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-xs bg-white text-[#005a9e] font-black flex items-center justify-center text-[10px]">
                G
              </div>
              <span>Sobre: Grupo GAPP Sistemas - ERP Apuração do Boi</span>
            </div>
            <button 
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center hover:bg-red-600 rounded-xs text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dialog Content */}
          <div className="p-4 space-y-4 text-xs text-slate-800">
            <div className="flex items-center gap-4 border-b border-slate-300 pb-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 border-2 border-slate-400 flex flex-col items-center justify-center shadow-inner shrink-0">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-800 to-slate-900 bg-clip-text text-transparent">
                  G
                </span>
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest -mt-1">
                  GAPP
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Grupo GAPP Sistemas
                </h3>
                <p className="text-[11px] font-bold text-blue-700">
                  ERP Apuração do Boi por Patrick Pessoa
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Versão 10.1 (Build Oficial 1.1.8719)
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-3 space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Desenvolvimento & Direção:</span>
                <span className="font-bold text-slate-900">Patrick Pessoa</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Corporação:</span>
                <span className="font-bold text-slate-900">GRUPO GAPP</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Rede Ativa:</span>
                <span className="font-bold text-emerald-700">{storeCount} Filiais Integradas</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Arquitetura de Banco:</span>
                <span className="font-mono text-slate-700">PostgreSQL / Storage v10.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ambiente de Execução:</span>
                <span className="font-mono text-slate-700">Solidcon Clássico ERP Engine</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                onClick={onClose}
                className="px-5 py-1 bg-gradient-to-b from-white to-slate-200 hover:from-white hover:to-slate-300 border border-slate-400 rounded text-xs font-semibold text-slate-800 shadow-xs active:bg-slate-300"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ATALHOS DE TECLADO */}
      {dialogType === 'shortcuts' && (
        <div className="w-full max-w-lg bg-[#eceff1] border-2 border-[#005a9e] rounded shadow-2xl overflow-hidden font-sans">
          {/* Title Bar */}
          <div className="h-7 px-2.5 bg-gradient-to-r from-[#005a9e] via-[#0078d7] to-[#1084d8] text-white flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-amber-300" />
              <span>Tabela de Atalhos de Teclado - Grupo GAPP Sistemas</span>
            </div>
            <button 
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center hover:bg-red-600 rounded-xs text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dialog Content */}
          <div className="p-4 space-y-3 text-xs text-slate-800">
            <p className="text-[11px] text-slate-600">
              Utilize os atalhos de teclado para navegação rápida entre os módulos do sistema:
            </p>

            <div className="bg-white border border-slate-300 rounded overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="py-1.5 px-3">Atalho</th>
                    <th className="py-1.5 px-3">Módulo / Função</th>
                    <th className="py-1.5 px-3">Área de Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">F2</td>
                    <td className="py-1.5 px-3">Planilha Matriz da Direção v10.1</td>
                    <td className="py-1.5 px-3 text-slate-500">Diretoria</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">F3</td>
                    <td className="py-1.5 px-3">Painel Executivo Geral (Dashboard)</td>
                    <td className="py-1.5 px-3 text-slate-500">Gestão</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">F4</td>
                    <td className="py-1.5 px-3">Calculadora Rápida de Desossa e @</td>
                    <td className="py-1.5 px-3 text-slate-500">Utilidades</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">F5</td>
                    <td className="py-1.5 px-3">Restaurar Matriz Oficial v10.1</td>
                    <td className="py-1.5 px-3 text-slate-500">Sistema</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">Ctrl + N</td>
                    <td className="py-1.5 px-3">Novo Lote de Compra de Gado</td>
                    <td className="py-1.5 px-3 text-slate-500">Suprimentos</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">Ctrl + P</td>
                    <td className="py-1.5 px-3">Imprimir Relatório Executivo (PDF)</td>
                    <td className="py-1.5 px-3 text-slate-500">Relatórios</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-700">Ctrl + E</td>
                    <td className="py-1.5 px-3">Exportar Planilha Completa (CSV)</td>
                    <td className="py-1.5 px-3 text-slate-500">Exportação</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                onClick={onClose}
                className="px-5 py-1 bg-gradient-to-b from-white to-slate-200 hover:from-white hover:to-slate-300 border border-slate-400 rounded text-xs font-semibold text-slate-800 shadow-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DIAGNÓSTICO DE INTEGRIDADE */}
      {dialogType === 'diagnostics' && (
        <div className="w-full max-w-md bg-[#eceff1] border-2 border-[#005a9e] rounded shadow-2xl overflow-hidden font-sans">
          {/* Title Bar */}
          <div className="h-7 px-2.5 bg-gradient-to-r from-[#005a9e] via-[#0078d7] to-[#1084d8] text-white flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Auditoria e Integridade do Sistema - Grupo GAPP</span>
            </div>
            <button 
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center hover:bg-red-600 rounded-xs text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dialog Content */}
          <div className="p-4 space-y-3 text-xs text-slate-800">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-xs">Todos os subsistemas operacionais e íntegros!</p>
                <p className="text-[11px] text-emerald-700">Fórmulas de apuração do boi validadas com sucesso.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Integridade dos Cálculos (@ e Kg):</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> OK (100% Preciso)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Sincronização 16 Filiais:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Conectadas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Armazenamento Local:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Sincronizado
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Versão da Matriz da Direção:</span>
                <span className="font-mono font-bold text-blue-700">v10.1 Oficial</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                onClick={onClose}
                className="px-5 py-1 bg-gradient-to-b from-white to-slate-200 hover:from-white hover:to-slate-300 border border-slate-400 rounded text-xs font-semibold text-slate-800 shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
