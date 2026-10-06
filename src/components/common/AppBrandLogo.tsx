import React from 'react';

interface AppBrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'emblem' | 'full';
}

export const AppBrandLogo: React.FC<AppBrandLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  variant = 'emblem',
}) => {
  const sizeMap = {
    xs: { img: 'w-5 h-5', text: 'text-[10px]', sub: 'text-[8px]' },
    sm: { img: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]' },
    md: { img: 'w-9 h-9', text: 'text-sm', sub: 'text-[10px]' },
    lg: { img: 'w-12 h-12', text: 'text-base', sub: 'text-xs' },
    xl: { img: 'w-16 h-16', text: 'text-lg', sub: 'text-xs' },
  };

  const { img, text, sub } = sizeMap[size];

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <img
          src="/brand-logo.svg"
          alt="Gestão Integral de Compra Personalizado - Patrick Pessoa"
          className="max-w-full h-auto drop-shadow-md"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0">
        <img
          src="/icon.svg"
          alt="Ícone Oficial Patrick Pessoa - Apuração do Boi"
          className={`${img} rounded-xl shadow-md border border-emerald-900/30 object-contain`}
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black uppercase tracking-wider text-slate-900 dark:text-white ${text}`}>
            Gestão Apuração do Boi
          </span>
          <span className={`font-semibold text-emerald-700 dark:text-emerald-400 ${sub} truncate`}>
            ERP Comercial • Grupo GAPP
          </span>
        </div>
      )}
    </div>
  );
};
