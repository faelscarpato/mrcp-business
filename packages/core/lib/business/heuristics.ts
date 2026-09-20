/**
 * MRCP-Business — Heurísticos RegExp para Dados Sensíveis e Estruturais
 *
 * Extrações determinísticas de CPFs, CNPJs, salários, telefones, emails,
 * datas de experiência e cláusulas contratuais. 100% local, sem IA.
 */

// ─── CPF / CNPJ ────────────────────────────────────────────────────────────

const CPF_REGEX = /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}\b/g;
const CNPJ_REGEX = /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\\]?\d{4}[-.\s]?\d{2}\b/g;

export function detectCpfs(text: string): string[] {
  return [...new Set(text.match(CPF_REGEX) ?? [])];
}

export function detectCnpjs(text: string): string[] {
  return [...new Set(text.match(CNPJ_REGEX) ?? [])];
}

export function hasCpf(text: string): boolean {
  return CPF_REGEX.test(text);
}

// ─── Email ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

export function extractEmails(text: string): string[] {
  return [...new Set(text.match(EMAIL_REGEX) ?? [])];
}

// ─── Telefone ───────────────────────────────────────────────────────────────

const PHONE_REGEX = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}/g;

export function extractPhones(text: string): string[] {
  return [...new Set(text.match(PHONE_REGEX) ?? [])];
}

// ─── Salário / Valores Monetários ───────────────────────────────────────────

const SALARY_REGEX =
  /(?:R\$|BRL|salário|remuneração|pretensão\s*salarial)[:\s]*[\d.,]+/gi;
const MONETARY_REGEX =
  /R\$\s*[\d.,]+(?:\s*(?:mil|milhão|milhões|bilhão|bilhões))?/gi;

export function detectSalary(text: string): string | null {
  const matches = text.match(SALARY_REGEX);
  return matches?.[0]?.trim() ?? null;
}

export function extractMonetaryValues(text: string): string[] {
  return [...new Set(text.match(MONETARY_REGEX) ?? [])];
}

// ─── Experiência Profissional (cálculo de anos) ─────────────────────────────

const DATE_RANGE_REGEX =
  /(\d{2})[/.-](\d{4})\s*(?:[-–aà]|até|a|to)\s*(?:(\d{2})[/.-](\d{4})|(?:atual|presente|current|present|now|hoje))/gi;

const YEAR_RANGE_REGEX =
  /(\d{4})\s*(?:[-–aà]|até|a|to)\s*(?:(\d{4})|(?:atual|presente|current|present|now|hoje))/gi;

const EXPERIENCE_YEARS_REGEX =
  /(\d+(?:[.,]\d+)?)\s*(?:anos?|years?)\s*(?:de\s*)?(?:experiência|experience)?/gi;

export function calculateExperienceYears(text: string): number {
  let totalMonths = 0;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Tenta extrair de ranges com mês/ano
  const dateRanges = [...text.matchAll(DATE_RANGE_REGEX)];
  for (const match of dateRanges) {
    const startMonth = parseInt(match[1], 10);
    const startYear = parseInt(match[2], 10);
    const endMonth = match[3] ? parseInt(match[3], 10) : currentMonth;
    const endYear = match[4] ? parseInt(match[4], 10) : currentYear;

    if (startYear >= 1970 && startYear <= currentYear && endYear >= startYear) {
      const months = (endYear - startYear) * 12 + (endMonth - startMonth);
      if (months > 0 && months < 600) {
        totalMonths += months;
      }
    }
  }

  // Fallback: ranges só com ano
  if (totalMonths === 0) {
    const yearRanges = [...text.matchAll(YEAR_RANGE_REGEX)];
    for (const match of yearRanges) {
      const startYear = parseInt(match[1], 10);
      const endYear = match[2] ? parseInt(match[2], 10) : currentYear;

      if (startYear >= 1970 && startYear <= currentYear && endYear >= startYear) {
        const months = (endYear - startYear) * 12;
        if (months > 0 && months < 600) {
          totalMonths += months;
        }
      }
    }
  }

  // Fallback: menção explícita de "X anos de experiência"
  if (totalMonths === 0) {
    const expMatches = [...text.matchAll(EXPERIENCE_YEARS_REGEX)];
    for (const match of expMatches) {
      const years = parseFloat(match[1].replace(",", "."));
      if (years > 0 && years < 50) {
        totalMonths += Math.round(years * 12);
      }
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

// ─── Educação ───────────────────────────────────────────────────────────────

const DEGREE_PATTERNS = [
  /(?:bacharelado|bacharel|graduação|graduado)\s+(?:em\s+)?([^\n,;.]{3,60})/gi,
  /(?:mestrado|mestre|msc|m\.sc)\s+(?:em\s+)?([^\n,;.]{3,60})/gi,
  /(?:doutorado|doutor|phd|ph\.d)\s+(?:em\s+)?([^\n,;.]{3,60})/gi,
  /(?:pós-graduação|pós\s*graduação|especialização|mba)\s+(?:em\s+)?([^\n,;.]{3,60})/gi,
  /(?:tecnólogo|tecnologia|técnico)\s+(?:em\s+)?([^\n,;.]{3,60})/gi,
  /(?:bachelor|master|doctorate|degree)\s+(?:in|of)\s+([^\n,;.]{3,60})/gi,
];

const INSTITUTION_PATTERNS = [
  /(?:universidade|faculdade|instituto|centro\s*universitário|univ\.|fac\.)\s+(?:de\s+|do\s+|da\s+|dos\s+|das\s+)?([^\n,;.]{3,80})/gi,
  /(?:university|college|institute)\s+(?:of\s+)?([^\n,;.]{3,80})/gi,
  /\b(USP|UNICAMP|UFRJ|UFMG|UFPR|UFSC|UNB|UFRGS|PUC|SENAI|SENAC|FIAP|FGV|INSPER|ITA|IME|UNESP|UERJ|UFG|UFC|UFBA|UFPE|MIT|Stanford|Harvard)\b/gi,
];

export interface EducationMatch {
  readonly degree: string;
  readonly institution: string;
}

export function extractEducation(text: string): EducationMatch[] {
  const results: EducationMatch[] = [];
  const degrees: string[] = [];
  const institutions: string[] = [];

  for (const pattern of DEGREE_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    for (const m of matches) {
      degrees.push(m[0].trim());
    }
  }

  for (const pattern of INSTITUTION_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    for (const m of matches) {
      institutions.push((m[1] || m[0]).trim());
    }
  }

  const maxLen = Math.max(degrees.length, institutions.length, 1);
  for (let i = 0; i < maxLen; i++) {
    if (degrees[i] || institutions[i]) {
      results.push({
        degree: degrees[i] ?? "Não identificado",
        institution: institutions[i] ?? "Não identificada",
      });
    }
  }

  return results;
}

// ─── Cláusulas Contratuais (Pipeline Jurídica) ─────────────────────────────

const CLAUSE_REGEX =
  /(?:cláusula|clause|artigo|art\.?|seção|section)\s*(\d+[\w.]*)\s*[-–:.]?\s*([^\n]{5,120})/gi;

export interface ClauseMatch {
  readonly number: string;
  readonly title: string;
}

export function extractClauses(text: string): ClauseMatch[] {
  const results: ClauseMatch[] = [];
  const matches = [...text.matchAll(CLAUSE_REGEX)];
  const seen = new Set<string>();

  for (const m of matches) {
    const num = m[1].trim();
    if (!seen.has(num)) {
      seen.add(num);
      results.push({
        number: num,
        title: m[2].trim(),
      });
    }
  }

  return results;
}

// ─── Penalidades / Multas ───────────────────────────────────────────────────

const PENALTY_REGEX =
  /(?:multa|penalidade|penalty|indenização|compensação)[:\s]+([^\n]{5,150})/gi;

export interface PenaltyMatch {
  readonly description: string;
  readonly value: string;
}

export function extractPenalties(text: string): PenaltyMatch[] {
  const results: PenaltyMatch[] = [];
  const matches = [...text.matchAll(PENALTY_REGEX)];

  for (const m of matches) {
    const desc = m[0].trim();
    const monetaryInDesc = desc.match(/R\$\s*[\d.,]+/);
    results.push({
      description: desc,
      value: monetaryInDesc?.[0] ?? "valor não especificado",
    });
  }

  return results;
}

// ─── Rescisão ───────────────────────────────────────────────────────────────

const TERMINATION_REGEX =
  /(?:rescisão|término|terminação|encerramento|termination|cancellation)[:\s]*([^\n]{5,200})/gi;

export function extractTerminationClauses(text: string): string[] {
  const matches = [...text.matchAll(TERMINATION_REGEX)];
  return matches.map((m) => m[0].trim());
}

// ─── Partes / Contratantes ──────────────────────────────────────────────────

const PARTY_REGEX =
  /(?:contratante|contratada|contratado|parte|party|outorgante|outorgado)[:\s]+([^\n,;]{3,80})/gi;

export function extractParties(text: string): string[] {
  const matches = [...text.matchAll(PARTY_REGEX)];
  return [...new Set(matches.map((m) => m[1].trim()))];
}

// ─── Nome do Candidato (primeira linha relevante) ───────────────────────────

export function extractCandidateName(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  for (const line of lines.slice(0, 5)) {
    // Ignora linhas que são claramente headers/labels
    if (/^(currículo|curriculum|resumé|resume|cv|perfil|profile)/i.test(line)) {
      continue;
    }
    // Ignora linhas que são URLs ou emails
    if (/^(https?:|www\.|[a-z]+@)/i.test(line)) {
      continue;
    }
    // Nome: 2-5 palavras, apenas letras e espaços, sem números
    if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ]+){1,5}$/.test(line)) {
      return line;
    }
    // Fallback: primeira linha não vazia com mais de 3 chars
    if (line.length > 3 && line.length < 80 && !/^\d/.test(line)) {
      return line;
    }
  }

  return lines[0] ?? "";
}

// ─── Anonimização ───────────────────────────────────────────────────────────

export function anonymizeText(text: string): string {
  let result = text;
  // Anonimiza CPFs
  result = result.replace(CPF_REGEX, "[CPF_ANONIMIZADO]");
  // Anonimiza CNPJs
  result = result.replace(CNPJ_REGEX, "[CNPJ_ANONIMIZADO]");
  // Anonimiza emails
  result = result.replace(EMAIL_REGEX, "[EMAIL_ANONIMIZADO]");
  // Anonimiza telefones
  result = result.replace(PHONE_REGEX, "[TEL_ANONIMIZADO]");
  return result;
}
