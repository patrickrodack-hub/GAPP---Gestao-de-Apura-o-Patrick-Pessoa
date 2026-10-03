/**
 * Utilitário para controle de Tela Cheia (Fullscreen API) no Portal Mobile
 */
export const requestPortalFullscreen = async (): Promise<boolean> => {
  try {
    if (typeof document === 'undefined') return false;
    const docEl = document.documentElement as any;
    const isAlreadyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    if (isAlreadyFullscreen) return true;

    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen();
      return true;
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
      return true;
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen();
      return true;
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    // Pode falhar caso o navegador exija uma interação prévia do usuário
    return false;
  }
  return false;
};

export const exitPortalFullscreen = async (): Promise<boolean> => {
  try {
    if (typeof document === 'undefined') return false;
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    if (!isFullscreen) return true;

    const doc = document as any;
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return true;
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
      return true;
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
      return true;
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

export const isPortalFullscreen = (): boolean => {
  if (typeof document === 'undefined') return false;
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};
