
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Task } from '../types';

interface GanttChartProps {
  tasks: Task[];
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
    const { ganttData, domain } = useMemo(() => {
        if (tasks.length === 0) {
            return { ganttData: [], domain: [0, 0] };
        }
        
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.plannedStartDate + 'T00:00:00').getTime() - new Date(b.plannedStartDate + 'T00:00:00').getTime());

        const allDates = sortedTasks.flatMap(t => [new Date(t.plannedStartDate + 'T00:00:00').getTime(), new Date(t.plannedEndDate + 'T00:00:00').getTime()]);
        const minDate = Math.min(...allDates);
        const maxDate = Math.max(...allDates);
        
        const ganttData = sortedTasks.map(task => {
            const plannedStart = new Date(task.plannedStartDate + 'T00:00:00').getTime();
            const plannedEnd = new Date(task.plannedEndDate + 'T00:00:00').getTime();
            const actualStart = task.actualStartDate ? new Date(task.actualStartDate + 'T00:00:00').getTime() : null;
            
            const plannedDuration = plannedEnd - plannedStart;
            const progressWidth = (plannedDuration * task.progress) / 100;
            const actualProgressStart = actualStart || plannedStart;

            return {
                name: task.name,
                plannedRange: [plannedStart, plannedEnd],
                actualProgressRange: [actualProgressStart, actualProgressStart + progressWidth],
                task,
            };
        });

        return { ganttData, domain: [minDate, maxDate] };
    }, [tasks]);

    const getStatusColor = (task: Task) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const plannedEndDate = new Date(task.plannedEndDate + 'T00:00:00');
        
        if (task.progress === 100) return '#39ff14'; // Verde Neon (CONCLUÍDO)
        if (today > plannedEndDate) return '#ff3131'; // Vermelho Neon (ATRASADO)
        if (!task.actualStartDate) return '#ff8c00';  // Laranja Neon (NÃO INICIADA)
        return '#00f3ff';                            // Ciano Neon (EM ANDAMENTO)
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const task = data.task as Task;
            const color = getStatusColor(task);
            
            return (
                <div className="bg-black p-5 border-2 shadow-lg text-sm font-mono" style={{ borderColor: color, boxShadow: `0 0 15px ${color}44` }}>
                    <p className="font-black mb-3 uppercase tracking-widest border-b-2 border-white/10 pb-3 text-base" style={{ color: color }}>{task.name}</p>
                    <p className="text-white/90 mb-2"><span className="text-neon-orange font-black">PREVISTO:</span> {task.plannedStartDate} → {task.plannedEndDate}</p>
                    {task.actualStartDate && <p className="text-white/90 mb-2"><span className="font-black" style={{ color: color }}>EXECUTADO:</span> {task.actualStartDate} → {task.actualEndDate || 'EM CURSO'}</p>}
                    <p className="text-white font-black mt-4 text-2xl flex items-baseline gap-2">
                        <span style={{ color: color }}>PROGRESSO:</span> {task.progress}%
                    </p>
                </div>
            );
        }
        return null;
    };

    if (tasks.length === 0) {
        return <div className="flex items-center justify-center h-full text-white/5 font-black uppercase tracking-[15px]">Cronograma Indisponível</div>;
    }

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={ganttData} layout="vertical" margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
                    <XAxis 
                        type="number" 
                        domain={domain} 
                        scale="time" 
                        stroke="#2a2a30"
                        tickFormatter={(time) => new Date(time).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                    />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#2a2a30"
                        width={140}
                        tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'black' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.08)' }} />
                    
                    <Bar dataKey="plannedRange" stackId="a" fill="transparent" shape={<g />} />
                    
                    {ganttData.map((entry, index) => {
                        const statusColor = getStatusColor(entry.task);
                        
                        const plannedAreaProps: any = {
                          fill: '#ffffff',
                          fillOpacity: 0.05,
                          stroke: '#ffffff',
                          strokeWidth: 1,
                          strokeDasharray: '2 2'
                        };
                        
                        const actualAreaProps: any = {
                          fill: statusColor,
                          fillOpacity: 0.8,
                          stroke: statusColor,
                          strokeWidth: 1,
                          style: { filter: `drop-shadow(0 0 5px ${statusColor})` }
                        };

                        return (
                            <React.Fragment key={`gantt-entry-${index}`}>
                                <ReferenceArea
                                    y1={entry.name} y2={entry.name}
                                    x1={entry.plannedRange[0]} x2={entry.plannedRange[1]}
                                    ifOverflow="visible"
                                    {...plannedAreaProps}
                                />
                                {entry.task.progress > 0 &&
                                    <ReferenceArea
                                        y1={entry.name} y2={entry.name}
                                        x1={entry.actualProgressRange[0]} x2={entry.actualProgressRange[1]}
                                        ifOverflow="visible"
                                        {...actualAreaProps}
                                    />
                                }
                            </React.Fragment>
                        );
                    })}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GanttChart;
