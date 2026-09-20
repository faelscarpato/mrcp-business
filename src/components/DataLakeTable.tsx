import React from 'react';
import { useDataLakeStore } from '../lib/store';
import { FileText, FileSpreadsheet, File, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const DataLakeTable = () => {
  const { documents, removeDocument, setSelectedDocId, selectedDocId, activePipeline } = useDataLakeStore();

  const getIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-400" />;
    if (ext === 'xlsx' || ext === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    return <File className="w-4 h-4 text-blue-400" />;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Processando') return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
    if (status === 'AST Parsed') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    return <AlertCircle className="w-4 h-4 text-rose-400" />;
  };

  const displayedDocs = activePipeline === 'Geral' ? documents : documents.filter(d => d.pipeline === activePipeline);

  if (displayedDocs.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-500 mt-6">
        Nenhum documento processado ainda neste pipeline.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden mt-6">
      <table className="w-full text-left text-sm text-zinc-400">
        <thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase font-medium text-zinc-500">
          <tr>
            <th className="px-4 py-3">Arquivo</th>
            <th className="px-4 py-3">Tamanho</th>
            <th className="px-4 py-3">Pipeline</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {displayedDocs.map((doc) => (
            <tr 
              key={doc.id} 
              className={`hover:bg-zinc-800/50 cursor-pointer transition-colors ${selectedDocId === doc.id ? 'bg-zinc-800/80' : ''}`}
              onClick={() => setSelectedDocId(doc.id)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center space-x-3">
                  {getIcon(doc.filename)}
                  <span className="text-zinc-200 font-medium truncate max-w-[200px]">{doc.filename}</span>
                </div>
              </td>
              <td className="px-4 py-3">{doc.filesize_kb} KB</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {doc.pipeline}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(doc.status)}
                  <span className={doc.status === 'AST Parsed' ? 'text-emerald-400' : doc.status === 'Processando' ? 'text-amber-400' : 'text-rose-400'}>
                    {doc.status}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">{format(doc.created_at, 'dd/MM/yyyy HH:mm')}</td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => removeDocument(doc.id)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors p-1 rounded-md hover:bg-zinc-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
