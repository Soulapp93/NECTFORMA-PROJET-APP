import React from 'react';
import { Link } from 'react-router-dom';

interface NectformaLogoProps {
  variant?: 'light' | 'dark' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  linkTo?: string;
  className?: string;
}

const NectformaLogo: React.FC<NectformaLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showIcon = true,
  linkTo,
  className = '',
}) => {
  const sizeConfig = {
    sm: { icon: 'w-7 h-7', iconText: 'text-[10px]', text: 'text-sm', oSize: '' },
    md: { icon: 'w-8 h-8', iconText: 'text-xs', text: 'text-lg', oSize: '' },
    lg: { icon: 'w-10 h-10', iconText: 'text-sm', text: 'text-xl', oSize: '' },
    xl: { icon: 'w-12 h-12', iconText: 'text-base', text: 'text-2xl', oSize: '' },
  };

  const config = sizeConfig[size];

  const textColorClass = {
    light: 'text-white',
    dark: 'text-foreground',
    gradient: 'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
  }[variant];

  const oColorClass = {
    light: 'text-white/70',
    dark: 'text-primary',
    gradient: 'text-primary',
  }[variant];

  const iconBgClass = {
    light: 'bg-white/20 backdrop-blur-sm border border-white/30',
    dark: 'bg-gradient-to-br from-primary to-accent',
    gradient: 'bg-gradient-to-br from-primary to-accent',
  }[variant];

  const iconTextClass = {
    light: 'text-white',
    dark: 'text-primary-foreground',
    gradient: 'text-primary-foreground',
  }[variant];

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className={`${config.icon} ${iconBgClass} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
          <span className={`${iconTextClass} font-extrabold ${config.iconText} tracking-tight`}>NF</span>
        </div>
      )}
      <span className={`${config.text} font-bold tracking-tight ${textColorClass}`}>
        Nectf<span className={`${oColorClass} font-extrabold`}>o</span>rma
      </span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export default NectformaLogo;
