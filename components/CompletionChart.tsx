import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// FIX: Import date-fns functions from their specific subpaths to resolve module resolution errors.
import { eachDayOfInterval, format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import min from 'date-fns/min';
import max from 'date-fns/max';
import { Task } from '../types';

interface CompletionChartProps {
  tasks: Task[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-surface p-2 border border-dark-border rounded">
        <p className="label text-white font-bold">{`Data: ${label}`}</p>
        <p className="intro text-neon-orange">{`Previsto: ${payload[0].value}`}</p>
        <p className="intro text-neon-green">{`Realizado: ${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};


const CompletionChart: React.FC<CompletionChartProps> = ({ tasks }) => {
    const chartData = useMemo(() => {
        const validTasks = tasks.filter(t => t.plannedEndDate);
        if (validTasks.length === 0) return [];

        const allDates = validTasks.flatMap(t => {
            const dates: Date[] = [parseISO(t.plannedEndDate)];
            if (t.actualEndDate) {
                dates.push(parseISO(t.actualEndDate));
            }
            return dates;
        });

        const minDate = min(allDates);
        const maxDate = max([...allDates, new Date()]); // Go up to today or last date

        const dateInterval = eachDayOfInterval({ start: minDate, end: maxDate });
        
        const plannedMap = new Map<string, number>();
        const actualMap = new Map<string, number>();

        validTasks.forEach(task => {
            const plannedKey = format(parseISO(task.plannedEndDate), 'yyyy-MM-dd');
            plannedMap.set(plannedKey, (plannedMap.get(plannedKey) || 0) + 1);

            if (task.actualEndDate && task.progress === 100) {
                 const actualKey = format(parseISO(task.actualEndDate), 'yyyy-MM-dd');
                 actualMap.set(actualKey, (actualMap.get(actualKey) || 0) + 1);
            }
        });

        let plannedCumulative = 0;
        let actualCumulative = 0;

        return dateInterval.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            
            plannedCumulative += plannedMap.get(dayKey) || 0;
            actualCumulative += actualMap.get(dayKey) || 0;

            return {
                date: format(day, 'dd/MM'),
                previstas: plannedCumulative,
                realizadas: actualCumulative
            };
        });

    }, [tasks]);
    
    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 min-h-[300px]">
                Sem dados de conclusão para exibir o gráfico.
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                    <YAxis stroke="#888" tick={{ fill: '#888' }} label={{ value: 'Nº Tarefas Acumulado', angle: -90, position: 'insideLeft', fill: '#888' }}/>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    <Line type="monotone" dataKey="previstas" name="Previstas" stroke="#ff8c00" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="realizadas" name="Realizadas" stroke="#39ff14" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CompletionChart;