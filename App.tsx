import React, { useState, useCallback } from 'react';
import { Task } from './types';
import Dashboard from './components/Dashboard';
import Modal from './components/Modal';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import { AddIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';
import { useRealtimeTasks } from './hooks/useRealtimeTasks';

const App: React.FC = () => {
  const { role, logout } = useAuth();
  const { tasks, addTask, updateTask, deleteTask, loading, error } = useRealtimeTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleOpenModal = useCallback((task: Task | null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleSaveTask = useCallback(async (task: Task) => {
    const isEditing = !!editingTask;

    const save = async () => {
        if (isEditing) {
            await updateTask(task);
        } else {
            await addTask(task);
        }
        handleCloseModal();
    };

    if (!isEditing) {
        const newStart = new Date(task.plannedStartDate).getTime();
        const newEnd = new Date(task.plannedEndDate).getTime();

        const overlappingTasks = tasks.filter(existingTask => {
            if (existingTask.name !== task.name) {
                return false;
            }
            const existingStart = new Date(existingTask.plannedStartDate).getTime();
            const existingEnd = new Date(existingTask.plannedEndDate).getTime();
            return newStart <= existingEnd && newEnd >= existingStart;
        });

        if (overlappingTasks.length > 0) {
            const confirmationMessage = `Já existem ${overlappingTasks.length} tarefas com o nome "${task.name}" planejadas para este período. Deseja criar mesmo assim?`;
            if (window.confirm(confirmationMessage)) {
                await save();
            }
        } else {
            await save();
        }
    } else {
        await save();
    }
  }, [tasks, editingTask, addTask, updateTask, handleCloseModal]);


  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTask(taskId);
    }
  }, [deleteTask]);

  if (!role) {
    return <Login />;
  }
  
  if (loading) {
    return (
        <div className="min-h-screen bg-dark-bg flex flex-col justify-center items-center text-neon-cyan text-xl space-y-4">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-neon-magenta"></div>
            <p>Carregando dados...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 sm:p-6 lg:p-8 font-sans">
      <header className="flex justify-between items-center mb-8">
        <div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neon-cyan tracking-wider" style={{textShadow: '0 0 5px #00ffff'}}>
              NSA - SERRA DAS ARARAS
            </h1>
            <p className="text-gray-400 mt-1">Dashboard de Acompanhamento de Atividades</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {role === 'EDITOR' && (
            <button
              onClick={() => handleOpenModal(null)}
              className="flex items-center gap-2 bg-neon-cyan/90 text-black font-bold py-2 px-4 rounded-lg shadow-neon-cyan hover:bg-neon-cyan transition-all duration-300 transform hover:scale-105"
            >
              <AddIcon />
              <span className="hidden sm:inline">Nova Tarefa</span>
            </button>
          )}
          <button
            onClick={logout}
            className="bg-dark-surface text-gray-300 font-bold py-2 px-4 rounded-lg hover:bg-dark-border hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </header>
      
      <main>
        {error && <div className="bg-red-500/20 text-red-400 p-4 rounded-md mb-4 text-center">{error}</div>}
        <Dashboard tasks={tasks} onEditTask={handleOpenModal} onDeleteTask={handleDeleteTask} />
      </main>

      {role === 'EDITOR' && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <TaskForm 
            onSave={handleSaveTask} 
            onCancel={handleCloseModal} 
            existingTask={editingTask}
          />
        </Modal>
      )}
    </div>
  );
};

export default App;