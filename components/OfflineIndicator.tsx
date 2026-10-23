import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ShieldAlert } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 rounded-2xl bg-amber-500/90 backdrop-blur-md px-5 py-3 text-xs font-black uppercase tracking-wider text-black shadow-2xl animate-fade-in-up">
      <ShieldAlert size={18} />
      <span>Offline — Usando dados em cache</span>
    </div>
  );
};
