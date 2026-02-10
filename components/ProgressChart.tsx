
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Task, Discipline } from '../types';

interface ProgressChartProps {
  tasks: Task[];
}

const COLORS = ['#00ffff', '#ff00ff', '#39ff14'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-surface p-2 border border-dark-border rounded">
        <p className="label text-white">{`${label}`}</p>
        <p className="intro text-neon-cyan">{`Progresso: ${payload[0].value.toFixed(1)}%`}</p>
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
    <div style={{ width: '100%', height: 300 }}>
        {tasks.length > 0 ? (
            <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#888" tick={{ fill: '#888' }} />
                <YAxis type="category" dataKey="name" stroke="#888" width={120} tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="progress" radius={[0, 5, 5, 0]}>
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                Sem dados para exibir o gráfico.
            </div>
        )}
    </div>
  );
};

export default ProgressChart;
