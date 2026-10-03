import { useEffect } from 'react';
import { NavigationTab } from '../components/Navigation';

interface UseGlobalShortcutsOptions {
  onNavigateTab: (tab: NavigationTab) => void;
  onExportXLSX: () => void;
  onOpenQuickCalc: () => void;
  onPrint: () => void;
  onToggleTheme: () => void;
  onToggleDesktop?: () => void;
  onOpenShortcutsHelp: () => void;
  onOpenPurchaseOrder?: () => void;
  onOpenSupplierManager?: () => void;
  onCloseModals: () => void;
}

export function useGlobalShortcuts({
  onNavigateTab,
  onExportXLSX,
  onOpenQuickCalc,
  onPrint,
  onToggleTheme,
  onToggleDesktop,
  onOpenShortcutsHelp,
  onOpenPurchaseOrder,
  onOpenSupplierManager,
  onCloseModals,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // F1 opens shortcuts help
      if (e.key === 'F1') {
        e.preventDefault();
        onOpenShortcutsHelp();
        return;
      }

      // Escape closes modals
      if (e.key === 'Escape' && !isInput) {
        onCloseModals();
        return;
      }

      // '?' opens shortcuts help when not inside an input
      if (e.key === '?' && !isInput && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenShortcutsHelp();
        return;
      }

      // Check Alt+Number or Ctrl+Alt+Number navigation (Alt+1 to Alt+8)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.code) {
          case 'Digit1':
          case 'Numpad1':
            e.preventDefault();
            onNavigateTab('dashboard');
            return;
          case 'Digit2':
          case 'Numpad2':
            e.preventDefault();
            onNavigateTab('sheet');
            return;
          case 'Digit3':
          case 'Numpad3':
            e.preventDefault();
            onNavigateTab('yield');
            return;
          case 'Digit4':
          case 'Numpad4':
            e.preventDefault();
            onNavigateTab('results');
            return;
          case 'Digit5':
          case 'Numpad5':
            e.preventDefault();
            onNavigateTab('inventory');
            return;
          case 'Digit6':
          case 'Numpad6':
            e.preventDefault();
            onNavigateTab('purchases');
            return;
          case 'Digit7':
          case 'Numpad7':
            e.preventDefault();
            onNavigateTab('waste');
            return;
          case 'Digit8':
          case 'Numpad8':
            e.preventDefault();
            onNavigateTab('parameters');
            return;
          case 'KeyX':
            e.preventDefault();
            onExportXLSX();
            return;
          case 'KeyG':
            if (onOpenPurchaseOrder) {
              e.preventDefault();
              onOpenPurchaseOrder();
            }
            return;
          case 'KeyF':
            if (onOpenSupplierManager) {
              e.preventDefault();
              onOpenSupplierManager();
            }
            return;
          case 'KeyC':
            e.preventDefault();
            onOpenQuickCalc();
            return;
          case 'KeyP':
            e.preventDefault();
            onPrint();
            return;
          case 'KeyT':
            e.preventDefault();
            onToggleTheme();
            return;
          case 'KeyD':
            if (onToggleDesktop) {
              e.preventDefault();
              onToggleDesktop();
            }
            return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onNavigateTab,
    onExportXLSX,
    onOpenQuickCalc,
    onPrint,
    onToggleTheme,
    onToggleDesktop,
    onOpenShortcutsHelp,
    onOpenPurchaseOrder,
    onOpenSupplierManager,
    onCloseModals
  ]);
}
