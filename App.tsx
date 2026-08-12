
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
import { FindLine } from './pages/FindLine';
import BracketCreator from './pages/BracketCreator';
import BracketOverlay from './pages/BracketOverlay';
import FreeFireTacticalBoard from './pages/freefire-tactical-board';
import { About, MapsPage, AerialView, GridGalleryPage, StaticGridGalleryPage, FirestoreGridGalleryPage } from './pages/SimplePages';
import AdminResources from './pages/AdminResources';
import AdminTeamLogos from './pages/AdminTeamLogos';
import VideoClasses from './pages/VideoClasses';
import AdminVideoClasses from './pages/AdminVideoClasses';
import { SHEETS, LOADOUTS_DATA, MAPS_PINGOS_DATA, RECURSOS_DATA } from './constants';
import { Language } from './translations';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('/');
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('pt');
  
  // Track which pages have been visited to lazy-load them
  const [visitedRoutes, setVisitedRoutes] = useState<Set<string>>(new Set(['/']));

  const handleNavigate = (path: string) => {
    if (path === currentPage) return;
    setHistoryStack(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === currentPage) {
        return prev;
      }
      return [...prev, currentPage];
    });
    setCurrentPage(path);
  };

  const handleBack = () => {
    const gameTools = [
      '/criar-treinos',
      '/mapeamento',
      '/montar-elenco',
      '/estatisticas',
      '/composicao',
      '/picks-bans',
      '/quadro-tatico',
      '/criar-chaveamento'
    ];
    const downloadPages = [
      '/mapas',
      '/pingos-mapas',
      '/visoes-aereas',
      '/pets',
      '/personagens',
      '/carregamentos',
      '/recursos',
      '/logos-times',
      '/safes',
      '/sala-de-aula',
      '/admin-recursos',
      '/admin-logos-times',
      '/admin-sala-de-aula'
    ];

    if (historyStack.length > 0) {
      const prevPath = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, -1));
      if (prevPath && prevPath !== currentPage) {
        setCurrentPage(prevPath);
        return;
      }
    }

    // Fallback based on structure
    if (gameTools.includes(currentPage)) {
      setCurrentPage('/jogo');
    } else if (downloadPages.includes(currentPage)) {
      setCurrentPage('/downloads');
    } else {
      setCurrentPage('/');
    }
  };

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

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} onBack={handleBack} language={language} setLanguage={setLanguage}>
      {/* 
         We render all visited components but hide the inactive ones via CSS.
         This preserves their internal state (inputs, canvas, selections) when navigating away.
      */}
      {renderRoute('/', <Home onNavigate={handleNavigate} />)}
      {renderRoute('/sobre', <About />)}
      
      {/* Hub Pages */}
      {renderRoute('/downloads', <Downloads onNavigate={handleNavigate} />)}
      {renderRoute('/jogo', <GameHub onNavigate={handleNavigate} />)}

      {/* Game Tools */}
      {renderRoute('/estatisticas', <Statistics language={language} />)}
      {renderRoute('/criar-treinos', <TrainingPlatform />)}
      {renderRoute('/composicao', <Composition />)}
      {renderRoute('/picks-bans', <PicksBans />)}
      {renderRoute('/mapeamento', <Mapping />)}
      {renderRoute('/montar-elenco', <SquadBuilder />)}
      {renderRoute('/encontrar-line', <FindLine />)}
      {renderRoute('/criar-chaveamento', <BracketCreator />)}
      {renderRoute('/quadro-tatico', <FreeFireTacticalBoard />)}
      
      {/* Download Sub-pages */}
      {renderRoute('/mapas', <MapsPage />)}
      {renderRoute('/pingos-mapas', <StaticGridGalleryPage title="Pingos dos Mapas" items={MAPS_PINGOS_DATA} />)}
      {renderRoute('/visoes-aereas', <AerialView />)}
      {renderRoute('/pets', <GridGalleryPage title="Pets" sheetUrl={SHEETS.PETS} imageFit="contain" />)}
      {renderRoute('/personagens', <GridGalleryPage title="Personagens" sheetUrl={SHEETS.CHARACTERS} filterType={true} imageFit="cover" />)}
      {renderRoute('/carregamentos', <StaticGridGalleryPage title="Carregamentos 3.0" items={LOADOUTS_DATA} />)}
      {renderRoute('/recursos', <FirestoreGridGalleryPage title="Recursos" collectionName="resources" />)}
      {renderRoute('/logos-times', <FirestoreGridGalleryPage title="Logos de Times" collectionName="teamLogos" />)}
      {renderRoute('/sala-de-aula', <VideoClasses onNavigate={handleNavigate} />)}
      {renderRoute('/admin-recursos', <AdminResources />)}
      {renderRoute('/admin-logos-times', <AdminTeamLogos />)}
      {renderRoute('/admin-sala-de-aula', <AdminVideoClasses />)}
      {renderRoute('/safes', <Safes />)}
    </Layout>
  );
};

export default App;
