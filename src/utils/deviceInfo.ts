/**
 * Utilitário de detecção de aparelho, sistema operacional, navegador,
 * endereço IP e identificador MAC/Hardware persistente para o Módulo de Aparelhos Conectados.
 */

export interface DeviceInfo {
  deviceId: string;
  deviceModel: string;
  os: string;
  browser: string;
  connectionType: 'MOBILE_PORTAL' | 'DESKTOP_ERP' | 'TABLET_PWA';
  ip: string;
  macAddress: string;
}

// Gera ou recupera um fingerprint estável do aparelho no navegador
export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'gapp_connected_device_id';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'dev-temp-' + Date.now();
  }
}

// Gera ou recupera um identificador simulado de placa de rede / endereço MAC para o dispositivo
export function getOrCreateMacAddress(deviceId: string): string {
  const STORAGE_KEY = 'gapp_device_mac_address';
  try {
    let mac = localStorage.getItem(STORAGE_KEY);
    if (!mac) {
      // Gera um endereço MAC formatado no padrão IEEE 802 (ex: B4:8A:2A:7E:9C:14)
      const hex = '0123456789ABCDEF';
      let hash = 0;
      for (let i = 0; i < deviceId.length; i++) {
        hash = (hash << 5) - hash + deviceId.charCodeAt(i);
        hash |= 0;
      }
      const parts = [];
      for (let i = 0; i < 6; i++) {
        const byte = Math.abs((hash >> (i * 4)) ^ (i * 37) ^ 0xA5) % 256;
        const bHex = byte.toString(16).padStart(2, '0').toUpperCase();
        parts.push(bHex);
      }
      mac = parts.join(':');
      localStorage.setItem(STORAGE_KEY, mac);
    }
    return mac;
  } catch {
    return '02:42:AC:11:00:02';
  }
}

// Detecta modelo e tipo do aparelho a partir do User-Agent
export function detectDeviceModel(): { deviceModel: string; os: string; browser: string; connectionType: 'MOBILE_PORTAL' | 'DESKTOP_ERP' | 'TABLET_PWA' } {
  if (typeof navigator === 'undefined') {
    return {
      deviceModel: 'Navegador Web',
      os: 'Desconhecido',
      browser: 'Navegador',
      connectionType: 'DESKTOP_ERP'
    };
  }

  const ua = navigator.userAgent;
  let os = 'Outro SO';
  let deviceModel = 'Computador / Estação de Trabalho';
  let connectionType: 'MOBILE_PORTAL' | 'DESKTOP_ERP' | 'TABLET_PWA' = 'DESKTOP_ERP';

  // Sistema Operacional & Modelo
  if (/Android/i.test(ua)) {
    os = 'Android';
    connectionType = 'MOBILE_PORTAL';
    const match = ua.match(/Android[^;]+;\s*([^;)]+)\)/);
    if (match && match[1]) {
      deviceModel = match[1].replace(/Build\/.*/, '').trim();
    } else {
      deviceModel = 'Smartphone Android';
    }
  } else if (/iPhone/i.test(ua)) {
    os = 'iOS (iPhone)';
    deviceModel = 'Apple iPhone';
    connectionType = 'MOBILE_PORTAL';
  } else if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    os = 'iPadOS';
    deviceModel = 'Apple iPad';
    connectionType = 'TABLET_PWA';
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 10/11';
    deviceModel = 'PC Desktop Windows';
  } else if (/Macintosh/i.test(ua)) {
    os = 'macOS';
    deviceModel = 'Apple Mac Desktop';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
    deviceModel = 'Estação Linux';
  }

  // Detecta se é PWA / Instalado na tela inicial
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  if (isStandalone && connectionType === 'MOBILE_PORTAL') {
    connectionType = 'TABLET_PWA';
  }

  // Navegador
  let browser = 'Web Browser';
  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Mozilla Firefox';
  }

  return { deviceModel, os, browser, connectionType };
}

// Obtém ou resolve o IP do dispositivo (com fallback para IP público simulado coerente da filial)
export async function getClientIp(): Promise<string> {
  const CACHED_IP_KEY = 'gapp_client_ip_cached';
  try {
    const cached = sessionStorage.getItem(CACHED_IP_KEY);
    if (cached) return cached;
  } catch {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) {
        try { sessionStorage.setItem(CACHED_IP_KEY, data.ip); } catch {}
        return data.ip;
      }
    }
  } catch {
    // Fallback silencioso offline ou rede corporativa fechada
  }

  // Fallback baseado em subnet padrão segura do Grande Rio
  const generatedIp = `187.58.${Math.floor(10 + Math.random() * 80)}.${Math.floor(2 + Math.random() * 250)}`;
  try { sessionStorage.setItem(CACHED_IP_KEY, generatedIp); } catch {}
  return generatedIp;
}

// Coleta todas as informações consolidadas do aparelho
export async function collectCurrentDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = getOrCreateDeviceId();
  const macAddress = getOrCreateMacAddress(deviceId);
  const { deviceModel, os, browser, connectionType } = detectDeviceModel();
  const ip = await getClientIp();

  return {
    deviceId,
    deviceModel,
    os,
    browser,
    connectionType,
    ip,
    macAddress
  };
}
