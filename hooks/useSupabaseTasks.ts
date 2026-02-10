import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Task } from '../types';

// Função auxiliar para converter strings vazias em null, que é o que o banco de dados espera.
const sanitizeTaskForDB = (task: Partial<Task>): Partial<Task> => {
    const sanitized = { ...task };
    // Itera sobre as chaves do objeto da tarefa
    for (const key in sanitized) {
        const typedKey = key as keyof Task;
        // Se o valor for uma string vazia, converte para null
        if (sanitized[typedKey] === '') {
            (sanitized as any)[typedKey] = null;
        }
    }
    return sanitized;
};


export function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    // Não reinicia o loading em revalidações em tempo real para uma UI mais suave
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('plannedStartDate', { ascending: true });

      if (fetchError) throw fetchError;
      if (data) setTasks(data);
    } catch (e: any) {
      setError(`Falha ao buscar tarefas: ${e.message}`);
      console.error(e);
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    // Busca inicial
    fetchTasks();

    // Configura a escuta de eventos em tempo real
    const channel = supabase
      .channel('realtime tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Mudança recebida!', payload);
          // Revalida os dados para garantir consistência. É mais simples e robusto
          // do que tentar mesclar as mudanças manualmente no estado.
          fetchTasks(); 
        }
      )
      .subscribe();

    // Limpeza da inscrição ao desmontar o componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);
  
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    // Sanitiza o objeto da tarefa antes de enviá-lo para o banco de dados
    const taskToInsert = sanitizeTaskForDB(task);
    const { error: insertError } = await supabase.from('tasks').insert([taskToInsert]);
    if (insertError) {
      setError(`Falha ao adicionar tarefa: ${insertError.message}`);
      throw insertError;
    }
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    // Sanitiza o objeto da tarefa antes de enviá-lo para o banco de dados
    const taskToUpdate = sanitizeTaskForDB(task);
    const { error: updateError } = await supabase.from('tasks').update(taskToUpdate).eq('id', task.id);
    if (updateError) {
        setError(`Falha ao atualizar tarefa: ${updateError.message}`);
        throw updateError;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);
    if (deleteError) {
        setError(`Falha ao excluir tarefa: ${deleteError.message}`);
        throw deleteError;
    }
  }, []);

  return { tasks, loading, error, addTask, updateTask, deleteTask };
}