import React from 'react';
import { Task } from '../types';
import { EditIcon, DeleteIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskItem: React.FC<{ task: Task; onEdit: (task: Task) => void; onDelete: (taskId: string) => void; }> = ({ task, onEdit, onDelete }) => {
  const { role } = useAuth();
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
      <div className="col-span-12 md:col-span-2">
        <p className="font-bold text-white">{task.name}</p>
        <p className="text-xs text-gray-400">{task.discipline} / {task.level}</p>
      </div>
      <div className="col-span-6 md:col-span-2 text-sm text-gray-300">
        <p>{task.obraDeArte || 'N/A'}</p>
      </div>
      <div className="col-span-6 md:col-span-2 text-sm text-gray-300">
        <p>{task.apoio || task.vao || 'N/A'}</p>
      </div>
      <div className="col-span-6 md:col-span-2 text-sm text-gray-300">
        <p>Início: {new Date(task.plannedStartDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
        <p>Fim: {new Date(task.plannedEndDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
      </div>
      <div className="col-span-6 md:col-span-1">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.progress, task.plannedEndDate)}`}>
          {statusText(task.progress, task.plannedEndDate)}
        </span>
      </div>
      <div className={role === 'EDITOR' ? "col-span-9 md:col-span-2" : "col-span-12 md:col-span-3"}>
        <div className="w-full bg-dark-border rounded-full h-2.5">
          <div className="bg-neon-green h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
        </div>
        <p className="text-xs text-right text-gray-400 mt-1">{task.progress}%</p>
      </div>
      {role === 'EDITOR' && (
        <div className="col-span-3 md:col-span-1 flex justify-end items-center gap-2">
          <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-neon-cyan transition-colors">
            <EditIcon />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <DeleteIcon />
          </button>
        </div>
      )}
    </div>
  );
};


const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete }) => {
  const { role } = useAuth();
  if (tasks.length === 0) {
    return <p className="text-center text-gray-500 py-8">Nenhuma tarefa encontrada com os filtros atuais.</p>;
  }

  const sortedTasks = [...tasks].sort((a,b) => new Date(a.plannedStartDate + 'T00:00:00').getTime() - new Date(b.plannedStartDate + 'T00:00:00').getTime());

  return (
    <div className="overflow-x-auto">
        <div className="min-w-full">
            <div className="grid grid-cols-12 gap-4 p-4 font-bold text-sm text-gray-400 border-b-2 border-neon-magenta/50">
                <div className="col-span-12 md:col-span-2">Tarefa</div>
                <div className="col-span-6 md:col-span-2">Obra de Arte</div>
                <div className="col-span-6 md:col-span-2">Apoio / Vão</div>
                <div className="col-span-6 md:col-span-2">Datas Previstas</div>
                <div className="col-span-6 md:col-span-1">Status</div>
                <div className={role === 'EDITOR' ? "col-span-9 md:col-span-2" : "col-span-9 md:col-span-3"}>Progresso</div>
                {role === 'EDITOR' && (
                  <div className="col-span-3 md:col-span-1 text-right">Ações</div>
                )}
            </div>
            <div>
                {sortedTasks.map(task => (
                    <TaskItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    </div>
  );
};

export default TaskList;