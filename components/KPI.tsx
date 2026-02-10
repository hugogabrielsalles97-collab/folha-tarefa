
import React from 'react';

interface KPIProps {
  title: string;
  value: string | number;
  color: 'cyan' | 'magenta' | 'green' | 'orange';
}

const colorClasses = {
  cyan: {
    text: 'text-neon-cyan',
    border: 'border-neon-cyan',
    shadow: 'shadow-neon-cyan/20'
  },
  magenta: {
    text: 'text-neon-magenta',
    border: 'border-neon-magenta',
    shadow: 'shadow-neon-magenta/20'
  },
  green: {
    text: 'text-neon-green',
    border: 'border-neon-green',
    shadow: 'shadow-neon-green/20'
  },
  orange: {
    text: 'text-neon-orange',
    border: 'border-neon-orange',
    shadow: 'shadow-neon-orange/20'
  }
};

const KPI: React.FC<KPIProps> = ({ title, value, color }) => {
  const classes = colorClasses[color];

  return (
    <div className={`bg-dark-surface p-6 rounded-lg border-l-4 ${classes.border} ${classes.shadow} shadow-lg`}>
      <p className="text-sm text-gray-400">{title}</p>
      <p className={`text-4xl font-bold ${classes.text}`}>{value}</p>
    </div>
  );
};

export default KPI;
