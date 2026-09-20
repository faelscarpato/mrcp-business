/**
 * MRCP-Business — Tool: mrcp_business_legal_contract_audit
 *
 * Pipeline Jurídica.
 * Analisa contratos em PDF/DOCX extraindo cláusulas, penalidades,
 * partes contratantes e calculando o Document Quality Index (DQI).
 *
 * Zero IA. 100% determinístico. Local-First.
 */

import path from "path";
import { readDocument } from "./document-reader.js";
import {
  extractClauses,
  extractPenalties,
  extractTerminationClauses,
  extractParties,
  extractMonetaryValues,
  detectCpfs,
  detectCnpjs,
} from "./heuristics.js";
import type {
  LegalContractAuditContract,
  LegalContractAuditInput,
  ClauseEntry,
  PenaltyEntry,
} from "./types.js";
import { createErrorContract } from "./types.js";

/**
 * Calcula o Document Quality Index (DQI) — 0 a 100.
 * Baseado em indicadores estruturais do documento.
 */
function calculateDQI(params: {
  textLength: number;
  clauseCount: number;
  hasParties: boolean;
  hasPenalties: boolean;
  hasTermination: boolean;
  hasMonetaryValues: boolean;
  pageCount: number;
}): number {
  let score = 0;

  // Comprimento adequado (até 15 pts)
  if (params.textLength > 500) score += 5;
  if (params.textLength > 2000) score += 5;
  if (params.textLength > 5000) score += 5;

  // Cláusulas estruturadas (até 30 pts)
  if (params.clauseCount > 0) score += 10;
  if (params.clauseCount >= 5) score += 10;
  if (params.clauseCount >= 10) score += 10;

  // Partes identificadas (15 pts)
  if (params.hasParties) score += 15;

  // Penalidades definidas (10 pts)
  if (params.hasPenalties) score += 10;

  // Cláusula de rescisão (10 pts)
  if (params.hasTermination) score += 10;

  // Valores monetários (10 pts)
  if (params.hasMonetaryValues) score += 10;

  // Páginas (até 10 pts)
  if (params.pageCount > 1) score += 5;
  if (params.pageCount >= 5) score += 5;

  return Math.min(score, 100);
}

/**
 * Executa a auditoria jurídica de um contrato.
 */
export async function legalContractAudit(
  input: LegalContractAuditInput,
): Promise<LegalContractAuditContract> {
  const startTime = performance.now();

  const doc = await readDocument(input.file_path);
  const text = doc.text;

  const meta = doc.metadata as Record<string, unknown>;
  const pageCount = (meta.pages as number) ?? Math.ceil(text.length / 3000);

  // Extrair componentes estruturais
  const clauseMatches = extractClauses(text);
  const penaltyMatches = extractPenalties(text);
  const terminationClauses = extractTerminationClauses(text);
  const parties = extractParties(text);
  const monetaryValues = extractMonetaryValues(text);
  const cpfs = detectCpfs(text);
  const cnpjs = detectCnpjs(text);

  // Mapear para contratos tipados
  const keyClauses: ClauseEntry[] = clauseMatches.map((c) => ({
    clause_number: c.number,
    title: c.title,
    summary: c.title.substring(0, 120),
  }));

  const penalties: PenaltyEntry[] = penaltyMatches.map((p) => ({
    description: p.description,
    value: p.value,
  }));

  // Título do documento: primeira linha não vazia com caracteres significativos
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
  const documentTitle = lines[0]?.substring(0, 120) ?? path.basename(input.file_path);

  // DQI
  const dqiScore = calculateDQI({
    textLength: text.length,
    clauseCount: keyClauses.length,
    hasParties: parties.length > 0,
    hasPenalties: penalties.length > 0,
    hasTermination: terminationClauses.length > 0,
    hasMonetaryValues: monetaryValues.length > 0,
    pageCount,
  });

  // Confidence
  let confidence = 40;
  if (keyClauses.length > 0) confidence += 20;
  if (parties.length > 0) confidence += 15;
  if (text.length > 1000) confidence += 10;
  if (penalties.length > 0 || terminationClauses.length > 0) confidence += 15;
  confidence = Math.min(confidence, 100);

  return {
    document_title: documentTitle,
    total_pages_estimated: pageCount,
    dqi_score: dqiScore,
    parties_detected: parties,
    key_clauses: keyClauses.slice(0, 30),
    penalties_detected: penalties.slice(0, 10),
    termination_clauses: terminationClauses.slice(0, 10),
    cpf_cnpj_detected: [...cpfs.map((c) => `CPF: ${c}`), ...cnpjs.map((c) => `CNPJ: ${c}`)],
    monetary_values: monetaryValues.slice(0, 20),
    mrcp_confidence_score: confidence,
    processing_ms: Math.round(performance.now() - startTime),
  };
}

/**
 * Wrapper MCP executor.
 */
export async function executeLegalContractAudit(args: Record<string, unknown>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const filePath = String(args?.file_path ?? "");

  if (!filePath) {
    const error = createErrorContract(
      "mrcp_business_legal_contract_audit",
      "MISSING_FILE_PATH",
      "Parâmetro 'file_path' é obrigatório.",
    );
    return {
      content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
      isError: true,
    };
  }

  try {
    const result = await legalContractAudit({ file_path: filePath });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const errorContract = createErrorContract(
      "mrcp_business_legal_contract_audit",
      "AUDIT_FAILED",
      msg,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(errorContract, null, 2) }],
      isError: true,
    };
  }
}
