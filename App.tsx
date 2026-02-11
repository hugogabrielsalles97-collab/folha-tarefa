
import React, { useState, useCallback, useEffect } from 'react';
import { Task } from './types';
import { useSupabaseTasks } from './hooks/useSupabaseTasks';
import Dashboard from './components/Dashboard';
import Modal from './components/Modal';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import { AddIcon, WeatherIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { role, logout } = useAuth();
  const { tasks, addTask, updateTask, deleteTask, loading, error } = useSupabaseTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Verifica se a chave de API está configurada no ambiente
  useEffect(() => {
    const checkKey = async () => {
      if (typeof window.aistudio !== 'undefined') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected || !!process.env.API_KEY);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume sucesso após abertura conforme diretrizes
    }
  };

  const handleOpenModal = useCallback((task: Task | null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleSaveTask = useCallback(async (task: Task) => {
    const isNewTask = !editingTask;
    try {
        if (isNewTask) {
            const { id, created_at, ...newTaskData } = task;
            await addTask(newTaskData);
        } else {
            await updateTask(task);
        }
        handleCloseModal();
    } catch (e) {
        console.error("Erro:", e);
        alert("Falha ao salvar a tarefa no servidor.");
    }
  }, [editingTask, addTask, updateTask, handleCloseModal]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('Confirmar exclusão definitiva do registro técnico?')) {
      try {
        await deleteTask(taskId);
      } catch (e) {
        alert("Erro ao excluir.");
      }
    }
  }, [deleteTask]);

  if (!role) return <Login />;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 border-b border-dark-border pb-8">
        <div className="flex items-center gap-6">
          <div className="bg-neon-orange p-3 text-black font-black text-2xl rotate-[-2deg] shadow-neon-orange">
            NSA
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
              Folha Tarefa <span className="text-neon-cyan text-glow-cyan">Digital</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] font-black text-neon-cyan/60 uppercase tracking-[4px]">Monitoramento Serra das Araras</p>
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                <div className={`h-1.5 w-1.5 rounded-full ${hasApiKey ? 'bg-neon-green shadow-neon-green' : 'bg-neon-red shadow-neon-red'} animate-pulse`}></div>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                  {hasApiKey ? 'Telemetria Ativa' : 'IA Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {!hasApiKey && (
            <button
              onClick={handleOpenSelectKey}
              className="flex items-center gap-2 bg-neon-red/10 text-neon-red font-bold py-2 px-6 border border-neon-red hover:bg-neon-red hover:text-black transition-all text-xs uppercase tracking-widest"
            >
              <WeatherIcon /> Ativar Telemetria
            </button>
          )}
          
          {role === 'PLANEJADOR' && (
            <button
              onClick={() => handleOpenModal(null)}
              className="flex items-center gap-2 bg-transparent text-neon-orange font-bold py-2 px-6 border-2 border-neon-orange shadow-neon-orange hover:bg-neon-orange hover:text-black transition-all"
            >
              <AddIcon />
              <span className="text-sm uppercase tracking-widest">Nova Tarefa</span>
            </button>
          )}
          
          <button
            onClick={logout}
            className="text-[11px] font-black text-white/50 hover:text-neon-magenta border border-white/10 px-4 py-2 uppercase tracking-widest transition-colors"
          >
            Sair
          </button>
        </div>
      </header>
      
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-neon-cyan/20 z-50">
            <div className="h-full bg-neon-cyan w-full animate-pulse shadow-neon-cyan"></div>
        </div>
      )}

      <main>
        <Dashboard tasks={tasks} onEditTask={handleOpenModal} onDeleteTask={handleDeleteTask} />
      </main>

      {(role === 'PLANEJADOR' || role === 'PRODUÇÃO' || role === 'VIEWER') && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <TaskForm 
            onSave={handleSaveTask} 
            onCancel={handleCloseModal} 
            existingTask={editingTask} 
            allTasks={tasks}
          />
        </Modal>
      )}
    </div>
  );
};

export default App;
