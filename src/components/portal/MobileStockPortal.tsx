import React, { useState, useEffect } from 'react';
import { SheetRowData, Store, PortalLockConfig } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { FirebaseService } from '../../services/firebase';
import { PortalLogin } from './PortalLogin';
import { PortalForm } from './PortalForm';
import { requestPortalFullscreen, exitPortalFullscreen, isPortalFullscreen } from '../../utils/fullscreen';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../pwa/PWAInstallModal';

export type PortalTheme = 'light' | 'dark';

interface MobileStockPortalProps {
  stores: Store[];
  rows: SheetRowData[];
  onUpdateRow: (row: SheetRowData) => void;
  onSwitchToAdmin?: () => void;
}

export const MobileStockPortal: React.FC<MobileStockPortalProps> = ({
  stores,
  rows,
  onUpdateRow
}) => {
  const [loggedStoreId, setLoggedStoreId] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState<string>('');
  
  // PWA Install Detection & First-time flow
  const { shouldShowFirstTimeInstall, isStandalone } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    // Ao iniciar pela primeira vez (não instalado e não em modo standalone),
    // inicia o processo guiado de instalação com animação no celular
    if (shouldShowFirstTimeInstall) {
      const timer = setTimeout(() => {
        setIsInstallModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowFirstTimeInstall]);
  
  // Controle de Horários & Bloqueio do Portal
  const [portalLockConfig, setPortalLockConfig] = useState<PortalLockConfig>(() => 
    StorageService.getPortalLockConfig()
  );

  useEffect(() => {
    // Sincroniza configuração de bloqueio em tempo real com o Firestore
    const unsubscribe = FirebaseService.subscribeToPortalLockConfig((cfg) => {
      if (cfg) {
        setPortalLockConfig(cfg);
        localStorage.setItem('apuracao_boi_portal_lock_v1', JSON.stringify(cfg));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Padrão "claro" conforme solicitado pelo usuário
  const [portalTheme, setPortalTheme] = useState<PortalTheme>(() => {
    try {
      const saved = localStorage.getItem('gapp_portal_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light'; // Default to "claro"
  });

  useEffect(() => {
    try {
      localStorage.setItem('gapp_portal_theme', portalTheme);
    } catch {}
  }, [portalTheme]);

  const togglePortalTheme = () => {
    setPortalTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Iniciar e manter em Fullscreen ao abrir o portal
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isPortalFullscreen());

  useEffect(() => {
    // 1. Inicia em Fullscreen assim que o portal for aberto
    requestPortalFullscreen();

    // 2. Se o navegador exigir gesto do usuário, o primeiro toque/clique acionará o fullscreen automaticamente
    const handleFirstGesture = () => {
      requestPortalFullscreen();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

    // 3. Listener para atualizar o estado de tela cheia caso o usuário saia/entre
    const handleFullscreenChange = () => {
      setIsFullscreen(isPortalFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (isPortalFullscreen()) {
      exitPortalFullscreen();
    } else {
      requestPortalFullscreen();
    }
  };

  const handleLogin = (storeId: string, name: string) => {
    // Garante fullscreen no envio do login
    requestPortalFullscreen();
    setLoggedStoreId(storeId);
    setOperatorName(name);
  };

  const handleLogout = () => {
    setLoggedStoreId(null);
    setOperatorName('');
  };

  const currentStore = stores.find(s => s.id === loggedStoreId);
  const currentRow = rows.find(r => r.storeId === loggedStoreId);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${portalTheme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-900'}`}>
      {!loggedStoreId || !currentStore || !currentRow ? (
        <PortalLogin
          stores={stores}
          onLogin={handleLogin}
          theme={portalTheme}
          onToggleTheme={togglePortalTheme}
          portalLockConfig={portalLockConfig}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isStandalone={isStandalone}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
      ) : (
        <PortalForm
          store={currentStore}
          operatorName={operatorName}
          stores={stores}
          initialRow={currentRow}
          onSave={onUpdateRow}
          onLogout={handleLogout}
          theme={portalTheme}
          onToggleTheme={togglePortalTheme}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Modal Guiado de Instalação no Celular (Android & iOS) */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onComplete={() => {
          requestPortalFullscreen();
        }}
      />
    </div>
  );
};
