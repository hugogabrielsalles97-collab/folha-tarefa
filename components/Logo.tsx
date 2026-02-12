
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 250 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="logoTitle"
    >
      <title id="logoTitle">Logo Engetec Infra</title>
      <style>{`
        .engetec-text {
          font-family: 'ui-sans-serif', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
        }
        .infra-text {
          font-family: 'ui-sans-serif', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
        }
      `}</style>

      {/* Onda gráfica */}
      <path 
        className="text-neon-cyan" 
        d="M0 60 Q 20 45, 40 60 T 80 60 T 120 60 T 160 60 L 160 80 L 0 80 Z" 
        fill="currentColor" 
        style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
      />

      {/* Bloco laranja para o "Infra" */}
      <rect 
        x="160" 
        y="45" 
        width="90" 
        height="35" 
        className="text-neon-orange" 
        fill="currentColor"
        style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
      />
      
      {/* Texto "Engetec" */}
      <text x="5" y="72" className="engetec-text text-white" fill="currentColor">
        Engetec
      </text>

      {/* Texto "Infra" */}
      <text x="168" y="72" className="infra-text text-black" fill="currentColor">
        Infra
      </text>
    </svg>
  );
};
