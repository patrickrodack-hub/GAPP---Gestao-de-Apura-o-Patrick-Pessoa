import React, { useState } from 'react';
import { SystemUser } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Sun, 
  Moon, 
  Monitor, 
  AlertCircle,
  Terminal,
  Power,
  Sparkles,
  CheckCircle2
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
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
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

      if (rememberMe) {
        StorageService.setSessionUser(updatedUser);
      } else {
        sessionStorage.setItem('apuracao_boi_temp_user', JSON.stringify(updatedUser));
      }

      setIsLoading(false);
      onLoginSuccess(updatedUser);
    }, 400);
  };

  // Preenchimento rápido para o desenvolvedor
  const handleFillDeveloper = () => {
    setUsername('desenvolvedor');
    setPassword('190996');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#07080c] text-white flex flex-col justify-between relative overflow-hidden select-none font-sans">
      
      {/* ============================================================ */}
      {/* BACKGROUND GRAPHICS: Neon Wavy Ribbons matching the reference */}
      {/* ============================================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glow ambient background orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-purple-700/20 via-fuchsia-600/15 to-transparent rounded-full blur-[120px]" />
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px]" />

        {/* Top-Right Neon Wave Mesh */}
        <svg 
          className="absolute -top-10 -right-20 w-[600px] h-[600px] opacity-75"
          viewBox="0 0 500 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
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
                strokeOpacity={0.15 + (i % 6) * 0.12}
              />
            );
          })}
        </svg>

        {/* Bottom-Left Neon Wave Mesh */}
        <svg 
          className="absolute -bottom-20 -left-20 w-[600px] h-[600px] opacity-70"
          viewBox="0 0 500 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveGradLeft" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0.85" />
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
                strokeOpacity={0.15 + (i % 5) * 0.14}
              />
            );
          })}
        </svg>
      </div>

      {/* ============================================================ */}
      {/* TOP BAR: Header com Seletor de Tema e Fechar Navegador */}
      {/* ============================================================ */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Identificação Corporativa */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-lg">
            <img 
              src="/brand-logo.svg" 
              alt="Patrick Pessoa" 
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.currentTarget.src = '/patrick-pessoa-brand.png';
              }}
            />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              Grupo GAPP Sistemas
            </span>
            <span className="text-[10px] text-zinc-400 font-mono block">
              Módulo de Gestão • Apuração do Boi v10.1
            </span>
          </div>
        </div>

        {/* Controles de Topo: Seletor de Tema e Botão Fechar Navegador */}
        <div className="flex items-center gap-3">
          {/* Seletor de Tema com persistência */}
          <div className="flex items-center bg-zinc-900/70 border border-white/10 backdrop-blur-xl p-1 rounded-2xl shadow-xl text-xs">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                isLight
                  ? 'bg-amber-500 text-slate-950 shadow-md'
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
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Tema: Solidcon Clássico ERP"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Solidcon</span>
            </button>
          </div>

          {/* Botão Fechar Navegador / Sair */}
          {onExitSystem && (
            <button
              type="button"
              onClick={onExitSystem}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-900/70 hover:bg-rose-600/90 text-zinc-300 hover:text-white border border-white/10 hover:border-rose-500 text-xs font-bold transition backdrop-blur-xl shadow-lg cursor-pointer group"
              title="Fechar Navegador / Encerrar Aplicação"
            >
              <Power className="w-3.5 h-3.5 text-rose-400 group-hover:text-white transition" />
              <span className="hidden sm:inline">Fechar Navegador</span>
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER: GLASSMORPHISM CARD EXACTLY LIKE THE REFERENCE */}
      {/* ============================================================ */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className="w-full max-w-4xl lg:max-w-5xl">
          
          {/* Card Principal em Glassmorphism Horizontal */}
          <div className="relative rounded-[32px] sm:rounded-[38px] bg-zinc-950/65 backdrop-blur-2xl border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden">
            
            {/* Brilho sutil de borda superior */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_auto_1fr] items-stretch min-h-[460px] sm:min-h-[500px]">
              
              {/* ======================================================== */}
              {/* COLUNA ESQUERDA: LOGO + TITULO + DESCRICAO + WEBSITE     */}
              {/* ======================================================== */}
              <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-6">
                
                {/* 1. Header com LOGO */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      onClick={handleFillDeveloper}
                      className="cursor-pointer group flex items-center gap-3"
                      title="Clique para carregar credenciais do Desenvolvedor"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/20 p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                        <img 
                          src="/brand-logo.svg" 
                          alt="Patrick Pessoa" 
                          className="w-full h-full object-contain filter drop-shadow-md"
                          onError={(e) => {
                            e.currentTarget.src = '/patrick-pessoa-brand.png';
                          }}
                        />
                      </div>
                      <div>
                        <span className="text-xl sm:text-2xl font-black tracking-widest text-white block">
                          LOGO
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 font-mono block">
                          PATRICK PESSOA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Título Impactante no estilo do layout ("Glass Morphism") */}
                  <div className="space-y-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.08]">
                      Módulo de
                    </h1>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-300">
                      Gestão
                    </h1>
                  </div>

                  {/* 3. Parágrafo Descritivo com as informações reais do nosso sistema */}
                  <p className="mt-5 text-xs sm:text-sm text-zinc-300/80 leading-relaxed max-w-sm font-normal">
                    Ambiente corporativo oficial para apuração de compras de gado, 
                    simulação zootécnica de rendimento de carcaças, auditoria de margens 
                    e consolidação de estoque nas câmaras das 16 lojas filiais.
                  </p>
                </div>

                {/* 4. Rodapé da Coluna Esquerda: Endereço / Assinatura do Sistema */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span className="hover:text-purple-300 transition cursor-default">
                    www.grupogapp.com.br
                  </span>
                  <span className="text-zinc-500">
                    16 Filiais Integradas
                  </span>
                </div>

              </div>

              {/* ======================================================== */}
              {/* DIVISOR CENTRAL: Linha vertical exatamente como na imagem */}
              {/* ======================================================== */}
              <div className="hidden md:flex items-center justify-center px-1">
                <div className="w-[3px] h-[78%] bg-white/90 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
              </div>

              {/* Divisor horizontal no mobile */}
              <div className="md:hidden px-8">
                <div className="h-[2px] w-full bg-white/20 rounded-full" />
              </div>

              {/* ======================================================== */}
              {/* COLUNA DIREITA: TITULO "Login" + INPUTS + BOTAO LOGIN    */}
              {/* ======================================================== */}
              <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
                
                {/* Título "Login" */}
                <div className="mb-7 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Login
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Entre com suas credenciais autorizadas
                  </p>
                </div>

                {/* Alerta de erro */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span className="font-semibold leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {/* Formulário de Login com campos estilo pill da imagem */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  
                  {/* Campo: Username (Pill arredondado translúcido) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-zinc-300 pl-3">
                      Usuário / Login
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        autoComplete="username"
                        autoFocus
                        className="w-full pl-11 pr-4 py-3 bg-zinc-800/80 hover:bg-zinc-800/95 focus:bg-zinc-800 border border-white/10 focus:border-purple-400/70 rounded-full text-sm font-semibold text-white placeholder:text-zinc-400 focus:outline-none transition shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Campo: Password (Pill arredondado translúcido) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-zinc-300 pl-3">
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full pl-11 pr-12 py-3 bg-zinc-800/80 hover:bg-zinc-800/95 focus:bg-zinc-800 border border-white/10 focus:border-purple-400/70 rounded-full text-sm font-semibold text-white placeholder:text-zinc-400 focus:outline-none transition shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white transition cursor-pointer"
                        title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Opções de Lembrar Acesso & Acesso Rápido Desenvolvedor */}
                  <div className="flex items-center justify-between text-xs px-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 bg-zinc-800 border-zinc-600 focus:ring-purple-500"
                      />
                      <span className="text-zinc-300 font-medium text-[11px]">
                        Lembrar acesso
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={handleFillDeveloper}
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-bold hover:underline cursor-pointer"
                    >
                      Preencher Desenvolvedor
                    </button>
                  </div>

                  {/* Botão de Login (Pill arredondado centralizado conforme imagem) */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto min-w-[160px] py-3 px-8 rounded-full bg-zinc-700/90 hover:bg-zinc-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-black/50 border border-white/15 active:scale-95 transition cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Entrando...</span>
                        </>
                      ) : (
                        <span>Login</span>
                      )}
                    </button>
                  </div>

                </form>

                {/* Dica Informativa do Desenvolvedor (Patrick Pessoa) */}
                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <div 
                    onClick={handleFillDeveloper}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 transition cursor-pointer group"
                    title="Acesso completo com usuário 'patrick pessoa' ou 'desenvolvedor'"
                  >
                    <Terminal className="w-3 h-3 text-purple-400" />
                    <span>Acesso Desenvolvedor: <strong>patrick pessoa</strong> (100% de acesso)</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </main>

      {/* ============================================================ */}
      {/* FOOTER MÍNIMO                                                */}
      {/* ============================================================ */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-3 text-center text-[11px] text-zinc-500">
        Grupo GAPP • Patrick Pessoa • Apuração do Boi v10.1 • 16 Filiais Conectadas
      </footer>

    </div>
  );
};
