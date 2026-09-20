import React, { useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { useDataLakeStore } from '../lib/store';
import { processDocument } from '../lib/DocumentProcessor';
import { useActiveCredentials } from '../lib/settingsStore';

export const DropZone = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const addDocument = useDataLakeStore((state) => state.addDocument);
  const updateDocument = useDataLakeStore((state) => state.updateDocument);
  const { apiKey, provider } = useActiveCredentials();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        processDocument(file, addDocument, updateDocument, apiKey, provider);
      });
    }
  }, [addDocument, updateDocument]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        processDocument(file, addDocument, updateDocument, apiKey, provider);
      });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
        isDragOver ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="bg-zinc-800 p-4 rounded-full mb-4">
        <UploadCloud className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-lg font-medium text-zinc-200 mb-1">Upload de Documentos Corporativos</h3>
      <p className="text-sm text-zinc-500 max-w-md mb-6">
        Arraste e solte arquivos PDF, XLSX, DOCX ou CSV. Todo o processamento e extração de regras de negócio (AST) ocorre 100% offline no seu navegador.
      </p>
      
      <label className="cursor-pointer bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
        Selecionar Arquivos
        <input type="file" className="hidden" multiple onChange={handleFileInput} />
      </label>
    </div>
  );
};
