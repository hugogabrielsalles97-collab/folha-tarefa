
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Discipline, TaskLevel, OAELevel } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL, UNIDADE_MEDIDA_OPTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  existingTask: Task | null;
  allTasks: Task[];
}

const InputField = ({ label, name, value, onChange, type = 'text', error, disabled, placeholder, errorType, min, max, step }: { label: string, name: string, value?: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, error?: string, disabled?: boolean, placeholder?: string, errorType?: 'default' | 'critical', min?: string | number, max?: string | number, step?: string }) => {
    return (
        <div className="mb-1.5">
          <label htmlFor={name} className="block text-[9px] font-black text-neon-cyan uppercase tracking-widest mb-0.5">{label}</label>
          <input 
            type={type} 
            id={name} 
            name={name} 
            value={value ?? ''} 
            onChange={onChange} 
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className={`w-full border ${error ? (errorType === 'critical' ? 'border-neon-orange shadow-neon-orange' : 'border-neon-magenta') : 'border-dark-border'} p-2 font-mono text-xs focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-dark-bg text-white placeholder:text-white/10`} 
          />
          {error && (
            <p className={`${errorType === 'critical' ? 'text-neon-orange animate-fast-blink' : 'text-neon-magenta'} text-[8px] mt-0.5 font-black uppercase tracking-widest`}>
              {error}
            </p>
          )}
        </div>
    );
};

const SelectField = ({ label, name, value, onChange, children, error, disabled, errorType }: { label: string, name: string, value: any, onChange: (e: React.ChangeEvent<any>) => void, children?: React.ReactNode, error?: string, disabled?: boolean, errorType?: 'default' | 'critical' }) => (
     <div className="mb-1.5">
      <label htmlFor={name} className="block text-[9px] font-black text-neon-cyan uppercase tracking-widest mb-0.5">{label}</label>
      <select 
        id={name} 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        disabled={disabled} 
        className={`w-full bg-dark-bg border ${error ? (errorType === 'critical' ? 'border-neon-orange shadow-neon-orange' : 'border-neon-magenta') : 'border-dark-border'} p-2 text-white font-mono text-xs focus:outline-none focus:border-neon-cyan disabled:opacity-30 appearance-none transition-colors`}
      >
          {children}
      </select>
      {error && (
        <p className={`${errorType === 'critical' ? 'text-neon-orange animate-fast-blink' : 'text-neon-magenta'} text-[8px] mt-0.5 font-black uppercase tracking-widest`}>
          {error}
        </p>
      )}
     </div>
);

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, existingTask, allTasks }) => {
  const { role } = useAuth();
  const isProductionUser = role === 'PRODUÇÃO';
  const isViewer = role === 'VIEWER';

  const [task, setTask] = useState<Omit<Task, 'id'>>({
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
    plannedQuantity: undefined,
    actualQuantity: undefined,
    quantityUnit: undefined,
    progress: 0,
    observations: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);

  useEffect(() => {
    if (existingTask) {
      setTask({ ...existingTask, observations: existingTask.observations || '' });
    }
  }, [existingTask]);

  useEffect(() => {
    const planned = task.plannedQuantity;
    const actual = task.actualQuantity;
    let newProgress = 0;

    // Calculate progress only if there's a start date and valid quantities
    if (task.actualStartDate && planned && planned > 0 && actual && actual >= 0) {
      newProgress = Math.min(100, Math.round((actual / planned) * 100));
    }

    // Only update state if progress has changed to prevent infinite loops
    if (task.progress !== newProgress) {
      setTask(prev => ({ ...prev, progress: newProgress }));
    }
  }, [task.plannedQuantity, task.actualQuantity, task.actualStartDate, task.progress]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewer) return;
    const { name, value } = e.target;
    
    setTask(prev => {
        let val: any = value;
        
        if (name === 'plannedQuantity' || name === 'actualQuantity') {
            val = value === '' ? undefined : Number(value);
        }

        const updated = { ...prev, [name]: val };
        
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
            if (value !== OAELevel.SUPERESTRUTURA) updated.vao = '';
            if (value !== OAELevel.FUNDACOES && value !== OAELevel.MESOESTRUTURA) updated.apoio = '';
        }
        return updated;
    });

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
        const sameName = t.name.trim().toLowerCase() === task.name.trim().toLowerCase();
        const overlap = (task.plannedStartDate <= t.plannedEndDate) && (t.plannedStartDate <= task.plannedEndDate);
        return sameName && overlap;
    }).length;
  }, [task.name, task.plannedStartDate, task.plannedEndDate, allTasks, existingTask]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!task.name) newErrors.name = 'Obrigatório.';
    if (!task.level) newErrors.level = 'Obrigatório.';
    if (!task.plannedStartDate) newErrors.plannedStartDate = 'Obrigatório.';
    if (!task.plannedEndDate) newErrors.plannedEndDate = 'Obrigatório.';
    
    if (task.progress > 0 && !task.actualStartDate) {
        newErrors.progress = 'Início Real é obrigatório para registrar progresso.';
    }

    if (task.actualEndDate && (task.progress || 0) < 100) {
        newErrors.actualEndDate = 'Avanço deve ser 100% para registrar término.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    if (!validate()) return;

    if (!showConflictWarning && getConflictingTasksCount > 0) {
        setConflictCount(getConflictingTasksCount);
        setShowConflictWarning(true);
        return;
    }

    const taskToSave: Task = {
      id: existingTask?.id || crypto.randomUUID(),
      ...task,
    } as Task;
    onSave(taskToSave);
  };

  const progressColor = useMemo(() => {
    const p = task.progress || 0;
    if (p === 100) return '#39ff14';
    if (p === 0) return '#ff8c00';
    return '#00f3ff';
  }, [task.progress]);

  const showApoio = task.discipline === Discipline.OAE && (task.level === OAELevel.FUNDACOES || task.level === OAELevel.MESOESTRUTURA);
  const showVao = task.discipline === Discipline.OAE && task.level === OAELevel.SUPERESTRUTURA;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <h2 className="text-base font-black text-white uppercase tracking-[3px] border-b border-dark-border pb-1.5 mb-2">
        {isViewer ? 'DETALHES DA' : 'REGISTRAR'} <span className="text-neon-orange">TAREFA</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField label="Disciplina" name="discipline" value={task.discipline} onChange={handleChange} disabled={isProductionUser || isViewer}>
            {Object.values(Discipline).map(d => <option key={d} value={d}>{d}</option>)}
        </SelectField>
        <SelectField label="Nível Operacional" name="level" value={task.level} onChange={handleChange} error={errors.level} disabled={isProductionUser || isViewer}>
            <option value="">Selecionar</option>
            {(DISCIPLINE_LEVELS[task.discipline] || []).map(l => <option key={l} value={l}>{l}</option>)}
        </SelectField>
      </div>

      <div className="bg-white/5 p-3 border border-dark-border">
          {task.discipline === Discipline.OAE ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SelectField label="OAE" name="obraDeArte" value={task.obraDeArte} onChange={handleChange} disabled={isProductionUser || isViewer}>
                    <option value="">---</option>
                    {OBRAS_DE_ARTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </SelectField>
                {showApoio && (
                    <SelectField label="Apoio" name="apoio" value={task.apoio} onChange={handleChange} disabled={isProductionUser || isViewer}>
                        <option value="">---</option>
                        {APOIOS_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </SelectField>
                )}
                {showVao && (
                    <SelectField label="Vão" name="vao" value={task.vao} onChange={handleChange} disabled={isProductionUser || isViewer}>
                        <option value="">---</option>
                        {VAOS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </SelectField>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
                <InputField label="Frente" name="frente" value={task.frente} onChange={handleChange} disabled={isProductionUser || isViewer} />
                <InputField label="Corte" name="corte" value={task.corte} onChange={handleChange} disabled={isProductionUser || isViewer} />
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 gap-2 pt-2">
          {OAE_TASK_NAMES_BY_LEVEL[task.level] ? (
              <SelectField label="Descrição da Tarefa" name="name" value={task.name} onChange={handleChange} error={errors.name} disabled={isProductionUser || isViewer}>
                  <option value="">Selecione a tarefa...</option>
                  {OAE_TASK_NAMES_BY_LEVEL[task.level].map(t => <option key={t} value={t}>{t}</option>)}
              </SelectField>
          ) : (
              <InputField label="Descrição da Tarefa" name="name" value={task.name} onChange={handleChange} error={errors.name} disabled={isProductionUser || isViewer} placeholder="Descreva a atividade..." />
          )}
      </div>

      <div className="pt-2">
        <SelectField label="Unidade de Medida" name="quantityUnit" value={task.quantityUnit} onChange={handleChange} disabled={isProductionUser || isViewer}>
            <option value="">Selecione a Unidade...</option>
            {UNIDADE_MEDIDA_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </SelectField>
      </div>

      <div className="bg-white/[0.03] p-3 border-l-4 border-neon-orange">
        <p className="text-[10px] font-black text-neon-orange uppercase mb-3 tracking-widest">Cronograma Planejado</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField label="Data Início" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} error={errors.plannedStartDate} disabled={isProductionUser || isViewer} />
            <InputField label="Data Término" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} error={errors.plannedEndDate} disabled={isProductionUser || isViewer} />
            <InputField label="Quantidade Prevista" name="plannedQuantity" type="number" step="0.01" value={task.plannedQuantity} onChange={handleChange} disabled={isProductionUser || isViewer} />
        </div>
      </div>

      <div className="bg-white/[0.03] p-3 border-l-4 border-neon-green">
        <p className="text-[10px] font-black text-neon-green uppercase mb-3 tracking-widest">Execução em Campo</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} disabled={isViewer} />
            <InputField label="Fim Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} disabled={isViewer} error={errors.actualEndDate} />
            <InputField label="Quantidade Realizada" name="actualQuantity" type="number" step="0.01" value={task.actualQuantity} onChange={handleChange} disabled={isViewer} />
        </div>
      </div>


      <div className={`pt-2 transition-opacity ${!task.actualStartDate ? 'opacity-40' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-1">
            <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest">Avanço Físico</label>
            <span className="text-[14px] font-mono font-black text-white bg-dark-bg px-2 border border-dark-border" style={{ color: !task.actualStartDate ? '#666' : progressColor }}>
                {task.progress}%
            </span>
          </div>
          <div className={`relative h-4 bg-dark-bg border ${errors.progress ? 'border-neon-magenta shadow-neon-magenta' : 'border-dark-border'} group overflow-hidden`}>
            <div 
                className="absolute top-0 left-0 h-full"
                style={{ 
                    width: `${task.progress}%`, 
                    background: !task.actualStartDate ? '#333' : progressColor,
                    boxShadow: task.actualStartDate ? `0 0 15px ${progressColor}88` : 'none'
                }}
            />
            <input 
                type="range"
                name="progress"
                min="0"
                max="100"
                step="1"
                value={task.progress}
                disabled={true}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-not-allowed z-10"
            />
          </div>
          {errors.progress ? (
              <p className="text-neon-magenta text-[8px] mt-1 font-black uppercase tracking-widest animate-pulse">{errors.progress}</p>
          ) : (
              <p className="text-[7px] text-white/30 uppercase font-black mt-1 tracking-tighter">
                {!task.actualStartDate 
                    ? 'BLOQUEADO: Defina a data de início real para habilitar o cálculo de avanço' 
                    : 'AVANÇO CALCULADO AUTOMATICAMENTE (REALIZADO / PREVISTO)'}
              </p>
          )}
      </div>

      {showConflictWarning && (
          <div className="border-2 border-neon-orange bg-dark-bg p-3 shadow-neon-orange animate-fast-blink my-2">
              <h4 className="text-neon-orange font-black uppercase text-[10px] tracking-widest mb-1">Alerta de Conflito de Equipe ({conflictCount})</h4>
              <p className="text-white text-[9px] uppercase font-bold leading-tight">
                  Detectamos que já possui {conflictCount} registros de equipe de <span className="text-neon-orange">{task.name.toUpperCase()}</span> alocadas neste período.
              </p>
          </div>
      )}

      <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
        <button type="button" onClick={onCancel} className="text-white/40 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:text-white transition-colors">{isViewer ? 'FECHAR' : 'CANCELAR'}</button>
        {!isViewer && (
            <button type="submit" className={`${showConflictWarning ? 'bg-neon-orange shadow-neon-orange' : 'bg-neon-cyan shadow-neon-cyan'} text-black font-black py-2.5 px-8 uppercase text-[10px] tracking-widest hover:bg-white transition-all`}>
              {showConflictWarning ? 'CONFIRMAR REGISTRO' : 'SALVAR REGISTRO'}
            </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
