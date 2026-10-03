import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
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

  // If already installed and running standalone, do not show button
  if (isStandalone) {
    return null;
  }

  if (variant === 'portal') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
          title="Instalar aplicativo na tela inicial do celular"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no Celular</span>
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
          <span>{isInstalled ? 'Reinstalar App' : 'Instalar App'}</span>
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
        title="Instalar no celular / desktop"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
