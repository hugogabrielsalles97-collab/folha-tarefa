
import React, { useState } from 'react';
import { ClipboardIcon } from './icons';

interface RdoModalContentProps {
  rdoContent: string;
  onClose: () => void;
  reportDate: string;
}

const RdoModalContent: React.FC<RdoModalContentProps> = ({ rdoContent, onClose, reportDate }) => {
  const [editedContent, setEditedContent] = useState(rdoContent);
  const [copyButtonText, setCopyButtonText] = useState('Copiar Texto');

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopyButtonText('Copiado!');
    setTimeout(() => setCopyButtonText('Copiar Texto'), 2000);
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <h2 className="text-base font-black text-white uppercase tracking-[3px] border-b border-dark-border pb-3 mb-4">
        RASCUNHO RDO <span className="text-neon-orange">{reportDate}</span>
      </h2>
      <p className="text-xs text-white/50 mb-4 font-mono">
        Este é um rascunho gerado por IA com base nas atividades registradas. Revise, edite e complemente conforme necessário antes de oficializar.
      </p>
      <div className="flex-grow mb-4">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-full bg-dark-bg border border-dark-border p-4 text-white font-mono text-sm focus:outline-none focus:border-neon-cyan resize-none custom-scrollbar"
          rows={20}
        />
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:text-white transition-colors"
        >
          FECHAR
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 bg-neon-cyan shadow-neon-cyan text-black font-black py-2.5 px-6 uppercase text-[10px] tracking-widest hover:bg-white transition-all"
        >
          <ClipboardIcon className="h-4 w-4" />
          {copyButtonText}
        </button>
      </div>
    </div>
  );
};

export default RdoModalContent;
