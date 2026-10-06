import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  FileCheck 
} from 'lucide-react';
import { ManualPdfService } from '../../services/manualPdfService';

interface UserManualsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string) => void;
}

export const UserManualsModal: React.FC<UserManualsModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [isGeneratingERP, setIsGeneratingERP] = useState(false);
  const [isGeneratingPortal, setIsGeneratingPortal] = useState(false);

  if (!isOpen) return null;

  const handleDownloadERPManual = async () => {
    try {
      setIsGeneratingERP(true);
      if (showToast) showToast('Gerando Manual Oficial do Sistema ERP em PDF...');
      await ManualPdfService.generateAndDownloadERPManual();
      if (showToast) showToast('Manual do Sistema ERP (.pdf) baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar manual ERP:', err);
      if (showToast) showToast('Erro ao gerar PDF do manual do ERP.');
    } finally {
      setIsGeneratingERP(false);
    }
  };

  const handleDownloadPortalManual = async () => {
    try {
      setIsGeneratingPortal(true);
      if (showToast) showToast('Gerando Manual Prático do Portal das Filiais em PDF...');
      await ManualPdfService.generateAndDownloadPortalManual();
      if (showToast) showToast('Manual do Portal das Filiais (.pdf) baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar manual do portal:', err);
      if (showToast) showToast('Erro ao gerar PDF do manual do portal.');
    } finally {
      setIsGeneratingPortal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-white transition-colors animate-scale-in font-sans">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20">
              <BookOpen className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-400/30 font-bold">
                DOCUMENTAÇÃO OFICIAL • GRUPO GAPP
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Manuais do Usuário em PDF
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Selecione abaixo o manual desejado para gerar e baixar diretamente o documento diagramado em formato <strong>PDF de alta definição</strong>, pronto para leitura ou impressão:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Manual do Sistema ERP */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/50 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    v10.4 • 4 Páginas
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Manual do Sistema ERP (Gestão & Direção)
                </h3>
                
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Guia completo para a Direção, Controladoria e Gerentes. Abrange a Planilha Matriz das 16 filiais, fórmulas zootécnicas, desossa, apuração DRE, estoque, lotes de compra, graxarias e atalhos.
                </p>

                <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Matriz de 16 Lojas e Fórmulas</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>DRE & Custo Limpo por Corte</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Tabela Oficial de Teclas de Atalho</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleDownloadERPManual}
                disabled={isGeneratingERP}
                className="mt-5 w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isGeneratingERP ? 'animate-bounce' : ''}`} />
                <span>{isGeneratingERP ? 'Gerando PDF...' : 'Baixar Manual do ERP (PDF)'}</span>
              </button>
            </div>

            {/* Card 2: Manual do Usuário do Portal das Filiais */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    Didático • 2 Páginas
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Manual do Usuário do Portal (Lojas / Celular)
                </h3>
                
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Desenvolvido com linguagem simples e ilustrada para encarregados de açougue e operadores de loja. Passo a passo para contar estoque de câmara, responder se recebeu boi e salvar.
                </p>

                <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <li className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Como Instalar o App no Celular</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Contagem de Peças na Câmara</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Dúvidas Frequentes & Modo Offline</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleDownloadPortalManual}
                disabled={isGeneratingPortal}
                className="mt-5 w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isGeneratingPortal ? 'animate-bounce' : ''}`} />
                <span>{isGeneratingPortal ? 'Gerando PDF...' : 'Baixar Manual do Portal (PDF)'}</span>
              </button>
            </div>

          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-300">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              Os manuais incluem informações de validação contábil, metodologia oficial de apuração e instruções para impressão em folhas A4.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
