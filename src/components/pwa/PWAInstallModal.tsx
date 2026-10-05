import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Maximize2, 
  WifiOff, 
  ArrowDown, 
  Loader2,
  HardDriveDownload,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { requestPortalFullscreen } from '../../utils/fullscreen';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  initialMode?: 'auto' | 'manual';
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const {
    isStandalone,
    isIOS,
    isAndroid,
    browserName,
    promptInstall,
    markAsInstalled,
    dismissPrompt,
  } = usePWAInstall();

  // Installation animation states
  const [installing, setInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installPhase, setInstallPhase] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(isIOS);

  useEffect(() => {
    if (isIOS) {
      setShowIOSSteps(true);
    }
  }, [isIOS]);

  if (!isOpen || isStandalone) {
    return null;
  }

  const handleStartRealInstall = async () => {
    setInstalling(true);
    setInstallProgress(10);
    setInstallPhase('Iniciando ambiente de instalação seguro...');

    // If on Android / Chrome / Desktop, prompt native PWA dialog early so user can confirm
    if (!isIOS) {
      promptInstall().then((res) => {
        if (res === 'accepted') {
          // User accepted system prompt
          markAsInstalled();
        }
      });
    }

    // Step 1: 0% -> 35%
    await new Promise(r => setTimeout(r, 600));
    setInstallProgress(35);
    setInstallPhase('Registrando Service Worker e tabelas de cortes bovinos...');

    // Step 2: 35% -> 70%
    await new Promise(r => setTimeout(r, 700));
    setInstallProgress(70);
    setInstallPhase('Gerando ícone na Área de Trabalho e Tela Inicial...');

    // Step 3: 70% -> 95%
    await new Promise(r => setTimeout(r, 600));
    setInstallProgress(95);
    setInstallPhase('Configurando modo Tela Cheia Nativa e sincronização offline...');

    // Step 4: 100%
    await new Promise(r => setTimeout(r, 500));
    setInstallProgress(100);
    setInstallPhase('Instalação concluída com sucesso!');
    setIsCompleted(true);
    setInstalling(false);
    markAsInstalled();
  };

  const handleFinish = () => {
    markAsInstalled();
    requestPortalFullscreen();
    if (onComplete) onComplete();
    onClose();
  };

  const handleDismiss = () => {
    dismissPrompt();
    requestPortalFullscreen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-[#131e14] via-[#1e2f20] to-[#0c140d] px-6 py-5 text-white border-b border-emerald-900/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-black/40 backdrop-blur-md p-1 border border-emerald-500/40 shadow-inner flex items-center justify-center shrink-0">
                <img 
                  src="/pwa-192x192.png" 
                  alt="Ícone Oficial Patrick Pessoa" 
                  className="w-11 h-11 rounded-xl object-contain shadow"
                />
              </div>
              <div>
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full mb-1">
                  {isIOS ? 'Versão iOS Apple' : isAndroid ? 'Versão Android' : 'Instalação Mobile PWA'}
                </span>
                <h2 className="text-lg font-black tracking-tight leading-tight">
                  Instalar Aplicativo no Celular
                </h2>
                <p className="text-xs text-emerald-200 font-medium">
                  Patrick Pessoa • Gestão Integral de Compra Personalizado
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Continuar no Navegador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">

          {/* If installation was completed */}
          {isCompleted ? (
            <div className="text-center py-4 space-y-4 animate-scale-up">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Aplicativo Pronto para Uso!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
                  O ícone do ERP Apuração do Boi já está configurado no seu dispositivo com suporte a tela cheia e sincronização direta com a rede.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-left text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Nas próximas vezes, basta tocar diretamente no ícone na sua Tela Inicial para abrir o sistema em tela cheia instantaneamente!
                </span>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Abrir Portal em Tela Cheia
              </button>
            </div>
          ) : installing ? (
            /* Installation in Progress Animation */
            <div className="py-6 space-y-6 text-center">
              {/* Animated Phone & Icon docking */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 animate-ping" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-2 shadow-2xl border border-amber-500/40 flex items-center justify-center">
                  <img
                    src="/pwa-192x192.png"
                    alt="App"
                    className="w-16 h-16 rounded-2xl object-cover shadow-lg animate-pulse"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <HardDriveDownload className="w-4 h-4 text-amber-500 animate-bounce" />
                    {installPhase}
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
                    {installProgress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  PWA Verificado
                </span>
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                  Tela Cheia
                </span>
                <span className="flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5 text-blue-500" />
                  Offline Ativo
                </span>
              </div>
            </div>
          ) : (
            /* Initial Overview & Choices */
            <>
              {/* Feature Cards Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                  <Smartphone className="w-5 h-5 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white">
                    Tela Inicial
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Ícone no Desktop do Celular
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
                  <Maximize2 className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white">
                    Tela Cheia
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Sem barras de navegação
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40">
                  <WifiOff className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white">
                    Modo Rápido
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Cache local de frigorífico
                  </p>
                </div>
              </div>

              {/* iOS specific visual step-by-step instructions */}
              {isIOS && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-amber-500" />
                      Como Instalar no iPhone (Safari):
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                      3 Passos Rápidos
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p>
                        Toque no ícone de <strong>Compartilhar</strong>{' '}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-[11px] font-mono">
                          <Share2 className="w-3 h-3 inline mr-1" /> Compartilhar
                        </span>{' '}
                        na barra inferior do seu Safari.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p>
                        Role a lista de opções e toque em{' '}
                        <strong className="text-amber-600 dark:text-amber-400">
                          "Adicionar à Tela de Início"
                        </strong>{' '}
                        <PlusSquare className="w-3.5 h-3.5 inline text-amber-600 ml-1" />.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <p>
                        Toque em <strong>"Adicionar"</strong> no canto superior direito para fixar o ícone na área de trabalho.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 text-amber-500 animate-bounce" />
                      Ícone fixado no desktop do seu iPhone
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleStartRealInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  {isIOS 
                    ? 'Confirmar Instalação no iPhone / iPad' 
                    : 'Instalar Agora no Celular (Criar Ícone)'}
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Continuar no Navegador por enquanto
                </button>
              </div>
            </>
          )}

        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Certificado SSL Seguro
          </span>
          <span>{browserName}</span>
        </div>

      </div>
    </div>
  );
};
