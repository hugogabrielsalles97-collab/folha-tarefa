
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Discipline, TaskLevel, OAELevel } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  existingTask: Task | null;
  allTasks: Task[];
}

const InputField = ({ label, name, value, onChange, type = 'text', error, disabled, placeholder, errorType }: { label: string, name: string, value?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, error?: string, disabled?: boolean, placeholder?: string, errorType?: 'default' | 'critical' }) => {
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
            className={`w-full border ${error ? (errorType === 'critical' ? 'border-neon-orange shadow-neon-orange' : 'border-neon-magenta') : 'border-dark-border'} p-2 font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-dark-bg text-white placeholder:text-white/10`} 
          />
          {error && (
            <p className={`${errorType === 'critical' ? 'text-neon-orange animate-fast-blink shadow-neon-orange' : 'text-neon-magenta'} text-[8px] mt-1 font-black uppercase tracking-widest`}>
              {error}
            </p>
          )}
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

const SelectField = ({ label, name, value, onChange, children, error, disabled, errorType }: { label: string, name: string, value: any, onChange: (e: React.ChangeEvent<any>) => void, children?: React.ReactNode, error?: string, disabled?: boolean, errorType?: 'default' | 'critical' }) => (
     <div className="mb-3">
      <label htmlFor={name} className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">{label}</label>
      <select 
        id={name} 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        disabled={disabled} 
        className={`w-full bg-dark-bg border ${error ? (errorType === 'critical' ? 'border-neon-orange shadow-neon-orange' : 'border-neon-magenta') : 'border-dark-border'} p-2 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 appearance-none transition-colors`}
      >
          {children}
      </select>
      {error && (
        <p className={`${errorType === 'critical' ? 'text-neon-orange animate-fast-blink shadow-neon-orange' : 'text-neon-magenta'} text-[8px] mt-1 font-black uppercase tracking-widest`}>
          {error}
        </p>
      )}
     </div>
);

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, existingTask, allTasks }) => {
  const { role } = useAuth();
  const isProductionUser = role === 'PRODUÇÃO';
  const isViewer = role === 'VIEWER';

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
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorType, setErrorType] = useState<'default' | 'critical'>('default');
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);

  useEffect(() => {
    if (existingTask) {
      setTask({ ...existingTask, observations: existingTask.observations || '' });
    }
  }, [existingTask]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewer) return;
    const { name, value } = e.target;
    setTask(prev => {
        const updated = { ...prev, [name]: value };
        if (name === 'discipline') {
            updated.level = '';
            updated.name = '';
            updated.obraDeArte = '';
            updated.apoio = '';
            updated.vao = '';
            updated.frente = '';
            updated.corte = '';
        }
        if (name === 'level' && updated.discipline === Discipline.OAE) {
            if (value !== OAELevel.SUPERESTRUTURA) {
                updated.vao = '';
            }
            if (value !== OAELevel.FUNDACOES && value !== OAELevel.MESOESTRUTURA) {
                updated.apoio = '';
            }
        }
        return updated;
    });
    // Limpar avisos ao editar campos relevantes
    setShowConflictWarning(false);
    if (errors[name]) {
        setErrors(prev => {
            const n = { ...prev };
            delete n[name];
            return n;
        });
    }
  };

  const getConflictingTasksCount = useMemo(() => {
    if (!task.name || !task.plannedStartDate || !task.plannedEndDate) return 0;
    
    return allTasks.filter(t => {
        if (existingTask && t.id === existingTask.id) return false;

        // Compara apenas o NOME da atividade (independente de localização)
        const sameName = t.name.trim().toLowerCase() === task.name.trim().toLowerCase();
        
        const tStart = t.plannedStartDate;
        const tEnd = t.plannedEndDate;
        const taskStart = task.plannedStartDate;
        const taskEnd = task.plannedEndDate;

        // Intervalo de sobreposição: (Início A <= Fim B) E (Início B <= Fim A)
        const overlap = (taskStart <= tEnd) && (tStart <= taskEnd);

        return sameName && overlap;
    }).length;
  }, [task, allTasks, existingTask]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!task.name) newErrors.name = 'Obrigatório.';
    if (!task.level) newErrors.level = 'Obrigatório.';
    if (!task.plannedStartDate) newErrors.plannedStartDate = 'Obrigatório.';
    if (!task.plannedEndDate) newErrors.plannedEndDate = 'Obrigatório.';
    
    if (task.actualEndDate && (task.progress || 0) < 100) {
        newErrors.actualEndDate = 'Avanço deve ser 100% para registrar término.';
    }

    setErrors(newErrors);
    setErrorType('default');
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    
    if (!validate()) return;

    // Verificação de conflito se não foi confirmado ainda
    if (!showConflictWarning && getConflictingTasksCount > 0) {
        setConflictCount(getConflictingTasksCount);
        setShowConflictWarning(true);
        return;
    }

    const taskToSave: Task = {
      id: existingTask?.id || crypto.randomUUID(),
      progress: task.progress || 0,
      ...task,
    } as Task;
    onSave(taskToSave);
  };
  
  const levelsForDiscipline = DISCIPLINE_LEVELS[task.discipline] || [];
  const oaeTaskOptions = (task.discipline === Discipline.OAE && task.level) ? OAE_TASK_NAMES_BY_LEVEL[task.level] : null;
  
  const isOAE = task.discipline === Discipline.OAE;
  const isOAESuper = isOAE && task.level === OAELevel.SUPERESTRUTURA;
  const isOAEFundOrMeso = isOAE && (task.level === OAELevel.FUNDACOES || task.level === OAELevel.MESOESTRUTURA);

  const getProgressStyles = () => {
    const progress = task.progress || 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const plannedEndDate = task.plannedEndDate ? new Date(task.plannedEndDate + 'T00:00:00') : null;

    let color = '#00f3ff'; 

    if (progress === 100) {
      color = '#39ff14'; 
    } else if (plannedEndDate && today > plannedEndDate) {
      color = '#ff3131'; 
    } else if (progress === 0) {
      color = '#ff8c00'; 
    }

    return {
      background: `linear-gradient(to right, ${color} 0%, ${color} ${progress}%, #0a0a0c ${progress}%, #0a0a0c 100%)`,
      color
    };
  };

  const progressStyle = getProgressStyles();

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
      <h2 className="text-lg font-black text-white uppercase tracking-[4px] border-b border-dark-border pb-2 mb-4">
        {isViewer ? 'Detalhes' : 'Registro de'} <span className="text-neon-orange">Tarefa</span>
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Disciplina" name="discipline" value={task.discipline} onChange={handleChange} disabled={isProductionUser || isViewer}>
            {Object.values(Discipline).map(d => <option key={d} value={d} className="bg-dark-surface text-white">{d}</option>)}
        </SelectField>
        
        <SelectField label="Nível Operacional" name="level" value={task.level} onChange={handleChange} error={errors.level} disabled={isProductionUser || isViewer}>
            <option value="" className="bg-dark-surface text-white">Selecionar</option>
            {levelsForDiscipline.map(l => <option key={l} value={l} className="bg-dark-surface text-white">{l}</option>)}
        </SelectField>
      </div>

      <div className="bg-white/5 p-3 border border-dark-border">
        {isOAE ? (
            <div className="grid grid-cols-2 gap-2">
                <SelectField label="OAE" name="obraDeArte" value={task.obraDeArte} onChange={handleChange} disabled={isProductionUser || isViewer}>
                    <option value="">---</option>
                    {OBRAS_DE_ARTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </SelectField>
                
                {isOAEFundOrMeso && (
                    <SelectField label="Apoio" name="apoio" value={task.apoio} onChange={handleChange} disabled={isProductionUser || isViewer}>
                        <option value="">---</option>
                        {APOIOS_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </SelectField>
                )}

                {isOAESuper && (
                    <SelectField label="Vão" name="vao" value={task.vao} onChange={handleChange} disabled={isProductionUser || isViewer}>
                        <option value="">---</option>
                        {VAOS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </SelectField>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-2">
                <InputField label="Frente" name="frente" value={task.frente} onChange={handleChange} disabled={isProductionUser || isViewer} placeholder="Ex: KM 12+500" />
                <InputField label="Corte" name="corte" value={task.corte} onChange={handleChange} disabled={isProductionUser || isViewer} placeholder="Ex: C-01" />
            </div>
        )}
      </div>

      {oaeTaskOptions ? (
          <SelectField 
            label="Descrição Atividade" 
            name="name" 
            value={task.name} 
            onChange={handleChange} 
            error={errors.name} 
            errorType={errorType}
            disabled={isProductionUser || isViewer}
          >
              <option value="">Selecione a tarefa técnica</option>
              {oaeTaskOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </SelectField>
      ) : (
          <InputField 
              label="Descrição Atividade" 
              name="name" 
              value={task.name} 
              onChange={handleChange} 
              error={errors.name} 
              errorType={errorType}
              disabled={isProductionUser || isViewer}
              placeholder="Digite a atividade..."
          />
      )}

      <div className="border-t border-dark-border pt-4 mt-2 space-y-4">
          <div className="bg-white/[0.02] p-3 border-l-2 border-neon-orange">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black text-neon-orange uppercase tracking-widest">Cronograma Planejado</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} error={errors.plannedStartDate} disabled={isProductionUser || isViewer} />
              <InputField label="Fim" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} error={errors.plannedEndDate} disabled={isProductionUser || isViewer} />
            </div>
          </div>

          <div className="bg-white/[0.02] p-3 border-l-2 border-neon-green">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black text-neon-green uppercase tracking-widest">Execução Real</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} disabled={isViewer} />
              <InputField label="Término Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} disabled={isViewer} error={errors.actualEndDate} />
            </div>
          </div>
      </div>

      <div className="border-t border-dark-border pt-4">
          <label 
            className="text-[9px] font-black uppercase tracking-widest mb-1 block transition-colors duration-300"
            style={{ color: progressStyle.color }}
          >
            Avanço Físico: {task.progress}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={task.progress || 0} 
            onChange={(e) => setTask(prev => ({...prev, progress: Number(e.target.value)}))} 
            disabled={isViewer} 
            className="w-full h-1 appearance-none cursor-pointer rounded-full outline-none transition-all duration-300 border border-dark-border/50" 
            style={{
              background: progressStyle.background
            }}
          />
      </div>

      <TextareaField label="Observações" name="observations" value={task.observations} onChange={handleChange} disabled={isViewer} placeholder="Notas de campo..." />

      {/* Alerta de Conflito de Equipes */}
      {showConflictWarning && (
          <div className="border-2 border-neon-orange bg-dark-bg p-4 shadow-neon-orange animate-fast-blink my-4 relative">
              <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-neon-orange rounded-full animate-pulse"></div>
                  <h4 className="text-neon-orange font-black uppercase text-[10px] tracking-widest">Alerta de Conflito de Equipes</h4>
              </div>
              <p className="text-white text-[9px] uppercase font-bold tracking-tight leading-relaxed">
                  Detectamos que já possui <span className="text-neon-orange text-lg px-1">{conflictCount}</span> registros de equipes alocadas neste mesmo período.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                  <p className="text-white/40 text-[8px] uppercase font-black">Confirma a criação deste registro múltiplo?</p>
              </div>
          </div>
      )}

      <div className="flex justify-end gap-3 pt-6 border-t border-dark-border">
        <button type="button" onClick={onCancel} className="text-white/30 font-black text-[9px] uppercase tracking-widest hover:text-white">{isViewer ? 'Fechar' : 'Cancelar'}</button>
        {!isViewer && (
            <button 
                type="submit" 
                className={`${showConflictWarning ? 'bg-neon-orange shadow-neon-orange text-black' : 'bg-neon-cyan shadow-neon-cyan text-black'} font-black py-2 px-10 uppercase text-[10px] tracking-widest hover:bg-white transition-all`}
            >
              {showConflictWarning ? 'Confirmar e Salvar' : 'Salvar Registro'}
            </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
