
import React, { useState, useCallback } from 'react';
import { Task } from './types';
import { useSupabaseTasks } from './hooks/useSupabaseTasks';
import Dashboard from './components/Dashboard';
import Modal from './components/Modal';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import PhotoViewer from './components/PhotoViewer';
import { AddIcon, SparklesIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';
import { generateRDODraft } from './services/geminiService';
import RdoModalContent from './components/RdoModalContent';
import RdoDateSelectionModal from './components/RdoDateSelectionModal';

const App: React.FC = () => {
  const { role, logout } = useAuth();
  const { tasks, addTask, updateTask, deleteTask, loading } = useSupabaseTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [photoViewerState, setPhotoViewerState] = useState({
    isOpen: false,
    images: [] as string[],
    currentIndex: 0,
  });
  const [isRdoDateModalOpen, setIsRdoDateModalOpen] = useState(false);
  const [isRdoModalOpen, setIsRdoModalOpen] = useState(false);
  const [isGeneratingRdo, setIsGeneratingRdo] = useState(false);
  const [rdoContent, setRdoContent] = useState('');
  const [rdoReportDate, setRdoReportDate] = useState('');


  const openPhotoViewer = useCallback((images: string[], startIndex = 0) => {
    if (images && images.length > 0) {
      setPhotoViewerState({
        isOpen: true,
        images,
        currentIndex: startIndex,
      });
    }
  }, []);

  const closePhotoViewer = useCallback(() => {
    setPhotoViewerState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const navigatePhotoViewer = useCallback((newIndex: number) => {
    setPhotoViewerState(prev => ({ ...prev, currentIndex: newIndex }));
  }, []);

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
    } catch (e: any) {
        console.error("Erro capturado no App:", e);
        // Exibe o erro real para facilitar o diagnóstico
        alert(`Erro ao salvar no servidor: ${e.message || "Verifique a conexão ou colunas do banco."}`);
    }
  }, [editingTask, addTask, updateTask, handleCloseModal]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('Confirmar exclusão definitiva do registro técnico?')) {
      try {
        await deleteTask(taskId);
      } catch (e: any) {
        alert(`Erro ao excluir: ${e.message}`);
      }
    }
  }, [deleteTask]);
  
  const handleGenerateRdo = useCallback(async (dateStr: string) => {
    setIsGeneratingRdo(true);
    setRdoContent('');
    
    const selectedDateObj = new Date(dateStr + 'T00:00:00Z');

    const activeTasks = tasks.filter(task => {
        if (!task.actualStartDate) return false;

        const startDateObj = new Date(task.actualStartDate + 'T00:00:00Z');
        if (startDateObj > selectedDateObj) return false;

        if (task.actualEndDate) {
            const endDateObj = new Date(task.actualEndDate + 'T00:00:00Z');
            if (endDateObj < selectedDateObj) return false;
        }
        return true;
    });

    if (activeTasks.length === 0) {
        const formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('pt-BR');
        alert(`Nenhuma atividade em andamento ou concluída foi encontrada para a data ${formattedDate}.`);
        setIsGeneratingRdo(false);
        return;
    }

    const activitiesSummary = activeTasks.map(task => {
        const location = [task.obraDeArte, task.frente, task.apoio, task.vao, task.corte].filter(Boolean).join(' / ');
        const status = task.actualEndDate === dateStr ? `Concluída (${task.progress}%)` : `Em Andamento (${task.progress}%)`;
        return `- TAREFA: ${task.name}\n  - LOCAL: ${location}\n  - STATUS: ${status}\n  - OBSERVAÇÕES: ${task.observations || 'Nenhuma.'}`;
    }).join('\n\n');

    try {
        const draft = await generateRDODraft(activitiesSummary, dateStr);
        setRdoContent(draft);
        setIsRdoModalOpen(true);
    } catch (error: any) {
        alert(`Erro ao gerar RDO: ${error.message}`);
    } finally {
        setIsGeneratingRdo(false);
    }
  }, [tasks]);

  const handleTriggerRdoGeneration = (date: string) => {
      setIsRdoDateModalOpen(false);
      setRdoReportDate(date);
      handleGenerateRdo(date);
  };

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
            <p className="text-[12px] font-black text-neon-cyan/60 uppercase tracking-[4px]">Monitoramento Serra das Araras</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {role === 'PLANEJADOR' && (
            <button
              onClick={() => handleOpenModal(null)}
              className="flex items-center gap-2 bg-transparent text-neon-orange font-bold py-2 px-6 border-2 border-neon-orange shadow-neon-orange hover:bg-neon-orange hover:text-black transition-all"
            >
              <AddIcon />
              <span className="text-sm uppercase tracking-widest">Nova Tarefa</span>
            </button>
          )}
          {role === 'PLANEJADOR' && (
            <button
              onClick={() => setIsRdoDateModalOpen(true)}
              disabled={isGeneratingRdo || loading}
              className="flex items-center gap-2 bg-neon-magenta text-black font-bold py-2 px-6 border-2 border-neon-magenta shadow-neon-magenta hover:bg-white transition-all disabled:bg-dark-border disabled:text-white/30 disabled:border-dark-border disabled:shadow-none disabled:cursor-wait"
            >
              <SparklesIcon className="h-5 w-5"/>
              <span className="text-sm uppercase tracking-widest">{isGeneratingRdo ? 'Gerando...' : 'Gerar RDO'}</span>
            </button>
          )}
          <button
            onClick={logout}
            className="text-[11px] font-black text-white/50 hover:text-neon-magenta border border-white/10 px-4 py-2 uppercase tracking-widest transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-neon-cyan/20 z-50">
            <div className="h-full bg-neon-cyan w-full animate-pulse shadow-neon-cyan"></div>
        </div>
      )}

      <main>
        <Dashboard 
          tasks={tasks} 
          onEditTask={handleOpenModal} 
          onDeleteTask={handleDeleteTask} 
          onViewPhotos={openPhotoViewer}
        />
      </main>

      {(role === 'PLANEJADOR' || role === 'PRODUÇÃO' || role === 'VIEWER') && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <TaskForm 
            onSave={handleSaveTask} 
            onCancel={handleCloseModal} 
            existingTask={editingTask} 
            allTasks={tasks}
            onViewPhotos={openPhotoViewer}
          />
        </Modal>
      )}

      {photoViewerState.isOpen && (
        <PhotoViewer
          images={photoViewerState.images}
          currentIndex={photoViewerState.currentIndex}
          onClose={closePhotoViewer}
          onNavigate={navigatePhotoViewer}
        />
      )}

      <Modal isOpen={isRdoDateModalOpen} onClose={() => setIsRdoDateModalOpen(false)}>
        <RdoDateSelectionModal 
            onGenerate={handleTriggerRdoGeneration}
            onClose={() => setIsRdoDateModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={isRdoModalOpen} onClose={() => setIsRdoModalOpen(false)}>
        <RdoModalContent 
            rdoContent={rdoContent} 
            onClose={() => setIsRdoModalOpen(false)}
            reportDate={new Date(rdoReportDate + 'T00:00:00Z').toLocaleDateString('pt-BR')}
        />
      </Modal>
    </div>
  );
};

export default App;
