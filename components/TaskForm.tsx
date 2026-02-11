
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
    const start = type === 'planned' ? task.plannedStartDate : task.actualStartDate;
    const end = type === 'planned' ? task.plannedEndDate : task.actualEndDate;

    if (!start || !end) {
      alert("Por favor, preencha as datas de início e fim antes de consultar.");
      return;
    }

    setLoadingWeather(type);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Resumo meteorológico para engenharia civil em Paracambi-RJ. 
      Período: ${start} até ${end}. 
      Atividade: ${task.name || 'Construção'} (${task.discipline}). 
      Se o período for futuro, dê a previsão. Se for passado, relate o clima real. 
      Foque em chuvas e impactos na obra. Seja muito breve (2 frases).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }] 
        }
      });

      const weatherText = response.text || "Relatório meteorológico não gerado.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      setTask(prev => ({ 
        ...prev, 
        [type === 'planned' ? 'plannedWeather' : 'actualWeather']: weatherText 
      }));
      setWeatherSources(prev => ({
        ...prev,
        [type]: sources
      }));
    } catch (error: any) {
      console.error("DEBUG METEO:", error);
      const msg = error?.message || "Erro desconhecido";
      
      if (msg.includes("Search tool is not enabled")) {
        alert("ALERTA: A ferramenta de busca (Google Search) não está habilitada nesta chave de API. Verifique as configurações no Google AI Studio.");
      } else if (msg.includes("API_KEY_INVALID")) {
        alert("ERRO: Chave de API inválida ou sem permissões suficientes.");
      } else {
        alert(`FALHA NA TELEMETRIA: ${msg}`);
      }
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
      <div className="mt-1 flex flex-wrap gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[6px] font-black text-white uppercase">Docs:</span>
        {sources.map((chunk, idx) => (
          chunk.web && (
            <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[6px] text-neon-cyan hover:text-white truncate max-w-[80px]">
              [{idx + 1}] {chunk.web.title || 'ref'}
            </a>
          )
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[85vh] overflow-y-auto pr-3 custom-scrollbar">
      <div className="sticky top-0 bg-dark-surface z-10 pb-4 border-b border-dark-border mb-4">
        <h2 className="text-lg font-black text-white uppercase tracking-[4px]">
          Controle <span className="text-neon-orange">Técnico</span>
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 w-1 rounded-full bg-neon-green animate-pulse"></div>
          <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Estação: Paracambi - RJ</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="mb-3">
              <label className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">Disciplina</label>
              <select name="discipline" value={task.discipline} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border p-2 text-white font-mono text-xs outline-none focus:border-neon-cyan">
                  {Object.values(Discipline).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
          </div>
          <div className="mb-3">
              <label className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">Nível Operacional</label>
              <select name="level" value={task.level} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border p-2 text-white font-mono text-xs outline-none focus:border-neon-cyan">
                  <option value="">Selecionar...</option>
                  {(DISCIPLINE_LEVELS[task.discipline] || []).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
          </div>
      </div>

      <InputField label="Atividade" name="name" value={task.name} onChange={handleChange} placeholder="Ex: Terraplanagem Setor A..." />

      <div className="space-y-4 pt-2">
          {/* Módulo Planejado */}
          <div className="bg-white/[0.02] p-3 border-l-2 border-neon-orange">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[8px] font-black text-neon-orange uppercase tracking-widest">Cronograma Previsto</p>
                <button 
                  type="button" 
                  onClick={() => fetchWeather('planned')}
                  disabled={!!loadingWeather || isViewer}
                  className="flex items-center gap-1.5 px-3 py-1 bg-dark-bg border border-neon-orange text-[7px] font-black uppercase text-neon-orange hover:bg-neon-orange hover:text-black transition-all disabled:opacity-20"
                >
                    {loadingWeather === 'planned' ? 'Sincronizando...' : <><WeatherIcon /> Consultar Previsão</>}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Início" name="plannedStartDate" type="date" value={task.plannedStartDate} onChange={handleChange} />
              <InputField label="Término" name="plannedEndDate" type="date" value={task.plannedEndDate} onChange={handleChange} />
            </div>
            {task.plannedWeather && (
                <div className="mt-2 p-2 bg-black/40 border border-white/5">
                    <p className="font-mono text-[9px] text-white/80 leading-relaxed italic">"{task.plannedWeather}"</p>
                    {renderSources(weatherSources.planned)}
                </div>
            )}
          </div>

          {/* Módulo Realizado */}
          <div className="bg-white/[0.02] p-3 border-l-2 border-neon-green">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[8px] font-black text-neon-green uppercase tracking-widest">Execução em Campo</p>
                <button 
                  type="button" 
                  onClick={() => fetchWeather('actual')}
                  disabled={!!loadingWeather || isViewer}
                  className="flex items-center gap-1.5 px-3 py-1 bg-dark-bg border border-neon-green text-[7px] font-black uppercase text-neon-green hover:bg-neon-green hover:text-black transition-all disabled:opacity-20"
                >
                    {loadingWeather === 'actual' ? 'Buscando...' : <><WeatherIcon /> Histórico Real</>}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} />
              <InputField label="Fim Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} />
            </div>
            {task.actualWeather && (
                <div className="mt-2 p-2 bg-black/40 border border-white/5">
                    <p className="font-mono text-[9px] text-white/80 leading-relaxed italic">"{task.actualWeather}"</p>
                    {renderSources(weatherSources.actual)}
                </div>
            )}
          </div>
      </div>

      <div className="pt-4 border-t border-dark-border mt-4">
          <div className="flex justify-between mb-1.5">
            <label className="text-[8px] font-black text-neon-cyan uppercase">Progresso da Tarefa</label>
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

      <TextareaField label="Observações de Campo" name="observations" value={task.observations} onChange={handleChange} placeholder="Relate impedimentos, condições do solo ou atrasos..." />

      <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-dark-surface z-10 border-t border-dark-border py-4 mt-6">
        <button type="button" onClick={onCancel} className="text-white/30 font-black text-[9px] uppercase tracking-widest hover:text-white transition-colors px-4">Sair</button>
        {!isViewer && (
            <button type="submit" className="bg-neon-cyan text-black font-black py-2.5 px-10 rounded-none uppercase text-[10px] tracking-[2px] hover:bg-white shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all active:scale-95">
              Salvar Registro
            </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
