import React from 'react';
import { FinOpsCards } from './FinOpsCards';
import { DropZone } from './DropZone';
import { DataLakeTable } from './DataLakeTable';
import { LegalAuditKPIs } from './LegalAuditKPIs';
import { FinancialKPIs } from './FinancialKPIs';
import { RHKPIs } from './RHKPIs';
import { OperacionalKPIs } from './OperacionalKPIs';
import { useDataLakeStore } from '../lib/store';

export const Dashboard = () => {
  const { activePipeline } = useDataLakeStore();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
          {activePipeline === 'Geral' ? 'Visão Executiva' : `Pipeline: ${activePipeline}`}
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          {activePipeline === 'Geral' 
            ? 'Acompanhe a economia de processamento e métricas dos seus documentos corporativos.' 
            : `Gestão e processamento de documentos para o pipeline ${activePipeline}.`}
        </p>
      </div>
      
      {activePipeline === 'Geral' && <FinOpsCards />}
      {activePipeline === 'Jurídico' && <LegalAuditKPIs />}
      {activePipeline === 'Financeiro & BI' && <FinancialKPIs />}
      {activePipeline === 'RH & Triagem' && <RHKPIs />}
      {activePipeline === 'Operacional' && <OperacionalKPIs />}

      <div className="mt-8 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-zinc-200">Upload de Documentos</h3>
          <p className="text-sm text-zinc-500">Arraste arquivos PDF, Word ou Excel para processamento local.</p>
        </div>
        <DropZone />
      </div>
      
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-zinc-200">Data Lake Local (IndexedDB)</h3>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
          <DataLakeTable />
        </div>
      </div>
    </div>
  );
};
