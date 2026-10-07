import { ConnectedDevice } from '../types/erp';
import { INITIAL_STORES } from './initialData';

export const INITIAL_CONNECTED_DEVICES: ConnectedDevice[] = [
  {
    id: 'dev_str_1_carlos',
    deviceId: 'dev-samsung-a54-str1',
    storeId: 'str_1',
    storeName: 'CM SANTA ROSA',
    operatorName: 'Carlos Eduardo (Encarregado)',
    ip: '187.58.24.112',
    macAddress: '48:2C:A0:6B:19:FE',
    deviceModel: 'Samsung Galaxy A54 5G',
    os: 'Android 14 (One UI 6.0)',
    browser: 'Chrome Mobile 128.0',
    connectionType: 'MOBILE_PORTAL',
    status: 'LIBERADO',
    firstConnectedAt: Date.now() - 3600000 * 28, // 28h atrás
    lastSeenAt: Date.now() - 1000 * 45,           // 45 segundos atrás (Online)
    sessionDurationSeconds: 1420,                 // ~23 min de permanência
    accessCount: 18,
    isOnline: true,
    locationHint: 'Niterói, RJ (Santa Rosa)'
  },
  {
    id: 'dev_str_2_marcos',
    deviceId: 'dev-iphone-13-str2',
    storeId: 'str_2',
    storeName: 'RN ARARUAMA II',
    operatorName: 'Marcos Vinicius (Encarregado)',
    ip: '187.58.42.89',
    macAddress: 'F0:18:98:C3:5A:21',
    deviceModel: 'Apple iPhone 13',
    os: 'iOS 17.5.1',
    browser: 'Mobile Safari 17.5',
    connectionType: 'MOBILE_PORTAL',
    status: 'LIBERADO',
    firstConnectedAt: Date.now() - 3600000 * 14,
    lastSeenAt: Date.now() - 1000 * 75,           // Online
    sessionDurationSeconds: 2180,                 // ~36 min
    accessCount: 12,
    isOnline: true,
    locationHint: 'Araruama, RJ (Centro)'
  },
  {
    id: 'dev_str_3_roberto',
    deviceId: 'dev-motorola-g84-str3',
    storeId: 'str_3',
    storeName: 'RN BANDEIRANTES',
    operatorName: 'Roberto Silva (Açougue)',
    ip: '187.58.19.45',
    macAddress: '9C:B6:54:11:88:42',
    deviceModel: 'Motorola Moto G84 5G',
    os: 'Android 13',
    browser: 'Chrome Mobile 127.0',
    connectionType: 'MOBILE_PORTAL',
    status: 'LIBERADO',
    firstConnectedAt: Date.now() - 3600000 * 48,
    lastSeenAt: Date.now() - 1000 * 60 * 12,      // 12 min atrás
    sessionDurationSeconds: 840,
    accessCount: 26,
    isOnline: false,
    locationHint: 'São Gonçalo, RJ (Bandeirantes)'
  },
  {
    id: 'dev_str_4_valter',
    deviceId: 'dev-xiaomi-note12-str4',
    storeId: 'str_4',
    storeName: 'RN ITABORAI',
    operatorName: 'Valter Santos (Gerente)',
    ip: '187.58.63.204',
    macAddress: 'E4:5F:01:8A:33:BD',
    deviceModel: 'Xiaomi Redmi Note 12',
    os: 'Android 13 (MIUI 14)',
    browser: 'Chrome Mobile 126.0',
    connectionType: 'MOBILE_PORTAL',
    status: 'LIBERADO',
    firstConnectedAt: Date.now() - 3600000 * 20,
    lastSeenAt: Date.now() - 1000 * 30,           // Online
    sessionDurationSeconds: 3100,                 // ~51 min
    accessCount: 31,
    isOnline: true,
    locationHint: 'Itaboraí, RJ'
  },
  {
    id: 'dev_str_6_alexandre',
    deviceId: 'dev-samsung-s22-str6',
    storeId: 'str_6',
    storeName: 'RN LGO BATALHA',
    operatorName: 'Alexandre Souza (Conferente)',
    ip: '187.58.33.15',
    macAddress: '3C:06:30:EF:41:88',
    deviceModel: 'Samsung Galaxy S22',
    os: 'Android 14 (One UI 6.1)',
    browser: 'Samsung Internet 25.0',
    connectionType: 'MOBILE_PORTAL',
    status: 'LIBERADO',
    firstConnectedAt: Date.now() - 3600000 * 8,
    lastSeenAt: Date.now() - 1000 * 90,           // Online
    sessionDurationSeconds: 980,
    accessCount: 9,
    isOnline: true,
    locationHint: 'Niterói, RJ (Largo da Batalha)'
  },
  {
    id: 'dev_str_16_gustavo',
    deviceId: 'dev-iphone-14-str16',
    storeId: 'str_16',
    storeName: 'RN ITAIPU',
    operatorName: 'Gustavo Barbosa (Encarregado)',
    ip: '187.58.71.55',
    macAddress: '18:65:90:D2:7C:1E',
    deviceModel: 'Apple iPhone 14 Pro',
    os: 'iOS 17.6',
    browser: 'Mobile Safari 17.6',
    connectionType: 'MOBILE_PORTAL',
    status: 'LIBERADO',
    firstConnectedAt: Date.now() - 3600000 * 72,
    lastSeenAt: Date.now() - 1000 * 60 * 35,
    sessionDurationSeconds: 1650,
    accessCount: 42,
    isOnline: false,
    locationHint: 'Niterói, RJ (Região Oceânica)'
  },
  {
    id: 'dev_desktop_matriz_patrick',
    deviceId: 'dev-workstation-matriz-pp',
    storeId: undefined,
    storeName: 'MATRIZ / DIRETORIA',
    operatorName: 'Patrick Pessoa (Gestor & Diretor)',
    ip: '187.58.10.1',
    macAddress: 'D8:BB:C1:22:90:01',
    deviceModel: 'Dell OptiPlex 7000 / Desktop',
    os: 'Windows 11 Pro 64-bit',
    browser: 'Google Chrome 129.0',
    connectionType: 'DESKTOP_ERP',
    status: 'LIBERADO',
    firstConnectedAt: Date.now() - 3600000 * 120,
    lastSeenAt: Date.now() - 1000 * 5,            // Ativo agora
    sessionDurationSeconds: 18400,                // 5+ horas conectado
    accessCount: 88,
    isOnline: true,
    locationHint: 'Niterói, RJ (Sede Administrativa)'
  }
];
