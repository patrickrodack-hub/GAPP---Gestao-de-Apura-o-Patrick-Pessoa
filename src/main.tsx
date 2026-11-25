import {createRoot} from 'react-dom/client';
import { setLogLevel } from 'firebase/firestore';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

try {
  setLogLevel('silent');
} catch {}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary scopeLabel="Sistema ERP">
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);

