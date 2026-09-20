/**
 * MRCP-Business — Dicionário de Skills Reconhecidas
 *
 * Dicionário expandido para extração determinística de skills técnicas.
 * Categorizado para scoring e mapeamento de gaps.
 */

export const SKILL_DICTIONARY: Record<string, readonly string[]> = {
  languages: [
    "javascript", "typescript", "python", "java", "c#", "c++", "c",
    "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala",
    "r", "matlab", "perl", "lua", "dart", "elixir", "haskell",
    "objective-c", "cobol", "fortran", "assembly", "vba", "delphi",
    "groovy", "clojure", "f#", "abap",
  ],
  frontend: [
    "react", "angular", "vue", "vue.js", "svelte", "next.js", "nextjs",
    "nuxt", "nuxt.js", "gatsby", "html", "css", "sass", "less",
    "tailwind", "tailwindcss", "bootstrap", "material-ui", "mui",
    "chakra-ui", "styled-components", "webpack", "vite", "rollup",
    "esbuild", "parcel", "storybook", "redux", "zustand", "mobx",
    "graphql", "apollo", "relay",
  ],
  backend: [
    "node.js", "nodejs", "express", "fastify", "nestjs", "nest.js",
    "koa", "hapi", "django", "flask", "fastapi", "spring", "spring boot",
    ".net", "asp.net", "rails", "ruby on rails", "laravel", "symfony",
    "gin", "echo", "fiber", "actix", "rocket",
  ],
  database: [
    "sql", "mysql", "postgresql", "postgres", "mongodb", "redis",
    "elasticsearch", "cassandra", "dynamodb", "sqlite", "mariadb",
    "oracle", "sql server", "mssql", "neo4j", "couchdb", "firestore",
    "supabase", "prisma", "typeorm", "sequelize", "drizzle",
    "mongoose", "knex",
  ],
  cloud: [
    "aws", "azure", "gcp", "google cloud", "heroku", "vercel",
    "netlify", "digitalocean", "cloudflare", "firebase",
    "lambda", "ec2", "s3", "rds", "ecs", "eks", "fargate",
    "cloud functions", "app engine", "cloud run",
  ],
  devops: [
    "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins",
    "github actions", "gitlab ci", "circleci", "travis ci",
    "argocd", "helm", "istio", "prometheus", "grafana", "datadog",
    "new relic", "splunk", "elk", "nginx", "apache", "caddy",
    "linux", "bash", "shell", "powershell",
  ],
  data: [
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
    "keras", "spark", "hadoop", "airflow", "dbt", "snowflake",
    "bigquery", "redshift", "databricks", "mlflow", "kubeflow",
    "power bi", "tableau", "looker", "dax", "power query",
    "etl", "data warehouse", "data lake",
  ],
  mobile: [
    "react native", "flutter", "ionic", "xamarin", "swiftui",
    "jetpack compose", "android", "ios", "cordova", "capacitor",
  ],
  security: [
    "oauth", "oauth2", "jwt", "openid", "saml", "ldap",
    "owasp", "penetration testing", "soc2", "iso 27001",
    "lgpd", "gdpr", "pci-dss", "hipaa",
  ],
  methodologies: [
    "agile", "scrum", "kanban", "lean", "xp", "tdd", "bdd",
    "ddd", "cqrs", "event sourcing", "microservices", "monolith",
    "serverless", "clean architecture", "hexagonal",
    "ci/cd", "devops", "gitflow", "trunk-based",
  ],
} as const;

/** Lista flat de todas as skills normalizadas (lowercase). */
export const ALL_SKILLS_FLAT: readonly string[] = Object.values(SKILL_DICTIONARY)
  .flat()
  .map((s) => s.toLowerCase());

/**
 * Extrai skills de um texto usando word-boundary matching no dicionário.
 * Retorna skills únicas em lowercase.
 */
export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of ALL_SKILLS_FLAT) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|[^a-z0-9.#])${escaped}(?:$|[^a-z0-9])`,
      "i",
    );
    if (pattern.test(lower)) {
      found.add(skill);
    }
  }

  return Array.from(found).sort();
}

/**
 * Dado um conjunto de skills do candidato e da vaga, calcula keywords faltantes.
 */
export function findMissingKeywords(
  candidateSkills: readonly string[],
  requiredKeywords: readonly string[],
): string[] {
  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
  return requiredKeywords.filter((kw) => !candidateSet.has(kw.toLowerCase()));
}
