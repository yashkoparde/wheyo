import React from 'react';
import { cn } from './Layout';

export interface TagProps {
  label: string;
  type?: 'protein' | 'veg' | 'price' | 'gym' | 'default';
  className?: string;
  key?: React.Key;
}

export function Tag({ label, type = 'default', className }: TagProps) {
  const baseStyles = "px-2.5 py-1 rounded-full text-xs font-mono font-bold border backdrop-blur-md flex items-center gap-1.5 transition-all";
  
  const typeStyles = {
    protein: "bg-[#D4FF00]/10 text-[#D4FF00] border-[#D4FF00]/20 hover:border-[#D4FF00]/50",
    veg: "bg-green-900/40 text-green-400 border-green-500/30 hover:border-green-500/60",
    price: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:border-orange-500/50",
    gym: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/50",
    default: "bg-white/5 text-gray-300 border-white/10 hover:border-white/20"
  };

  return (
    <span className={cn(baseStyles, typeStyles[type], className)}>
      {label}
    </span>
  );
}
