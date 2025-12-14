
import React, { useState, useEffect } from 'react';
import { 
  Users, Upload, DollarSign, Download, RotateCcw, 
  HelpCircle, Trash2, Copy, Edit2, GripVertical, User, 
  Briefcase, Save, Undo2, X, Plus 
} from 'lucide-react';
import { downloadDivAsImage } from '../utils';

// --- TYPES ---

interface SquadMember {
  id: string; // Unique ID for slot
  type: 'player' | 'coach' | 'analyst';
  label: string; // "Player 1", "Coach", etc.
  name: string;
  role: string; // "Rush", "Sniper"
  image: string | null;
  oneWord: string; // Defining characteristic
  salary: number;
}

const ROLES = ['RUSH', 'RUSH 2', 'CPT', 'BOMBA', 'SNIPER', 'SUPORTE', 'CORINGA'];

const SquadBuilder: React.FC = () => {
  // --- STATE ---
  
  const [teamName, setTeamName] = useState('NOME DO TIME');
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  
  // Initial Slots: 4 Mains + 1 Sub + Coach + Analyst
  const initialSquad: SquadMember[] = [
    { id: 'p1', type: 'player', label: 'JOGADOR 1', name: '', role: '', image: null, oneWord: '', salary: 0 },
    { id: 'p2', type: 'player', label: 'JOGADOR 2', name: '', role: '', image: null, oneWord: '', salary: 0 },
    { id: 'p3', type: 'player', label: 'JOGADOR 3', name: '', role: '', image: null, oneWord: '', salary: 0 },
    { id: 'p4', type: 'player', label: 'JOGADOR 4', name: '', role: '', image: null, oneWord: '', salary: 0 },
    { id: 'p5', type: 'player', label: '5º PLAYER / RES', name: '', role: '', image: null, oneWord: '', salary: 0 },
    { id: 'c1', type: 'coach', label: 'COACH', name: '', role: 'COACH', image: null, oneWord: '', salary: 0 },
    { id: 'a1', type: 'analyst', label: 'ANALISTA', name: '', role: 'ANALISTA', image: null, oneWord: '', salary: 0 },
  ];

  const [squad, setSquad] = useState<SquadMember[]>(initialSquad);
  const [history, setHistory] = useState<SquadMember[][]>([]); // For Undo
  
  // UI State
  const [showHelp, setShowHelp] = useState(false);
  const [mobileEditId, setMobileEditId] = useState<string | null>(null); // ID of slot being edited on mobile

  // --- ACTIONS ---

  const saveHistory = () => {
    setHistory(prev => [...prev.slice(-10), JSON.parse(JSON.stringify(squad))]); // Keep last 10 states
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setSquad(previous);
    setHistory(prev => prev.slice(0, -1));
  };

  const updateMember = (id: string, field: keyof SquadMember, value: any) => {
    saveHistory();
    setSquad(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setTeamLogo(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleMemberImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => updateMember(id, 'image', ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const clearSlot = (id: string) => {
    saveHistory();
    setSquad(prev => prev.map(m => 
      m.id === id ? { ...m, name: '', role: m.type === 'player' ? '' : m.role, image: null, oneWord: '', salary: 0 } : m
    ));
  };

  const duplicateSlot = (sourceId: string) => {
    // Find next empty slot of same type
    const source = squad.find(s => s.id === sourceId);
    if (!source) return;

    const target = squad.find(s => s.type === source.type && s.id !== sourceId && !s.name);
    
    if (target) {
        saveHistory();
        setSquad(prev => prev.map(m => m.id === target.id ? { 
            ...m, 
            name: source.name, 
            role: source.role, 
            image: source.image, 
            oneWord: source.oneWord,
            salary: source.salary
        } : m));
    } else {
        alert("Não há slots vazios disponíveis para duplicar.");
    }
  };

  const resetAll = () => {
      if(confirm("Deseja limpar todo o elenco?")) {
          saveHistory();
          setSquad(initialSquad);
          setTeamName('NOME DO TIME');
          setTeamLogo(null);
      }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, role: string) => {
      e.dataTransfer.setData("role", role);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
      const role = e.dataTransfer.getData("role");
      if (role) {
          updateMember(id, 'role', role);
      }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // Calculation
  const totalSalary = squad.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);

  // --- RENDERERS ---

  const renderCard = (member: SquadMember) => (
      <div 
        key={member.id}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, member.id)}
        className={`relative bg-gray-900 border-2 rounded-xl p-3 flex flex-col gap-2 transition-all group ${member.type === 'player' ? 'border-gray-700 hover:border-brand-500' : 'border-blue-900 hover:border-blue-500'}`}
      >
          {/* Header Actions */}
          <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase mb-1">
              <span>{member.label}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => duplicateSlot(member.id)} title="Duplicar para vazio"><Copy size={12}/></button>
                  <button onClick={() => clearSlot(member.id)} title="Limpar" className="text-red-500"><Trash2 size={12}/></button>
                  <button onClick={() => setMobileEditId(member.id)} title="Editar (Modal)" className="md:hidden text-brand-500"><Edit2 size={12}/></button>
              </div>
          </div>

          {/* Image & Role Area */}
          <div className="flex gap-3 h-24">
              {/* Photo */}
              <label className="relative w-20 h-full bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition-opacity">
                  {member.image ? (
                      <img src={member.image} className="w-full h-full object-cover" />
                  ) : (
                      <div className="text-gray-600 flex flex-col items-center">
                          <User size={24} />
                          <span className="text-[8px] uppercase mt-1">Foto</span>
                      </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMemberImageUpload(member.id, e)} />
              </label>

              {/* Role & Definition */}
              <div className="flex-1 flex flex-col justify-between">
                  {/* Role Display/Input */}
                  <div 
                    onClick={() => setMobileEditId(member.id)}
                    className={`h-8 flex items-center justify-center font-black uppercase text-sm rounded cursor-pointer border border-dashed ${member.role ? 'bg-gray-800 text-white border-transparent' : 'bg-transparent text-gray-600 border-gray-600'}`}
                  >
                      {member.role || 'Arraste Função'}
                  </div>

                  {/* One Word Definition */}
                  <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Definição (1 palavra)"
                        value={member.oneWord}
                        onChange={(e) => updateMember(member.id, 'oneWord', e.target.value)}
                        className="w-full bg-transparent border-b border-gray-700 text-center text-xs font-bold text-brand-500 placeholder-gray-600 outline-none focus:border-brand-500"
                      />
                  </div>
              </div>
          </div>

          {/* Name Input */}
          <input 
            type="text"
            placeholder="Nome do Jogador"
            value={member.name}
            onChange={(e) => updateMember(member.id, 'name', e.target.value)}
            className="w-full bg-gray-800 rounded px-2 py-1.5 text-center font-bold text-white outline-none focus:ring-1 focus:ring-brand-500 text-sm"
          />

          {/* Salary Input */}
          <div className="flex items-center gap-2 bg-black/30 rounded px-2 py-1 border border-gray-800">
             <DollarSign size={12} className="text-green-500" />
             <input 
                type="number"
                placeholder="Salário"
                value={member.salary || ''}
                onChange={(e) => updateMember(member.id, 'salary', parseFloat(e.target.value))}
                className="w-full bg-transparent text-xs font-mono text-right text-green-400 outline-none placeholder-gray-700"
             />
          </div>
      </div>
  );

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
            
            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 sticky top-20 z-40">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200">
                            Montar Elenco
                        </h1>
                        <p className="text-xs text-gray-500">Planejamento de Squad & Staff</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                    <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-gray-500 hover:text-white disabled:opacity-30 rounded-lg hover:bg-gray-800" title="Desfazer">
                        <Undo2 size={20} />
                    </button>
                    <button onClick={resetAll} className="p-2 text-red-500 hover:text-red-400 rounded-lg hover:bg-gray-800" title="Resetar">
                        <RotateCcw size={20} />
                    </button>
                    <button onClick={() => setShowHelp(true)} className="p-2 text-brand-500 hover:text-brand-400 rounded-lg hover:bg-gray-800" title="Ajuda">
                        <HelpCircle size={20} />
                    </button>
                    <div className="h-8 w-px bg-gray-700 mx-2"></div>
                    <button onClick={() => downloadDivAsImage('squad-builder-canvas', 'meu-elenco')} className="bg-brand-500 hover:bg-brand-600 text-gray-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                        <Download size={18} /> Salvar PNG
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* MAIN BUILDER AREA */}
                <div id="squad-builder-canvas" className="flex-1 bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
                    {/* Decorative BG */}
                    <div className="absolute inset-0 bg-[url('https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg')] bg-cover bg-center opacity-5 pointer-events-none"></div>

                    {/* Team Header Info */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative z-10 border-b border-gray-800 pb-6">
                        <div className="flex items-center gap-4">
                             <label className="w-20 h-20 bg-gray-900 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:border-brand-500 transition-colors overflow-hidden group">
                                 {teamLogo ? (
                                     <img src={teamLogo} className="w-full h-full object-cover" />
                                 ) : (
                                     <Upload className="text-gray-600 group-hover:text-brand-500" />
                                 )}
                                 <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                             </label>
                             <div>
                                 <input 
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="bg-transparent text-3xl font-black text-white uppercase outline-none placeholder-gray-700 border-b border-transparent focus:border-brand-500 w-full md:w-auto"
                                 />
                                 <div className="text-gray-500 text-xs font-mono mt-1 uppercase tracking-widest">Season 2025</div>
                             </div>
                        </div>

                        {/* Salary Total */}
                        <div className="bg-black/40 px-6 py-3 rounded-xl border border-gray-800 text-right">
                             <div className="text-xs text-gray-500 uppercase font-bold mb-1">Folha Salarial Mensal</div>
                             <div className="text-3xl font-mono font-black text-green-500">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSalary)}
                             </div>
                        </div>
                    </div>

                    {/* LINE UP PRINCIPAL (4 Cards) */}
                    <div className="mb-8 relative z-10">
                        <h3 className="text-brand-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                            <Users size={16} /> Line-up Principal
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {squad.slice(0, 4).map(renderCard)}
                        </div>
                    </div>

                    {/* RESERVAS & STAFF */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                         <div>
                             <h3 className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                <Plus size={16} /> 5º Jogador / Reserva
                             </h3>
                             <div className="grid grid-cols-1">
                                 {renderCard(squad[4])}
                             </div>
                         </div>
                         <div>
                             <h3 className="text-purple-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                <Briefcase size={16} /> Comissão Técnica
                             </h3>
                             <div className="grid grid-cols-2 gap-4">
                                 {renderCard(squad[5])} {/* Coach */}
                                 {renderCard(squad[6])} {/* Analyst */}
                             </div>
                         </div>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-gray-900 text-center text-gray-600 text-[10px] font-mono uppercase">
                        Gerado via Jhan Medeiros Analytics
                    </div>
                </div>

                {/* SIDEBAR TOOLS (Desktop) */}
                <div className="hidden lg:block w-72 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-24">
                        <h3 className="font-bold text-gray-500 uppercase text-xs mb-4 flex items-center gap-2">
                            <GripVertical size={14} /> Funções (Arraste)
                        </h3>
                        <div className="space-y-2">
                            {ROLES.map(role => (
                                <div 
                                    key={role}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, role)}
                                    className="bg-gray-100 dark:bg-gray-700 hover:bg-brand-500 hover:text-black dark:hover:text-black p-3 rounded-lg font-bold text-center cursor-grab active:cursor-grabbing transition-colors text-sm shadow-sm"
                                >
                                    {role}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400 text-xs mb-2">Dica Rápida</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                No celular, clique no card para abrir o menu de edição. No PC, você pode arrastar as funções ao lado para os cards.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* MOBILE EDIT MODAL */}
        {mobileEditId && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md p-6 rounded-t-2xl sm:rounded-2xl border-t sm:border border-gray-700 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Editar {squad.find(s => s.id === mobileEditId)?.label}</h3>
                        <button onClick={() => setMobileEditId(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={20}/></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Função / Role</label>
                            <div className="flex flex-wrap gap-2">
                                {ROLES.map(role => (
                                    <button 
                                        key={role}
                                        onClick={() => { updateMember(mobileEditId, 'role', role); setMobileEditId(null); }}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                            squad.find(s => s.id === mobileEditId)?.role === role 
                                            ? 'bg-brand-500 text-black border-brand-500' 
                                            : 'bg-transparent border-gray-600 hover:border-white'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={() => { duplicateSlot(mobileEditId); setMobileEditId(null); }}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                <Copy size={16} /> Duplicar
                            </button>
                            <button 
                                onClick={() => { clearSlot(mobileEditId); setMobileEditId(null); }}
                                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Limpar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* HELP MODAL */}
        {showHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                <div className="bg-white dark:bg-gray-900 max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-gray-700 relative">
                    <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                    <h3 className="text-2xl font-bold mb-4 text-brand-500">Como usar o Montar Elenco</h3>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li className="flex gap-2"><span className="text-brand-500 font-bold">1.</span> Clique na área da foto para adicionar a imagem do jogador.</li>
                        <li className="flex gap-2"><span className="text-brand-500 font-bold">2.</span> Digite o nome, definição (1 palavra) e salário nos campos de texto.</li>
                        <li className="flex gap-2"><span className="text-brand-500 font-bold">3.</span> <strong>PC:</strong> Arraste as funções da barra lateral para os cards.</li>
                        <li className="flex gap-2"><span className="text-brand-500 font-bold">4.</span> <strong>Celular:</strong> Toque na caixa da função ou no ícone de editar para abrir o menu.</li>
                        <li className="flex gap-2"><span className="text-brand-500 font-bold">5.</span> Use os botões de ação no topo dos cards para duplicar dados ou limpar o slot.</li>
                        <li className="flex gap-2"><span className="text-brand-500 font-bold">6.</span> O cálculo salarial é automático. Clique em "Salvar PNG" para exportar.</li>
                    </ul>
                    <button onClick={() => setShowHelp(false)} className="mt-6 w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold">Entendi</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default SquadBuilder;
