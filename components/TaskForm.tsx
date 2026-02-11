
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
  const [weatherSources, setWeatherSources] = useState<{ planned: any[], actual: any[] }>({ planned: [], actual: [] });

  useEffect(() => {
    if (existingTask) {
      setTask({ ...existingTask, observations: existingTask.observations || '' });
    }
  }, [existingTask]);

  const fetchWeather = async (type: 'planned' | 'actual') => {
    const startDate = type === 'planned' ? task.plannedStartDate : task.actualStartDate;
    const endDate = type === 'planned' ? task.plannedEndDate : task.actualEndDate;

    if (!startDate || !endDate) {
      alert("Defina o período completo (Início e Fim) antes de consultar o clima.");
      return;
    }

    setLoadingWeather(type);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Aja como um engenheiro de planejamento especialista em meteorologia. 
      Forneça um resumo técnico do clima EXCLUSIVAMENTE para a localização de Paracambi-RJ. 
      Período solicitado: de ${startDate} até ${endDate}. 
      Tarefa de campo: "${task.name}" na disciplina de "${task.discipline}".
      
      Instruções:
      1. Se o período for FUTURO, forneça a previsão de chuvas e temperaturas.
      2. Se o período for PASSADO, forneça o histórico meteorológico real verificado.
      3. Indique janelas de trabalho favoráveis ou riscos de paralisação por chuva (pluviometria) para atividades de ${task.discipline}.
      Seja técnico e conciso (máximo de 250 caracteres).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }] 
        }
      });

      const weatherText = response.text || "Dados meteorológicos indisponíveis para este período em Paracambi-RJ.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      setTask(prev => ({ 
        ...prev, 
        [type === 'planned' ? 'plannedWeather' : 'actualWeather']: weatherText 
      }));
      setWeatherSources(prev => ({
        ...prev,
        [type]: sources
      }));
    } catch (error) {
      console.error("Erro na API Gemini:", error);
      alert("Falha técnica ao acessar serviços meteorológicos de Paracambi. Verifique sua conexão ou tente novamente.");
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

  const renderSources = (sources: any[]) => {
    if (!sources || sources.length === 0) return null;
    return (
      <div className="mt-1 flex flex-wrap gap-2">
        <span className="text-[7px] font-black text-white/30 uppercase">Fontes:</span>
        {sources.map((chunk, idx) => (
          chunk.web && (
            <a 
              key={idx} 
              href={chunk.web.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[7px] text-neon-cyan hover:underline truncate max-w-[150px]"
            >
              {chunk.web.title || 'Referência'}
            </a>
          )
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="sticky top-0 bg-dark-surface z-10 pb-4 border-b border-dark-border mb-4">
        <h2 className="text-lg font-black text-white uppercase tracking-[4px]">
          Folha de <span className="text-neon-orange">Registro Técnico</span>
        </h2>
        <p className="text-[7px] font-black text-neon-cyan/50 uppercase tracking-widest mt-1">Localidade Padrão: Paracambi - RJ</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="mb-3">
              <label className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">Disciplina</label>
              <select name="discipline" value={task.discipline} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border p-2 text-white font-mono text-sm outline-none focus:border-neon-cyan">
                  {Object.values(Discipline).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
          </div>
          <div className="mb-3">
              <label className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">Nível Operacional</label>
              <select name="level" value={task.level} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border p-2 text-white font-mono text-sm outline-none focus:border-neon-cyan">
                  <option value="">Selecionar...</option>
                  {(DISCIPLINE_LEVELS[task.discipline] || []).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
          </div>
      </div>

      <InputField label="Descrição da Atividade" name="name" value={task.name} onChange={handleChange} placeholder="Ex: Montagem de Cimbramento..." />

      <div className="border-t border-dark-border pt-4 mt-2 space-y-4">
          {/* Módulo Clima Planejado */}
          <div className="bg-neon-orange/5 p-3 border border-neon-orange/20 relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] font-black text-neon-orange uppercase tracking-widest">Cronograma Planejado</p>
                <button 
                  type="button" 
                  onClick={() => fetchWeather('planned')}
                  disabled={!!loadingWeather || isViewer}
                  className="flex items-center gap-1.5 px-3 py-1 bg-dark-bg border border-neon-orange text-[8px] font-black uppercase text-neon-orange hover:bg-neon-orange hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                    {loadingWeather === 'planned' ? 'Analizando...' : <><WeatherIcon /> Previsão Paracambi</>}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início (ETA)" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} />
              <InputField label="Fim (ETA)" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} />
            </div>
            {task.plannedWeather && (
                <div className="mt-2 p-2 bg-black/60 border-l-2 border-neon-orange">
                    <p className="font-mono text-[9px] text-white/90 leading-tight italic">{task.plannedWeather}</p>
                    {renderSources(weatherSources.planned)}
                </div>
            )}
          </div>

          {/* Módulo Clima Realizado */}
          <div className="bg-neon-green/5 p-3 border border-neon-green/20">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] font-black text-neon-green uppercase tracking-widest">Execução Real</p>
                <button 
                  type="button" 
                  onClick={() => fetchWeather('actual')}
                  disabled={!!loadingWeather || isViewer}
                  className="flex items-center gap-1.5 px-3 py-1 bg-dark-bg border border-neon-green text-[8px] font-black uppercase text-neon-green hover:bg-neon-green hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                    {loadingWeather === 'actual' ? 'Sincronizando...' : <><WeatherIcon /> Histórico Real</>}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} />
              <InputField label="Término Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} />
            </div>
            {task.actualWeather && (
                <div className="mt-2 p-2 bg-black/60 border-l-2 border-neon-green">
                    <p className="font-mono text-[9px] text-white/90 leading-tight italic">{task.actualWeather}</p>
                    {renderSources(weatherSources.actual)}
                </div>
            )}
          </div>
      </div>

      <div className="pt-4 border-t border-dark-border mt-4">
          <div className="flex justify-between mb-1">
            <label className="text-[9px] font-black text-neon-cyan uppercase">Avanço Físico</label>
            <span className="text-[10px] font-mono text-neon-cyan">{task.progress}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={task.progress || 0} 
            onChange={(e) => setTask(prev => ({...prev, progress: Number(e.target.value)}))} 
            className="w-full h-1 bg-dark-bg appearance-none cursor-pointer accent-neon-cyan border border-dark-border" 
          />
      </div>

      <TextareaField label="Observações e Impedimentos" name="observations" value={task.observations} onChange={handleChange} placeholder="Relate condições de acesso, equipamentos ou atrasos..." />

      <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-dark-surface z-10 border-t border-dark-border py-4 mt-6">
        <button type="button" onClick={onCancel} className="text-white/30 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors px-4">Cancelar</button>
        {!isViewer && (
            <button type="submit" className="bg-neon-cyan text-black font-black py-2.5 px-10 uppercase text-[11px] tracking-[2px] hover:bg-white shadow-neon-cyan transition-all active:scale-95">
              Confirmar Registro
            </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
