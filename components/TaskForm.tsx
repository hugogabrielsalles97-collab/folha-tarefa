import React, { useState, useEffect } from 'react';
import { Task, Discipline, TaskLevel } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  existingTask: Task | null;
}

const InputField = ({ label, name, value, onChange, type = 'text', error, disabled }: { label: string, name: string, value?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, error?: string, disabled?: boolean }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neon-cyan/80 mb-1">{label}</label>
      <input type={type} id={name} name={name} value={value || ''} onChange={onChange} disabled={disabled} className={`w-full bg-dark-bg border ${error ? 'border-red-500' : 'border-dark-border'} rounded-md shadow-sm p-2 text-white focus:ring-neon-magenta focus:border-neon-magenta disabled:bg-dark-border disabled:cursor-not-allowed`} />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

// FIX: Explicitly typing SelectField as a React.FC to resolve children prop errors.
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
     <div>
      <label htmlFor={name} className="block text-sm font-medium text-neon-cyan/80 mb-1">{label}</label>
      <select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className={`w-full bg-dark-bg border ${error ? 'border-red-500' : 'border-dark-border'} rounded-md shadow-sm p-2 text-white focus:ring-neon-magenta focus:border-neon-magenta disabled:bg-dark-border disabled:cursor-not-allowed`}>
          {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
     </div>
);

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, existingTask }) => {
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

  useEffect(() => {
    if (existingTask) {
      setTask(existingTask);
    } else {
      setTask({
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
    }
  }, [existingTask]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setTask(prev => {
        const newState = {...prev, [name]: value};
        if(name === 'discipline') {
            newState.level = ''; // Reset level when discipline changes
            newState.name = ''; // Also reset name
        }
        if(name === 'level'){
            newState.name = ''; // Reset name when level changes to force re-selection
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
    if (!task.name) newErrors.name = 'Nome da tarefa é obrigatório.';
    if (!task.level) newErrors.level = 'Nível é obrigatório.';
    if (!task.plannedStartDate) newErrors.plannedStartDate = 'Data de início prevista é obrigatória.';
    if (!task.plannedEndDate) newErrors.plannedEndDate = 'Data de fim prevista é obrigatória.';
    if (task.plannedStartDate && task.plannedEndDate && task.plannedStartDate > task.plannedEndDate) {
        newErrors.plannedEndDate = 'A data final não pode ser anterior à data inicial.'
    }
    if (task.actualStartDate && task.actualEndDate && task.actualStartDate > task.actualEndDate) {
        newErrors.actualEndDate = 'A data final real não pode ser anterior à data inicial real.'
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const taskToSave: Task = {
      id: existingTask?.id || crypto.randomUUID(),
      progress: task.progress || 0,
      ...task,
      name: task.name!,
      discipline: task.discipline!,
      level: task.level!,
      plannedStartDate: task.plannedStartDate!,
      plannedEndDate: task.plannedEndDate!,
    };
    onSave(taskToSave);
  };
  
  const levelsForDiscipline = DISCIPLINE_LEVELS[task.discipline] || [];
  const taskNameOptions = task.discipline === Discipline.OAE ? OAE_TASK_NAMES_BY_LEVEL[task.level] : null;

  const renderConditionalFields = () => {
    switch (task.discipline) {
      case Discipline.TERRAPLANAGEM:
      case Discipline.CONTENCOES:
        return (
          <>
            <InputField label="Frente" name="frente" value={task.frente} onChange={handleChange} disabled={isProductionUser} />
            <InputField label="Corte" name="corte" value={task.corte} onChange={handleChange} disabled={isProductionUser} />
          </>
        );
      case Discipline.OAE:
        return (
          <>
            <SelectField label="Obra de Arte" name="obraDeArte" value={task.obraDeArte || ''} onChange={handleChange} disabled={isProductionUser}>
              <option value="">Selecione a Obra de Arte</option>
              {OBRAS_DE_ARTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </SelectField>
            
            { (task.level === 'Fundações' || task.level === 'Mesoestrutura') &&
              <SelectField label="Apoio" name="apoio" value={task.apoio || ''} onChange={handleChange} disabled={isProductionUser}>
                <option value="">Selecione o Apoio</option>
                {APOIOS_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </SelectField>
            }
            { task.level === 'Superestrutura' &&
              <SelectField label="Vão" name="vao" value={task.vao || ''} onChange={handleChange} disabled={isProductionUser}>
                <option value="">Selecione o Vão</option>
                {VAOS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </SelectField>
            }
          </>
        );
      default:
        return null;
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-neon-magenta mb-4">{existingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Disciplina" name="discipline" value={task.discipline} onChange={handleChange} disabled={isProductionUser}>
            {Object.values(Discipline).map(d => <option key={d} value={d}>{d}</option>)}
        </SelectField>
        
        <SelectField label="Nível" name="level" value={task.level} onChange={handleChange} error={errors.level} disabled={isProductionUser}>
            <option value="">Selecione um nível</option>
            {levelsForDiscipline.map(l => <option key={l} value={l}>{l}</option>)}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderConditionalFields()}
      </div>

      {taskNameOptions ? (
          <SelectField label="Nome da Tarefa" name="name" value={task.name || ''} onChange={handleChange} error={errors.name} disabled={isProductionUser}>
              <option value="">Selecione a Tarefa</option>
              {taskNameOptions.map(name => <option key={name} value={name}>{name}</option>)}
          </SelectField>
      ) : (
          <InputField label="Nome da Tarefa" name="name" value={task.name} onChange={handleChange} error={errors.name} disabled={isProductionUser} />
      )}

      <fieldset className="border border-dark-border p-4 rounded-md">
        <legend className="text-neon-orange px-2">Planejamento</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Início Previsto" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} error={errors.plannedStartDate} disabled={isProductionUser} />
            <InputField label="Fim Previsto" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} error={errors.plannedEndDate} disabled={isProductionUser} />
        </div>
      </fieldset>

      {existingTask && (
        <fieldset className="border border-dark-border p-4 rounded-md">
            <legend className="text-neon-green px-2">Execução</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} error={errors.actualStartDate} />
                <InputField label="Fim Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} error={errors.actualEndDate} />
            </div>
            <div className='mt-4'>
                <label htmlFor="progress" className="block text-sm font-medium text-neon-cyan/80 mb-1">Progresso ({task.progress}%)</label>
                <input type="range" id="progress" name="progress" min="0" max="100" value={task.progress || 0} onChange={handleProgressChange} className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-neon-green" />
            </div>
        </fieldset>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
        <button type="submit" className="bg-neon-magenta text-black font-bold py-2 px-4 rounded-lg shadow-neon-magenta hover:bg-neon-magenta/90 transition-all duration-300">Salvar</button>
      </div>
    </form>
  );
};

export default TaskForm;