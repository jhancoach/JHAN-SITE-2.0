
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Composition from './pages/Composition';
import PicksBans from './pages/PicksBans';
import Safes from './pages/Safes';
import Downloads from './pages/Downloads';
import Statistics from './pages/Statistics'; 
import TrainingPlatform from './pages/TrainingPlatform';
import GameHub from './pages/GameHub';
import Mapping from './pages/Mapping';
import SquadBuilder from './pages/SquadBuilder'; 
import BracketCreator from './pages/BracketCreator';
import BracketOverlay from './pages/BracketOverlay';
import { About, MapsPage, AerialView, GridGalleryPage, StaticGridGalleryPage } from './pages/SimplePages';
import { SHEETS, LOADOUTS_DATA, MAPS_PINGOS_DATA } from './constants';
import { Language } from './translations';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('/');
  const [language, setLanguage] = useState<Language>('pt');
  
  // Track which pages have been visited to lazy-load them
  const [visitedRoutes, setVisitedRoutes] = useState<Set<string>>(new Set(['/']));

  useEffect(() => {
    setVisitedRoutes(prev => {
        const newSet = new Set(prev);
        newSet.add(currentPage);
        return newSet;
    });
  }, [currentPage]);

  // Helper to render pages only if visited, and toggle visibility
  const renderRoute = (path: string, Component: React.ReactNode) => {
    if (!visitedRoutes.has(path)) return null;
    return (
      <div 
        key={path}
        style={{ 
            display: currentPage === path ? 'block' : 'none',
            height: '100%',
            width: '100%'
        }}
      >
        {Component}
      </div>
    );
  };

  // Special logic for Overlay Page (No Layout)
  if (currentPage === '/overlay/chaveamento') {
      return <BracketOverlay />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} language={language} setLanguage={setLanguage}>
      {/* 
         We render all visited components but hide the inactive ones via CSS.
         This preserves their internal state (inputs, canvas, selections) when navigating away.
      */}
      {renderRoute('/', <Home onNavigate={setCurrentPage} />)}
      {renderRoute('/sobre', <About />)}
      
      {/* Hub Pages */}
      {renderRoute('/downloads', <Downloads onNavigate={setCurrentPage} />)}
      {renderRoute('/jogo', <GameHub onNavigate={setCurrentPage} />)}

      {/* Game Tools */}
      {renderRoute('/estatisticas', <Statistics language={language} />)}
      {renderRoute('/criar-treinos', <TrainingPlatform />)}
      {renderRoute('/composicao', <Composition />)}
      {renderRoute('/picks-bans', <PicksBans />)}
      {renderRoute('/mapeamento', <Mapping />)}
      {renderRoute('/montar-elenco', <SquadBuilder />)}
      {renderRoute('/criar-chaveamento', <BracketCreator />)}
      
      {/* Download Sub-pages */}
      {renderRoute('/mapas', <MapsPage />)}
      {renderRoute('/pingos-mapas', <StaticGridGalleryPage title="Pingos dos Mapas" items={MAPS_PINGOS_DATA} />)}
      {renderRoute('/visoes-aereas', <AerialView />)}
      {renderRoute('/pets', <GridGalleryPage title="Pets" sheetUrl={SHEETS.PETS} imageFit="contain" />)}
      {renderRoute('/personagens', <GridGalleryPage title="Personagens" sheetUrl={SHEETS.CHARACTERS} filterType={true} imageFit="cover" />)}
      {renderRoute('/carregamentos', <StaticGridGalleryPage title="Carregamentos 3.0" items={LOADOUTS_DATA} />)}
      {renderRoute('/safes', <Safes />)}
    </Layout>
  );
};

export default App;
