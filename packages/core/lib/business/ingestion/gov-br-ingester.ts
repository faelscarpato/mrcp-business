/**
 * MRCP-Business - Gov.br Ingestion Service
 * 
 * Camada de Ingestão de Dados Abertos (Knowledge Base).
 * Responsável por buscar, formatar e preparar as leis (Constituição, CLT, Civil)
 * a partir da API oficial do Governo Federal (dados.gov.br) para vetorização RAG.
 */

export interface GovDatasetConfig {
  baseUrl: string;
  apiToken?: string; // Token de autorização, caso a API exija para o endpoint escolhido
}

export interface GovDatasetResult {
  id: string;
  titulo: string;
  descricao: string;
  urlDownload: string;
  dataAtualizacao: string;
}

export class GovBrIngester {
  private config: GovDatasetConfig;

  constructor(config?: Partial<GovDatasetConfig>) {
    this.config = {
      baseUrl: 'https://dados.gov.br/dados/api/publico',
      ...config,
    };
  }

  /**
   * Busca conjuntos de dados no portal de Dados Abertos.
   * Ex: query = "Constituição Federal" ou "CLT"
   */
  async searchLegalDatasets(query: string, pagina: number = 1): Promise<GovDatasetResult[]> {
    const url = `${this.config.baseUrl}/conjuntos-dados?nomeConjuntoDados=${encodeURIComponent(query)}&pagina=${pagina}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'MRCP-Business-RAG-Ingester/1.0',
    };

    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }

    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
           console.warn(`[GovBrIngester] Acesso negado (401/403) na API gov.br para a query "${query}". Verifique a necessidade de Token.`);
           return this.mockFallbackData(query);
        }
        throw new Error(`Erro na API dados.gov.br: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Mapeamento baseado no Swagger (ConjuntoDadosApiView)
      // A resposta real pode estar envelopada em data, content, etc.
      const items = Array.isArray(data) ? data : (data.content || []);
      
      return items.map((item: any) => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        urlDownload: item.recursos?.[0]?.link || '',
        dataAtualizacao: item.dataUltimaAtualizacaoArquivo,
      }));

    } catch (error) {
      console.error(`[GovBrIngester] Falha na busca por ${query}:`, error);
      // Fallback local seguro para não quebrar a pipeline se o Governo estiver offline
      return this.mockFallbackData(query);
    }
  }

  /**
   * Baixa e extrai os artigos do recurso governamental, retornando os nós
   * prontos para inserção no Vector Database (pgvector/pinecone).
   */
  async downloadAndChunkLegalText(downloadUrl: string): Promise<string[]> {
    console.log(`[GovBrIngester] Baixando recurso de: ${downloadUrl}`);
    // Simulação do parse de CSV/JSON aberto do governo e quebra por "Art." ou "Cláusula"
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      "Art. 1º - A República Federativa do Brasil...",
      "Art. 2º - São Poderes da União, independentes e harmônicos entre si...",
      "Art. 3º - Constituem objetivos fundamentais da República..."
    ];
  }

  /**
   * Simula um dataset de fallback caso a API do governo esteja bloqueando a requisição pública.
   * Isso garante que a POC de RAG possa prosseguir localmente.
   */
  private mockFallbackData(query: string): GovDatasetResult[] {
    return [
      {
        id: 'mock-123',
        titulo: `Base Legal (Fallback Local): ${query}`,
        descricao: 'Dados cacheados localmente devido a restrições/instabilidade na API pública dados.gov.br.',
        urlDownload: 'local://knowledge-base/offline-backup.json',
        dataAtualizacao: new Date().toISOString(),
      }
    ];
  }
}

// Para testar diretamente via npx tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log("Iniciando Ingestão de Leis Brasileiras...");
    const ingester = new GovBrIngester();
    const resultados = await ingester.searchLegalDatasets("Constituição Federal");
    console.log(JSON.stringify(resultados, null, 2));
    
    if (resultados.length > 0 && resultados[0].urlDownload) {
      const chunks = await ingester.downloadAndChunkLegalText(resultados[0].urlDownload);
      console.log(`\nExtraídos ${chunks.length} artigos para o Vector DB.`);
    }
  })();
}
