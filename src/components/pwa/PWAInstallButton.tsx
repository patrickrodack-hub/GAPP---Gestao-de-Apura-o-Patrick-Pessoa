import React, { useState } from 'react';
import { Download, Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'portal' | 'minimal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isStandalone, isInstalled } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateInstalled = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
        }
      }
    } catch {}
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // If already installed and running standalone, show active shortcut badge with click to refresh
  if (isStandalone) {
    return (
      <button
        type="button"
        onClick={handleUpdateInstalled}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer ${className}`}
        title="Atalho 'Gestão Apuração do Boi' ativo no sistema. Clique para forçar sincronização de atualizações."
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="hidden md:inline font-bold">Gestão Apuração do Boi</span>
        <RefreshCw className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 ${isUpdating ? 'animate-spin' : ''}`} />
      </button>
    );
  }

  if (variant === 'portal') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
          title="Criar atalho 'Gestão Apuração do Boi' na tela inicial"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Criar Atalho "Gestão Apuração do Boi"</span>
        </button>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstalled ? 'Atualizar Atalho' : 'Criar Atalho Gestão Apuração do Boi'}</span>
        </button>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer ${className}`}
        title="Criar atalho no computador ou celular: Gestão Apuração do Boi"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden sm:inline">Criar Atalho "Gestão Apuração do Boi"</span>
        <span className="sm:hidden">Criar Atalho</span>
      </button>

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
