
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
  // Agora visitantes também veem o botão de "editar", mas ele servirá apenas para ver detalhes.
  const showViewButton = role === 'PLANEJADOR' || role === 'PRODUÇÃO' || role === 'VIEWER';
  const canDelete = role === 'PLANEJADOR';

  const getStatusInfo = (task: Task) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const plannedEndDate = new Date(task.plannedEndDate + 'T00:00:00');

    if (task.progress === 100) {
      return { text: 'CONCLUÍDO', colorClass: 'neon-green', hex: '#39ff14' };
    }
    
    if (today > plannedEndDate) {
      return { text: 'ATRASADO', colorClass: 'neon-red', hex: '#ff3131' };
    }

    if (!task.actualStartDate) {
      return { text: 'NÃO INICIADA', colorClass: 'neon-orange', hex: '#ff8c00' };
    }

    return { text: 'EM ANDAMENTO', colorClass: 'neon-cyan', hex: '#00f3ff' };
  };

  const status = getStatusInfo(task);

  const getStatusStyle = () => {
    return `text-${status.colorClass} border-${status.colorClass}/40 bg-${status.colorClass}/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] print:text-black print:border-black print:bg-white`;
  };

  const getProgressColorClass = () => {
    return `bg-${status.colorClass} shadow-[0_0_15px_${status.hex}] progress-bar-fill`;
  };

  return (
    <div className="grid grid-cols-12 gap-y-4 md:gap-2 items-center p-4 border-b border-dark-border hover:bg-white/[0.04] transition-colors group print:border-black print:p-2">
      {/* Nome e Disciplina */}
      <div className="col-span-12 md:col-span-3">
        <p className="font-black text-white text-[13px] leading-tight tracking-tight group-hover:text-neon-cyan transition-colors print:text-black print:font-bold">{task.name.toUpperCase()}</p>
        <p className="text-[9px] text-white/40 font-bold uppercase tracking-[1px] mt-0.5 print:text-black print:opacity-60">{task.discipline} / {task.level}</p>
      </div>

      {/* OAE */}
      <div className="col-span-4 md:col-span-1 text-xs text-white/80 font-mono text-center print:text-black">
        <span className="md:hidden text-[9px] block text-white/20 uppercase font-black mb-1 print:text-black">OAE</span>
        {task.obraDeArte || '---'}
      </div>

      {/* LOCAL - Agora visível e identificado no mobile */}
      <div className="col-span-4 md:col-span-1 text-xs text-white/80 font-mono text-center print:text-black">
        <span className="md:hidden text-[9px] block text-white/20 uppercase font-black mb-1 print:text-black">LOCAL</span>
        {task.apoio || task.vao || task.corte || '---'}
      </div>

      {/* DATAS */}
      <div className="col-span-4 md:col-span-2 text-[10px] text-white/50 font-mono text-center leading-tight print:text-black print:font-bold">
        <span className="md:hidden text-[9px] block text-white/20 uppercase font-black mb-1 print:text-black">PREVISTO</span>
        {new Date(task.plannedStartDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}<br/>
        {new Date(task.plannedEndDate + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
      </div>

      {/* STATUS */}
      <div className="col-span-4 md:col-span-2 flex justify-center">
        <span className={`px-1 py-1 text-[8px] font-black border rounded-none tracking-tighter text-center w-full max-w-[100px] ${getStatusStyle()}`}>
          {status.text}
        </span>
      </div>

      {/* PROGRESSO */}
      <div className={showViewButton ? "col-span-5 md:col-span-2" : "col-span-8 md:col-span-3"}>
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-bg h-1.5 border border-dark-border overflow-hidden progress-bar-bg print:border-black">
                <div className={`h-full ${getProgressColorClass()}`} style={{ width: `${task.progress}%` }}></div>
            </div>
            <span className="text-[11px] font-black text-white/90 w-8 text-right font-mono print:text-black">{task.progress}%</span>
        </div>
      </div>

      {/* AÇÕES - Visíveis e acessíveis no mobile */}
      {showViewButton && (
        <div className="col-span-3 md:col-span-1 flex justify-end gap-2 print:hidden">
          <button onClick={() => onEdit(task)} title={role === 'VIEWER' ? "Visualizar" : "Editar"} className="p-2 bg-dark-bg border border-dark-border text-white/40 hover:text-neon-orange hover:border-neon-orange transition-all active:scale-90">
            <EditIcon />
          </button>
          {canDelete && (
            <button onClick={() => onDelete(task.id)} title="Excluir" className="p-2 bg-dark-bg border border-dark-border text-white/40 hover:text-neon-magenta hover:border-neon-magenta transition-all active:scale-90">
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
    centered?: boolean;
}> = ({ title, sortKey, onSort, sortConfig, className, centered }) => {
    const isSorted = sortConfig.key === sortKey;

    return (
        <div className={`${className} ${centered ? 'flex justify-center' : ''}`}>
            <button onClick={() => onSort(sortKey)} className={`flex items-center gap-1 text-white/30 hover:text-neon-cyan transition-colors uppercase text-[9px] font-black tracking-[1px] ${centered ? 'text-center' : ''} print:text-black print:border-none`}>
                {title}
                {isSorted && <span className="text-neon-orange text-[9px] print:text-black">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
            </button>
        </div>
    );
};

const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete, onSort, sortConfig }) => {
  const { role } = useAuth();
  const showActionsHeader = role === 'PLANEJADOR' || role === 'PRODUÇÃO' || role === 'VIEWER';

  if (tasks.length === 0) {
    return <p className="text-center text-white/20 font-black py-20 uppercase tracking-[10px] print:text-black">TERMINAL VAZIO</p>;
  }

  return (
    <div className="overflow-x-hidden">
        <div className="w-full">
            {/* Cabeçalho Responsivo */}
            <div className="grid grid-cols-12 gap-y-2 md:gap-2 p-4 border-b border-white/10 bg-white/[0.04] mb-2 print:border-black print:bg-white print:p-2">
                <SortableHeader title="Tarefas" sortKey="name" onSort={onSort} sortConfig={sortConfig} className="col-span-12 md:col-span-3" />
                <SortableHeader title="OAE" sortKey="obraDeArte" onSort={onSort} sortConfig={sortConfig} className="col-span-4 md:col-span-1" centered />
                <SortableHeader title="Local" sortKey="apoio" onSort={onSort} sortConfig={sortConfig} className="col-span-4 md:col-span-1" centered />
                <SortableHeader title="Previsto" sortKey="plannedStartDate" onSort={onSort} sortConfig={sortConfig} className="col-span-4 md:col-span-2" centered />
                <SortableHeader title="Status" sortKey="status" onSort={onSort} sortConfig={sortConfig} className="col-span-4 md:col-span-2" centered />
                <SortableHeader title="Avanço" sortKey="progress" onSort={onSort} sortConfig={sortConfig} className={showActionsHeader ? "col-span-5 md:col-span-2" : "col-span-8 md:col-span-3"} />
                {showActionsHeader && <div className="col-span-3 md:col-span-1 text-right text-[9px] font-black text-white/20 uppercase tracking-widest print:hidden">Info</div>}
            </div>
            {/* Lista de Itens */}
            <div className="divide-y divide-white/[0.03] print:divide-black">
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    </div>
  );
};

export default TaskList;
