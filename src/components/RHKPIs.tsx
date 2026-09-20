import React from 'react';
import { useDataLakeStore } from '../lib/store';

export const RHKPIs = () => {
  const documents = useDataLakeStore((state) => state.documents);
  const docs = documents.filter((d) => d.pipeline === 'RH & Triagem' && d.status === 'AST Parsed');
  
  let totalCandidates = docs.length;
  let totalExperience = 0;
  
  if (docs.length > 0) {
    docs.forEach((doc) => {
      totalExperience += doc.parsedData?.experience_years || 0;
    });
  }

  const avgExperience = docs.length > 0 ? Math.round(totalExperience / docs.length) : 0;

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-zinc-100">Visão Geral RH & Triagem</h3>
        <span className="text-xs font-medium bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
          Base: {docs.length} currículo(s) processado(s)
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <h4 className="text-sm font-semibold text-zinc-400 mb-1">Candidatos Triados</h4>
          <p className="text-3xl font-bold text-blue-400">{totalCandidates}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <h4 className="text-sm font-semibold text-zinc-400 mb-1">Média Experiência (Anos)</h4>
          <p className="text-3xl font-bold text-amber-400">{avgExperience}</p>
        </div>
      </div>
    </div>
  );
};
