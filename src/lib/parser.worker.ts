import { read, utils } from 'xlsx';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const determinePipelineFallback = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf', 'docx'].includes(ext || '')) return 'RH & Triagem';
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return 'Financeiro & BI';
  if (['md'].includes(ext || '')) return 'Jurídico';
  if (['txt'].includes(ext || '')) return 'Operacional';
  return 'Desconhecido';
};

async function extractText(buffer: ArrayBuffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }
  if (ext === 'pdf') {
    try {
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
        if (text.length > 50000) break;
      }
      return text;
    } catch (err) {
      console.warn('PDF extraction failed:', err);
    }
  }
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  return textDecoder.decode(buffer);
}

async function detectPipelineWithAI(buffer: ArrayBuffer, filename: string, apiKey?: string, provider?: string): Promise<string> {
  try {
    const rawText = await extractText(buffer, filename);
    const sample = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').slice(0, 1000);

    const activeKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    if (!activeKey) {
      console.warn('Sem API Key configurada para o AI Router. Usando fallback.');
      return determinePipelineFallback(filename);
    }

    let model;
    if (provider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey: activeKey });
      model = anthropic('claude-3-5-haiku-latest');
    } else if (provider === 'google' || (!provider && import.meta.env.VITE_GEMINI_API_KEY)) {
      const google = createGoogleGenerativeAI({ apiKey: activeKey });
      model = google('gemini-1.5-flash');
    } else {
      const openai = createOpenAI({ apiKey: activeKey, compatibility: 'strict' });
      model = openai('gpt-4o-mini');
    }

    const { text } = await generateText({
      model,
      prompt: `Analise a seguinte amostra de texto extraída de um arquivo chamado "${filename}" e determine qual o pipeline de processamento mais adequado.

Amostra:
"""
${sample}
"""

Responda APENAS com uma destas opções exatas (sem aspas, sem pontos finais ou explicações adicionais):
- RH & Triagem
- Financeiro & BI
- Jurídico
- Operacional

Resposta:`
    });

    const result = text.trim();
    if (['RH & Triagem', 'Financeiro & BI', 'Jurídico', 'Operacional'].includes(result)) {
      return result;
    }
    return determinePipelineFallback(filename);
  } catch (err) {
    console.error('Erro no AI Router:', err);
    return determinePipelineFallback(filename);
  }
}

self.onmessage = async (e: MessageEvent) => {
  try {
    const { file, apiKey, provider } = e.data;
    let { pipeline } = e.data;
    
    // We get a File object
    const buffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!pipeline || pipeline === 'Classificando via IA...') {
      pipeline = await detectPipelineWithAI(buffer, file.name, apiKey, provider);
    }

    let parsedData: Record<string, any> = {};

    if (pipeline === 'RH & Triagem') {
      const rawText = await extractText(buffer, file.name);
      const text = rawText.replace(/[^a-zA-Z0-9\s@.,_-]/g, ' '); // simple cleaningts
      
      const ALL_SKILLS = ['typescript', 'react', 'node.js', 'python', 'java', 'c++', 'aws', 'docker', 'kubernetes', 'sql', 'finops'];
      const textLower = text.toLowerCase();
      const detectedSkills = ALL_SKILLS.filter(skill => textLower.includes(skill));
      
      // Calculate Experience Score by reading dates (e.g., "2020 - 2023")
      let experienceYears = 0;
      const dateRanges = text.match(/(20\d{2})\s*(?:-|a|até|to)\s*(20\d{2}|Atual|Presente|Hoje)/gi);
      if (dateRanges) {
        dateRanges.forEach(range => {
            const parts = range.match(/(20\d{2})\s*(?:-|a|até|to)\s*(20\d{2}|Atual|Presente|Hoje)/i);
            if (parts) {
                const start = parseInt(parts[1], 10);
                const end = (parts[2].toLowerCase() === 'atual' || parts[2].toLowerCase() === 'presente' || parts[2].toLowerCase() === 'hoje') ? new Date().getFullYear() : parseInt(parts[2], 10);
                if (end >= start) {
                    experienceYears += (end - start);
                }
            }
        });
      }
      if (experienceYears === 0) {
        const expMatch = textLower.match(/(\d+)\s+(?:anos?|years?)\s+(?:de\s+)?(?:experi[êe]ncia|experience)/);
        experienceYears = expMatch ? parseInt(expMatch[1], 10) : 0;
      }
      
      const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/);
      const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/);
      
      // Extract Candidate Name using Regex
      const nameMatch = rawText.match(/^([A-ZÀ-Ÿa-zà-ÿ]+(?:\s+[A-ZÀ-Ÿa-zà-ÿ]+){1,3})/m);
      const candidateName = nameMatch ? nameMatch[1].trim() : 'Candidato Anonimizado (LGPD)';

      parsedData = {
        candidate: candidateName,
        email_detected: !!emailMatch,
        phone_detected: !!phoneMatch,
        skills: detectedSkills.length > 0 ? detectedSkills : ['Nenhuma habilidade técnica identificada'],
        experience_years: experienceYears,
        score: Math.min(100, (detectedSkills.length * 10) + (experienceYears * 5) + (emailMatch ? 10 : 0)),
        bytes_analyzed: buffer.byteLength,
      };
    } else if (pipeline === 'Financeiro & BI') {
      let total_rows = 0;
      let sheets = 0;
      let allText = '';
      let columnHeaders: string[] = [];
      let formulas: string[] = [];
      let daxExpressions: string[] = [];
      
      try {
        const workbook = read(buffer, { type: 'array', cellFormula: true });
        sheets = workbook.SheetNames.length;
        
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const json: any[] = utils.sheet_to_json(sheet);
          total_rows += json.length;
          
          if (json.length > 0 && columnHeaders.length === 0) {
             columnHeaders = Object.keys(json[0]);
          }

          for (const cell in sheet) {
            if (cell[0] === '!') continue;
            const cellObj = sheet[cell];
            if (cellObj.f) formulas.push(cellObj.f);
            if (cellObj.v !== undefined) allText += cellObj.v + ' ';
          }
        }

        const DAX_REGEX = /(?:CALCULATE|SUMX|FILTER|ALL|VALUES|RELATED|EARLIER|RANKX|AVERAGEX|COUNTROWS|DISTINCTCOUNT|DIVIDE|IF|SWITCH|CONCATENATEX|TOPN|GENERATE|ADDCOLUMNS|SUMMARIZE|DATEADD|TOTALYTD|SAMEPERIODLASTYEAR|PARALLELPERIOD)\s*\(/gi;
        const matches = allText.match(DAX_REGEX);
        if (matches) daxExpressions = [...new Set(matches)];

      } catch (err) {
        total_rows = 0;
        sheets = 0;
      }
      
      parsedData = {
        sheets_detected: sheets,
        macros_hidden: allText.includes('Sub ') || allText.includes('Function '),
        rules_extracted: daxExpressions.slice(0, 10).length > 0 ? daxExpressions.slice(0, 10) : ['Nenhuma regra DAX identificada'],
        formulas_detected: formulas.slice(0, 10),
        columns: columnHeaders,
        total_rows,
      };
    } else if (pipeline === 'Jurídico') {
      const textOriginal = await extractText(buffer, file.name);
      const text = textOriginal.toLowerCase();
      
      const clausesMatch = text.match(/cl[áa]usula/g);
      const clauses = clausesMatch ? clausesMatch.length : 0;
      
      const monetaryMatch = text.match(/(?:R\$|BRL|USD|U\$)\s*[\d.,]+/gi);
      const penalties = monetaryMatch ? monetaryMatch[0] : 'Nenhum valor monetário explícito encontrado';
      
      const partiesCount = (text.match(/contratante|contratada|locador|locat[áa]rio/g) || []).length;
      
      const apontamentos: any[] = [];
      
      const extractContext = (keyword: string, t: string) => {
        const regex = new RegExp(`.{0,40}${keyword}.{0,60}`, 'i');
        const match = t.match(regex);
        return match ? match[0].trim().replace(/\s+/g, ' ') : null;
      };

      const multaMatch = extractContext('multa', text);
      if (multaMatch) {
        apontamentos.push({
          abuso: `Menção a multa: "${multaMatch}"`,
          lei: 'Avaliar Art. 412/413 do CC',
          gravidade: 'Alta',
        });
      }
      
      const jurosMatch = extractContext('juros', text);
      if (jurosMatch) {
        const abusivo = /juros\s+(acima|maior|excedente|superiores?)\s+a\s+1%/i.test(text);
        apontamentos.push({
          abuso: `Cláusula de juros: "${jurosMatch}"`,
          lei: 'Lei de Usura / CC',
          gravidade: abusivo ? 'Alta' : 'Média',
        });
      }

      const prazoMatch = extractContext('prazo', text);
      if (prazoMatch) {
        const indeterminado = /prazo\s+indeterminado/i.test(text);
        apontamentos.push({
          abuso: `Definição de prazo: "${prazoMatch}"`,
          lei: '-',
          gravidade: indeterminado ? 'Média' : 'Baixa',
        });
      }

      const foroMatch = extractContext('foro', text);
      if (foroMatch) {
        apontamentos.push({
          abuso: `Eleição de foro: "${foroMatch}"`,
          lei: 'Art. 63 CPC',
          gravidade: 'Baixa',
        });
      }

      const recisaoMatch = extractContext('rescis[ãa]o', text) || extractContext('recis[ãa]o', text);
      if (recisaoMatch) {
        apontamentos.push({
          abuso: `Termos de rescisão: "${recisaoMatch}"`,
          lei: 'Direito de Resilição',
          gravidade: 'Alta',
        });
      }

      if (apontamentos.length === 0) {
        apontamentos.push({
          abuso: 'Nenhuma cláusula sensível (multa, juros, prazo, foro, rescisão) foi explicitamente identificada.',
          lei: '-',
          gravidade: 'Baixa',
        });
      }

      // Document Block Splitting & Cross-reference Extraction (Deterministic)
      const blockRegex = /^(?:Cl[áa]usula\s+[\w\d]+[.\-]?|Art(?:igo|\.)?\s+\d+[.\-]?|Par[áa]grafo\s+(?:[úu]nico|\d+)[.\-]?)/igm;
      const extractedBlocks: { id: string, text: string, linksTo: string[] }[] = [];
      const blocksMatches = [...textOriginal.matchAll(blockRegex)];

      if (blocksMatches.length > 0) {
          if (blocksMatches[0].index !== undefined && blocksMatches[0].index > 0) {
               extractedBlocks.push({
                   id: "preambulo",
                   text: textOriginal.substring(0, blocksMatches[0].index).trim(),
                   linksTo: []
               });
          }
          
          for (let i = 0; i < blocksMatches.length; i++) {
              const m = blocksMatches[i];
              const nextM = blocksMatches[i+1];
              const textContent = textOriginal.substring(m.index, nextM ? nextM.index : textOriginal.length).trim();
              const header = m[0].trim().toLowerCase();
              
              let id = "bloco_" + i;
              if (header.includes("clá") || header.includes("cla")) {
                  const numMatch = header.match(/cl[áa]usula\s+([\w\d]+)/i);
                  id = "clausula_" + (numMatch ? numMatch[1].toLowerCase() : i);
              } else if (header.includes("art")) {
                  const numMatch = header.match(/art(?:igo|\.)?\s+(\d+)/i);
                  id = "artigo_" + (numMatch ? numMatch[1] : i);
              } else if (header.includes("par")) {
                  const numMatch = header.match(/par[áa]grafo\s+([úu]nico|\d+)/i);
                  id = "paragrafo_" + (numMatch ? numMatch[1].toLowerCase() : i);
              }
              
              extractedBlocks.push({
                  id,
                  text: textContent,
                  linksTo: []
              });
          }
      } else {
          extractedBlocks.push({
              id: "documento_inteiro",
              text: textOriginal,
              linksTo: []
          });
      }

      // Cross-referencing logic
      for (const b of extractedBlocks) {
          const refs: string[] = [];
          const refMatch = [...b.text.matchAll(/cl[áa]usula\s+(?<ref_clausula>[\w\d]+)/gi)];
          for (const rm of refMatch) {
               const refVal = rm.groups?.ref_clausula?.toLowerCase();
               if (refVal) {
                   const refId = "clausula_" + refVal;
                   if (refId !== b.id) refs.push(refId);
               }
          }
          
          const artMatch = [...b.text.matchAll(/art(?:igo|\.)?\s+(?<ref_artigo>\d+)/gi)];
          for (const am of artMatch) {
               const refVal = am.groups?.ref_artigo;
               if (refVal) {
                   const refId = "artigo_" + refVal;
                   if (refId !== b.id) refs.push(refId);
               }
          }
          
          b.linksTo = [...new Set(refs)];
      }

      const riskLevel = apontamentos.some(a => a.gravidade === 'Alta') ? 'High' : (apontamentos.some(a => a.gravidade === 'Média') ? 'Medium' : 'Low');

      const segurancaJuridica = riskLevel === 'High' ? 40 : (riskLevel === 'Medium' ? 70 : 95);
      const grauAmbiguidade = clauses > 15 ? 35 : (clauses > 0 ? 10 : 50);
      const taxaAbusividade = apontamentos.filter(a => a.gravidade === 'Alta').length * 15;
      const notaFormatacao = clauses > 0 ? 90 : 40;

      parsedData = {
        clauses_isolated: clauses,
        risk_level: riskLevel,
        penalties: penalties,
        parties_mentions: partiesCount,
        bytes_analyzed: buffer.byteLength,
        kpis: {
          seguranca_juridica: segurancaJuridica,
          grau_ambiguidade: grauAmbiguidade,
          nota_formatacao: notaFormatacao,
          taxa_abusividade: Math.min(taxaAbusividade, 100)
        },
        apontamentos: apontamentos,
        document_blocks: extractedBlocks,
        texto_original: textOriginal.slice(0, 500) + (textOriginal.length > 500 ? '...' : '')
      };
    } else {
      const text = await extractText(buffer, file.name);
      const lines = text.split('\n').length;
      const errorCount = (text.match(/error|fail|exception|timeout|critical/gi) || []).length;
      
      parsedData = {
        lines_parsed: lines,
        anomalies_detected: errorCount,
        severity: errorCount > 10 ? 'High' : (errorCount > 0 ? 'Medium' : 'Low'),
        summary: `Log processado. ${errorCount} erros/anomalias encontradas.`,
      };
    }

    const filesize_kb = parseFloat((file.size / 1024).toFixed(2));
    const raw_tokens = Math.floor(filesize_kb * 300);
    const parsed_tokens = Math.max(100, Math.floor(raw_tokens * 0.02));
    const saved_tokens = raw_tokens - parsed_tokens;
    const savings_usd = parseFloat(((saved_tokens / 1000) * 0.01).toFixed(4));
    const finops = { raw_tokens, parsed_tokens, saved_tokens, savings_usd, cost_saved_usd: savings_usd };

    self.postMessage({ success: true, parsedData, pipeline, finops });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message || String(error) });
  }
};
