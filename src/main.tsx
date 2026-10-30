import {createRoot} from 'react-dom/client';
import { setLogLevel } from 'firebase/firestore';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

try {
  setLogLevel('silent');
} catch {}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

