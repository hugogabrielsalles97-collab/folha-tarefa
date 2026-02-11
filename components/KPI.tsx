
import React from 'react';

interface KPIProps {
  title: string;
  value: string | number;
  color: 'cyan' | 'magenta' | 'green' | 'orange' | 'red';
}

const colorClasses = {
  cyan: { 
    text: 'text-neon-cyan', 
    border: 'border-neon-cyan', 
    shadow: 'shadow-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.2)]',
    glow: 'border-l-4 border-l-neon-cyan' 
  },
  magenta: { 
    text: 'text-neon-magenta', 
    border: 'border-neon-magenta', 
    shadow: 'shadow-neon-magenta shadow-[0_0_20px_rgba(255,0,255,0.2)]',
    glow: 'border-l-4 border-l-neon-magenta' 
  },
  green: { 
    text: 'text-neon-green', 
    border: 'border-neon-green', 
    shadow: 'shadow-neon-green shadow-[0_0_20px_rgba(57,255,20,0.2)]',
    glow: 'border-l-4 border-l-neon-green' 
  },
  orange: { 
    text: 'text-neon-orange', 
    border: 'border-neon-orange', 
    shadow: 'shadow-neon-orange shadow-[0_0_20px_rgba(255,140,0,0.2)]',
    glow: 'border-l-4 border-l-neon-orange' 
  },
  red: { 
    text: 'text-neon-red', 
    border: 'border-neon-red', 
    shadow: 'shadow-neon-red shadow-[0_0_20px_rgba(255,49,49,0.2)]',
    glow: 'border-l-4 border-l-neon-red' 
  }
};

const KPI: React.FC<KPIProps> = ({ title, value, color }) => {
  const classes = colorClasses[color];

  return (
    <div className={`technical-frame p-6 bg-dark-surface relative overflow-hidden group ${classes.shadow} ${classes.glow} transition-all duration-300 hover:bg-white/[0.02]`}>
        <div className="corner-marker corner-tl opacity-40"></div>
        <div className="corner-marker corner-br opacity-40"></div>
      
        <p className="text-[9px] font-black text-white/50 uppercase tracking-[3px] mb-2">{title}</p>
        <div className="flex items-baseline gap-2">
            <p className={`text-4xl font-black ${classes.text} transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`}>
                {value}
            </p>
            <div className={`flex-grow h-[1px] mb-2 bg-gradient-to-r from-transparent to-${colorClasses[color].border.split('-')[1]}-${colorClasses[color].border.split('-')[2]} opacity-40`}></div>
        </div>
    </div>
  );
};

export default KPI;
