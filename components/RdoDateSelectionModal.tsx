
import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface RdoDateSelectionModalProps {
  onGenerate: (date: string) => void;
  onClose: () => void;
}

const RdoDateSelectionModal: React.FC<RdoDateSelectionModalProps> = ({ onGenerate, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerateClick = () => {
    if (selectedDate) {
      onGenerate(selectedDate);
    } else {
      alert("Por favor, selecione uma data.");
    }
  };

  return (
    <div>
      <h2 className="text-base font-black text-white uppercase tracking-[3px] border-b border-dark-border pb-3 mb-4">
        GERAR RELATÓRIO <span className="text-neon-orange">RDO</span>
      </h2>
      <p className="text-sm text-white/60 mb-6">
        Selecione a data para a qual deseja gerar o Relatório Diário de Obra.
      </p>
      
      <div className="mb-6">
        <label htmlFor="rdo-date" className="block text-[9px] font-black text-neon-cyan uppercase tracking-widest mb-1">
          Data do Relatório
        </label>
        <input
          type="date"
          id="rdo-date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border p-3 text-white font-mono text-lg focus:outline-none focus:border-neon-cyan"
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:text-white transition-colors"
        >
          CANCELAR
        </button>
        <button
          type="button"
          onClick={handleGenerateClick}
          className="flex items-center gap-2 bg-neon-magenta shadow-neon-magenta text-black font-black py-2.5 px-6 uppercase text-[10px] tracking-widest hover:bg-white transition-all"
        >
          <SparklesIcon className="h-4 w-4" />
          Gerar Relatório
        </button>
      </div>
    </div>
  );
};

export default RdoDateSelectionModal;
