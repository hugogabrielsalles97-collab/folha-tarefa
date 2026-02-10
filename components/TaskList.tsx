import React from 'react';
import { Task } from '../types';
import { EditIcon, DeleteIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSort: (key: keyof Task | 'status') => void;
  sortConfig: { key: keyof Task | 'status' | null; direction: 'asc' | 'desc' };
}

const TaskItem: React.FC<{ task: Task; onEdit: (task: Task) => void; onDelete: (taskId: string) => void; }> = ({ task, onEdit, onDelete }) => {
  const { role } = useAuth();
  const showActions = role === 'PLANEJADOR' || role === 'PRODUÇÃO';

  const getStatusColor = (progress: number, plannedEndDate: string) => {
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    const endDate = new Date(plannedEndDate + 'T00:00:00');
    if (progress === 100) return 'bg-neon-green/20 text-neon-green';
    if (today > endDate) return 'bg-red-500/20 text-red-400';
    return 'bg-neon-orange/20 text-neon-orange';
  };
  
  const statusText = (progress: number, plannedEndDate: string) => {
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    const endDate = new Date(plannedEndDate + 'T00:00:00');
    if (progress === 100) return 'Concluída';
    if (today > endDate) return 'Atrasada';
    return 'Em Andamento';
  }

  return (
    <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-dark-border hover:bg-dark-bg transition-colors duration-200">
      <div className="col-span-12 md:col-span-3">
        <p className="font-bold text-white">{task.name}</p>
        <p className="text-xs text-gray-400">{task.discipline} / {task.level}</p>
      </div>
      <div className="col-span-6 md:col-span-1 text-sm text-gray-300">
        <p>{task.obraDeArte || 'N/A'}</p>
      </div>
      <div className="col-span-6 md:col-span-1 text-sm text-gray-300">
        <p>{task.apoio || task.vao || 'N/A'}</p>
      </div>
      <div className="col-span-6 md:col-span-2 text-sm text-gray-300">
        <p>Início: {new Date(task.plannedStartDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
        <p>Fim: {new Date(task.plannedEndDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
      </div>
      <div className="col-span-6 md:col-span-2">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.progress, task.plannedEndDate)}`}>
          {statusText(task.progress, task.plannedEndDate)}
        </span>
      </div>
      <div className={showActions ? "col-span-9 md:col-span-2 print:md:col-span-3" : "col-span-12 md:col-span-3"}>
        <div className="w-full bg-dark-border rounded-full h-2.5">
          <div className="bg-neon-green h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
        </div>
        <p className="text-xs text-right text-gray-400 mt-1">{task.progress}%</p>
      </div>
      {showActions && (
        <div className="col-span-3 md:col-span-1 flex justify-end items-center gap-2 print:hidden">
          <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-neon-cyan transition-colors">
            <EditIcon />
          </button>
          {role === 'PLANEJADOR' && (
            <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <DeleteIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const SortableHeader: React.FC<{
    title: string;
    sortKey: keyof Task | 'status';
    onSort: (key: keyof Task | 'status') => void;
    sortConfig: { key: keyof Task | 'status' | null; direction: 'asc' | 'desc' };
    className?: string;
}> = ({ title, sortKey, onSort, sortConfig, className }) => {
    const isSorted = sortConfig.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;

    return (
        <div className={className}>
            <button onClick={() => onSort(sortKey)} className="flex items-center hover:text-white transition-colors duration-200">
                {title}
                {isSorted && <span className="ml-2 text-xs">{direction === 'asc' ? '▲' : '▼'}</span>}
            </button>
        </div>
    );
};

const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete, onSort, sortConfig }) => {
  const { role } = useAuth();
  const showActions = role === 'PLANEJADOR' || role === 'PRODUÇÃO';

  if (tasks.length === 0) {
    return <p className="text-center text-gray-500 py-8">Nenhuma tarefa encontrada com os filtros atuais.</p>;
  }

  return (
    <div className="overflow-x-auto">
        <div className="min-w-full">
            <div className="grid grid-cols-12 gap-4 p-4 font-bold text-sm text-gray-400 border-b-2 border-neon-magenta/50">
                <SortableHeader title="Tarefa" sortKey="name" onSort={onSort} sortConfig={sortConfig} className="col-span-12 md:col-span-3" />
                <SortableHeader title="Obra de Arte" sortKey="obraDeArte" onSort={onSort} sortConfig={sortConfig} className="col-span-6 md:col-span-1" />
                <SortableHeader title="Apoio / Vão" sortKey="apoio" onSort={onSort} sortConfig={sortConfig} className="col-span-6 md:col-span-1" />
                <SortableHeader title="Datas Previstas" sortKey="plannedStartDate" onSort={onSort} sortConfig={sortConfig} className="col-span-6 md:col-span-2" />
                <SortableHeader title="Status" sortKey="status" onSort={onSort} sortConfig={sortConfig} className="col-span-6 md:col-span-2" />
                <SortableHeader title="Progresso" sortKey="progress" onSort={onSort} sortConfig={sortConfig} className={showActions ? "col-span-9 md:col-span-2 print:md:col-span-3" : "col-span-9 md:col-span-3"} />

                {showActions && (
                  <div className="col-span-3 md:col-span-1 text-right print:hidden">Ações</div>
                )}
            </div>
            <div>
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    </div>
  );
};

export default TaskList;