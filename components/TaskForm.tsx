
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Discipline, TaskLevel, OAELevel, ImageSafetyAnalysis } from '../types';
import { DISCIPLINE_LEVELS, OBRAS_DE_ARTE_OPTIONS, APOIOS_OPTIONS, VAOS_OPTIONS, OAE_TASK_NAMES_BY_LEVEL, UNIDADE_MEDIDA_OPTIONS, FRENTES_OPTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { EyeIcon, SparklesIcon, ShieldCheckIcon, WarningIcon } from './icons';
import { getWeatherForecast, getHistoricalWeather } from '../services/weatherService';
import { analyzeObservations, analyzeImageSafety } from '../services/geminiService';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  existingTask: Task | null;
  allTasks: Task[];
  onViewPhotos: (images: string[], startIndex?: number) => void;
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

const TextAreaField = ({ label, name, value, onChange, disabled, placeholder }: { label?: string, name: string, value?: any, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, disabled?: boolean, placeholder?: string }) => {
    return (
        <div className="mb-1.5">
            {label && <label htmlFor={name} className="block text-[9px] font-black text-neon-cyan uppercase tracking-widest mb-0.5">{label}</label>}
            <textarea
                id={name}
                name={name}
                value={value ?? ''}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                rows={4}
                className={`w-full border border-dark-border p-2 font-mono text-xs focus:outline-none focus:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-dark-bg text-white placeholder:text-white/10`}
            />
        </div>
    );
};

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, existingTask, allTasks, onViewPhotos }) => {
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
    plannedWeather: '',
    actualWeather: '',
    plannedQuantity: undefined,
    actualQuantity: undefined,
    quantityUnit: undefined,
    progress: 0,
    observations: '',
    photo_urls: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingPlannedWeather, setIsFetchingPlannedWeather] = useState(false);
  const [isFetchingActualWeather, setIsFetchingActualWeather] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [aiAnalysisError, setAiAnalysisError] = useState('');
  const [safetyAnalyses, setSafetyAnalyses] = useState<Record<string, ImageSafetyAnalysis>>({});


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) {
      alert("ERRO DE CONFIGURAÇÃO: O serviço de armazenamento de arquivos não está disponível.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from('task_photos')
        .upload(fileName, file);

    if (error) {
        alert('Erro no upload da imagem: ' + error.message);
        setIsUploading(false);
        return;
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from('task_photos')
        .getPublicUrl(data.path);

    setTask(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), publicUrl] }));
    setIsUploading(false);
    e.target.value = ''; // Limpa o input

    // Inicia a análise de segurança da imagem
    setSafetyAnalyses(prev => ({ ...prev, [publicUrl]: { status: 'analyzing' } }));
    try {
      const analysisResult = await analyzeImageSafety(file);
      const status = analysisResult.includes('INSEGURO') ? 'unsafe' : 'safe';
      setSafetyAnalyses(prev => ({ ...prev, [publicUrl]: { status, analysis: analysisResult } }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred during image safety analysis.";
      setSafetyAnalyses(prev => ({ ...prev, [publicUrl]: { status: 'error', analysis: message } }));
    }
  };

  const handleAnalyzeExistingImage = async (url: string) => {
    // Fix: Cast Object.values to ImageSafetyAnalysis[] to avoid 'unknown' type error
    if ((Object.values(safetyAnalyses) as ImageSafetyAnalysis[]).some(a => a.status === 'analyzing')) {
      alert("Aguarde a análise atual ser concluída antes de iniciar outra.");
      return;
    }
    
    setSafetyAnalyses(prev => ({ ...prev, [url]: { status: 'analyzing' } }));
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Não foi possível buscar a imagem para análise.');
      
      const blob = await response.blob();
      const fileName = url.substring(url.lastIndexOf('/') + 1) || 'image.jpg';
      const file = new File([blob], fileName, { type: blob.type });

      const analysisResult = await analyzeImageSafety(file);
      const status = analysisResult.includes('INSEGURO') ? 'unsafe' : 'safe';
      setSafetyAnalyses(prev => ({ ...prev, [url]: { status, analysis: analysisResult } }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred while analyzing the existing image.";
      setSafetyAnalyses(prev => ({ ...prev, [url]: { status: 'error', analysis: message } }));
    }
  };

  const handleDeletePhoto = async (url: string) => {
    if (!supabase) {
      alert("ERRO DE CONFIGURAÇÃO: O serviço de armazenamento de arquivos não está disponível.");
      return;
    }
    if (!window.confirm('Tem certeza que deseja remover esta foto?')) return;
    
    const filePath = url.split('/task_photos/')[1];
    
    const { error } = await supabase.storage.from('task_photos').remove([filePath]);
    if (error) {
        alert('Erro ao remover a imagem: ' + error.message);
        return;
    }

    setTask(prev => ({ ...prev, photo_urls: (prev.photo_urls || []).filter(u => u !== url) }));
    setSafetyAnalyses(prev => {
        const newAnalyses = { ...prev };
        delete newAnalyses[url];
        return newAnalyses;
    });
  };

  useEffect(() => {
    if (existingTask) {
        setTask({ 
          ...existingTask, 
          observations: existingTask.observations || '',
          photo_urls: existingTask.photo_urls || [],
          plannedWeather: existingTask.plannedWeather || '',
          actualWeather: existingTask.actualWeather || '',
      });
    }
  }, [existingTask]);

  // Busca previsão do tempo planejada para datas futuras
  useEffect(() => {
    if (task.plannedStartDate && !isProductionUser && !isViewer) {
      const fetchWeather = async () => {
        setIsFetchingPlannedWeather(true);
        const weather = await getWeatherForecast(task.plannedStartDate);
        setTask(prev => ({ ...prev, plannedWeather: weather }));
        setIsFetchingPlannedWeather(false);
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const plannedDate = new Date(task.plannedStartDate + 'T00:00:00Z');
      
      if (plannedDate >= today) {
        fetchWeather();
      } else {
        setTask(prev => ({ ...prev, plannedWeather: '' }));
      }
    } else {
      setTask(prev => ({ ...prev, plannedWeather: '' }));
    }
  }, [task.plannedStartDate, isProductionUser, isViewer]);

  // Busca tempo histórico para datas de execução passadas
  useEffect(() => {
    if (task.actualStartDate && !isViewer && !existingTask?.actualWeather) {
      const fetchHistoricalWeather = async () => {
        setIsFetchingActualWeather(true);
        const weather = await getHistoricalWeather(task.actualStartDate);
        setTask(prev => ({ ...prev, actualWeather: weather }));
        setIsFetchingActualWeather(false);
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const actualDate = new Date(task.actualStartDate + 'T00:00:00Z');

      if (actualDate <= today) {
        fetchHistoricalWeather();
      } else {
        setTask(prev => ({ ...prev, actualWeather: '' }));
      }
    } else if (!task.actualStartDate) {
        setTask(prev => ({ ...prev, actualWeather: '' }));
    }
  }, [task.actualStartDate, isViewer, existingTask?.actualWeather]);

  useEffect(() => {
    const planned = task.plannedQuantity;
    const actual = task.actualQuantity;
    let newProgress = 0;

    if (task.actualStartDate && planned && planned > 0 && actual && actual >= 0) {
      newProgress = Math.min(100, Math.round((actual / planned) * 100));
    }

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
  
  const handleAnalyzeWithAI = async () => {
    if (!task.observations || isAnalyzingAI) return;
    
    setIsAnalyzingAI(true);
    setAiAnalysisResult('');
    setAiAnalysisError('');

    try {
        const result = await analyzeObservations(task.observations);
        setAiAnalysisResult(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred during AI analysis.";
        setAiAnalysisError(`Erro na análise: ${message}`);
    } finally {
        setIsAnalyzingAI(false);
    }
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
      
      {isViewer && (
        <div className="flex items-center gap-3 bg-dark-bg border-l-4 border-neon-cyan p-4 -mt-2 mb-2">
          <EyeIcon />
          <p className="text-xs text-white/70">
            <span className="font-bold text-white uppercase tracking-wider">Modo Visualização:</span> As edições estão desabilitadas.
          </p>
        </div>
      )}

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
          ) : task.discipline === Discipline.PAVIMENTACAO ? (
            <div>
              <SelectField label="Frente" name="frente" value={task.frente} onChange={handleChange} disabled={isProductionUser || isViewer}>
                  <option value="">---</option>
                  {FRENTES_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </SelectField>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
                <SelectField label="Frente" name="frente" value={task.frente} onChange={handleChange} disabled={isProductionUser || isViewer}>
                    <option value="">---</option>
                    {FRENTES_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </SelectField>
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
        {(isFetchingPlannedWeather || task.plannedWeather) && (
            <div className="mt-3 text-xs text-white/50 font-mono p-2 bg-dark-bg border border-dark-border text-center">
                {isFetchingPlannedWeather ? 'Buscando previsão...' : task.plannedWeather}
            </div>
        )}
      </div>

      <div className="bg-white/[0.03] p-3 border-l-4 border-neon-green">
        <p className="text-[10px] font-black text-neon-green uppercase mb-3 tracking-widest">Execução em Campo</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField label="Início Real" name="actualStartDate" type="date" value={task.actualStartDate} onChange={handleChange} disabled={isViewer} />
            <InputField label="Fim Real" name="actualEndDate" type="date" value={task.actualEndDate} onChange={handleChange} disabled={isViewer} error={errors.actualEndDate} />
            <InputField label="Quantidade Realizada" name="actualQuantity" type="number" step="0.01" value={task.actualQuantity} onChange={handleChange} disabled={isViewer} />
        </div>
        {(isFetchingActualWeather || task.actualWeather) && (
            <div className="mt-3 text-xs text-white/50 font-mono p-2 bg-dark-bg border border-dark-border text-center">
                {isFetchingActualWeather ? 'Buscando tempo real...' : task.actualWeather}
            </div>
        )}
      </div>
      
      <div className="bg-white/[0.03] p-3 border-l-4 border-neon-cyan">
        <p className="text-[10px] font-black text-neon-cyan uppercase mb-3 tracking-widest">Registro Fotográfico & Análise de Segurança</p>
        <input id="photo-upload" type="file" className="hidden" onChange={handleFileUpload} accept="image/*" disabled={isUploading || isViewer} />
        
        {(task.photo_urls || []).length === 0 ? (
            (isProductionUser || role === 'PLANEJADOR') && !isViewer ? (
                <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed border-dark-border hover:border-neon-cyan transition-colors cursor-pointer bg-dark-bg p-4 group">
                    {isUploading ? (
                        <div className="text-center">
                            <svg className="animate-spin h-8 w-8 text-neon-cyan mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-2 text-sm text-white/50 animate-pulse uppercase tracking-widest">Enviando...</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-white/20 group-hover:text-neon-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-2 text-sm text-white/50">
                                <span className="font-semibold text-neon-cyan">CLIQUE AQUI</span> PARA ADICIONAR
                            </p>
                            <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">OU ARRASTE E SOLTE O ARQUIVO</p>
                        </div>
                    )}
                </label>
            ) : (
                <div className="flex items-center justify-center w-full min-h-[200px] border-2 border-dashed border-dark-border bg-dark-bg p-4">
                    <p className="text-center text-white/10 text-xs font-black uppercase tracking-widest">Nenhum registro fotográfico.</p>
                </div>
            )
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {(task.photo_urls || []).map((url, index) => {
                    const analysis = safetyAnalyses[url];
                    let statusIndicator = null;
                    if (analysis) {
                        if (analysis.status === 'analyzing') {
                            statusIndicator = (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-center text-white text-[8px] font-black uppercase tracking-widest animate-pulse">
                                    ANALISANDO...
                                </div>
                            );
                        } else if (analysis.status === 'safe') {
                            statusIndicator = (
                                <div title={analysis.analysis} className="absolute bottom-0 left-0 right-0 bg-neon-green/80 p-1 flex items-center justify-center gap-1 text-black text-[8px] font-black uppercase tracking-widest">
                                    <ShieldCheckIcon className="h-3 w-3" />
                                    SEGURO
                                </div>
                            );
                        } else if (analysis.status === 'unsafe') {
                            statusIndicator = (
                                <div title={analysis.analysis} className="absolute bottom-0 left-0 right-0 bg-neon-red/80 p-1 flex items-center justify-center gap-1 text-white text-[8px] font-black uppercase tracking-widest">
                                    <WarningIcon className="h-3 w-3" />
                                    INSEGURO
                                </div>
                            );
                        } else if (analysis.status === 'error') {
                            statusIndicator = (
                                <div title={analysis.analysis} className="absolute bottom-0 left-0 right-0 bg-neon-orange/80 p-1 flex items-center justify-center gap-1 text-black text-[8px] font-black uppercase tracking-widest">
                                    ERRO
                                </div>
                            );
                        }
                    }

                    return (
                        <div key={url} className="relative group aspect-square">
                            <img onClick={() => onViewPhotos(task.photo_urls || [], index)} src={url} alt={`Registro da tarefa ${index + 1}`} className="w-full h-full object-cover border-2 border-dark-border group-hover:border-neon-cyan transition-colors cursor-pointer"/>
                            {(isProductionUser || role === 'PLANEJADOR') && !isViewer && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(url); }} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-magenta z-10" title="Remover foto">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                            {!analysis && (isProductionUser || role === 'PLANEJADOR') && !isViewer && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleAnalyzeExistingImage(url); }}
                                    // Fix: Cast Object.values to ImageSafetyAnalysis[] to avoid 'unknown' type error
                                    disabled={(Object.values(safetyAnalyses) as ImageSafetyAnalysis[]).some(a => a.status === 'analyzing')}
                                    className="absolute bottom-1 left-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-magenta z-10 disabled:opacity-50 disabled:cursor-wait"
                                    title="Analisar Segurança com IA"
                                >
                                    <SparklesIcon className="h-4 w-4" />
                                </button>
                            )}
                            {statusIndicator}
                        </div>
                    );
                })}
                {(isProductionUser || role === 'PLANEJADOR') && !isViewer && (
                    <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-dark-border hover:border-neon-cyan transition-colors cursor-pointer bg-dark-bg group">
                        {isUploading ? (
                            <svg className="animate-spin h-8 w-8 text-neon-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-white/30 group-hover:text-neon-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="mt-1 block text-[9px] uppercase font-black text-white/40 group-hover:text-neon-cyan transition-colors">Adicionar</span>
                            </div>
                        )}
                    </label>
                )}
            </div>
        )}
      </div>

      <div className="bg-white/[0.03] p-3 border-l-4 border-white/20">
        <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Observações & Anotações de Campo</p>
            {!isViewer && (
                <button 
                    type="button"
                    onClick={handleAnalyzeWithAI}
                    disabled={isAnalyzingAI || !task.observations}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-dark-bg border border-neon-magenta text-neon-magenta shadow-neon-magenta hover:bg-neon-magenta hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    {isAnalyzingAI ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analisando...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="h-4 w-4"/>
                            Analisar com IA
                        </>
                    )}
                </button>
            )}
        </div>
        <TextAreaField
            name="observations"
            value={task.observations}
            onChange={handleChange}
            disabled={isViewer}
            placeholder="Digite aqui qualquer observação relevante, ocorrências ou anotações da equipe..."
        />
        {aiAnalysisResult && (
            <div className="mt-3 p-3 bg-dark-bg border border-neon-magenta/50 text-white font-mono text-xs whitespace-pre-wrap">
                <p className="text-[9px] font-black text-neon-magenta uppercase tracking-widest mb-2">Análise do Assistente IA</p>
                {aiAnalysisResult}
            </div>
        )}
         {aiAnalysisError && (
            <div className="mt-3 p-3 bg-dark-bg border border-neon-red/50 text-neon-red font-mono text-xs">
                 <p className="text-[9px] font-black uppercase tracking-widest mb-2">Erro de Análise</p>
                {aiAnalysisError}
            </div>
        )}
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
