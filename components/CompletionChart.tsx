
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
      <div className="bg-dark-surface p-3 border border-dark-border shadow-lg">
        <p className="label text-white/40 font-mono text-[10px] mb-2">{`DATA: ${label}`}</p>
        <p className="text-neon-orange font-bold text-xs">{`PREVISTO: ${payload[0].value}`}</p>
        {payload[1] && payload[1].value !== null && <p className="text-neon-green font-bold text-xs">{`REALIZADO: ${payload[1].value}`}</p>}
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
        const maxDate = max([...allDates, new Date()]);

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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return dateInterval.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            
            plannedCumulative += plannedMap.get(dayKey) || 0;
            actualCumulative += actualMap.get(dayKey) || 0;

            const isFuture = day > today;

            return {
                date: format(day, 'dd/MM'),
                previstas: plannedCumulative,
                realizadas: isFuture ? null : actualCumulative
            };
        });

    }, [tasks]);
    
    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/5 min-h-[250px] uppercase font-black tracking-[5px]">
                Sem dados de análise.
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="previstas" name="PLANEJADO" stroke="#ff8c00" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="realizadas" name="EXECUTADO" stroke="#39ff14" strokeWidth={3} shadow="0 0 10px #39ff14" dot={false} connectNulls={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CompletionChart;