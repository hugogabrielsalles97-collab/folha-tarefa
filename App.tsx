import React, { useState, useCallback } from 'react';
import { Task } from './types';
import { useSupabaseTasks } from './hooks/useSupabaseTasks';
import Dashboard from './components/Dashboard';
import Modal from './components/Modal';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import { AddIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { role, logout } = useAuth();
  const { tasks, addTask, updateTask, deleteTask, loading, error } = useSupabaseTasks();
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
    const isNewTask = !editingTask;

    const performSave = async () => {
        try {
            if (isNewTask) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, created_at, ...newTaskData } = task;
                await addTask(newTaskData);
            } else {
                await updateTask(task);
            }
            handleCloseModal();
        } catch (e) {
            console.error("Falha ao salvar:", e);
            alert("Não foi possível salvar a tarefa. Verifique o console para mais detalhes.");
        }
    };

    if (isNewTask) {
        // FIX: Ensure dates are parsed as UTC to prevent timezone bugs
        const newStart = new Date(task.plannedStartDate + 'T00:00:00').getTime();
        const newEnd = new Date(task.plannedEndDate + 'T00:00:00').getTime();

        const overlappingTasks = tasks.filter(existingTask => {
            if (existingTask.name !== task.name) {
                return false;
            }
            const existingStart = new Date(existingTask.plannedStartDate + 'T00:00:00').getTime();
            const existingEnd = new Date(existingTask.plannedEndDate + 'T00:00:00').getTime();
            
            return newStart <= existingEnd && newEnd >= existingStart;
        });

        if (overlappingTasks.length > 0) {
            const confirmationMessage = `Já existem ${overlappingTasks.length} tarefas com o nome "${task.name}" planejadas para este período. Deseja criar mesmo assim?`;
            if (window.confirm(confirmationMessage)) {
                await performSave();
            }
        } else {
            await performSave();
        }
    } else { // This is an edit
        await performSave();
    }
  }, [tasks, editingTask, addTask, updateTask, handleCloseModal]);


  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(taskId);
      } catch (e) {
        console.error("Falha ao excluir:", e);
        alert("Não foi possível excluir a tarefa.");
      }
    }
  }, [deleteTask]);


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
          {role === 'PLANEJADOR' && (
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
      
      {loading && <p className="text-center text-neon-cyan my-4">Carregando dados em tempo real...</p>}
      {error && <p className="text-center text-red-500 bg-red-500/10 p-3 rounded-md my-4">{error}</p>}

      <main>
        <Dashboard tasks={tasks} onEditTask={handleOpenModal} onDeleteTask={handleDeleteTask} />
      </main>

      {(role === 'PLANEJADOR' || role === 'PRODUÇÃO') && (
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