
import React, { useMemo, useState } from 'react';
import { Task, Discipline } from '../types';
import KPI from './KPI';
import ProgressChart from './ProgressChart';
import GanttChart from './GanttChart';
import TaskList from './TaskList';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS } from '../constants';
import CompletionChart from './CompletionChart';

interface DashboardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TechnicalFrame: React.FC<{ title: string; children: React.ReactNode; className?: string; headerContent?: React.ReactNode }> = ({ title, children, className = "", headerContent }) => (
  <div className={`technical-frame ${className}`}>
    <div className="corner-marker corner-tl"></div>
    <div className="corner-marker corner-tr"></div>
    <div className="corner-marker corner-bl"></div>
    <div className="corner-marker corner-br"></div>
    <div className="flex justify-between items-start">
      <div className="eng-header-tab mb-6">{title}</div>
      {headerContent}
    </div>
    <div className="relative z-0">
      {children}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ tasks, onEditTask, onDeleteTask }) => {
  const [filter, setFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [specificFieldFilter, setSpecificFieldFilter] = useState('');
  const [ganttOAEFilter, setGanttOAEFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task | 'status'; direction: 'asc' | 'desc' }>({ key: 'plannedStartDate', direction: 'asc' });

  // Consolidação de todos os níveis possíveis para o filtro
  const allAvailableLevels = useMemo(() => {
    return Array.from(new Set(Object.values(DISCIPLINE_LEVELS).flat()));
  }, []);

  const { filteredTasks, stats } = useMemo(() => {
    const filtered = tasks.filter(task => {
      const nameMatch = task.name.toLowerCase().includes(filter.toLowerCase());
      const disciplineMatch = !disciplineFilter || task.discipline === disciplineFilter;
      const levelMatch = !levelFilter || task.level === levelFilter;
      
      let specificFieldMatch = true;
      if (disciplineFilter && specificFieldFilter) {
          if (disciplineFilter === Discipline.OAE) {
              specificFieldMatch = task.obraDeArte === specificFieldFilter;
          } else {
              specificFieldMatch = task.corte === specificFieldFilter;
          }
      }

      if (!task.plannedStartDate) return false;
      const taskDate = new Date(task.plannedStartDate + 'T00:00:00');
      const start = startDate ? new Date(startDate + 'T00:00:00') : null;
      const end = endDate ? new Date(endDate + 'T00:00:00') : null;

      const startDateMatch = !start || taskDate >= start;
      const endDateMatch = !end || taskDate <= end;

      return nameMatch && disciplineMatch && levelMatch && specificFieldMatch && startDateMatch && endDateMatch;
    });

    const totalTasks = filtered.length;
    const completedTasks = filtered.filter(t => t.progress === 100).length;
    const inProgressTasks = filtered.filter(
      t => t.progress > 0 && t.progress < 100
    ).length;
    const totalProgress = filtered.reduce((acc, t) => acc + t.progress, 0);
    const overallProgress =
      totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;

    return {
      filteredTasks: filtered,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overallProgress,
      },
    };
  }, [tasks, filter, startDate, endDate, disciplineFilter, levelFilter, specificFieldFilter]);
  
  const handleSort = (key: keyof Task | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const handleDisciplineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDiscipline = e.target.value;
    setDisciplineFilter(newDiscipline);
    setLevelFilter(''); 
    setSpecificFieldFilter('');
  };

  const sortedTasks = useMemo(() => {
    const getStatusValue = (task: Task) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(task.plannedEndDate + 'T00:00:00');
        if (task.progress === 100) return 3; // Concluído
        if (today > endDate) return 0; // Atrasado
        if (!task.actualStartDate) return 1; // Não Iniciada
        return 2; // Em Andamento
    };
    
    return [...filteredTasks].sort((a, b) => {
        if (!sortConfig.key) return 0;
        if (sortConfig.key === 'status') {
            const statusA = getStatusValue(a);
            const statusB = getStatusValue(b);
            return sortConfig.direction === 'desc' ? statusB - statusA : statusA - statusB;
        }
        const aVal = a[sortConfig.key as keyof Task];
        const bVal = b[sortConfig.key as keyof Task];
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison = 0;
        if (sortConfig.key === 'progress') {
            comparison = (aVal as number) - (bVal as number);
        } else if (['plannedStartDate', 'plannedEndDate'].includes(sortConfig.key)) {
            comparison = new Date(aVal.toString()).getTime() - new Date(bVal.toString()).getTime();
        } else {
            comparison = aVal.toString().localeCompare(bVal.toString());
        }
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
    });
  }, [filteredTasks, sortConfig]);

  const ganttTasks = useMemo(() => {
    if (!ganttOAEFilter) return filteredTasks;
    return filteredTasks.filter(task => task.obraDeArte === ganttOAEFilter);
  }, [filteredTasks, ganttOAEFilter]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <KPI title="Total Atividades" value={stats.totalTasks} color="cyan" />
        <KPI title="Status: Concluído" value={stats.completedTasks} color="green" />
        <KPI title="Status: Em Andamento" value={stats.inProgressTasks} color="orange" />
        <KPI title="Avanço Físico Geral" value={`${stats.overallProgress}%`} color="magenta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        <TechnicalFrame title="PROGRESSO DISCIPLINAR" className="lg:col-span-1">
          <ProgressChart tasks={filteredTasks} />
        </TechnicalFrame>
        
        <TechnicalFrame 
          title="LINHA DO TEMPO (GANTT)" 
          className="lg:col-span-2"
          headerContent={
            <div className="flex flex-col items-end">
              <select
                id="ganttOAEFilter"
                value={ganttOAEFilter}
                onChange={e => setGanttOAEFilter(e.target.value)}
                className="bg-dark-bg border-2 border-neon-orange shadow-neon-orange text-white p-2 text-xs font-bold uppercase outline-none focus:bg-neon-orange focus:text-black transition-all"
              >
                <option value="">TODAS AS OBRAS</option>
                {OBRAS_DE_ARTE_OPTIONS.map(oae => <option key={oae} value={oae}>{oae}</option>)}
              </select>
            </div>
          }
        >
          <GanttChart tasks={ganttTasks} />
        </TechnicalFrame>
      </div>

      <TechnicalFrame title="PREVISTO VS REALIZADO" className="print:hidden">
        <CompletionChart tasks={filteredTasks} />
      </TechnicalFrame>

      <TechnicalFrame 
        title="LISTA DE TAREFAS"
        headerContent={
          <div className="flex flex-wrap items-end gap-3 print:hidden">
            <div className="flex gap-2">
              <div className="flex flex-col">
                  <span className="text-[7px] font-black text-neon-cyan uppercase tracking-tighter mb-0.5">Início (prev)</span>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-dark-bg border border-dark-border p-2 text-xs text-white outline-none focus:border-neon-cyan h-[34px]" />
              </div>
              <div className="flex flex-col">
                  <span className="text-[7px] font-black text-neon-cyan uppercase tracking-tighter mb-0.5">Fim (prev)</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-dark-bg border border-dark-border p-2 text-xs text-white outline-none focus:border-neon-cyan h-[34px]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-neon-cyan uppercase tracking-tighter mb-0.5">Nível</span>
              <select 
                value={levelFilter} 
                onChange={e => setLevelFilter(e.target.value)} 
                className="bg-dark-bg border border-dark-border p-2 text-xs text-white outline-none focus:border-neon-cyan uppercase font-bold h-[34px] min-w-[140px]"
              >
                  <option value="">TODOS OS NÍVEIS</option>
                  {allAvailableLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-eng-blue text-black font-black py-2 px-5 text-xs uppercase border border-black hover:opacity-80 transition-opacity h-[34px]"
            >
              Imprimir
            </button>
          </div>
        }
      >
        <div className="mt-4">
          <TaskList 
              tasks={sortedTasks} 
              onEdit={onEditTask} 
              onDelete={onDeleteTask}
              onSort={handleSort}
              sortConfig={sortConfig}
          />
        </div>
      </TechnicalFrame>
    </div>
  );
};

export default Dashboard;
