
import React, { useState, useEffect, useRef } from 'react';
import { Task, Discipline, TaskLevel } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { CameraIcon } from './icons';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  existingTask: Task | null;
  allTasks: Task[];
}

const InputField = ({ label, name, value, onChange, type = 'text', error, disabled, placeholder }: { label: string, name: string, value?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, error?: string, disabled?: boolean, placeholder?: string }) => {
    return (
        <div className="mb-3">
          <label htmlFor={name} className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">{label}</label>
          <input 
            type={type} 
            id={name} 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full border ${error ? 'border-neon-magenta' : 'border-dark-border'} p-2 font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-dark-bg text-white placeholder:text-white/10`} 
          />
          {error && <p className="text-neon-magenta text-[8px] mt-1 font-black uppercase tracking-widest">{error}</p>}
        </div>
    );
};

const TextareaField = ({ label, name, value, onChange, error, disabled, placeholder }: { label: string, name: string, value?: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, error?: string, disabled?: boolean, placeholder?: string }) => (
    <div className="mb-3">
      <label htmlFor={name} className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">{label}</label>
      <textarea 
        id={name} 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className={`w-full bg-dark-bg border ${error ? 'border-neon-magenta' : 'border-dark-border'} p-2 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-colors placeholder:text-white/10 resize-none`} 
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
     <div className="mb-3">
      <label htmlFor={name} className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">{label}</label>
      <select 
        id={name} 
        name={name} 
        value={value} 
        onChange={onChange} 
        disabled={disabled} 
        className={`w-full bg-dark-bg border ${error ? 'border-neon-magenta' : 'border-dark-border'} p-2 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed appearance-none transition-colors`}
      >
          {children}
      </select>
      {error && <p className="text-neon-magenta text-[8px] mt-1 font-black uppercase tracking-widest">{error}</p>}
     </div>
);

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, existingTask, allTasks }) => {
  const { role } = useAuth();
  const isProductionUser = role === 'PRODUÇÃO';
  const isViewer = role === 'VIEWER';
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    observations: '',
    evidencePhoto: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{ count: number } | null>(null);

  useEffect(() => {
    if (existingTask) {
      setTask({
        ...existingTask,
        observations: existingTask.observations || '',
        evidencePhoto: existingTask.evidencePhoto || '',
      });
    }
  }, [existingTask]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewer) return;

    const { name, value } = e.target;
    
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTask(prev => ({ ...prev, evidencePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    if (isViewer) return;
    setTask(prev => ({ ...prev, evidencePhoto: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewer) return;
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
    const currentName = task.name;
    const currentStart = task.plannedStartDate;
    const currentEnd = task.plannedEndDate;

    if (!currentName || !currentStart || !currentEnd) return 0;

    const overlaps = allTasks.filter(t => {
        const isSameName = t.name === currentName;
        const isDifferentId = t.id !== existingTask?.id;
        const intersects = (currentStart <= t.plannedEndDate) && (currentEnd >= t.plannedStartDate);
        return isSameName && isDifferentId && intersects;
    });

    return overlaps.length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    if (!validate()) return;

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
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
      <h2 className="text-lg font-black text-white uppercase tracking-[4px] border-b border-dark-border pb-2 mb-4 sticky top-0 bg-dark-surface z-10">
        {isViewer ? 'Detalhes da' : existingTask ? 'Atualizar' : 'Registrar'} <span className="text-neon-orange">Tarefa</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField label="Disciplina" name="discipline" value={task.discipline} onChange={handleChange} disabled={isProductionUser || isViewer}>
            {Object.values(Discipline).map(d => <option key={d} value={d} className="bg-dark-surface text-white">{d}</option>)}
        </SelectField>
        
        <SelectField label="Nível Operacional" name="level" value={task.level} onChange={handleChange} error={errors.level} disabled={isProductionUser || isViewer}>
            <option value="" className="bg-dark-surface text-white">Selecionar Nível</option>
            {levelsForDiscipline.map(l => <option key={l} value={l} className="bg-dark-surface text-white">{l}</option>)}
        </SelectField>
      </div>

      {task.discipline === Discipline.OAE ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SelectField label="Obra de Arte" name="obraDeArte" value={task.obraDeArte || ''} onChange={handleChange} disabled={isProductionUser || isViewer}>
              <option value="" className="bg-dark-surface text-white">Selecionar OAE</option>
              {OBRAS_DE_ARTE_OPTIONS.map(o => <option key={o} value={o} className="bg-dark-surface text-white">{o}</option>)}
            </SelectField>
            {task.level === 'Superestrutura' ? (
                <SelectField label="Vão de Atuação" name="vao" value={task.vao || ''} onChange={handleChange} disabled={isProductionUser || isViewer}>
                    <option value="" className="bg-dark-surface text-white">Selecionar Apoio / Vão</option>
                    {VAOS_OPTIONS.map(v => <option key={v} value={v} className="bg-dark-surface text-white">{v}</option>)}
                </SelectField>
            ) : (
                <SelectField label="Apoio / Vão" name="apoio" value={task.apoio || ''} onChange={handleChange} disabled={isProductionUser || isViewer}>
                    <option value="" className="bg-dark-surface text-white">Selecionar Apoio / Vão</option>
                    {APOIOS_OPTIONS.map(a => <option key={a} value={a} className="bg-dark-surface text-white">{a}</option>)}
                </SelectField>
            )}
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InputField label="Frente de Obra" name="frente" value={task.frente} onChange={handleChange} disabled={isProductionUser || isViewer} />
              <InputField label="Setor / Corte" name="corte" value={task.corte} onChange={handleChange} disabled={isProductionUser || isViewer} />
          </div>
      )}

      {selectableTaskNames ? (
        <SelectField label="Descrição Atividade" name="name" value={task.name || ''} onChange={handleChange} error={errors.name} disabled={isProductionUser || isViewer}>
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
            disabled={isProductionUser || isViewer}
            placeholder="Descrever atividade..."
        />
      )}

      <div className="border-t border-dark-border pt-4 mt-2 space-y-4">
          <div>
            <p className="text-[9px] font-black text-neon-orange uppercase tracking-widest mb-2">Cronograma Planejado</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} error={errors.plannedStartDate} disabled={isProductionUser || isViewer} />
              <InputField label="Fim" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} error={errors.plannedEndDate} disabled={isProductionUser || isViewer} />
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-neon-green uppercase tracking-widest mb-2">Execução Real</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} disabled={isViewer} />
              <InputField label="Término Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} disabled={isViewer} />
            </div>
          </div>
      </div>

      <div className="border-t border-dark-border pt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest">Avanço Físico: {task.progress}%</label>
            <div className={`h-1 w-20 bg-dark-bg border border-dark-border overflow-hidden`}>
                <div className="bg-neon-cyan h-full" style={{ width: `${task.progress}%` }}></div>
            </div>
          </div>
          <input type="range" min="0" max="100" value={task.progress || 0} onChange={handleProgressChange} disabled={isViewer} className="w-full h-1 bg-dark-bg appearance-none cursor-pointer accent-neon-cyan disabled:cursor-not-allowed disabled:opacity-30" />
      </div>

      {/* Seção de Evidência Fotográfica */}
      <div className="border-t border-dark-border pt-4">
        <p className="text-[9px] font-black text-neon-magenta uppercase tracking-widest mb-2">Evidência Fotográfica</p>
        
        {task.evidencePhoto ? (
          <div className="relative group overflow-hidden border border-neon-magenta/30 bg-black/40 p-2">
            <img 
              src={task.evidencePhoto} 
              alt="Evidência técnica" 
              className="w-full h-48 object-cover border border-white/10"
            />
            {!isViewer && (
              <button 
                type="button" 
                onClick={removePhoto}
                className="absolute top-4 right-4 bg-neon-red text-black p-1 text-[8px] font-black uppercase tracking-widest shadow-neon-red opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remover Foto
              </button>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1">
              <span className="text-[7px] font-mono text-neon-magenta uppercase">IMAGEM_ANEXADA.JPEG</span>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => !isViewer && fileInputRef.current?.click()}
            className={`h-24 border-2 border-dashed border-dark-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-neon-magenta/50 hover:bg-neon-magenta/5 transition-all ${isViewer ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <CameraIcon />
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
              {isViewer ? 'Sem Imagem Registrada' : 'Capturar Evidência Técnica'}
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              capture="environment" 
              onChange={handlePhotoUpload} 
              className="hidden"
            />
          </div>
        )}
      </div>

      <div className="border-t border-dark-border pt-4">
        <TextareaField 
          label="Observações Técnicas" 
          name="observations" 
          value={task.observations} 
          onChange={handleChange}
          disabled={isViewer}
          placeholder={isViewer ? "Sem observações registradas." : "Inserir notas de campo ou justificativas..."}
        />
      </div>

      {duplicateWarning && !isViewer && (
        <div className="bg-neon-orange/10 border border-neon-orange p-3 animate-pulse">
            <div className="flex items-center gap-2">
                <div className="text-neon-orange">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <p className="text-[9px] font-black text-white uppercase tracking-wider">Alerta de Conflito</p>
                    <p className="text-[8px] text-neon-orange font-bold uppercase leading-tight">
                        Existem <span className="text-white">{duplicateWarning.count}</span> registros de <span className="text-white italic">"{task.name}"</span> no mesmo período.
                    </p>
                </div>
            </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-dark-surface z-10 py-2 border-t border-dark-border mt-4">
        <button type="button" onClick={onCancel} className="text-white/30 font-black text-[9px] uppercase tracking-widest hover:text-white transition-colors">
            {isViewer ? 'Fechar' : 'Cancelar'}
        </button>
        {!isViewer && (
            <button 
                type="submit" 
                className={`font-black py-2 px-6 border-2 uppercase text-[10px] tracking-[2px] transition-all ${duplicateWarning ? 'bg-neon-orange border-neon-orange text-black' : 'bg-transparent text-neon-cyan border-neon-cyan hover:bg-neon-cyan hover:text-black'}`}
            >
              {duplicateWarning ? 'Ignorar e Salvar' : 'Confirmar'}
            </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
