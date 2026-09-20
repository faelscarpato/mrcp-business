/**
 * MRCP-Business — Tool: mrcp_business_extract_dax
 *
 * Pipeline Financeira & BI.
 * Extrai determinísticamente fórmulas, DAX, Power Query e sumarizações
 * de planilhas XLSX/CSV. Retorna micro-contrato JSON enxuto.
 *
 * Zero IA. 100% determinístico. Local-First.
 */

import fs from "fs";
import path from "path";
import { readDocument } from "./document-reader.js";
import type { ExtractDaxContract, ExtractDaxInput, FormulaEntry, NumericColumnSummary } from "./types.js";
import { createErrorContract } from "./types.js";

// ─── Regex para fórmulas Excel / DAX / Power Query ──────────────────────────

const EXCEL_FORMULA_REGEX = /=\s*[A-Z]+\s*\(/gi;
const DAX_REGEX = /(?:CALCULATE|SUMX|FILTER|ALL|VALUES|RELATED|EARLIER|RANKX|AVERAGEX|COUNTROWS|DISTINCTCOUNT|DIVIDE|IF|SWITCH|CONCATENATEX|TOPN|GENERATE|ADDCOLUMNS|SUMMARIZE|DATEADD|TOTALYTD|SAMEPERIODLASTYEAR|PARALLELPERIOD)\s*\(/gi;
const POWER_QUERY_REGEX = /(?:let\s+|in\s+|#"[^"]+"|Table\.FromRows|Source\s*=|each\s+|List\.)/gi;

/**
 * Extrai fórmulas de um texto de planilha.
 */
function extractFormulas(text: string, sheetName: string): FormulaEntry[] {
  const formulas: FormulaEntry[] = [];
  const lines = text.split("\n");
  let lineIdx = 0;

  for (const line of lines) {
    lineIdx++;
    const matches = line.match(/=[A-Z]+\([^)]*\)/gi);
    if (matches) {
      for (const formula of matches) {
        formulas.push({
          cell: `${sheetName}!R${lineIdx}`,
          formula: formula.trim(),
          sheet: sheetName,
        });
      }
    }
  }

  return formulas;
}

/**
 * Extrai expressões DAX do texto.
 */
function extractDaxExpressions(text: string): string[] {
  const matches = text.match(DAX_REGEX);
  if (!matches) return [];

  // Tenta extrair a expressão completa (com parênteses balanceados)
  const results: string[] = [];
  for (const match of matches) {
    const startIdx = text.indexOf(match);
    if (startIdx === -1) continue;

    let depth = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < Math.min(text.length, startIdx + 500); i++) {
      if (text[i] === "(") depth++;
      if (text[i] === ")") {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    if (endIdx > startIdx) {
      results.push(text.substring(startIdx, endIdx).trim());
    }
  }

  return [...new Set(results)];
}

/**
 * Extrai headers (primeira linha) de um CSV/sheet.
 */
function extractColumnHeaders(text: string): string[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}

/**
 * Calcula sumarizações numéricas para colunas detectadas.
 */
function calculateNumericSummaries(text: string): NumericColumnSummary[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const columnValues: Map<number, number[]> = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    for (let j = 0; j < cells.length; j++) {
      const val = parseFloat(cells[j].replace(/[^0-9.-]/g, ""));
      if (!isNaN(val) && isFinite(val)) {
        if (!columnValues.has(j)) columnValues.set(j, []);
        columnValues.get(j)!.push(val);
      }
    }
  }

  const summaries: NumericColumnSummary[] = [];
  for (const [colIdx, values] of columnValues) {
    if (values.length < 2) continue; // Precisa de pelo menos 2 valores numéricos
    const header = headers[colIdx] ?? `Coluna_${colIdx + 1}`;
    const sorted = values.sort((a, b) => a - b);
    summaries.push({
      column: header,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
      count: values.length,
    });
  }

  return summaries;
}

/**
 * Executa a extração DAX/financeira de um arquivo XLSX/CSV.
 */
export async function extractDax(
  input: ExtractDaxInput,
): Promise<ExtractDaxContract> {
  const startTime = performance.now();

  const doc = await readDocument(input.file_path);
  const text = doc.text;

  const meta = doc.metadata as Record<string, unknown>;
  const sheetCount = (meta.sheetCount as number) ?? 1;
  const sheetNames = (meta.sheetNames as string[]) ?? ["Sheet1"];

  // Extrair fórmulas por sheet
  const allFormulas: FormulaEntry[] = [];
  for (const sheetName of sheetNames) {
    const sheetRegex = new RegExp(`--- Sheet: ${sheetName} ---([\\s\\S]*?)(?=--- Sheet:|$)`);
    const sheetMatch = text.match(sheetRegex);
    const sheetText = sheetMatch?.[1] ?? text;
    allFormulas.push(...extractFormulas(sheetText, sheetName));
  }

  const daxExpressions = extractDaxExpressions(text);
  const columnHeaders = extractColumnHeaders(text.split("---")[1] ?? text);
  const numericSummaries = calculateNumericSummaries(text.split("---")[1] ?? text);

  // Contagem de linhas/colunas
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const totalRows = Math.max(lines.length - sheetCount, 0);
  const totalColumns = columnHeaders.length;

  // Confidence score
  let confidence = 50;
  if (allFormulas.length > 0) confidence += 15;
  if (daxExpressions.length > 0) confidence += 15;
  if (columnHeaders.length > 0) confidence += 10;
  if (numericSummaries.length > 0) confidence += 10;
  confidence = Math.min(confidence, 100);

  return {
    file_name: path.basename(input.file_path),
    total_sheets: sheetCount,
    total_rows: totalRows,
    total_columns: totalColumns,
    column_headers: columnHeaders,
    detected_formulas: allFormulas.slice(0, 50), // Cap em 50 fórmulas
    dax_expressions: daxExpressions.slice(0, 20),
    numeric_summary: numericSummaries.slice(0, 20),
    mrcp_confidence_score: confidence,
    processing_ms: Math.round(performance.now() - startTime),
  };
}

/**
 * Wrapper MCP executor.
 */
export async function executeExtractDax(args: Record<string, unknown>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const filePath = String(args?.file_path ?? "");

  if (!filePath) {
    const error = createErrorContract(
      "mrcp_business_extract_dax",
      "MISSING_FILE_PATH",
      "Parâmetro 'file_path' é obrigatório.",
    );
    return {
      content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
      isError: true,
    };
  }

  try {
    const result = await extractDax({ file_path: filePath });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const errorContract = createErrorContract(
      "mrcp_business_extract_dax",
      "EXTRACTION_FAILED",
      msg,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(errorContract, null, 2) }],
      isError: true,
    };
  }
}
