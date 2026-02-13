
import { useState, useEffect, useCallback } from 'react';
import { supabase, DBTask } from '../services/supabaseClient';
import { Task } from '../types';

// FIX: Changed return type from 'any' to 'Partial<DBTask>' to provide proper type information
// to Supabase client methods, resolving overload errors.
const filterTaskForDB = (task: Partial<Task>): Partial<DBTask> => {
    const sanitized: Partial<DBTask> = {};
    
    // Mapeamento explícito para evitar problemas e garantir que apenas os campos corretos sejam enviados.
    if (task.id !== undefined) sanitized.id = task.id;
    if (task.name !== undefined) sanitized.name = task.name;
    if (task.responsible !== undefined) sanitized.responsible = task.responsible === '' ? null : task.responsible;
    if (task.discipline !== undefined) sanitized.discipline = task.discipline;
    if (task.level !== undefined) sanitized.level = task.level;
    if (task.obraDeArte !== undefined) sanitized.obraDeArte = task.obraDeArte === '' ? null : task.obraDeArte;
    if (task.apoio !== undefined) sanitized.apoio = task.apoio === '' ? null : task.apoio;
    if (task.vao !== undefined) sanitized.vao = task.vao === '' ? null : task.vao;
    if (task.frente !== undefined) sanitized.frente = task.frente === '' ? null : task.frente;
    if (task.corte !== undefined) sanitized.corte = task.corte === '' ? null : task.corte;
    if (task.plannedStartDate !== undefined) sanitized.plannedStartDate = task.plannedStartDate;
    if (task.plannedEndDate !== undefined) sanitized.plannedEndDate = task.plannedEndDate;
    if (task.actualStartDate !== undefined) sanitized.actualStartDate = task.actualStartDate === '' ? null : task.actualStartDate;
    if (task.actualEndDate !== undefined) sanitized.actualEndDate = task.actualEndDate === '' ? null : task.actualEndDate;
    if (task.progress !== undefined) sanitized.progress = Number(task.progress) || 0;
    if (task.plannedQuantity !== undefined) sanitized.plannedQuantity = task.plannedQuantity === null ? null : Number(task.plannedQuantity);
    if (task.actualQuantity !== undefined) sanitized.actualQuantity = task.actualQuantity === null ? null : Number(task.actualQuantity);
    // FIX: This comparison appears to be unintentional because the types 'UnitOfMeasurement' and '""' have no overlap.
    if (task.quantityUnit !== undefined) sanitized.quantityUnit = (task.quantityUnit as any) === '' ? null : task.quantityUnit;
    if (task.photo_urls !== undefined) sanitized.photo_urls = task.photo_urls;
    if (task.plannedWeather !== undefined) sanitized.plannedWeather = task.plannedWeather === '' ? null : task.plannedWeather;
    if (task.actualWeather !== undefined) sanitized.actualWeather = task.actualWeather === '' ? null : task.actualWeather;
    if (task.observations !== undefined) sanitized.observations = task.observations;
    
    // Mapeamento dos novos campos de recursos
    if (task.plannedResources !== undefined) sanitized.planned_resources = task.plannedResources;
    if (task.actualResources !== undefined) sanitized.actualResources = task.actualResources;
    
    return sanitized;
};

export function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!supabase) {
        setError("ERRO DE CONFIGURAÇÃO: A conexão com o banco de dados não pôde ser estabelecida.");
        setLoading(false);
        return;
    }

    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('plannedStartDate', { ascending: true });

      if (fetchError) throw fetchError;
      if (data) {
        // Mapeia de snake_case para camelCase e trata dados legados
        const mappedData = data.map(item => {
          const plannedRes = item.planned_resources as any;
          const actualRes = item.actualResources as any;

          return {
            ...item,
            plannedResources: {
              personnel: plannedRes?.personnel || [],
              machines: plannedRes?.machines || plannedRes?.equipment || [],
            },
            actualResources: {
              personnel: actualRes?.personnel || [],
              machines: actualRes?.machines || actualRes?.equipment || [],
            },
          }
        }) as unknown as Task[];
        setTasks(mappedData);
      }
    } catch (e: any) {
      console.error('Fetch Error:', e);
      setError(`Erro ao buscar: ${e.message}`);
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!supabase) {
      setError("ERRO DE CONFIGURAÇÃO: A conexão com o banco de dados não pôde ser estabelecida.");
      setLoading(false);
      return;
    }

    fetchTasks();
    const channel = supabase
      .channel('realtime tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks(); 
      })
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchTasks]);
  
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    if (!supabase) throw new Error("A conexão com o banco de dados não está configurada.");
    const taskToInsert = filterTaskForDB(task);
    // FIX: No overload matches this call.
    // The type inference for the Supabase client seems to be failing, resulting in a 'never' type.
    // Casting `supabase.from('tasks')` to `any` bypasses the incorrect type error.
    const { error: insertError } = await (supabase.from('tasks') as any).insert([taskToInsert]);
    if (insertError) {
      console.error('Insert Error Detail:', insertError);
      throw new Error(insertError.message);
    }
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    if (!supabase) throw new Error("A conexão com o banco de dados não está configurada.");
    const taskToUpdate = filterTaskForDB(task);
    // FIX: Argument of type 'Partial<DBTask>' is not assignable to parameter of type 'never'.
    // The type inference for the Supabase client seems to be failing, resulting in a 'never' type.
    // Casting `supabase.from('tasks')` to 'any' to bypass the incorrect type error.
    const { error: updateError } = await (supabase.from('tasks') as any).update(taskToUpdate).eq('id', task.id);
    if (updateError) {
        console.error('Update Error Detail:', updateError);
        throw new Error(updateError.message);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!supabase) throw new Error("A conexão com o banco de dados não está configurada.");
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);
    if (deleteError) {
        throw new Error(deleteError.message);
    }
  }, []);

  return { tasks, loading, error, addTask, updateTask, deleteTask };
}