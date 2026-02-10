
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Task } from '../types';

interface GanttChartProps {
  tasks: Task[];
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
    // This is a simplified Gantt chart. Recharts is not ideal for Gantt charts,
    // but we can create a functional representation.
    const { ganttData, domain } = useMemo(() => {
        if (tasks.length === 0) {
            return { ganttData: [], domain: [0, 0] };
        }
        
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());

        const allDates = sortedTasks.flatMap(t => [new Date(t.plannedStartDate).getTime(), new Date(t.plannedEndDate).getTime()]);
        const minDate = Math.min(...allDates);
        const maxDate = Math.max(...allDates);
        
        const ganttData = sortedTasks.map(task => {
            const plannedStart = new Date(task.plannedStartDate).getTime();
            const plannedEnd = new Date(task.plannedEndDate).getTime();
            const actualStart = task.actualStartDate ? new Date(task.actualStartDate).getTime() : null;
            
            const plannedDuration = plannedEnd - plannedStart;
            const progressWidth = (plannedDuration * task.progress) / 100;
            const actualProgressStart = actualStart || plannedStart;

            return {
                name: task.name,
                plannedRange: [plannedStart, plannedEnd],
                actualProgressRange: [actualProgressStart, actualProgressStart + progressWidth],
                task, // Pass full task for tooltip
            };
        });

        return { ganttData, domain: [minDate, maxDate] };
    }, [tasks]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const task = data.task as Task;
            return (
                <div className="bg-dark-surface p-3 border border-dark-border rounded shadow-lg text-sm">
                    <p className="font-bold text-neon-cyan mb-2">{task.name}</p>
                    <p><span className="font-semibold">Planejado:</span> {task.plannedStartDate} a {task.plannedEndDate}</p>
                    {task.actualStartDate && <p><span className="font-semibold">Real:</span> {task.actualStartDate} a {task.actualEndDate || '...'}</p>}
                    <p><span className="font-semibold">Progresso:</span> {task.progress}%</p>
                </div>
            );
        }
        return null;
    };

    if (tasks.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">Sem tarefas para exibir no cronograma.</div>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={ganttData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis 
                        type="number" 
                        domain={domain} 
                        scale="time" 
                        stroke="#888"
                        tickFormatter={(time) => new Date(time).toLocaleDateString('pt-BR')} 
                        tick={{ fill: '#888' }}
                    />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#888"
                        width={100}
                        tick={{ fill: '#888', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar dataKey="plannedRange" stackId="a" fill="#ff00ff" fillOpacity="0.3" shape={<div />} />
                    <Bar dataKey="actualProgressRange" stackId="a" fill="#39ff14" shape={<div />} />
                    
                     {/* Custom rendering using ReferenceArea to simulate Gantt bars */}
                    {ganttData.map((entry, index) => (
                        <ReferenceArea 
                            key={`planned-${index}`}
                            y1={entry.name} y2={entry.name}
                            x1={entry.plannedRange[0]} x2={entry.plannedRange[1]}
                            ifOverflow="visible"
                            fill="#ff00ff"
                            fillOpacity={0.3}
                            stroke="#ff00ff"
                            strokeOpacity={0.6}
                        />
                    ))}
                    {ganttData.map((entry, index) => (
                         entry.task.progress > 0 &&
                        <ReferenceArea 
                            key={`actual-${index}`}
                            y1={entry.name} y2={entry.name}
                            x1={entry.actualProgressRange[0]} x2={entry.actualProgressRange[1]}
                            ifOverflow="visible"
                            fill="#39ff14"
                            fillOpacity={0.8}
                        />
                    ))}

                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GanttChart;
