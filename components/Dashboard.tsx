
import React, { useMemo, useState } from 'react';
import { Task } from '../types';
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

const Dashboard: React.FC<DashboardProps> = ({ tasks, onEditTask, onDeleteTask }) => {
  const [filter, setFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [ganttOAEFilter, setGanttOAEFilter] = useState('');

  const allLevels = useMemo(() => {
    const levels = Object.values(DISCIPLINE_LEVELS).flat();
    return [...new Set(levels)].sort();
  }, []);

  const { filteredTasks, stats } = useMemo(() => {
    const filtered = tasks.filter(task => {
      const nameMatch = task.name.toLowerCase().includes(filter.toLowerCase());
      const levelMatch = !levelFilter || task.level === levelFilter;

      // Date filtering logic
      if (!task.plannedStartDate) return false;
      // Using UTC to prevent timezone issues with 'YYYY-MM-DD' strings
      const taskDate = new Date(task.plannedStartDate + 'T00:00:00');
      const start = startDate ? new Date(startDate + 'T00:00:00') : null;
      const end = endDate ? new Date(endDate + 'T00:00:00') : null;

      const startDateMatch = !start || taskDate >= start;
      const endDateMatch = !end || taskDate <= end;

      return nameMatch && levelMatch && startDateMatch && endDateMatch;
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
  }, [tasks, filter, startDate, endDate, levelFilter]);

  const ganttTasks = useMemo(() => {
    if (!ganttOAEFilter) {
        return filteredTasks;
    }
    return filteredTasks.filter(task => task.obraDeArte === ganttOAEFilter);
  }, [filteredTasks, ganttOAEFilter]);


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        <KPI title="Total de Tarefas" value={stats.totalTasks} color="cyan" />
        <KPI title="Tarefas Concluídas" value={stats.completedTasks} color="green" />
        <KPI title="Tarefas em Andamento" value={stats.inProgressTasks} color="orange" />
        <KPI title="Progresso Geral" value={`${stats.overallProgress}%`} color="magenta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        <div className="lg:col-span-1 bg-dark-surface p-6 rounded-lg border border-dark-border">
          <h3 className="text-xl font-semibold text-neon-cyan mb-4">Progresso por Disciplina</h3>
          <ProgressChart tasks={filteredTasks} />
        </div>
        <div className="lg:col-span-2 bg-dark-surface p-6 rounded-lg border border-dark-border">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h3 className="text-xl font-semibold text-neon-cyan">Linha do Tempo (Gantt)</h3>
            <div>
              <label htmlFor="ganttOAEFilter" className="sr-only">Filtrar por Obra de Arte</label>
              <select
                id="ganttOAEFilter"
                value={ganttOAEFilter}
                onChange={e => setGanttOAEFilter(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-md shadow-sm p-2 text-white focus:ring-neon-cyan focus:border-neon-cyan text-sm"
              >
                <option value="">Todas as Obras de Arte</option>
                {OBRAS_DE_ARTE_OPTIONS.map(oae => (
                  <option key={oae} value={oae}>{oae}</option>
                ))}
              </select>
            </div>
          </div>
          <GanttChart tasks={ganttTasks} />
        </div>
      </div>

      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border print:hidden">
          <h3 className="text-xl font-semibold text-neon-cyan mb-4">Previsto vs. Realizado</h3>
          <CompletionChart tasks={filteredTasks} />
      </div>

      <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h3 className="text-xl font-semibold text-neon-cyan">Lista de Tarefas</h3>
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap items-end gap-4 print:hidden">
                <div>
                  <label htmlFor="startDate" className="block text-xs font-medium text-gray-400 mb-1">Data Início (Prev.)</label>
                  <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="bg-dark-bg border border-dark-border rounded-md shadow-sm p-2 text-white focus:ring-neon-cyan focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-xs font-medium text-gray-400 mb-1">Data Fim (Prev.)</label>
                  <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="bg-dark-bg border border-dark-border rounded-md shadow-sm p-2 text-white focus:ring-neon-cyan focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <label htmlFor="levelFilter" className="block text-xs font-medium text-gray-400 mb-1">Filtrar por Nível</label>
                  <select
                      id="levelFilter"
                      value={levelFilter}
                      onChange={e => setLevelFilter(e.target.value)}
                      className="bg-dark-bg border border-dark-border rounded-md shadow-sm p-2 text-white focus:ring-neon-cyan focus:border-neon-cyan w-full min-w-[180px]"
                  >
                      <option value="">Todos os Níveis</option>
                      {allLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="textFilter" className="block text-xs font-medium text-gray-400 mb-1">Filtrar por nome</label>
                  <input
                      id="textFilter"
                      type="text"
                      placeholder="Nome da tarefa..."
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      className="bg-dark-bg border border-dark-border rounded-md shadow-sm p-2 text-white focus:ring-neon-cyan focus:border-neon-cyan"
                  />
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="print:hidden self-end bg-neon-cyan/90 text-black font-bold py-2 px-4 rounded-lg hover:bg-neon-cyan transition-all duration-300 h-10"
              >
                Imprimir
              </button>
            </div>
        </div>
        <TaskList tasks={filteredTasks} onEdit={onEditTask} onDelete={onDeleteTask} />
      </div>
    </div>
  );
};

export default Dashboard;