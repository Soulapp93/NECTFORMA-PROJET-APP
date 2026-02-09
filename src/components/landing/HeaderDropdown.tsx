import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
  isAnchor?: boolean;
  icon?: React.ElementType;
}

interface HeaderDropdownProps {
  label: string;
  items: DropdownItem[];
}

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-1 px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-200 rounded-lg hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in"
          style={{ boxShadow: '0 25px 60px -12px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.08)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 grid grid-cols-2 gap-1">
            {items.map((item) => {
              const IconComponent = item.icon;
              const content = (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/8 transition-all duration-200 group cursor-pointer">
                  {IconComponent && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-200">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-popover-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </div>
              );

              return item.isAnchor ? (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    const el = document.querySelector(item.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => {
                    setIsOpen(false);
                    if (item.href.includes('#')) {
                      setTimeout(() => {
                        const hash = item.href.split('#')[1];
                        const el = document.getElementById(hash);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 300);
                    }
                  }}
                >
                  {content}
                </Link>
              );
            })}
          </div>
          
          {/* Bottom CTA */}
          <div className="border-t border-border/50 p-3 bg-primary/5">
            <Link
              to="/fonctionnalites"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors rounded-lg hover:bg-primary/10"
            >
              Voir toutes les fonctionnalités
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderDropdown;
