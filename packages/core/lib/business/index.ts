/**
 * MRCP-Business — Barrel Export
 *
 * Re-exporta todos os módulos do engine documental de negócios.
 */

// Tipos
export type {
  ParseResumeContract,
  ParseResumeInput,
  ExtractDaxContract,
  ExtractDaxInput,
  LegalContractAuditContract,
  LegalContractAuditInput,
  BusinessToolName,
  BusinessErrorContract,
  EducationEntry,
  ClauseEntry,
  PenaltyEntry,
  FormulaEntry,
  NumericColumnSummary,
} from "./types.js";

export { ANONYMIZED_LABEL, createErrorContract } from "./types.js";

// Ferramentas
export { parseResume, executeParseResume } from "./parse-resume.js";
export { extractDax, executeExtractDax } from "./extract-dax.js";
export { legalContractAudit, executeLegalContractAudit } from "./legal-contract-audit.js";

// Skill Dictionary
export { extractSkillsFromText, findMissingKeywords, SKILL_DICTIONARY, ALL_SKILLS_FLAT } from "./skill-dictionary.js";

// Heuristics
export {
  detectCpfs,
  detectCnpjs,
  hasCpf,
  extractEmails,
  extractPhones,
  detectSalary,
  extractMonetaryValues,
  calculateExperienceYears,
  extractEducation,
  extractClauses,
  extractPenalties,
  extractTerminationClauses,
  extractParties,
  extractCandidateName,
  anonymizeText,
} from "./heuristics.js";

// Document Reader
export { readDocument, detectFormat } from "./document-reader.js";
export type { DocumentContent, DocumentFormat } from "./document-reader.js";
