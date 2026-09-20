/**
 * MRCP-Business — Tool: mrcp_business_parse_resume
 *
 * Pipeline de Triagem & RH — Prova de Conceito Primária.
 * Extrai determinísticamente dados de currículos (PDF/DOCX/TXT).
 * Retorna micro-contrato JSON enxuto (50-600 tokens).
 *
 * Zero IA. 100% determinístico. Local-First.
 */

import { readDocument } from "./document-reader.js";
import { extractSkillsFromText } from "./skill-dictionary.js";
import {
  extractCandidateName,
  extractEmails,
  extractPhones,
  hasCpf,
  detectSalary,
  calculateExperienceYears,
  extractEducation,
} from "./heuristics.js";
import type { ParseResumeContract, ParseResumeInput } from "./types.js";
import { ANONYMIZED_LABEL, createErrorContract } from "./types.js";

/**
 * Calcula o score de confiança do parsing baseado na quantidade e qualidade
 * dos dados extraídos. Puramente matemático.
 */
function calculateConfidenceScore(contract: Omit<ParseResumeContract, "mrcp_confidence_score" | "processing_ms">): number {
  let score = 0;

  // Nome detectado (até 15 pts)
  if (contract.candidate_name && contract.candidate_name !== ANONYMIZED_LABEL) {
    score += 15;
  }

  // Email detectado (10 pts)
  if (contract.email.length > 0) {
    score += 10;
  }

  // Telefone detectado (5 pts)
  if (contract.phone.length > 0) {
    score += 5;
  }

  // Skills detectadas (até 30 pts, 5 por skill, max 6)
  score += Math.min(contract.verified_skills.length * 5, 30);

  // Experiência calculada (até 20 pts)
  if (contract.experience_years_calculated > 0) {
    score += 20;
  }

  // Educação detectada (até 10 pts)
  if (contract.education.length > 0) {
    score += 10;
  }

  // Texto suficiente (até 10 pts)
  if (contract.raw_text_length > 200) {
    score += 5;
  }
  if (contract.raw_text_length > 1000) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Executa o parsing determinístico de um currículo.
 *
 * @param input - { file_path: string } caminho local do arquivo
 * @returns ParseResumeContract — micro-contrato JSON enxuto
 */
export async function parseResume(
  input: ParseResumeInput,
): Promise<ParseResumeContract> {
  const startTime = performance.now();

  const doc = await readDocument(input.file_path);

  const text = doc.text;
  const candidateName = extractCandidateName(text);
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const skills = extractSkillsFromText(text);
  const experienceYears = calculateExperienceYears(text);
  const education = extractEducation(text);
  const cpfDetected = hasCpf(text);
  const salaryDetected = detectSalary(text);

  const baseContract = {
    candidate_name: ANONYMIZED_LABEL,
    email: emails[0] ?? "",
    phone: phones[0] ?? "",
    verified_skills: skills,
    experience_years_calculated: experienceYears,
    education: education.map((e) => ({
      degree: e.degree,
      institution: e.institution,
    })),
    cpf_detected: cpfDetected,
    salary_detected: salaryDetected,
    missing_keywords: [] as string[],
    raw_text_length: text.length,
    source_format: doc.format === "unknown" ? "txt" as const : doc.format as ParseResumeContract["source_format"],
  };

  const confidenceScore = calculateConfidenceScore(baseContract);
  const processingMs = Math.round(performance.now() - startTime);

  return {
    ...baseContract,
    mrcp_confidence_score: confidenceScore,
    processing_ms: processingMs,
  };
}

/**
 * Wrapper para execução via MCP executor.
 * Retorna o resultado formatado para o protocolo MCP.
 */
export async function executeParseResume(args: Record<string, unknown>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const filePath = String(args?.file_path ?? "");

  if (!filePath) {
    const error = createErrorContract(
      "mrcp_business_parse_resume",
      "MISSING_FILE_PATH",
      "Parâmetro 'file_path' é obrigatório.",
    );
    return {
      content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
      isError: true,
    };
  }

  try {
    const result = await parseResume({ file_path: filePath });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const errorContract = createErrorContract(
      "mrcp_business_parse_resume",
      "PARSE_FAILED",
      msg,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(errorContract, null, 2) }],
      isError: true,
    };
  }
}
