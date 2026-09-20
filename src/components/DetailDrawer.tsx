import React, { useState } from 'react';
import { useDataLakeStore } from '../lib/store';
import { X, Check, FileText, Layers, TrendingUp, Bot, Cpu, Zap, Gauge, ShieldAlert } from 'lucide-react';

function Badge({ children, className, variant = "default" }: { children: React.ReactNode; className?: string; variant?: "default" | "secondary" | "outline" }) {
  const base = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground",
  };
  return (
    <div className={`${base} ${variants[variant]} ${className || ""}`}>
      {children}
    </div>
  );
}

export const DetailDrawer = () => {
  const { documents, selectedDocId, setSelectedDocId } = useDataLakeStore();
  const [copied, setCopied] = useState(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  if (!selectedDoc) return null;

  const handleCopyToAI = () => {
    let summary = `Documento: ${selectedDoc.filename}\nPipeline: ${selectedDoc.pipeline}\n\n`;
    
    if (selectedDoc.pipeline === 'Jurídico') {
      summary += `RESUMO DOS APONTAMENTOS JURÍDICOS:\n\n`;
      const apontamentos = selectedDoc.parsedData?.apontamentos || [];
      apontamentos.forEach((card: any, idx: number) => {
        summary += `${idx + 1}. [Risco: ${card.gravidade}]\n`;
        summary += `   Problema: ${card.abuso}\n`;
        summary += `   Base Legal: ${card.lei}\n\n`;
      });
    } else if (selectedDoc.pipeline === 'RH & Triagem') {
      summary += `DADOS ESTRUTURADOS EXTRAÍDOS:\n\n`;
      Object.entries(selectedDoc.parsedData || {}).forEach(([key, value]) => {
        if (key !== 'document_blocks' && key !== 'texto_original') {
          summary += `${key.toUpperCase()}:\n`;
          if (Array.isArray(value)) {
            summary += value.map(v => `- ${v}`).join('\n') + '\n\n';
          } else if (typeof value === 'object') {
            summary += JSON.stringify(value, null, 2) + '\n\n';
          } else {
            summary += `${value}\n\n`;
          }
        }
      });
      summary += `INSTRUÇÃO PARA A IA:\n`;
      summary += `Gere um relatório decidindo se chama ou não para entrevista e liste 3 perguntas técnicas baseadas no currículo.\n\n`;
      summary += `VAGA: [Descrição genérica da vaga]\n`;
    } else {
      summary += `DADOS ESTRUTURADOS EXTRAÍDOS:\n\n`;
      Object.entries(selectedDoc.parsedData || {}).forEach(([key, value]) => {
        if (key !== 'document_blocks' && key !== 'texto_original') {
          summary += `${key.toUpperCase()}:\n`;
          if (Array.isArray(value)) {
            summary += value.map(v => `- ${v}`).join('\n') + '\n\n';
          } else if (typeof value === 'object') {
            summary += JSON.stringify(value, null, 2) + '\n\n';
          } else {
            summary += `${value}\n\n`;
          }
        }
      });
    }

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getSeverityColors = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'text-destructive';
      case 'medium':
      case 'média':
        return 'text-[oklch(0.78_0.16_90)]';
      case 'low':
      case 'baixa':
        return 'text-[oklch(0.78_0.13_160)]';
      default:
        return 'text-muted-foreground';
    }
  };
  
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'bg-destructive/15 text-destructive';
      case 'medium':
      case 'média':
        return 'bg-[oklch(0.78_0.16_90/0.15)] text-[oklch(0.78_0.16_90)]';
      case 'low':
      case 'baixa':
        return 'bg-[oklch(0.7_0.16_160/0.18)] text-[oklch(0.8_0.13_160)]';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const renderJuridicoDashboard = () => {
    const kpis = selectedDoc.parsedData?.kpis || {};
    const riskLevel = selectedDoc.parsedData?.risk_level || 'Medium';
    const apontamentos = selectedDoc.parsedData?.apontamentos || [];
    const blocks = selectedDoc.parsedData?.document_blocks || [];

    const riskColorClass = getSeverityColors(riskLevel);

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card/40 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary px-5 py-3">
              <ShieldAlert className={`mb-1 size-5 ${riskColorClass}`} />
              <span className={`font-mono text-xl font-bold uppercase tracking-tight ${riskColorClass}`}>
                {riskLevel === 'High' || riskLevel === 'Alta' ? 'ALTO' : riskLevel === 'Medium' || riskLevel === 'Média' ? 'MÉDIO' : 'BAIXO'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Risco Global
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-secondary/50 p-4">
               <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Segurança Jurídica</span>
               <span className="font-mono text-2xl font-bold text-foreground">{kpis.seguranca_juridica || 0}/100</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-secondary/50 p-4">
               <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Taxa de Abusividade</span>
               <span className="font-mono text-2xl font-bold text-foreground">{kpis.taxa_abusividade || 0}%</span>
            </div>
          </div>
        </div>

        <section aria-label="Parecer Analítico" className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Parecer Analítico
          </h3>
          <div className="flex flex-col gap-3">
            {apontamentos.map((apt: any, i: number) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">{i + 1}</span>
                    <Badge className={`border-transparent font-mono text-xs ${getSeverityBadgeColor(apt.gravidade)}`}>
                      {apt.gravidade.toUpperCase()}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs border-primary/20 bg-primary/5 text-primary">
                    {apt.lei}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90 pl-8 leading-relaxed">
                  {apt.abuso}
                </p>
              </div>
            ))}
          </div>
        </section>

        {blocks.length > 0 && (
          <section aria-label="Conteúdo do Documento" className="rounded-xl border border-border bg-card/40 p-5">
             <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
               <Layers className="size-4 text-primary" />
               Conteúdo Original
             </h3>
             <div className="flex max-h-64 flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-background p-4">
               {blocks.map((block: any, i: number) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <span className="w-fit rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                      {block.id.replace(/_/g, ' ')}
                    </span>
                    <p className="font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {block.text}
                    </p>
                  </div>
               ))}
             </div>
          </section>
        )}
      </div>
    );
  };

  const renderRHDashboard = () => {
    const data = selectedDoc.parsedData || {};
    const score = data.score || 0;
    const scoreColor =
      score >= 80
        ? "text-[oklch(0.78_0.13_160)]"
        : score >= 50
          ? "text-[oklch(0.78_0.16_90)]"
          : "text-destructive";

    const matchedSkills = data.skills || [];

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card/40 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary px-5 py-3">
              <Gauge className={`mb-1 size-4 ${scoreColor}`} />
              <span className={`font-mono text-3xl font-bold ${scoreColor}`}>
                {score}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                match score
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Candidato</span>
              <h2 className="text-xl font-semibold text-foreground">{data.candidate || 'Não identificado'}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5 font-mono text-xs">
                 {data.experience_years || 0} Anos Exp.
              </Badge>
              {data.email_detected && (
                <Badge className="border-transparent bg-[oklch(0.7_0.16_160/0.18)] font-mono text-xs text-[oklch(0.8_0.13_160)]">
                  ✓ Contato Extraído
                </Badge>
              )}
            </div>
          </div>
        </div>

        <section aria-label="Mapa de Competências" className="rounded-xl border border-border bg-card/40 p-5">
           <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
             <Bot className="size-4 text-primary" />
             Skills Extraídas
           </h3>
           <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill: string, i: number) => (
                <Badge
                  key={i}
                  className="border-transparent bg-[oklch(0.7_0.16_160/0.18)] font-mono text-xs text-[oklch(0.8_0.13_160)] capitalize"
                >
                  ✓ {skill}
                </Badge>
              ))}
              {matchedSkills.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhuma skill encontrada.</span>
              )}
           </div>
        </section>
      </div>
    );
  };

  const renderGenericDashboard = () => {
    const data = selectedDoc.parsedData || {};
    return (
      <div className="flex flex-col gap-6 p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          Métricas Extraídas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'document_blocks' || key === 'texto_original') return null;
            return (
              <div key={key} className={`flex flex-col gap-1.5 rounded-xl border border-border bg-card/40 p-4 ${Array.isArray(value) || typeof value === 'object' ? 'col-span-full' : ''}`}>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                <div className="text-sm text-foreground">
                  {Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {value.map((v, i) => (
                        <Badge key={i} variant="secondary" className="font-mono text-xs">
                          {String(v)}
                        </Badge>
                      ))}
                    </div>
                  ) : typeof value === 'object' ? (
                    <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground font-mono">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <span className="font-mono text-lg font-semibold">{String(value)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[95vw] max-w-4xl bg-background border-l border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-500 ease-out">
      {/* Cabeçalho Premium */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-border bg-card/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/15">
            <Bot className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground line-clamp-1">
              {selectedDoc.filename}
            </h1>
            <p className="text-sm text-muted-foreground">
              Parsing determinístico no backend · a IA recebe só o JSON
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-mono text-xs">
              <Cpu className="size-3" />
              Node.js runtime
            </Badge>
            <Badge variant="secondary" className="gap-1.5 font-mono text-xs">
              <Zap className="size-3 text-primary" />
              token-efficient
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-mono text-xs">
              Pipeline {selectedDoc.pipeline}
            </Badge>
          </div>
          <button 
            onClick={() => setSelectedDocId(null)}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedDoc.status === 'Processando' ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <div className="size-12 animate-spin rounded-full border-b-2 border-primary mb-6"></div>
            <p className="text-lg font-semibold text-foreground">Analisando documento localmente...</p>
            <p className="text-sm mt-2">Extraindo AST sem envio para nuvem.</p>
          </div>
        ) : selectedDoc.status === 'Erro' ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <ShieldAlert className="size-12 mb-4 opacity-80" />
            <p className="text-xl font-semibold">Falha no Processamento</p>
            <p className="text-sm mt-2 opacity-80 max-w-md">O documento não pôde ser analisado ou ocorreu um erro interno no worker.</p>
          </div>
        ) : (
          selectedDoc.pipeline === 'Jurídico' ? renderJuridicoDashboard() :
          selectedDoc.pipeline === 'RH & Triagem' ? renderRHDashboard() :
          renderGenericDashboard()
        )}
      </div>

      {/* Footer FinOps e IA */}
      <div className="flex items-center justify-between border-t border-border bg-card/40 p-5 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="mr-1 size-3" /> Otimização FinOps
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[oklch(0.78_0.13_160)]">{selectedDoc.finops?.saved_tokens?.toLocaleString() || 0}</span>
              <span className="text-xs font-medium text-muted-foreground">tokens poupados</span>
            </div>
          </div>
          <div className="h-8 w-px bg-border"></div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Economia Gerada</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <span className="text-xl font-bold text-foreground">{selectedDoc.finops?.savings_usd?.toFixed(4) || '0.00'}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleCopyToAI}
          disabled={selectedDoc.status !== 'AST Parsed'}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            copied 
              ? 'bg-[oklch(0.7_0.16_160/0.18)] text-[oklch(0.8_0.13_160)] border border-transparent' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none'
          }`}
        >
          {copied ? <Check className="size-4" /> : <Layers className="size-4" />}
          <span>{copied ? 'Conteúdo Copiado!' : selectedDoc.pipeline === 'RH & Triagem' ? 'Avaliar contra Vaga Aberta' : 'Transferir Resumo para IA'}</span>
        </button>
      </div>
    </div>
  );
};
