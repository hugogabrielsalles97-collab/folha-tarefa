import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import * as taskService from '../services/taskService';

/**
 * Hook customizado para gerenciar tarefas com sincronização em tempo real.
 * Utiliza polling para manter os dados atualizados com o backend.
 */
export function useRealtimeTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const remoteTasks = await taskService.getTasks();
      // Ordena as tarefas por data de início para consistência
      remoteTasks.sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());
      setTasks(remoteTasks);
      setError(null);
    } catch (e) {
      setError('Falha ao sincronizar as tarefas. Verifique a conexão e a configuração do serviço.');
      console.error(e);
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchTasks(); // Busca inicial
    const intervalId = setInterval(fetchTasks, 5000); // Polling a cada 5 segundos
    return () => clearInterval(intervalId); // Limpeza ao desmontar
  }, [fetchTasks]);

  const performUpdate = useCallback(async (updateFunction: (currentTasks: Task[]) => Task[]) => {
    try {
      setError(null);
      // Fetch-before-write para reduzir race conditions
      const currentTasks = await taskService.getTasks();
      const newTasks = updateFunction(currentTasks);
      await taskService.saveTasks(newTasks);
      // Atualiza o estado local otimisticamente após o sucesso do save
      newTasks.sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());
      setTasks(newTasks);
    } catch (e) {
      setError('Falha ao salvar a alteração. Os dados serão sincronizados novamente.');
      console.error(e);
      // Dispara uma nova busca para garantir consistência após erro
      setTimeout(fetchTasks, 1000); 
    }
  }, [fetchTasks]);

  const addTask = useCallback(async (task: Task) => {
    await performUpdate(currentTasks => [...currentTasks, task]);
  }, [performUpdate]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    await performUpdate(currentTasks => currentTasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
  }, [performUpdate]);

  const deleteTask = useCallback(async (taskId: string) => {
    await performUpdate(currentTasks => currentTasks.filter(t => t.id !== taskId));
  }, [performUpdate]);

  return { tasks, loading, error, addTask, updateTask, deleteTask };
}
