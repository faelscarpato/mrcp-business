import React from 'react';
import { useDataLakeStore } from '../lib/store';

export const FinancialKPIs = () => {
  const documents = useDataLakeStore((state) => state.documents);
  const docs = documents.filter((d) => d.pipeline === 'Financeiro & BI' && d.status === 'AST Parsed');
  
  let totalRows = 0;
  let totalSheets = 0;

  if (docs.length > 0) {
    docs.forEach((doc) => {
      totalRows += doc.parsedData?.total_rows || 0;
      totalSheets += doc.parsedData?.sheets_detected || 0;
    });
  }

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-zinc-100">Métricas Financeiro & BI</h3>
        <span className="text-xs font-medium bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
          Base: {docs.length} documento(s) processado(s)
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <h4 className="text-sm font-semibold text-zinc-400 mb-1">Linhas Analisadas</h4>
          <p className="text-3xl font-bold text-emerald-400">{totalRows}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <h4 className="text-sm font-semibold text-zinc-400 mb-1">Abas Encontradas</h4>
          <p className="text-3xl font-bold text-blue-400">{totalSheets}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <h4 className="text-sm font-semibold text-zinc-400 mb-1">Documentos Válidos</h4>
          <p className="text-3xl font-bold text-purple-400">{docs.length}</p>
        </div>
      </div>
    </div>
  );
};
