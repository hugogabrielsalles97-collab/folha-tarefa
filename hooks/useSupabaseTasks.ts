import { useState, useEffect, useCallback } from 'react';
import { supabase, DBTask } from '../services/supabaseClient';
import { Task } from '../types';

// FIX: Changed return type from 'any' to 'Partial<DBTask>' to provide proper type information
// to Supabase client methods, resolving overload errors.
const filterTaskForDB = (task: Partial<Task>): Partial<DBTask> => {
    // Definimos apenas as chaves que existem comprovadamente no banco de dados.
    const allowedKeys: (keyof DBTask)[] = [
        'id', 'name', 'discipline', 'level', 'obraDeArte', 'apoio', 'vao', 
        'frente', 'corte', 'plannedStartDate', 'plannedEndDate', 
        'actualStartDate', 'actualEndDate', 'progress',
        'plannedQuantity', 'actualQuantity', 'quantityUnit', 'photo_urls',
        'plannedWeather', 'actualWeather', 'observations'
    ];

    const sanitized: Partial<DBTask> = {};
    
    allowedKeys.forEach(key => {
        if (key in task) {
            const value = (task as any)[key];
            if (['progress', 'plannedQuantity', 'actualQuantity'].includes(key as string)) {
                // Para quantidades e progresso, converte para número ou null se vazio.
                (sanitized as any)[key] = value === '' || value === null || value === undefined ? null : Number(value);
            } else {
                // Para outros campos, converte string vazia para null.
                (sanitized as any)[key] = value === '' ? null : value;
            }
        }
    });

    // Garante que o progresso nunca seja nulo no DB se não for fornecido
    // FIX: Check for undefined as well, as progress might not be in the partial task object.
    if (sanitized.progress === null || sanitized.progress === undefined) {
        sanitized.progress = 0;
    }

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
      if (data) setTasks(data as unknown as Task[]);
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
