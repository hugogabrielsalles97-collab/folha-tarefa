
import { useState, useEffect, useCallback } from 'react';
import { supabase, DBTask } from '../services/supabaseClient';
import { Task } from '../types';

/**
 * Filtra o objeto Task para enviar apenas colunas que existem no banco de dados.
 * Isso evita o erro "Could not find the 'column_name' in the schema cache".
 */
const filterTaskForDB = (task: Partial<Task>): any => {
    // Lista de campos que sabemos que existem na tabela 'tasks'
    const allowedKeys: (keyof DBTask)[] = [
        'id', 'name', 'discipline', 'level', 'obraDeArte', 'apoio', 'vao', 
        'frente', 'corte', 'plannedStartDate', 'plannedEndDate', 
        'actualStartDate', 'actualEndDate', 'progress'
    ];

    const sanitized: any = {};
    
    allowedKeys.forEach(key => {
        if (key in task) {
            const value = (task as any)[key];
            // Converte strings vazias para null (padrão Postgres para datas/opcionais)
            sanitized[key] = value === '' ? null : value;
        }
    });

    return sanitized;
};

export function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('plannedStartDate', { ascending: true });

      if (fetchError) throw fetchError;
      // O data retornado aqui pode ser convertido para Task[]
      if (data) setTasks(data as unknown as Task[]);
    } catch (e: any) {
      console.error('Fetch Error:', e);
      setError(`Erro ao buscar: ${e.message}`);
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel('realtime tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);
  
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    const taskToInsert = filterTaskForDB(task);
    const { error: insertError } = await supabase.from('tasks').insert([taskToInsert]);
    if (insertError) {
      console.error('Insert Error Detail:', insertError);
      throw new Error(insertError.message);
    }
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    const taskToUpdate = filterTaskForDB(task);
    const { error: updateError } = await supabase.from('tasks').update(taskToUpdate).eq('id', task.id);
    if (updateError) {
        console.error('Update Error Detail:', updateError);
        throw new Error(updateError.message);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);
    if (deleteError) {
        throw new Error(deleteError.message);
    }
  }, []);

  return { tasks, loading, error, addTask, updateTask, deleteTask };
}
