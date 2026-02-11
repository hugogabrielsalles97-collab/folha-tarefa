
import React, { useState, useEffect } from 'react';
import { Task, Discipline, TaskLevel } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  existingTask: Task | null;
  allTasks: Task[];
}

// Ícone de clima simples
const WeatherIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
);

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

// Improved SelectField props to ensure children are recognized correctly and value accepts enums/strings
// This fixes the 'children' missing error by ensuring proper prop matching
const SelectField = ({ label, name, value, onChange, children, error, disabled }: { label: string, name: string, value: any, onChange: (e: React.ChangeEvent<any>) => void, children: React.ReactNode, error?: string, disabled?: boolean }) => (
     <div className="mb-3">
      <label htmlFor={name} className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">{label}</label>
      <select 
        id={name} 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        disabled={disabled} 
        className={`w-full bg-dark-bg border ${error ? 'border-neon-magenta' : 'border-dark-border'} p-2 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan disabled:opacity-30 appearance-none transition-colors`}
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
    plannedWeather: '',
    actualWeather: '',
    progress: 0,
    observations: '',
  });
  
  const [loadingWeather, setLoadingWeather] = useState<'planned' | 'actual' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingTask) {
      setTask({ ...existingTask, observations: existingTask.observations || '' });
    }
  }, [existingTask]);

  const fetchWeather = async (type: 'planned' | 'actual') => {
    const start = type === 'planned' ? task.plannedStartDate : task.actualStartDate;
    const end = type === 'planned' ? task.plannedEndDate : task.actualEndDate;

    if (!start || !end) {
      alert("Por favor, preencha as datas para consultar o clima.");
      return;
    }

    setLoadingWeather(type);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Resumo técnico de clima para Paracambi-RJ de ${start} a ${end}. Atividade: ${task.name || 'Obra'}. Relate chuvas e impacto na execução. Seja breve (2 frases).`;

      // Simplified contents to string as per current guidelines for text generation
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      // Using the .text property directly as per the latest @google/genai SDK
      const weatherText = response.text || "Sem dados.";
      setTask(prev => ({ 
        ...prev, 
        [type === 'planned' ? 'plannedWeather' : 'actualWeather']: weatherText 
      }));
    } catch (error) {
      console.error("Erro clima:", error);
    } finally {
      setLoadingWeather(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewer) return;
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    if (!validate()) return;

    const taskToSave: Task = {
      id: existingTask?.id || crypto.randomUUID(),
      progress: task.progress || 0,
      ...task,
    } as Task;
    onSave(taskToSave);
  };
  
  const levelsForDiscipline = DISCIPLINE_LEVELS[task.discipline] || [];
  const selectableTaskNames = task.discipline === Discipline.OAE && task.level ? OAE_TASK_NAMES_BY_LEVEL[task.level] : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
      <h2 className="text-lg font-black text-white uppercase tracking-[4px] border-b border-dark-border pb-2 mb-4">
        {isViewer ? 'Detalhes' : 'Registro de'} <span className="text-neon-orange">Tarefa</span>
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Fix for line 182: SelectField now accepts children and its value type is more flexible */}
        <SelectField label="Disciplina" name="discipline" value={task.discipline} onChange={handleChange} disabled={isProductionUser || isViewer}>
            {Object.values(Discipline).map(d => <option key={d} value={d} className="bg-dark-surface text-white">{d}</option>)}
        </SelectField>
        
        {/* Fix for line 186: SelectField now accepts children and handles task.level union type properly */}
        <SelectField label="Nível Operacional" name="level" value={task.level} onChange={handleChange} error={errors.level} disabled={isProductionUser || isViewer}>
            <option value="" className="bg-dark-surface text-white">Selecionar</option>
            {levelsForDiscipline.map(l => <option key={l} value={l} className="bg-dark-surface text-white">{l}</option>)}
        </SelectField>
      </div>

      <InputField 
          label="Descrição Atividade" 
          name="name" 
          value={task.name} 
          onChange={handleChange} 
          error={errors.name} 
          disabled={isProductionUser || isViewer}
      />

      <div className="border-t border-dark-border pt-4 mt-2 space-y-4">
          {/* Planejado */}
          <div className="bg-white/[0.02] p-3 border-l-2 border-neon-orange">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black text-neon-orange uppercase tracking-widest">Cronograma Planejado</p>
                <button type="button" onClick={() => fetchWeather('planned')} disabled={isViewer || !!loadingWeather} className="text-[7px] text-neon-orange border border-neon-orange px-2 py-0.5 hover:bg-neon-orange hover:text-black transition-all">
                    {loadingWeather === 'planned' ? '...' : 'Previsão'}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} error={errors.plannedStartDate} disabled={isProductionUser || isViewer} />
              <InputField label="Fim" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} error={errors.plannedEndDate} disabled={isProductionUser || isViewer} />
            </div>
            {task.plannedWeather && <p className="text-[8px] text-white/40 italic font-mono mt-1">"{task.plannedWeather}"</p>}
          </div>

          {/* Real */}
          <div className="bg-white/[0.02] p-3 border-l-2 border-neon-green">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black text-neon-green uppercase tracking-widest">Execução Real</p>
                <button type="button" onClick={() => fetchWeather('actual')} disabled={isViewer || !!loadingWeather} className="text-[7px] text-neon-green border border-neon-green px-2 py-0.5 hover:bg-neon-green hover:text-black transition-all">
                    {loadingWeather === 'actual' ? '...' : 'Histórico'}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} disabled={isViewer} />
              <InputField label="Término Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} disabled={isViewer} />
            </div>
            {task.actualWeather && <p className="text-[8px] text-white/40 italic font-mono mt-1">"{task.actualWeather}"</p>}
          </div>
      </div>

      <div className="border-t border-dark-border pt-4">
          <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest mb-1 block">Avanço Físico: {task.progress}%</label>
          <input type="range" min="0" max="100" value={task.progress || 0} onChange={(e) => setTask(prev => ({...prev, progress: Number(e.target.value)}))} disabled={isViewer} className="w-full h-1 bg-dark-bg appearance-none cursor-pointer accent-neon-cyan" />
      </div>

      <TextareaField label="Observações" name="observations" value={task.observations} onChange={handleChange} disabled={isViewer} placeholder="Notas de campo..." />

      <div className="flex justify-end gap-3 pt-6 border-t border-dark-border">
        <button type="button" onClick={onCancel} className="text-white/30 font-black text-[9px] uppercase tracking-widest hover:text-white">{isViewer ? 'Fechar' : 'Cancelar'}</button>
        {!isViewer && (
            <button type="submit" className="bg-neon-cyan text-black font-black py-2 px-10 uppercase text-[10px] tracking-widest hover:bg-white shadow-neon-cyan">
              Salvar Registro
            </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
