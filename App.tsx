
import React, { useState } from 'react';
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
import SquadBuilder from './pages/SquadBuilder'; // New Import
import { About, MapsPage, AerialView, GridGalleryPage } from './pages/SimplePages';
import { SHEETS } from './constants';
import { Language } from './translations';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('/');
  const [language, setLanguage] = useState<Language>('pt');

  const renderPage = () => {
    switch (currentPage) {
      case '/': return <Home onNavigate={setCurrentPage} />;
      case '/sobre': return <About />;
      
      // Hub Pages
      case '/downloads': return <Downloads onNavigate={setCurrentPage} />;
      case '/jogo': return <GameHub onNavigate={setCurrentPage} />;

      // Game Tools (Accessed via Game Hub)
      case '/estatisticas': return <Statistics language={language} />;
      case '/criar-treinos': return <TrainingPlatform />;
      case '/composicao': return <Composition />;
      case '/picks-bans': return <PicksBans />;
      case '/mapeamento': return <Mapping />;
      case '/montar-elenco': return <SquadBuilder />; // New Route
      
      // Download Sub-pages
      case '/mapas': return <MapsPage />;
      case '/visoes-aereas': return <AerialView />;
      case '/pets': return <GridGalleryPage title="Pets" sheetUrl={SHEETS.PETS} imageFit="contain" />;
      case '/personagens': return <GridGalleryPage title="Personagens" sheetUrl={SHEETS.CHARACTERS} filterType={true} imageFit="cover" />;
      case '/safes': return <Safes />;
      
      default: return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} language={language} setLanguage={setLanguage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
