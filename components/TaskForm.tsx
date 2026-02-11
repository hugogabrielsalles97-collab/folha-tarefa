
import React, { useState, useEffect } from 'react';
import { Task, Discipline, TaskLevel } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  existingTask: Task | null;
  allTasks: Task[];
}

const InputField = ({ label, name, value, onChange, type = 'text', error, disabled, placeholder }: { label: string, name: string, value?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, error?: string, disabled?: boolean, placeholder?: string }) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">{label}</label>
      <input 
        type={type} 
        id={name} 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-dark-bg border ${error ? 'border-neon-magenta' : 'border-dark-border'} p-3 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-colors placeholder:text-white/10`} 
      />
      {error && <p className="text-neon-magenta text-[8px] mt-1 font-black uppercase tracking-widest">{error}</p>}
    </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  error?: string;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, children, error, disabled }) => (
     <div className="mb-4">
      <label htmlFor={name} className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">{label}</label>
      <select 
        id={name} 
        name={name} 
        value={value} 
        onChange={onChange} 
        disabled={disabled} 
        className={`w-full bg-dark-bg border ${error ? 'border-neon-magenta' : 'border-dark-border'} p-3 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed appearance-none transition-colors`}
      >
          {children}
      </select>
      {error && <p className="text-neon-magenta text-[8px] mt-1 font-black uppercase tracking-widest">{error}</p>}
     </div>
);

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, existingTask, allTasks }) => {
  const { role } = useAuth();
  const isProductionUser = role === 'PRODUÇÃO';

  const [task, setTask] = useState<Omit<Task, 'id' | 'progress'> & { id?: string, progress?: number }>({
    name: '',
    discipline: Discipline.OAE,
    level: '',
    frente: '',
    corte: '',
    obraDeArte: '',
    apoio: '',
    vao: '',
    plannedStartDate: '',
    plannedEndDate: '',
    actualStartDate: '',
    actualEndDate: '',
    progress: 0,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{ count: number } | null>(null);

  useEffect(() => {
    if (existingTask) {
      setTask(existingTask);
    }
  }, [existingTask]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Resetar aviso de duplicidade se o usuário alterar dados chave
    if (['name', 'plannedStartDate', 'plannedEndDate'].includes(name)) {
        setDuplicateWarning(null);
    }

    setTask(prev => {
        const newState = {...prev, [name]: value};
        if(name === 'discipline') {
            newState.level = '';
            newState.name = '';
        }
        if(name === 'level' && prev.discipline === Discipline.OAE) {
            newState.name = '';
        }
        return newState;
    });

    if(errors[name]) {
        setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, Number(e.target.value)));
    setTask(prev => ({ ...prev, progress: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!task.name) newErrors.name = 'Obrigatório.';
    if (!task.level) newErrors.level = 'Obrigatório.';
    if (!task.plannedStartDate) newErrors.plannedStartDate = 'Obrigatório.';
    if (!task.plannedEndDate) newErrors.plannedEndDate = 'Obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const checkDuplicates = () => {
    const duplicates = allTasks.filter(t => 
        t.name === task.name && 
        t.plannedStartDate === task.plannedStartDate && 
        t.plannedEndDate === task.plannedEndDate &&
        t.id !== existingTask?.id
    );
    return duplicates.length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Se ainda não mostramos o aviso e existem duplicatas, mostrar agora
    const dupCount = checkDuplicates();
    if (dupCount > 0 && !duplicateWarning) {
        setDuplicateWarning({ count: dupCount });
        return;
    }

    const taskToSave: Task = {
      id: existingTask?.id || crypto.randomUUID(),
      progress: task.progress || 0,
      ...task,
      name: task.name!,
      discipline: task.discipline!,
      level: task.level!,
      plannedStartDate: task.plannedStartDate!,
      plannedEndDate: task.plannedEndDate!,
    } as Task;
    onSave(taskToSave);
  };
  
  const levelsForDiscipline = DISCIPLINE_LEVELS[task.discipline] || [];
  const selectableTaskNames = task.discipline === Discipline.OAE && task.level ? OAE_TASK_NAMES_BY_LEVEL[task.level] : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-black text-white uppercase tracking-[4px] border-b border-dark-border pb-4 mb-6">
        {existingTask ? 'Atualizar' : 'Registrar'} <span className="text-neon-orange">Tarefa</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Disciplina" name="discipline" value={task.discipline} onChange={handleChange} disabled={isProductionUser}>
            {Object.values(Discipline).map(d => <option key={d} value={d} className="bg-dark-surface text-white">{d}</option>)}
        </SelectField>
        
        <SelectField label="Nível Operacional" name="level" value={task.level} onChange={handleChange} error={errors.level} disabled={isProductionUser}>
            <option value="" className="bg-dark-surface text-white">Selecionar Nível</option>
            {levelsForDiscipline.map(l => <option key={l} value={l} className="bg-dark-surface text-white">{l}</option>)}
        </SelectField>
      </div>

      {task.discipline === Discipline.OAE ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Obra de Arte" name="obraDeArte" value={task.obraDeArte || ''} onChange={handleChange} disabled={isProductionUser}>
              <option value="" className="bg-dark-surface text-white">Selecionar OAE</option>
              {OBRAS_DE_ARTE_OPTIONS.map(o => <option key={o} value={o} className="bg-dark-surface text-white">{o}</option>)}
            </SelectField>
            {task.level === 'Superestrutura' ? (
                <SelectField label="Vão de Atuação" name="vao" value={task.vao || ''} onChange={handleChange} disabled={isProductionUser}>
                    <option value="" className="bg-dark-surface text-white">Selecionar Apoio / Vão</option>
                    {VAOS_OPTIONS.map(v => <option key={v} value={v} className="bg-dark-surface text-white">{v}</option>)}
                </SelectField>
            ) : (
                <SelectField label="Apoio / Vão" name="apoio" value={task.apoio || ''} onChange={handleChange} disabled={isProductionUser}>
                    <option value="" className="bg-dark-surface text-white">Selecionar Apoio / Vão</option>
                    {APOIOS_OPTIONS.map(a => <option key={a} value={a} className="bg-dark-surface text-white">{a}</option>)}
                </SelectField>
            )}
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Frente de Obra" name="frente" value={task.frente} onChange={handleChange} disabled={isProductionUser} />
              <InputField label="Setor / Corte" name="corte" value={task.corte} onChange={handleChange} disabled={isProductionUser} />
          </div>
      )}

      {selectableTaskNames ? (
        <SelectField label="Descrição Atividade" name="name" value={task.name || ''} onChange={handleChange} error={errors.name} disabled={isProductionUser}>
            <option value="" className="bg-dark-surface text-white">Selecionar Atividade</option>
            {selectableTaskNames.map(name => <option key={name} value={name} className="bg-dark-surface text-white">{name}</option>)}
        </SelectField>
      ) : (
        <InputField 
            label="Descrição Atividade" 
            name="name" 
            value={task.name} 
            onChange={handleChange} 
            error={errors.name} 
            disabled={isProductionUser}
            placeholder="Descrever atividade..."
        />
      )}

      <div className="grid grid-cols-1 gap-6 border-t border-dark-border pt-6 mt-4">
          <div>
            <p className="text-[10px] font-black text-neon-orange uppercase tracking-widest mb-4">Planejamento</p>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Início" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} error={errors.plannedStartDate} disabled={isProductionUser} />
                <InputField label="Fim" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} error={errors.plannedEndDate} disabled={isProductionUser} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-neon-green uppercase tracking-widest mb-4">Execução Real</p>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} />
                <InputField label="Fim Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} />
            </div>
          </div>
      </div>

      <div className="border-t border-dark-border pt-6">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">Avanço Físico: {task.progress}%</label>
            <div className={`h-1 w-24 bg-dark-bg border border-dark-border overflow-hidden`}>
                <div className="bg-neon-cyan h-full" style={{ width: `${task.progress}%` }}></div>
            </div>
          </div>
          <input type="range" min="0" max="100" value={task.progress || 0} onChange={handleProgressChange} className="w-full h-1 bg-dark-bg appearance-none cursor-pointer accent-neon-cyan" />
      </div>

      {duplicateWarning && (
        <div className="bg-neon-orange/10 border border-neon-orange p-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="text-neon-orange">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">
                        Alerta de Sobreposição Técnica
                    </p>
                    <p className="text-[9px] text-neon-orange font-bold uppercase">
                        Detectamos <span className="text-white text-xs">{duplicateWarning.count}</span> tarefa(s) idêntica(s) com esta descrição para este período.
                    </p>
                </div>
            </div>
            <p className="text-[8px] text-white/60 mt-2 italic">Deseja prosseguir com a criação de múltiplos registros para a mesma atividade?</p>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-8">
        <button type="button" onClick={onCancel} className="text-white/30 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
        <button 
            type="submit" 
            className={`font-black py-3 px-8 border-2 uppercase text-xs tracking-[2px] transition-all ${duplicateWarning ? 'bg-neon-orange border-neon-orange text-black shadow-neon-orange hover:bg-white hover:border-white' : 'bg-transparent text-neon-cyan border-neon-cyan shadow-neon-cyan hover:bg-neon-cyan hover:text-black'}`}
        >
          {duplicateWarning ? 'Confirmar Duplicidade' : 'Confirmar Dados'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
