/**
 * MRCP-Business — Testes dos Heurísticos RegExp
 *
 * Testes unitários para extração de CPF, emails, telefones,
 * experiência, educação, cláusulas e anonimização.
 */

import { describe, it, expect } from "vitest";
import {
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
} from "../heuristics.js";

describe("Heurísticos — CPF/CNPJ", () => {
  it("deve detectar CPFs formatados", () => {
    const cpfs = detectCpfs("CPF: 123.456.789-09 e outro 987.654.321-00");
    expect(cpfs).toHaveLength(2);
    expect(cpfs).toContain("123.456.789-09");
    expect(cpfs).toContain("987.654.321-00");
  });

  it("deve detectar CPFs sem formatação", () => {
    const cpfs = detectCpfs("CPF 12345678909");
    expect(cpfs).toHaveLength(1);
  });

  it("deve retornar array vazio quando não há CPFs", () => {
    expect(detectCpfs("texto sem dados")).toEqual([]);
  });

  it("hasCpf deve retornar boolean", () => {
    expect(hasCpf("CPF: 123.456.789-09")).toBe(true);
    expect(hasCpf("sem cpf")).toBe(false);
  });

  it("deve detectar CNPJs", () => {
    const cnpjs = detectCnpjs("CNPJ: 12.345.678/0001-90");
    expect(cnpjs).toHaveLength(1);
  });
});

describe("Heurísticos — Email", () => {
  it("deve extrair emails válidos", () => {
    const emails = extractEmails("Email: joao@email.com e maria@corp.com.br");
    expect(emails).toHaveLength(2);
    expect(emails).toContain("joao@email.com");
  });

  it("deve retornar array vazio sem emails", () => {
    expect(extractEmails("sem email aqui")).toEqual([]);
  });

  it("deve deduplicar emails repetidos", () => {
    const emails = extractEmails("a@b.com a@b.com a@b.com");
    expect(emails).toHaveLength(1);
  });
});

describe("Heurísticos — Telefone", () => {
  it("deve extrair telefones brasileiros", () => {
    const phones = extractPhones("Tel: (11) 99876-5432");
    expect(phones.length).toBeGreaterThanOrEqual(1);
  });

  it("deve extrair telefones com +55", () => {
    const phones = extractPhones("+55 11 99876-5432");
    expect(phones.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Heurísticos — Salário", () => {
  it("deve detectar pretensão salarial", () => {
    const salary = detectSalary("Pretensão salarial: R$ 15.000,00");
    expect(salary).not.toBeNull();
    expect(salary).toContain("15.000");
  });

  it("deve retornar null quando não há salário", () => {
    expect(detectSalary("sem informação salarial")).toBeNull();
  });

  it("deve extrair valores monetários", () => {
    const values = extractMonetaryValues("Total: R$ 120.000,00 e R$ 10.000,00");
    expect(values.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Heurísticos — Experiência", () => {
  it("deve calcular anos de ranges mês/ano", () => {
    const years = calculateExperienceYears("01/2020 - 01/2024");
    expect(years).toBeCloseTo(4, 0);
  });

  it("deve calcular experiência até 'presente'", () => {
    const years = calculateExperienceYears("01/2020 - presente");
    expect(years).toBeGreaterThan(0);
  });

  it("deve calcular de ranges com ano apenas", () => {
    const years = calculateExperienceYears("2018 - 2022");
    expect(years).toBeCloseTo(4, 0);
  });

  it("deve extrair menção explícita de anos", () => {
    const years = calculateExperienceYears("5 anos de experiência");
    expect(years).toBeCloseTo(5, 0);
  });

  it("deve retornar 0 quando não há dados", () => {
    expect(calculateExperienceYears("sem dados de experiência")).toBe(0);
  });

  it("deve somar múltiplos períodos", () => {
    const text = "01/2018 - 12/2019\n01/2020 - 12/2022";
    const years = calculateExperienceYears(text);
    expect(years).toBeGreaterThanOrEqual(4);
  });
});

describe("Heurísticos — Educação", () => {
  it("deve extrair formação acadêmica", () => {
    const edu = extractEducation(
      "Bacharelado em Ciência da Computação\nUniversidade de São Paulo",
    );
    expect(edu.length).toBeGreaterThanOrEqual(1);
  });

  it("deve detectar siglas de universidades", () => {
    const edu = extractEducation("Graduado pela USP");
    expect(edu.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Heurísticos — Nome do Candidato", () => {
  it("deve extrair nome válido", () => {
    const name = extractCandidateName("João Silva dos Santos\nDesenvolvedor");
    expect(name).toBe("João Silva dos Santos");
  });

  it("deve ignorar headers como 'Currículo'", () => {
    const name = extractCandidateName("Currículo\nMaria Santos\nDev");
    expect(name).toBe("Maria Santos");
  });

  it("deve lidar com texto vazio", () => {
    const name = extractCandidateName("");
    expect(name).toBe("");
  });
});

describe("Heurísticos — Cláusulas Contratuais", () => {
  it("deve extrair cláusulas numeradas", () => {
    const clauses = extractClauses(
      "Cláusula 1 - Do Objeto\nCláusula 2 - Do Prazo",
    );
    expect(clauses).toHaveLength(2);
    expect(clauses[0].number).toBe("1");
    expect(clauses[0].title).toContain("Do Objeto");
  });

  it("deve deduplicar cláusulas com mesmo número", () => {
    const clauses = extractClauses(
      "Cláusula 1 - Objeto\nCláusula 1 - Objeto\nCláusula 2 - Prazo",
    );
    expect(clauses).toHaveLength(2);
  });
});

describe("Heurísticos — Penalidades", () => {
  it("deve extrair penalidades com valor", () => {
    const penalties = extractPenalties("Multa: R$ 5.000,00 por dia de atraso");
    expect(penalties.length).toBeGreaterThanOrEqual(1);
    expect(penalties[0].value).toContain("R$");
  });
});

describe("Heurísticos — Rescisão", () => {
  it("deve extrair cláusulas de rescisão", () => {
    const terminations = extractTerminationClauses(
      "Rescisão: O contrato poderá ser rescindido mediante aviso prévio",
    );
    expect(terminations.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Heurísticos — Partes", () => {
  it("deve extrair contratantes", () => {
    const parties = extractParties(
      "Contratante: Empresa Alpha Ltda.\nContratada: Empresa Beta S.A.",
    );
    expect(parties.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Heurísticos — Anonimização", () => {
  it("deve anonimizar CPFs", () => {
    const result = anonymizeText("CPF: 123.456.789-09");
    expect(result).toContain("[CPF_ANONIMIZADO]");
    expect(result).not.toContain("123.456.789-09");
  });

  it("deve anonimizar emails", () => {
    const result = anonymizeText("Email: joao@email.com");
    expect(result).toContain("[EMAIL_ANONIMIZADO]");
    expect(result).not.toContain("joao@email.com");
  });
});
