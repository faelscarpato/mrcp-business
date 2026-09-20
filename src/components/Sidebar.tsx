import React, { useState } from 'react';
import { Layers, Briefcase, FileText, Settings, Shield, Activity, PieChart, Home } from 'lucide-react';
import { useDataLakeStore } from '../lib/store';
import { SettingsModal } from './SettingsModal';

export const Sidebar = () => {
  const { activePipeline, setActivePipeline } = useDataLakeStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { name: 'Geral', icon: Home, pipeline: 'Geral' },
    { name: 'RH & Triagem', icon: Briefcase, pipeline: 'RH & Triagem' },
    { name: 'Financeiro & BI', icon: PieChart, pipeline: 'Financeiro & BI' },
    { name: 'Jurídico', icon: Shield, pipeline: 'Jurídico' },
    { name: 'Operacional', icon: Activity, pipeline: 'Operacional' },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full shadow-lg z-10">
      <div className="p-4 border-b border-zinc-800 flex items-center space-x-2">
        <Layers className="text-brand-500 w-6 h-6" />
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">MRCP OS</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pipelines</div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePipeline === item.pipeline;
            return (
              <button
                key={item.name}
                onClick={() => setActivePipeline(item.pipeline)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-400' : 'text-zinc-500'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-8 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sistema</div>
        <nav className="space-y-1 px-2">
          <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent transition-all duration-200">
            <FileText className="mr-3 h-5 w-5 text-zinc-500" />
            Data Lake
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent transition-all duration-200"
          >
            <Settings className="mr-3 h-5 w-5 text-zinc-500" />
            Configurações
          </button>
        </nav>
      </div>
      
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center text-sm text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          AST Engine: Local
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
};
