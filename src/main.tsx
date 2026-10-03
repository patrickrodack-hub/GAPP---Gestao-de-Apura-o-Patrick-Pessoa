import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline caching and mobile installability
registerSW({
  immediate: true,
  onNeedRefresh() {},
  onOfflineReady() {
    console.log('ERP Apuração do Boi pronto para funcionamento offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

