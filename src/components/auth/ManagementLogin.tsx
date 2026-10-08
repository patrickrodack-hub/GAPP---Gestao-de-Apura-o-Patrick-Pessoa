import React, { useState, useEffect } from 'react';
import { SystemUser } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Monitor, 
  AlertCircle,
  Power,
  Minus,
  Square,
  X,
  Database
} from 'lucide-react';

interface ManagementLoginProps {
  onLoginSuccess: (user: SystemUser) => void;
  onExitSystem?: () => void;
}

export const ManagementLogin: React.FC<ManagementLoginProps> = ({ onLoginSuccess, onExitSystem }) => {
  const { theme, setTheme, isDark, isSolidcon, isLight } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincroniza os usuários cadastrados diretamente do Firestore ao abrir a tela de login
  useEffect(() => {
    StorageService.syncUsersFromCloud().catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMessage('Por favor, informe seu usuário ou login de acesso.');
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      // Garante a lista mais recente do Firestore antes de validar
      await StorageService.syncUsersFromCloud();
    } catch {}

    const allUsers = StorageService.getUsers();

    // Busca por username ou nome (ex: "desenvolvedor", "patrick pessoa", "patrick")
    const matchedUser = allUsers.find(u => {
      const uName = u.username.toLowerCase();
      const fName = u.name.toLowerCase();
      
      const isUserMatch = uName === trimmedUser || 
                          fName === trimmedUser || 
                          (trimmedUser === 'patrick' && u.role === 'DESENVOLVEDOR');

      return isUserMatch && u.password === trimmedPass;
    });

    if (!matchedUser) {
      setIsLoading(false);
      setErrorMessage('Usuário ou senha incorretos. Verifique suas credenciais.');
      return;
    }

    if (!matchedUser.active) {
      setIsLoading(false);
      setErrorMessage('Este usuário foi desativado pelo administrador do sistema.');
      return;
    }

    // Registra último login
    const updatedUser: SystemUser = {
      ...matchedUser,
      lastLoginAt: Date.now()
    };
    StorageService.updateUser(updatedUser);
    // Sessão estritamente em memória do ciclo de vida da aplicação (sem salvar para auto-login)
    StorageService.clearSessionUser();

    setIsLoading(false);
    onLoginSuccess(updatedUser);
  };

  return (
    <div 
      className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden select-none font-sans transition-colors duration-300 ${
        isSolidcon
          ? 'bg-gradient-to-br from-[#1b3252] via-[#24436c] to-[#162740] text-slate-900'
          : isLight
          ? 'bg-gradient-to-br from-slate-100 via-[#f4f7f6] to-[#e6f0eb] text-slate-900'
          : 'bg-[#07080c] text-white'
      }`}
    >
      
      {/* ============================================================ */}
      {/* BACKGROUND GRAPHICS: Adaptado dinamicamente ao tema          */}
      {/* ============================================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glow ambient background orbs */}
        {isLight ? (
          <>
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/15 via-teal-400/10 to-indigo-400/10 rounded-full blur-[130px]" />
            <div className="absolute -top-20 -right-20 w-[550px] h-[550px] bg-gradient-to-br from-indigo-300/15 via-emerald-200/15 to-transparent rounded-full blur-[140px]" />
            <div className="absolute -bottom-24 -left-24 w-[550px] h-[550px] bg-gradient-to-tr from-teal-300/15 via-blue-200/15 to-transparent rounded-full blur-[140px]" />
          </>
        ) : isSolidcon ? (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-[#0078d7]/20 via-[#005a9e]/15 to-transparent rounded-full blur-[150px]" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
          </>
        ) : (
          <>
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-600/25 via-teal-500/20 to-purple-600/20 rounded-full blur-[130px]" />
            <div className="absolute -top-20 -right-20 w-[550px] h-[550px] bg-gradient-to-br from-purple-600/25 via-pink-600/20 to-transparent rounded-full blur-[140px]" />
            <div className="absolute -bottom-24 -left-24 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-600/25 via-blue-600/20 to-transparent rounded-full blur-[140px]" />
          </>
        )}

        {/* Top-Right Neon/Subtle Wave Mesh */}
        {!isSolidcon && (
          <svg 
            className={`absolute -top-10 -right-20 w-[600px] h-[600px] transition-opacity duration-300 ${isLight ? 'opacity-35' : 'opacity-80'}`}
            viewBox="0 0 500 500" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="waveGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isLight ? '#059669' : '#10b981'} stopOpacity={isLight ? '0.6' : '0.85'} />
                <stop offset="40%" stopColor={isLight ? '#2563eb' : '#3b82f6'} stopOpacity={isLight ? '0.6' : '0.85'} />
                <stop offset="80%" stopColor={isLight ? '#7c3aed' : '#a855f7'} stopOpacity={isLight ? '0.6' : '0.85'} />
                <stop offset="100%" stopColor={isLight ? '#db2777' : '#ec4899'} stopOpacity={isLight ? '0.6' : '0.85'} />
              </linearGradient>
            </defs>
            {Array.from({ length: 32 }).map((_, i) => {
              const offset = i * 7;
              return (
                <path
                  key={i}
                  d={`M ${180 + offset},0 C ${230 + offset * 0.9},140 ${320 - offset * 0.5},220 ${280 + offset},350 C ${250 + offset},440 ${370 + offset * 0.6},470 ${420 + offset},500`}
                  stroke="url(#waveGradRight)"
                  strokeWidth="1.2"
                  strokeOpacity={isLight ? 0.12 + (i % 6) * 0.08 : 0.18 + (i % 6) * 0.12}
                />
              );
            })}
          </svg>
        )}

        {/* Bottom-Left Neon/Subtle Wave Mesh */}
        {!isSolidcon && (
          <svg 
            className={`absolute -bottom-20 -left-20 w-[600px] h-[600px] transition-opacity duration-300 ${isLight ? 'opacity-30' : 'opacity-75'}`}
            viewBox="0 0 500 500" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="waveGradLeft" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isLight ? '#047857' : '#059669'} stopOpacity={isLight ? '0.6' : '0.9'} />
                <stop offset="40%" stopColor={isLight ? '#1d4ed8' : '#2563eb'} stopOpacity={isLight ? '0.6' : '0.9'} />
                <stop offset="80%" stopColor={isLight ? '#6d28d9' : '#7c3aed'} stopOpacity={isLight ? '0.6' : '0.9'} />
                <stop offset="100%" stopColor={isLight ? '#c026d3' : '#d946ef'} stopOpacity={isLight ? '0.6' : '0.9'} />
              </linearGradient>
            </defs>
            {Array.from({ length: 30 }).map((_, i) => {
              const offset = i * 7.5;
              return (
                <path
                  key={i}
                  d={`M 0,${340 + offset * 0.5} C 120,${290 + offset * 0.7} 180,${180 - offset * 0.4} 280,${220 + offset * 0.6} C 350,${260 + offset * 0.3} 380,${390} 500,${420 + offset * 0.2}`}
                  stroke="url(#waveGradLeft)"
                  strokeWidth="1.2"
                  strokeOpacity={isLight ? 0.12 + (i % 5) * 0.08 : 0.18 + (i % 5) * 0.14}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* ============================================================ */}
      {/* TOP BAR: Header com Seletor de Tema e Fechar Navegador */}
      {/* ============================================================ */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Identificação Corporativa */}
        <div className="flex items-center gap-3">
          <div 
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              isSolidcon
                ? 'bg-[#0078d7] border border-blue-300/40 text-white shadow-blue-900/30'
                : isLight
                ? 'bg-white border border-slate-200/90 text-slate-900 shadow-slate-900/5'
                : 'bg-zinc-900/90 border border-emerald-500/30 text-white shadow-emerald-950/40'
            }`}
          >
            <img 
              src="/brand-logo.svg" 
              alt="Patrick Pessoa" 
              className="w-7 h-7 object-contain drop-shadow"
              onError={(e) => {
                e.currentTarget.src = '/patrick-pessoa-brand.png';
              }}
            />
          </div>
          <div>
            <span 
              className={`font-extrabold text-sm tracking-tight block ${
                isSolidcon ? 'text-white' : isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Grupo GAPP Sistemas
            </span>
            <span 
              className={`text-[10px] font-mono block ${
                isSolidcon ? 'text-blue-200' : isLight ? 'text-slate-500' : 'text-zinc-400'
              }`}
            >
              Módulo de Gestão • Gestão Apuração do Boi v10.7
            </span>
          </div>
        </div>

        {/* Controles de Topo: Seletor de Tema e Botão Fechar Navegador */}
        <div className="flex items-center gap-3">
          {/* Seletor de Tema com persistência */}
          <div 
            className={`flex items-center p-1 rounded-2xl shadow-xl text-xs transition-colors backdrop-blur-xl ${
              isSolidcon
                ? 'bg-[#0d223a]/80 border border-white/20'
                : isLight
                ? 'bg-white/90 border border-slate-200 shadow-slate-200/50'
                : 'bg-zinc-900/70 border border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                isLight
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isSolidcon
                  ? 'text-blue-200 hover:text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Tema Padrão: Moderno Claro"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Claro</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                isDark
                  ? 'bg-purple-600 text-white shadow-md'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : isSolidcon
                  ? 'text-blue-200 hover:text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Tema: Moderno Escuro"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Escuro</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('solidcon')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                isSolidcon
                  ? 'bg-[#0078d7] text-white shadow-md'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Tema: GAPP Classic ERP"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GAPP Classic</span>
            </button>
          </div>

          {/* Botão Fechar Navegador / Sair */}
          {onExitSystem && (
            <button
              type="button"
              onClick={onExitSystem}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition backdrop-blur-xl shadow-lg cursor-pointer group ${
                isSolidcon
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-400 shadow-rose-950/30'
                  : isLight
                  ? 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 shadow-slate-200/50'
                  : 'bg-zinc-900/70 hover:bg-rose-600/90 text-zinc-300 hover:text-white border border-white/10 hover:border-rose-500'
              }`}
              title="Fechar Navegador / Encerrar Aplicação"
            >
              <Power className={`w-3.5 h-3.5 transition ${isLight ? 'text-rose-600' : 'text-rose-400 group-hover:text-white'}`} />
              <span className="hidden sm:inline">Fechar Navegador</span>
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER: CARD DE LOGIN ADAPTADO AO TEMA SELECIONADO    */}
      {/* ============================================================ */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-4xl lg:max-w-5xl">
          
          {/* Card Principal - Renderização contextual de acordo com tema */}
          <div 
            className={`relative overflow-hidden transition-all duration-300 ${
              isSolidcon
                ? 'rounded-xl sm:rounded-2xl bg-[#f4f6f8] border-2 border-[#0078d7] shadow-[0_25px_80px_rgba(0,0,0,0.55)] text-slate-900'
                : isLight
                ? 'rounded-[32px] sm:rounded-[38px] bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-[0_25px_80px_rgba(15,23,42,0.12)] text-slate-900'
                : 'rounded-[32px] sm:rounded-[38px] bg-zinc-950/75 backdrop-blur-2xl border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)] text-white'
            }`}
          >
            
            {/* Barra de Título Exclusiva do Tema Solidcon (Estilo Janela Windows / ERP) */}
            {isSolidcon && (
              <div className="bg-gradient-to-r from-[#005a9e] to-[#0078d7] text-white px-4 py-2 flex items-center justify-between text-xs font-bold border-b border-[#004e8c]">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-sky-200" />
                  <span className="tracking-wide">
                    GAPP Classic • Autenticação de Acesso ao Sistema - Gestão Apuração do Boi v10.7
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-xs bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
                    <Minus className="w-2.5 h-2.5" />
                  </div>
                  <div className="w-4 h-4 rounded-xs bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
                    <Square className="w-2.5 h-2.5" />
                  </div>
                  {onExitSystem && (
                    <div 
                      onClick={onExitSystem}
                      className="w-4 h-4 rounded-xs bg-rose-600 hover:bg-rose-700 flex items-center justify-center cursor-pointer"
                      title="Fechar"
                    >
                      <X className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Brilho sutil de borda superior nos temas Modernos */}
            {!isSolidcon && (
              <div 
                className={`absolute top-0 inset-x-0 h-px pointer-events-none ${
                  isLight 
                    ? 'bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent' 
                    : 'bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent'
                }`} 
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1.15fr_auto_1fr] items-stretch min-h-[460px] sm:min-h-[500px]">
              
              {/* ======================================================== */}
              {/* COLUNA ESQUERDA: LOGO + TITULO + DESCRICAO + WEBSITE     */}
              {/* ======================================================== */}
              <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-6">
                
                {/* 1. Header com LOGO AUMENTADA E COLORIDA */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6">
                    {/* Container de Logo Ampliado com Cores e Brilho Vibrante */}
                    <div className="relative shrink-0">
                      <div 
                        className={`absolute -inset-1.5 rounded-[28px] blur-md opacity-70 animate-pulse ${
                          isSolidcon
                            ? 'bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-600'
                            : isLight
                            ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-indigo-400 opacity-50'
                            : 'bg-gradient-to-tr from-emerald-500 via-amber-400 to-purple-600'
                        }`} 
                      />
                      <div 
                        className={`relative w-20 h-20 sm:w-24 sm:h-24 p-2.5 flex items-center justify-center shadow-2xl transition-colors ${
                          isSolidcon
                            ? 'rounded-xl bg-gradient-to-b from-white to-slate-100 border-2 border-[#0078d7] shadow-blue-900/20'
                            : isLight
                            ? 'rounded-[24px] bg-gradient-to-b from-emerald-50 via-white to-emerald-100/50 border-2 border-emerald-500/50 shadow-emerald-950/10'
                            : 'rounded-[24px] bg-gradient-to-b from-[#1b2d1e] via-[#101912] to-[#0a100c] border-2 border-emerald-400/60 shadow-emerald-950/80'
                        }`}
                      >
                        <img 
                          src="/brand-logo.svg" 
                          alt="Patrick Pessoa - Apuração do BOI" 
                          className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.35)]"
                          onError={(e) => {
                            e.currentTarget.src = '/patrick-pessoa-brand.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* Título Oficial: Apuração do BOI v10.7 */}
                    <div>
                      <span 
                        className={`text-2xl sm:text-3xl font-black tracking-tight block drop-shadow-sm ${
                          isSolidcon
                            ? 'text-[#005a9e]'
                            : isLight
                            ? 'text-slate-900'
                            : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-300'
                        }`}
                      >
                        Gestão Apuração do Boi v10.7
                      </span>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span 
                          className={`text-[11px] font-extrabold uppercase tracking-wider font-mono px-2 py-0.5 rounded-lg shadow-xs ${
                            isSolidcon
                              ? 'bg-blue-100 text-[#005a9e] border border-blue-300'
                              : isLight
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'text-amber-300 bg-amber-500/15 border border-amber-400/40'
                          }`}
                        >
                          PATRICK PESSOA
                        </span>
                        <span 
                          className={`text-[11px] font-medium ${
                            isSolidcon ? 'text-slate-600' : isLight ? 'text-slate-500' : 'text-zinc-400'
                          }`}
                        >
                          Gestão de Desossa & Câmaras
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Título Impactante no estilo do layout */}
                  <div className="space-y-1">
                    <h1 
                      className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] ${
                        isSolidcon ? 'text-slate-800' : isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      Gestão
                    </h1>
                    <h1 
                      className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] ${
                        isSolidcon
                          ? 'text-[#0078d7]'
                          : isLight
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700'
                          : 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300'
                      }`}
                    >
                      Apuração do Boi
                    </h1>
                  </div>

                  {/* 3. Parágrafo Descritivo com as informações reais do nosso sistema */}
                  <p 
                    className={`mt-5 text-xs sm:text-sm leading-relaxed max-w-sm font-normal ${
                      isSolidcon || isLight ? 'text-slate-600' : 'text-zinc-300/85'
                    }`}
                  >
                    Ambiente corporativo oficial para apuração de compras de gado, 
                    apuração técnica e real de rendimento de carcaças, auditoria de margens 
                    e consolidação de estoque nas câmaras das 16 lojas filiais.
                  </p>
                </div>

                {/* 4. Rodapé da Coluna Esquerda: Endereço Atualizado www.gipp-site.vercel.app */}
                <div 
                  className={`pt-4 border-t flex items-center justify-between text-[11px] font-mono ${
                    isSolidcon
                      ? 'border-slate-300 text-slate-600'
                      : isLight
                      ? 'border-slate-200 text-slate-500'
                      : 'border-white/10 text-zinc-400'
                  }`}
                >
                  <a
                    href="https://gipp-site.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`transition underline underline-offset-4 font-semibold ${
                      isSolidcon
                        ? 'text-[#005a9e] hover:text-[#0078d7] decoration-blue-400/50'
                        : isLight
                        ? 'text-emerald-700 hover:text-emerald-900 decoration-emerald-500/40'
                        : 'text-emerald-400 hover:text-emerald-300 decoration-emerald-500/40'
                    }`}
                    title="Acessar portal institucional"
                  >
                    www.gipp-site.vercel.app
                  </a>
                  <span className={isSolidcon || isLight ? 'text-slate-500' : 'text-zinc-500'}>
                    16 Filiais Integradas
                  </span>
                </div>

              </div>

              {/* ======================================================== */}
              {/* DIVISOR CENTRAL: Linha vertical adaptada ao tema         */}
              {/* ======================================================== */}
              <div className="hidden md:flex items-center justify-center px-1">
                <div 
                  className={`w-[3px] h-[78%] rounded-full ${
                    isSolidcon
                      ? 'bg-slate-300 shadow-xs'
                      : isLight
                      ? 'bg-slate-200 shadow-xs'
                      : 'bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  }`} 
                />
              </div>

              {/* Divisor horizontal no mobile */}
              <div className="md:hidden px-8">
                <div 
                  className={`h-[2px] w-full rounded-full ${
                    isSolidcon || isLight ? 'bg-slate-200' : 'bg-white/20'
                  }`} 
                />
              </div>

              {/* ======================================================== */}
              {/* COLUNA DIREITA: TITULO "Login" + INPUTS + BOTAO LOGIN    */}
              {/* ======================================================== */}
              <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
                
                {/* Título "Login" */}
                <div className="mb-7 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2 
                      className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                        isSolidcon ? 'text-slate-900 font-extrabold' : isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {isSolidcon ? 'Autenticação de Operador' : 'Login'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      v10.7
                    </span>
                  </div>
                  <p 
                    className={`text-xs mt-1 ${
                      isSolidcon ? 'text-slate-600' : isLight ? 'text-slate-500' : 'text-zinc-400'
                    }`}
                  >
                    Entre com suas credenciais autorizadas
                  </p>
                </div>

                {/* Alerta de erro */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
                    <span className="font-semibold leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {/* Formulário de Login */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  
                  {/* Campo: Username */}
                  <div className="space-y-1">
                    <label 
                      className={`block text-[11px] font-semibold pl-3 ${
                        isSolidcon || isLight ? 'text-slate-700' : 'text-zinc-300'
                      }`}
                    >
                      Usuário / Login
                    </label>
                    <div className="relative">
                      <div 
                        className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                          isSolidcon || isLight ? 'text-slate-500' : 'text-zinc-400'
                        }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        autoComplete="username"
                        autoFocus
                        className={`w-full pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none transition shadow-inner ${
                          isSolidcon
                            ? 'bg-white hover:border-slate-400 focus:border-[#0078d7] border-2 border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400'
                            : isLight
                            ? 'bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-full text-slate-900 placeholder:text-slate-400'
                            : 'bg-zinc-800/80 hover:bg-zinc-800/95 focus:bg-zinc-800 border border-white/10 focus:border-emerald-400/70 rounded-full text-white placeholder:text-zinc-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Campo: Password */}
                  <div className="space-y-1">
                    <label 
                      className={`block text-[11px] font-semibold pl-3 ${
                        isSolidcon || isLight ? 'text-slate-700' : 'text-zinc-300'
                      }`}
                    >
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <div 
                        className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                          isSolidcon || isLight ? 'text-slate-500' : 'text-zinc-400'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        className={`w-full pl-11 pr-12 py-3 text-sm font-semibold focus:outline-none transition shadow-inner ${
                          isSolidcon
                            ? 'bg-white hover:border-slate-400 focus:border-[#0078d7] border-2 border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400'
                            : isLight
                            ? 'bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-full text-slate-900 placeholder:text-slate-400'
                            : 'bg-zinc-800/80 hover:bg-zinc-800/95 focus:bg-zinc-800 border border-white/10 focus:border-emerald-400/70 rounded-full text-white placeholder:text-zinc-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 pr-4 flex items-center transition cursor-pointer ${
                          isSolidcon || isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-400 hover:text-white'
                        }`}
                        title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Botão de Login */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full sm:w-auto min-w-[160px] py-3 px-8 font-bold text-sm tracking-wide transition cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 ${
                        isSolidcon
                          ? 'rounded-md bg-gradient-to-b from-[#0078d7] to-[#005a9e] hover:from-[#1084e3] hover:to-[#006bbd] text-white border border-[#004e8c] shadow-md active:translate-y-px'
                          : isLight
                          ? 'rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 active:scale-95'
                          : 'rounded-full bg-zinc-700/90 hover:bg-zinc-600 text-white shadow-xl shadow-black/50 border border-white/15 active:scale-95'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Entrando...</span>
                        </>
                      ) : (
                        <span>{isSolidcon ? 'Conectar ao ERP' : 'Login'}</span>
                      )}
                    </button>
                  </div>

                </form>

                {/* Rodapé Seguro */}
                <div 
                  className={`mt-6 pt-4 border-t text-center ${
                    isSolidcon
                      ? 'border-slate-300'
                      : isLight
                      ? 'border-slate-200'
                      : 'border-white/10'
                  }`}
                >
                  <div 
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] border transition-colors ${
                      isSolidcon
                        ? 'rounded bg-slate-200/80 border-slate-300 text-slate-700 font-mono'
                        : isLight
                        ? 'rounded-full bg-slate-100 border-slate-200 text-slate-600'
                        : 'rounded-full bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    <ShieldCheck 
                      className={`w-3.5 h-3.5 ${
                        isSolidcon ? 'text-[#0078d7]' : isLight ? 'text-emerald-600' : 'text-emerald-400'
                      }`} 
                    />
                    <span>
                      {isSolidcon 
                        ? 'Sessão Corporativa Segura • Protocolo TCP/IP Criptografado' 
                        : 'Ambiente Corporativo Seguro • Criptografia Ativa'}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Barra de Status no Rodapé da Janela Solidcon */}
            {isSolidcon && (
              <div className="bg-[#e8ecef] border-t border-[#b0bec5] px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-600 font-mono select-none">
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-[#0078d7]" />
                  <span>Terminal Matriz: Conectado</span>
                  <span>•</span>
                  <span>Porta 3000</span>
                </div>
                <div>
                  <span>16 Filiais Integradas</span>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* ============================================================ */}
      {/* FOOTER MÍNIMO                                                */}
      {/* ============================================================ */}
      <footer 
        className={`relative z-10 w-full max-w-7xl mx-auto px-6 py-3 text-center text-[11px] transition-colors ${
          isSolidcon ? 'text-blue-200/70 font-mono' : isLight ? 'text-slate-500' : 'text-zinc-500'
        }`}
      >
        Grupo GAPP • Patrick Pessoa • Gestão Apuração do Boi v10.7 • 16 Filiais Conectadas
      </footer>

    </div>
  );
};

