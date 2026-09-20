import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, Database, Server, RefreshCw } from 'lucide-react';
import { useSettings, ProviderId } from '../lib/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { provider, setProvider, keys, setKey, models, setModel, baseUrls, setBaseUrl, hydrated } = useSettings();
  const [localKeys, setLocalKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [localModels, setLocalModels] = useState<Partial<Record<ProviderId, string>>>({});
  const [localBaseUrls, setLocalBaseUrls] = useState<Partial<Record<ProviderId, string>>>({});
  const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) {
      setLocalKeys(keys);
      setLocalModels(models);
      setLocalBaseUrls(baseUrls);
    }
  }, [hydrated, keys, models, baseUrls]);

  if (!isOpen) return null;

  const handleSave = () => {
    Object.entries(localKeys).forEach(([p, key]) => {
      setKey(p as ProviderId, key || '');
    });
    Object.entries(localModels).forEach(([p, model]) => {
      setModel(p as ProviderId, model || '');
    });
    Object.entries(localBaseUrls).forEach(([p, url]) => {
      setBaseUrl(p as ProviderId, url || '');
    });
    onClose();
  };

  const providers: { id: ProviderId; name: string }[] = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'google', name: 'Google (Gemini)' },
    { id: 'nvidia', name: 'NVIDIA' },
    { id: 'custom', name: 'Custom Provider' },
  ];

  const fetchModels = async (p: ProviderId) => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const apiKey = localKeys[p] || '';
      let baseUrl = localBaseUrls[p] || '';
      
      if (!baseUrl) {
        if (p === 'openai') baseUrl = 'https://api.openai.com/v1';
        else if (p === 'nvidia') baseUrl = 'https://integrate.api.nvidia.com/v1';
        else if (p === 'custom') throw new Error('Base URL is required for custom provider');
        else throw new Error('Model fetching is only supported for OpenAI compatible endpoints');
      }

      // Remove trailing slash
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';

      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        setFetchedModels(prev => ({
          ...prev,
          [p]: data.data.map((m: any) => m.id)
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error fetching models');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-500/20 p-2 rounded-lg">
              <Server className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">Configurações de IA (BYOK)</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Provedor Ativo</label>
            <div className="flex flex-wrap gap-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    provider === p.id 
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                      : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-2">Configuração dos Provedores</h3>
            
            {providers.map((p) => (
              <div key={p.id} className={`space-y-4 p-4 rounded-xl border ${provider === p.id ? 'border-brand-500/50 bg-brand-500/5' : 'border-zinc-800 bg-zinc-900/30'}`}>
                <h4 className="text-sm font-bold text-zinc-200">{p.name}</h4>
                
                {/* Custom Base URL (Para provedores customizados ou sobreposições) */}
                {(p.id === 'custom' || p.id === 'openai' || p.id === 'nvidia') && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Base URL</label>
                    <input
                      type="text"
                      placeholder={p.id === 'custom' ? "https://api.exemplo.com/v1" : "Deixe em branco para usar o padrão"}
                      value={localBaseUrls[p.id] || ''}
                      onChange={(e) => setLocalBaseUrls(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center text-xs font-medium text-zinc-400">
                    <Key className="w-3 h-3 mr-1.5" /> API Key
                  </label>
                  <input
                    type="password"
                    placeholder={`sk-...`}
                    value={localKeys[p.id] || ''}
                    onChange={(e) => setLocalKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-400">Modelo Padrão</label>
                    {(p.id === 'custom' || p.id === 'openai' || p.id === 'nvidia') && (
                      <button 
                        onClick={() => fetchModels(p.id)}
                        disabled={isFetching}
                        className="text-xs flex items-center text-brand-400 hover:text-brand-300 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                        Buscar Modelos
                      </button>
                    )}
                  </div>
                  
                  {fetchedModels[p.id] && fetchedModels[p.id].length > 0 ? (
                    <select
                      value={localModels[p.id] || ''}
                      onChange={(e) => setLocalModels(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Selecione um modelo</option>
                      {fetchedModels[p.id].map(modelId => (
                        <option key={modelId} value={modelId}>{modelId}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ex: gpt-4o"
                      value={localModels[p.id] || ''}
                      onChange={(e) => setLocalModels(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  )}
                  {fetchError && <p className="text-xs text-red-400 mt-1">{fetchError}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start space-x-3">
            <Database className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/80 leading-relaxed">
              <strong>Privacidade Garantida:</strong> Suas chaves de API nunca são enviadas para nossos servidores. Elas são armazenadas no <code>localStorage</code> do seu navegador e usadas apenas para comunicação direta com os provedores de IA, respeitando o modelo Bring Your Own Key.
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-brand-900/20 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
};

