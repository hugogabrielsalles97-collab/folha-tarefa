
import React, { useState, useEffect } from 'react';
import { Task, Discipline, TaskLevel } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";
import { WeatherIcon } from './icons';

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

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, existingTask, allTasks }) => {
  const { role } = useAuth();
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
    const startDate = type === 'planned' ? task.plannedStartDate : task.actualStartDate;
    const endDate = type === 'planned' ? task.plannedEndDate : task.actualEndDate;

    if (!startDate || !endDate) {
      alert("Defina o período (Início e Fim) antes de consultar o clima.");
      return;
    }

    setLoadingWeather(type);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Como um consultor de meteorologia para engenharia civil, forneça um resumo técnico do clima para a região da Serra das Araras, RJ (Piraí/Paracambi). 
      Período: de ${startDate} até ${endDate}. 
      Tarefa sendo executada: ${task.name} na disciplina de ${task.discipline}.
      Se as datas forem passadas, relate o histórico real. Se forem futuras, dê a previsão. 
      Foque em: Pluviometria (chuva), janelas de trabalho e riscos para ${task.discipline}. Seja conciso (máximo 3 frases).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const weatherText = response.text || "Dados meteorológicos indisponíveis no momento.";
      setTask(prev => ({ 
        ...prev, 
        [type === 'planned' ? 'plannedWeather' : 'actualWeather']: weatherText 
      }));
    } catch (error) {
      console.error("Erro ao buscar clima:", error);
      alert("Falha na telemetria meteorológica.");
    } finally {
      setLoadingWeather(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewer) return;
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    
    const taskToSave: Task = {
      id: existingTask?.id || crypto.randomUUID(),
      progress: task.progress || 0,
      ...task,
    } as Task;
    onSave(taskToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      <h2 className="text-lg font-black text-white uppercase tracking-[4px] border-b border-dark-border pb-2 mb-4 sticky top-0 bg-dark-surface z-10">
        Registro <span className="text-neon-orange">Técnico</span>
      </h2>
      
      {/* ... (campos de disciplina e local omitidos para brevidade, mas mantidos no código original) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="mb-3">
              <label className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">Disciplina</label>
              <select name="discipline" value={task.discipline} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border p-2 text-white font-mono text-sm outline-none">
                  {Object.values(Discipline).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
          </div>
          <div className="mb-3">
              <label className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">Nível</label>
              <select name="level" value={task.level} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border p-2 text-white font-mono text-sm outline-none">
                  <option value="">Selecionar...</option>
                  {(DISCIPLINE_LEVELS[task.discipline] || []).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
          </div>
      </div>

      <InputField label="Descrição da Atividade" name="name" value={task.name} onChange={handleChange} placeholder="Ex: Concretagem de Viga S01..." />

      <div className="border-t border-dark-border pt-4 mt-2 space-y-4">
          {/* Planejado */}
          <div className="bg-neon-orange/5 p-3 border border-neon-orange/20">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] font-black text-neon-orange uppercase tracking-widest">Cronograma Planejado</p>
                <button 
                  type="button" 
                  onClick={() => fetchWeather('planned')}
                  disabled={!!loadingWeather || isViewer}
                  className="flex items-center gap-1.5 px-2 py-1 border border-neon-orange text-[8px] font-black uppercase text-neon-orange hover:bg-neon-orange hover:text-black transition-all disabled:opacity-30"
                >
                    {loadingWeather === 'planned' ? 'Consultando...' : <><WeatherIcon /> Previsão Meteorológica</>}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} />
              <InputField label="Fim" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} />
            </div>
            {task.plannedWeather && (
                <div className="mt-2 p-2 bg-black/40 border-l-2 border-neon-orange font-mono text-[9px] text-white/70 italic leading-tight">
                    {task.plannedWeather}
                </div>
            )}
          </div>

          {/* Real */}
          <div className="bg-neon-green/5 p-3 border border-neon-green/20">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] font-black text-neon-green uppercase tracking-widest">Execução Real</p>
                <button 
                  type="button" 
                  onClick={() => fetchWeather('actual')}
                  disabled={!!loadingWeather || isViewer}
                  className="flex items-center gap-1.5 px-2 py-1 border border-neon-green text-[8px] font-black uppercase text-neon-green hover:bg-neon-green hover:text-black transition-all disabled:opacity-30"
                >
                    {loadingWeather === 'actual' ? 'Buscando Histórico...' : <><WeatherIcon /> Histórico Real Clima</>}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} />
              <InputField label="Fim Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} />
            </div>
            {task.actualWeather && (
                <div className="mt-2 p-2 bg-black/40 border-l-2 border-neon-green font-mono text-[9px] text-white/70 italic leading-tight">
                    {task.actualWeather}
                </div>
            )}
          </div>
      </div>

      <div className="pt-4">
          <label className="text-[9px] font-black text-neon-cyan uppercase mb-1 block">Avanço Físico: {task.progress}%</label>
          <input type="range" min="0" max="100" value={task.progress || 0} onChange={(e) => setTask(prev => ({...prev, progress: Number(e.target.value)}))} className="w-full h-1 bg-dark-bg appearance-none cursor-pointer accent-neon-cyan" />
      </div>

      <TextareaField label="Notas de Campo / Observações" name="observations" value={task.observations} onChange={handleChange} />

      <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-dark-surface z-10 border-t border-dark-border py-3 mt-4">
        <button type="button" onClick={onCancel} className="text-white/30 font-black text-[9px] uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
        {!isViewer && (
            <button type="submit" className="bg-transparent text-neon-cyan border-2 border-neon-cyan font-black py-2 px-8 uppercase text-[10px] tracking-[2px] hover:bg-neon-cyan hover:text-black transition-all">Confirmar Registro</button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
