import React from 'react';
import { useDataLakeStore } from '../lib/store';

export const OperacionalKPIs = () => {
  const documents = useDataLakeStore((state) => state.documents);
  const docs = documents.filter((d) => d.pipeline === 'Operacional' && d.status === 'AST Parsed');
  
  let totalAnomalies = 0;
  
  if (docs.length > 0) {
    docs.forEach((doc) => {
      totalAnomalies += doc.parsedData?.anomalies_detected || 0;
    });
  }

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-zinc-100">Visão Operacional (Logs)</h3>
        <span className="text-xs font-medium bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
          Base: {docs.length} log(s) processado(s)
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <h4 className="text-sm font-semibold text-zinc-400 mb-1">Logs Analisados</h4>
          <p className="text-3xl font-bold text-zinc-200">{docs.length}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <h4 className="text-sm font-semibold text-zinc-400 mb-1">Anomalias Críticas Detectadas</h4>
          <p className="text-3xl font-bold text-rose-400">{totalAnomalies}</p>
        </div>
      </div>
    </div>
  );
};
