import React, { Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4 font-sans">
          <div className="max-w-lg w-full bg-gray-900 p-8 rounded-2xl border border-red-500/30 shadow-2xl">
            <h1 className="text-2xl font-black text-red-500 mb-4 uppercase">Erro Crítico</h1>
            <p className="text-gray-400 mb-6">Ocorreu um problema inesperado que impediu o carregamento da aplicação.</p>
            
            <div className="bg-black/50 p-4 rounded-xl border border-gray-800 mb-6 overflow-auto max-h-64 custom-scrollbar">
              <code className="text-xs font-mono text-red-300 block whitespace-pre-wrap">
                {this.state.error?.toString()}
              </code>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/50 py-3 rounded-xl font-bold transition-colors text-sm"
              >
                Limpar Dados & Recarregar
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-gray-950 py-3 rounded-xl font-bold transition-colors text-sm shadow-lg"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);