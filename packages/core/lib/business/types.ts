/**
 * MRCP-Business — Tipos dos Micro-Contratos JSON
 *
 * Todos os payloads finais aderem a contratos matemáticos enxutos (50-600 tokens).
 * Dados sensíveis (CPF, nome) são anonimizados localmente antes de qualquer saída.
 */

// ─── Parse Resume (Triagem & RH) ────────────────────────────────────────────

export interface ParseResumeInput {
  readonly file_path: string;
}

export interface ParseResumeContract {
  readonly candidate_name: string;
  readonly email: string;
  readonly phone: string;
  readonly verified_skills: readonly string[];
  readonly experience_years_calculated: number;
  readonly education: readonly EducationEntry[];
  readonly cpf_detected: boolean;
  readonly salary_detected: string | null;
  readonly missing_keywords: readonly string[];
  readonly mrcp_confidence_score: number;
  readonly raw_text_length: number;
  readonly source_format: "pdf" | "docx" | "txt" | "unknown";
  readonly processing_ms: number;
}

export interface EducationEntry {
  readonly degree: string;
  readonly institution: string;
}

// ─── Extract DAX (Financeira & BI) ──────────────────────────────────────────

export interface ExtractDaxInput {
  readonly file_path: string;
}

export interface ExtractDaxContract {
  readonly file_name: string;
  readonly total_sheets: number;
  readonly total_rows: number;
  readonly total_columns: number;
  readonly column_headers: readonly string[];
  readonly detected_formulas: readonly FormulaEntry[];
  readonly dax_expressions: readonly string[];
  readonly numeric_summary: readonly NumericColumnSummary[];
  readonly mrcp_confidence_score: number;
  readonly processing_ms: number;
}

export interface FormulaEntry {
  readonly cell: string;
  readonly formula: string;
  readonly sheet: string;
}

export interface NumericColumnSummary {
  readonly column: string;
  readonly min: number;
  readonly max: number;
  readonly avg: number;
  readonly count: number;
}

// ─── Legal Contract Audit (Jurídica) ────────────────────────────────────────

export interface LegalContractAuditInput {
  readonly file_path: string;
}

export interface LegalContractAuditContract {
  readonly document_title: string;
  readonly total_pages_estimated: number;
  readonly dqi_score: number; // Document Quality Index (0-100)
  readonly parties_detected: readonly string[];
  readonly key_clauses: readonly ClauseEntry[];
  readonly penalties_detected: readonly PenaltyEntry[];
  readonly termination_clauses: readonly string[];
  readonly cpf_cnpj_detected: readonly string[];
  readonly monetary_values: readonly string[];
  readonly mrcp_confidence_score: number;
  readonly processing_ms: number;
}

export interface ClauseEntry {
  readonly clause_number: string;
  readonly title: string;
  readonly summary: string;
}

export interface PenaltyEntry {
  readonly description: string;
  readonly value: string;
}

// ─── Constantes Compartilhadas ──────────────────────────────────────────────

export const ANONYMIZED_LABEL = "[ANONIMIZADO_LOCALMENTE]" as const;

export type BusinessToolName =
  | "mrcp_business_parse_resume"
  | "mrcp_business_extract_dax"
  | "mrcp_business_legal_contract_audit";

// ─── Error Contract ─────────────────────────────────────────────────────────

export interface BusinessErrorContract {
  readonly status: "error";
  readonly tool: BusinessToolName;
  readonly error_code: string;
  readonly message: string;
  readonly timestamp: string;
}

export function createErrorContract(
  tool: BusinessToolName,
  code: string,
  message: string,
): BusinessErrorContract {
  return {
    status: "error",
    tool,
    error_code: code,
    message,
    timestamp: new Date().toISOString(),
  };
}
