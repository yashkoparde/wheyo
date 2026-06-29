import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from './Layout';

// Custom Breakpoint Observer Hook
export function useBreakpointObserver(breakpointWidth = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpointWidth;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpointWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpointWidth]);

  return isMobile;
}

export interface BentoItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  glow: string;
  colSpan?: string; // Col span for desktop grid
  description?: string; // Info text for bento card
  badge?: string; // Optional badge like "Core", "Beta", etc.
}

interface ResponsiveBentoWrapperProps {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  items: BentoItem[];
  renderDetailContent: (id: string) => React.ReactNode;
}

export const ResponsiveBentoWrapper: React.FC<ResponsiveBentoWrapperProps> = ({
  activeTab,
  setActiveTab,
  items,
  renderDetailContent,
}) => {
  const isMobile = useBreakpointObserver(768);

  const toggleAccordion = (id: string) => {
    if (activeTab === id) {
      setActiveTab(null);
    } else {
      setActiveTab(id);
      // Optional: Smooth scroll to the expanded accordion header
      setTimeout(() => {
        const el = document.getElementById(`accordion-header-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  if (isMobile) {
    // Mobile Accordion View
    return (
      <div className="w-full space-y-3.5 mb-8" id="athlete-accordion-container">
        <span className="text-[9.5px] font-mono text-[#D4FF00] uppercase tracking-widest block mb-1 font-black text-center">
          ATHLETE PANEL HUB (ACCORDION)
        </span>
        <div className="space-y-3">
          {items.map((item) => {
            const IconComponent = item.icon;
            const isOpen = activeTab === item.id;

            return (
              <div 
                key={item.id} 
                className="border border-white/5 bg-[#09090B]/60 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300"
                style={{
                  borderColor: isOpen ? `${item.color}33` : 'rgba(255,255,255,0.05)',
                  boxShadow: isOpen ? `0 4px 20px ${item.glow}` : 'none'
                }}
              >
                {/* Accordion Header */}
                <button
                  id={`accordion-header-${item.id}`}
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform shrink-0"
                      style={{ 
                        backgroundColor: isOpen ? `${item.color}20` : 'rgba(255,255,255,0.03)',
                        color: item.color
                      }}
                    >
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-[13px] sm:text-sm font-black uppercase text-zinc-100 tracking-wide">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span 
                            className="text-[7px] font-mono font-black uppercase px-1.5 py-0.5 rounded leading-none"
                            style={{ 
                              backgroundColor: `${item.color}15`, 
                              color: item.color,
                              border: `1px solid ${item.color}30`
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] font-mono text-zinc-500 block truncate max-w-[200px] sm:max-w-xs mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <div 
                    className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="border-t border-white/5 p-4 bg-black/45">
                        {renderDetailContent(item.id)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Bento Grid View
  return (
    <div className="w-full space-y-5 mb-8" id="athlete-bento-container">
      <span className="text-[9.5px] font-mono text-[#D4FF00] uppercase tracking-widest block font-black text-center">
        ATHLETE CONTROL HUB (BENTO GRID)
      </span>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 max-w-7xl mx-auto w-full">
        {items.map((item) => {
          const IconComponent = item.icon;
          const isSelected = activeTab === item.id;
          const colSpan = item.colSpan || 'col-span-1';

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={cn(
                colSpan,
                "relative group cursor-pointer overflow-hidden rounded-3xl border backdrop-blur-md transition-all duration-300",
                "bg-gradient-to-br from-[#0A0A0C] via-[#050507] to-[#010103] p-5.5 min-h-[145px] flex flex-col justify-between"
              )}
              style={{
                borderColor: isSelected ? `${item.color}50` : 'rgba(255,255,255,0.05)',
                boxShadow: isSelected ? `0 10px 30px ${item.glow}` : 'none'
              }}
            >
              {/* Card Corner Tech Glow */}
              <div 
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity"
                style={{ backgroundColor: item.color }}
              />

              {/* Rotating Outer Tech Ring inside top-left icon */}
              <div className="flex items-start justify-between">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 bg-zinc-950 border border-white/5"
                  style={{ color: isSelected ? item.color : '#8A8A93' }}
                >
                  <svg 
                    className="absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none opacity-25 group-hover:opacity-50" 
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="fill-none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4, 6"
                    />
                  </svg>
                  <IconComponent className="w-5.5 h-5.5 transition-transform group-hover:rotate-12 duration-300" />
                </div>

                {item.badge && (
                  <span 
                    className="text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${item.color}15`, 
                      color: item.color,
                      border: `1px solid ${item.color}25`
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Card Title & Desc */}
              <div className="mt-6">
                <h3 className="font-display text-[15px] font-black uppercase text-zinc-100 tracking-wide group-hover:text-white transition-colors">
                  {item.label}
                </h3>
                {item.description && (
                  <p className="text-[11px] font-mono text-zinc-400 mt-1.5 leading-relaxed group-hover:text-zinc-300 transition-colors line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Glowing Corner Chevron indicator */}
              <div className="absolute bottom-4 right-4 text-zinc-600 group-hover:text-white transition-colors duration-200">
                <svg 
                  className="w-4.5 h-4.5 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
