import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-loud-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-graphite-950 shadow-lg hover:bg-loud-400 transition-all"
      >
        <Download size={14} />
        Instalar App
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-graphite-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-premium-muted hover:text-white transition-all"
        >
          Instalar no iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-graphite-900 p-8 shadow-2xl border border-white/10 text-center">
              <h3 className="text-lg font-bold text-white mb-3">Instalar no iPhone / iPad</h3>
              <p className="text-sm text-premium-muted mb-6 leading-relaxed">
                1. Toque no botão <strong className="text-white">Compartilhar</strong> na barra de ferramentas do Safari.<br /><br />
                2. Role para baixo e toque em <strong className="text-white">Adicionar à Tela de Início</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-graphite-800 py-3 text-sm font-bold text-white hover:bg-graphite-700"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
