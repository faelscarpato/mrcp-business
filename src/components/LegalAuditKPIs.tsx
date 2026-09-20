import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { useDataLakeStore } from '../lib/store';

interface GaugeProps {
  value: number;
  title: string;
  color: string;
  format?: (val: number) => string;
}

const Gauge = ({ value, title, color, format = (v) => `${v}%` }: GaugeProps) => {
  const data = [
    { name: 'value', value: value },
    { name: 'empty', value: 100 - value },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-xl p-5 flex flex-col items-center hover:border-zinc-700 transition-colors">
      <h4 className="text-sm font-semibold text-zinc-300 mb-2 text-center h-10 flex items-center">{title}</h4>
      <div className="h-32 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#27272a" />
              <Label
                value={format(value)}
                position="centerBottom"
                className="text-2xl font-bold fill-zinc-100"
                offset={10}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const LegalAuditKPIs = () => {
  const documents = useDataLakeStore((state) => state.documents);
  const legalDocs = documents.filter((d) => d.pipeline === 'Jurídico' && d.status === 'AST Parsed');
  
  let avgSeguranca = 0;
  let avgAmbiguidade = 0;
  let avgFormatacao = 0;
  let avgAbusividade = 0;

  if (legalDocs.length > 0) {
    let totalSeg = 0, totalAmb = 0, totalForm = 0, totalAbu = 0;
    
    legalDocs.forEach((doc) => {
      const kpis = doc.parsedData?.kpis || {};
      
      totalSeg += Number(kpis.seguranca_juridica || 0);
      totalAmb += Number(kpis.grau_ambiguidade || 0);
      totalForm += Number(kpis.nota_formatacao || 0);
      totalAbu += Number(kpis.taxa_abusividade || 0);
    });

    avgSeguranca = Math.round(totalSeg / legalDocs.length);
    avgAmbiguidade = Math.round(totalAmb / legalDocs.length);
    avgFormatacao = Math.round(totalForm / legalDocs.length);
    avgAbusividade = Math.round(totalAbu / legalDocs.length);
  }

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-zinc-100">KPIs de Auditoria Jurídica</h3>
        <span className="text-xs font-medium bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
          Base: {legalDocs.length} documento(s) analisado(s)
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Gauge value={avgSeguranca} title="Índice de Segurança Jurídica" color="#3b82f6" /> 
        <Gauge value={avgAmbiguidade} title="Grau de Ambiguidade" color="#eab308" /> 
        <Gauge value={avgFormatacao} title="Nota de Formatação" color="#10b981" /> 
        <Gauge value={avgAbusividade} title="Taxa de Abusividade" color="#ef4444" /> 
      </div>
    </div>
  );
};
