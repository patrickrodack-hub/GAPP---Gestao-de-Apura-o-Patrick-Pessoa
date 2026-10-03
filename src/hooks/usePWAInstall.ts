import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const STORAGE_KEY_PWA_INSTALLED = 'gapp_pwa_installed_v1';
export const STORAGE_KEY_DISMISSED = 'gapp_pwa_install_dismissed_v1';

export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
  );
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsStandalone());
  const [isInstalledStored, setIsInstalledStored] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PWA_INSTALLED) === 'true';
    } catch {
      return false;
    }
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
    } catch {
      return false;
    }
  });

  const [platformInfo, setPlatformInfo] = useState<{
    isIOS: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    browserName: string;
  }>(() => {
    if (typeof window === 'undefined') {
      return { isIOS: false, isAndroid: false, isMobile: false, browserName: 'Unknown' };
    }
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIOS || isAndroid || /mobile|tablet|silk|kindle/.test(ua);
    
    let browserName = 'Navegador';
    if (/chrome|crios/.test(ua) && !/edg|opr|brave/.test(ua)) browserName = 'Google Chrome';
    else if (/safari/.test(ua) && !/chrome|crios/.test(ua)) browserName = 'Safari';
    else if (/firefox|fxios/.test(ua)) browserName = 'Mozilla Firefox';
    else if (/edg/.test(ua)) browserName = 'Microsoft Edge';
    else if (/samsungbrowser/.test(ua)) browserName = 'Samsung Internet';

    return { isIOS, isAndroid, isMobile, browserName };
  });

  useEffect(() => {
    const updateStandalone = () => {
      const standalone = checkIsStandalone();
      setIsStandalone(standalone);
      if (standalone) {
        try {
          localStorage.setItem(STORAGE_KEY_PWA_INSTALLED, 'true');
        } catch {}
        setIsInstalledStored(true);
      }
    };

    updateStandalone();

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      // Store event for in-app trigger
      setDeferredPrompt(e);
      (window as any).__pwaDeferredPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstalledStored(true);
      setDeferredPrompt(null);
      (window as any).__pwaDeferredPrompt = null;
      try {
        localStorage.setItem(STORAGE_KEY_PWA_INSTALLED, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener?.('change', updateStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mql.removeEventListener?.('change', updateStandalone);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    const prompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__pwaDeferredPrompt : null);
    if (!prompt) {
      return 'manual';
    }

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
        setIsInstalledStored(true);
        setDeferredPrompt(null);
        (window as any).__pwaDeferredPrompt = null;
        try {
          localStorage.setItem(STORAGE_KEY_PWA_INSTALLED, 'true');
        } catch {}
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('Erro ao executar prompt de instalação PWA:', err);
      return 'manual';
    }
  }, [deferredPrompt]);

  const markAsInstalled = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PWA_INSTALLED, 'true');
    } catch {}
    setIsInstalledStored(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
    } catch {}
    setIsDismissed(true);
  }, []);

  const resetInstallState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_PWA_INSTALLED);
      sessionStorage.removeItem(STORAGE_KEY_DISMISSED);
    } catch {}
    setIsInstalledStored(false);
    setIsDismissed(false);
  }, []);

  // Is effectively already installed if running standalone OR flagged in localStorage
  const isInstalled = isStandalone || isInstalledStored;

  // Should show initial installation modal on first visit:
  // Not installed yet AND not running standalone AND not dismissed in current session
  const shouldShowFirstTimeInstall = !isInstalled && !isStandalone && !isDismissed;

  return {
    isStandalone,
    isInstalled,
    isInstallable: !!deferredPrompt,
    shouldShowFirstTimeInstall,
    isIOS: platformInfo.isIOS,
    isAndroid: platformInfo.isAndroid,
    isMobile: platformInfo.isMobile,
    browserName: platformInfo.browserName,
    promptInstall,
    markAsInstalled,
    dismissPrompt,
    resetInstallState,
  };
}
