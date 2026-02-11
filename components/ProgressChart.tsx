
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Task, Discipline } from '../types';

interface ProgressChartProps {
  tasks: Task[];
}

const COLORS = ['#00f3ff', '#ff00ff', '#39ff14'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-surface p-3 border border-dark-border text-[10px] font-bold shadow-neon-cyan">
        <p className="label uppercase text-white/50">{`${label}`}</p>
        <p className="intro text-neon-cyan">{`AVANÇO: ${payload[0].value.toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

const ProgressChart: React.FC<ProgressChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const disciplineProgress: { [key in Discipline]: { total: number, count: number } } = {
      [Discipline.OAE]: { total: 0, count: 0 },
      [Discipline.TERRAPLANAGEM]: { total: 0, count: 0 },
      [Discipline.CONTENCOES]: { total: 0, count: 0 },
    };

    tasks.forEach(task => {
      disciplineProgress[task.discipline].total += task.progress;
      disciplineProgress[task.discipline].count++;
    });

    return Object.entries(disciplineProgress).map(([name, data]) => ({
      name,
      progress: data.count > 0 ? data.total / data.count : 0,
    }));
  }, [tasks]);

  return (
    <div style={{ width: '100%', height: 400 }}>
        {tasks.length > 0 ? (
            <ResponsiveContainer>
                <BarChart 
                  data={chartData} 
                  layout="vertical" 
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                <XAxis type="number" domain={[0, 100]} stroke="#2a2a30" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#2a2a30" 
                  width={140} 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="progress" barSize={30} radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-white/10 text-[10px] font-black uppercase tracking-[3px]">
                Sem telemetria disponível.
            </div>
        )}
    </div>
  );
};

export default ProgressChart;