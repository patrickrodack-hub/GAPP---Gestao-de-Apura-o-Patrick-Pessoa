import React, { useState, useEffect, useRef } from 'react';
import { SheetRowData, Store, PortalLockConfig, ConnectedDevice } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { FirebaseService } from '../../services/firebase';
import { PortalLogin } from './PortalLogin';
import { PortalForm } from './PortalForm';
import { PortalDeviceBlockedScreen } from './PortalDeviceBlockedScreen';
import { collectCurrentDeviceInfo, DeviceInfo } from '../../utils/deviceInfo';
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
  onUpdateRow,
  onSwitchToAdmin
}) => {
  const [loggedStoreId, setLoggedStoreId] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState<string>('');
  
  // Aparelho Conectado & Controle de Acesso
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isDeviceBlocked, setIsDeviceBlocked] = useState<boolean>(false);
  const [blockedDevice, setBlockedDevice] = useState<ConnectedDevice | null>(null);
  const [isCheckingBlock, setIsCheckingBlock] = useState<boolean>(false);
  const heartbeatTimerRef = useRef<any>(null);

  // Inicializa e detecta o aparelho atual
  useEffect(() => {
    let isMounted = true;
    collectCurrentDeviceInfo().then(info => {
      if (!isMounted) return;
      setDeviceInfo(info);
      const check = StorageService.isDeviceBlocked(info.deviceId);
      setIsDeviceBlocked(check.isBlocked);
      if (check.device) {
        setBlockedDevice(check.device);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Escuta alterações em tempo real dos aparelhos na nuvem Firestore
  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToConnectedDevices((allDevices) => {
      if (!deviceInfo) return;
      const myDevice = allDevices.find(d => d.deviceId === deviceInfo.deviceId || d.id === deviceInfo.deviceId);
      if (myDevice) {
        if (myDevice.status === 'BLOQUEADO') {
          setIsDeviceBlocked(true);
          setBlockedDevice(myDevice);
        } else {
          setIsDeviceBlocked(false);
          setBlockedDevice(null);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [deviceInfo]);

  // Função manual para verificar se o gestor desbloqueou o aparelho
  const handleCheckDeviceStatus = async () => {
    setIsCheckingBlock(true);
    try {
      await StorageService.syncConnectedDevices();
      if (deviceInfo) {
        const check = StorageService.isDeviceBlocked(deviceInfo.deviceId);
        setIsDeviceBlocked(check.isBlocked);
        setBlockedDevice(check.device || null);
      }
    } finally {
      setTimeout(() => setIsCheckingBlock(false), 600);
    }
  };

  // Heartbeat do aparelho enquanto estiver navegando ou conectado
  useEffect(() => {
    if (!deviceInfo || isDeviceBlocked) return;

    // Atualiza heartbeat a cada 25 segundos
    heartbeatTimerRef.current = setInterval(() => {
      StorageService.updateDeviceHeartbeat(deviceInfo.deviceId, 25);
    }, 25000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [deviceInfo, isDeviceBlocked, loggedStoreId]);

  // PWA Install Detection & First-time flow
  const { shouldShowFirstTimeInstall, isStandalone } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
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
    requestPortalFullscreen();

    const handleFirstGesture = () => {
      requestPortalFullscreen();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

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
    // Garante que o aparelho não está bloqueado
    if (deviceInfo) {
      const check = StorageService.isDeviceBlocked(deviceInfo.deviceId);
      if (check.isBlocked) {
        setIsDeviceBlocked(true);
        setBlockedDevice(check.device || null);
        return;
      }

      // Registra conexão do aparelho no módulo de segurança
      const store = stores.find(s => s.id === storeId);
      StorageService.registerDeviceConnection({
        deviceId: deviceInfo.deviceId,
        storeId,
        storeName: store?.name || 'Filial',
        operatorName: name,
        ip: deviceInfo.ip,
        macAddress: deviceInfo.macAddress,
        deviceModel: deviceInfo.deviceModel,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        connectionType: deviceInfo.connectionType,
        locationHint: store?.city ? `${store.city}, RJ` : 'Rio de Janeiro, RJ'
      });
    }

    requestPortalFullscreen();
    setLoggedStoreId(storeId);
    setOperatorName(name);
  };

  const handleLogout = () => {
    if (deviceInfo) {
      StorageService.markDeviceOffline(deviceInfo.deviceId);
    }
    setLoggedStoreId(null);
    setOperatorName('');
  };

  // Se o aparelho estiver bloqueado, exibe tela de bloqueio impenetrável
  if (isDeviceBlocked) {
    return (
      <PortalDeviceBlockedScreen
        deviceInfo={deviceInfo}
        blockedDevice={blockedDevice}
        onCheckStatus={handleCheckDeviceStatus}
        isChecking={isCheckingBlock}
        onSwitchToAdmin={onSwitchToAdmin}
      />
    );
  }

  const currentStore = stores.find(s => s.id === loggedStoreId);
  const currentRow = rows.find(r => r.storeId === loggedStoreId);

  return (
    <div className={`portal-scroll-container h-screen h-[100dvh] w-full overflow-y-auto overflow-x-hidden transition-colors duration-200 ${portalTheme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-900'}`}>
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
          deviceInfo={deviceInfo}
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
