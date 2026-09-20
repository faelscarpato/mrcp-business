import React from 'react';
import { useDataLakeStore } from '../lib/store';
import { Database, Zap, DollarSign, FileCheck, Percent } from 'lucide-react';

export const FinOpsCards = () => {
  const documents = useDataLakeStore((state) => state.documents);
  
  const totalDocs = documents.length;
  const docsProcessed = documents.filter(d => d.status === 'AST Parsed').length;
  
  const totalRawTokens = documents.reduce((acc, doc) => acc + (doc.finops?.raw_tokens || 0), 0);
  const totalParsedTokens = documents.reduce((acc, doc) => acc + (doc.finops?.parsed_tokens || 0), 0);
  const totalSavedTokens = documents.reduce((acc, doc) => acc + (doc.finops?.saved_tokens || 0), 0);
  const totalCostSaved = documents.reduce((acc, doc) => acc + ((doc.finops as any)?.savings_usd || doc.finops?.cost_saved_usd || 0), 0);

  const savingsPercent = totalRawTokens > 0 ? Math.round((totalSavedTokens / totalRawTokens) * 100) : 0;

  return (
    <>
      <div className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 rounded-lg p-5 mb-6">
        <h3 className="mt-0 text-emerald-400 flex items-center gap-2 font-semibold">
          <Zap className="w-5 h-5" />
          Comprovação de Eficiência & ROI de Tokens (MRCP Engine)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-xs text-zinc-400 mb-1">Baseline sem MRCP (Raw Tokens):</div>
            <div className="text-xl font-bold text-zinc-200">
              {totalRawTokens.toLocaleString()} <span className="text-xs font-normal">tokens brutos</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Contexto Otimizado MRCP:</div>
            <div className="text-xl font-bold text-emerald-500">
              {totalParsedTokens.toLocaleString()} <span className="text-xs font-normal">tokens AST</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Economia Real por Consulta:</div>
            <div className="text-xl font-bold text-emerald-500">
              ~{totalSavedTokens.toLocaleString()} tokens <span className="text-xs font-normal">({savingsPercent}%)</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-1">Custo Total Economizado:</div>
            <div className="text-xl font-bold text-blue-400">
              ~${totalCostSaved.toFixed(4)} USD
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Documentos Locais</div>
          <div className="text-3xl font-bold text-zinc-100 mb-1">{totalDocs}</div>
          <div className="text-xs text-zinc-400 font-medium">{docsProcessed} processados (DQI)</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Tokens Brutos (Cloud)</div>
          <div className="text-3xl font-bold text-zinc-100 mb-1">{totalRawTokens.toLocaleString()}</div>
          <div className="text-xs text-zinc-400 font-medium">Evitados de envio</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-emerald-500/70 mb-3 font-bold">Economia de Tokens LLM</div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">~{savingsPercent}%</div>
          <div className="text-xs text-zinc-400 font-medium">{totalSavedTokens.toLocaleString()} tokens salvos via Edge</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-blue-500/70 mb-3 font-bold">Economia (FinOps)</div>
          <div className="text-3xl font-bold text-blue-400 mb-1">${totalCostSaved.toFixed(4)}</div>
          <div className="text-xs text-zinc-400 font-medium">USD Salvos em inferência</div>
        </div>
      </div>
    </>
  );
};
