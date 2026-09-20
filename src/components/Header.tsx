import React from 'react';
import { Search, Bell, User } from 'lucide-react';

export const Header = () => {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6">
      <div className="flex items-center text-sm text-zinc-400">
        Workspace: <span className="text-zinc-100 ml-2 font-medium">Acme Corp</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-zinc-900 border border-zinc-800 text-sm rounded-md pl-10 pr-4 py-1.5 text-zinc-300 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-64"
          />
        </div>
        <button className="text-zinc-400 hover:text-zinc-100 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>
        <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-300">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
