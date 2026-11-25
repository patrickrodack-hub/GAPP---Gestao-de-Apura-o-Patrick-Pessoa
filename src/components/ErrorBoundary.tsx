import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  scopeLabel?: string;
  resetKey?: string | number;
  onReturnHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * ErrorBoundary corporativo para isolar falhas inesperadas de renderização
 * sem derrubar todo o ERP e oferecendo recuperação imediata ao operador.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Erro inesperado durante a renderização deste módulo.';
    return {
      hasError: true,
      errorMessage: message,
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.scopeLabel ? `:${this.props.scopeLabel}` : ''}]`, error, errorInfo?.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleReturnHome = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReturnHome) {
      this.props.onReturnHome();
    }
  };

  handleFullReload = (): void => {
    try {
      window.location.reload();
    } catch {
      this.handleRetry();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="w-full min-h-[320px] flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-xl p-6 text-slate-800 dark:text-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                {this.props.scopeLabel
                  ? `Interrupção temporária em ${this.props.scopeLabel}`
                  : 'Interrupção temporária detectada'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                O sistema isolou uma falha neste painel para proteger os seus dados salvos. Você pode tentar carregar novamente ou retornar ao Painel Geral.
              </p>
              {this.state.errorMessage && (
                <div className="mt-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-rose-700 dark:text-rose-300 break-words">
                  {this.state.errorMessage.slice(0, 260)}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>
                {this.props.onReturnHome && (
                  <button
                    type="button"
                    onClick={this.handleReturnHome}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Voltar ao Painel Geral</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={this.handleFullReload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  <span>Recarregar Sistema</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
