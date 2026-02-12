
import { useState, useEffect, useCallback } from 'react';
import { supabase, DBTask } from '../services/supabaseClient';
import { Task } from '../types';

const filterTaskForDB = (task: Partial<Task>): any => {
    // Definimos apenas as chaves que existem comprovadamente no banco de dados.
    const allowedKeys: (keyof DBTask)[] = [
        'id', 'name', 'discipline', 'level', 'obraDeArte', 'apoio', 'vao', 
        'frente', 'corte', 'plannedStartDate', 'plannedEndDate', 
        'actualStartDate', 'actualEndDate', 'progress',
        'plannedQuantity', 'actualQuantity', 'quantityUnit', 'photo_urls',
        'plannedWeather', 'actualWeather', 'observations'
    ];

    const sanitized: any = {};
    
    allowedKeys.forEach(key => {
        if (key in task) {
            const value = (task as any)[key];
            if (['progress', 'plannedQuantity', 'actualQuantity'].includes(key as string)) {
                // Para quantidades e progresso, converte para número ou null se vazio.
                sanitized[key] = value === '' || value === null || value === undefined ? null : Number(value);
            } else {
                // Para outros campos, converte string vazia para null.
                sanitized[key] = value === '' ? null : value;
            }
        }
    });

    // Garante que o progresso nunca seja nulo no DB se não for fornecido
    if (sanitized.progress === null) {
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
    const { error: insertError } = await supabase.from('tasks').insert([taskToInsert]);
    if (insertError) {
      console.error('Insert Error Detail:', insertError);
      throw new Error(insertError.message);
    }
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    if (!supabase) throw new Error("A conexão com o banco de dados não está configurada.");
    const taskToUpdate = filterTaskForDB(task);
    const { error: updateError } = await supabase.from('tasks').update(taskToUpdate).eq('id', task.id);
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
