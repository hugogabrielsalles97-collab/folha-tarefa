import React, { useState, useCallback } from 'react';
import { Task } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import Modal from './components/Modal';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import { AddIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { role, logout } = useAuth();
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
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

  const handleSaveTask = useCallback((task: Task) => {
    // If editing, just save and bypass the check
    if (editingTask) {
      setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? task : t)));
      handleCloseModal();
      return;
    }

    // For new tasks, check for duplicates with overlapping dates
    const newStart = new Date(task.plannedStartDate).getTime();
    const newEnd = new Date(task.plannedEndDate).getTime();

    const overlappingTasks = tasks.filter(existingTask => {
      if (existingTask.name !== task.name) {
        return false;
      }
      const existingStart = new Date(existingTask.plannedStartDate).getTime();
      const existingEnd = new Date(existingTask.plannedEndDate).getTime();
      
      // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
      return newStart <= existingEnd && newEnd >= existingStart;
    });

    const saveTask = () => {
        setTasks(prevTasks => [...prevTasks, task]);
        handleCloseModal();
    }

    if (overlappingTasks.length > 0) {
      const confirmationMessage = `Já existem ${overlappingTasks.length} tarefas com o nome "${task.name}" planejadas para este período. Deseja criar mesmo assim?`;
      if (window.confirm(confirmationMessage)) {
        saveTask();
      }
      // If user cancels, do nothing, the modal remains open
    } else {
      // No overlap, save directly
      saveTask();
    }
  }, [tasks, editingTask, setTasks, handleCloseModal]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    }
  }, [setTasks]);

  if (!role) {
    return <Login />;
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