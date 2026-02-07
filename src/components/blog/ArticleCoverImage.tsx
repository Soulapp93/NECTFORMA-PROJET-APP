import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, User } from 'lucide-react';
import logoNf from '@/assets/logo-nf.png';

interface ArticleCoverImageProps {
  title: string;
  className?: string;
  size?: 'card' | 'hero';
  publishedAt?: string | null;
  readTime?: number | null;
}

/**
 * Branded cover image component inspired by Digiforma.
 * Renders a consistent visual with Nectforma branding + article title overlay.
 */
const ArticleCoverImage: React.FC<ArticleCoverImageProps> = ({ title, className = '', size = 'hero', publishedAt, readTime }) => {
  const isCard = size === 'card';

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 ${className}`}>
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[55%] h-[80%] rounded-full bg-white/10 blur-sm" />
        <div className="absolute -bottom-[15%] -right-[8%] w-[45%] h-[70%] rounded-full bg-white/8 blur-sm" />
        <div className="absolute top-[15%] right-[20%] w-[18%] h-[28%] rounded-full bg-white/12" />
        <div className="absolute top-[10%] left-[60%] w-[30%] h-[30%] opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: isCard ? '8px 8px' : '12px 12px',
          }}
        />
        <div className="absolute bottom-[25%] left-[5%] w-[35%] h-[3px] bg-white/20 rounded-full" />
        <div className="absolute top-[60%] left-[45%] w-[6%] h-[10%] bg-white/15 rounded-lg rotate-12" />
        <div className="absolute top-[20%] left-[30%] w-[4%] h-[7%] bg-white/10 rounded-md -rotate-6" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 sm:p-6 md:p-8">
        {/* Title area — centered */}
        <div className="flex-1 flex items-center justify-center text-center">
          <h2 className={`font-bold text-white leading-tight ${
            isCard 
              ? 'text-sm sm:text-base line-clamp-3 max-w-[90%]' 
              : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl line-clamp-4 max-w-[90%]'
          }`}>
            {title}
          </h2>
        </div>

        {/* Bottom bar: metadata left + logo right */}
        <div className="flex items-end justify-between mt-3">
          {/* Author + Date + Read time */}
          {!isCard && (publishedAt || readTime) ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <User className="h-3.5 w-3.5 text-white/80" />
                <span className="text-xs sm:text-sm font-medium text-white">Équipe Nectforma</span>
              </div>
              {publishedAt && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-white/80" />
                  <span className="text-xs sm:text-sm text-white">
                    {format(new Date(publishedAt), 'd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              {readTime && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-white/80" />
                  <span className="text-xs sm:text-sm text-white">{readTime} min</span>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Logo */}
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
            <img src={logoNf} alt="Nectforma" className={isCard ? 'h-4' : 'h-5 sm:h-6'} />
            <span className={`font-semibold text-white ${isCard ? 'text-xs' : 'text-sm sm:text-base'}`}>
              Nectforma
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCoverImage;
