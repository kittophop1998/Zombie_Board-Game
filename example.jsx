import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  LogIn, 
  Copy, 
  Clock, 
  ShieldAlert, 
  Crosshair, 
  Syringe, 
  Skull,
  ChevronRight,
  Info
} from 'lucide-react';

// --- Mock Data & Helpers ---
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const Card = ({ suit, value, type = 'number', selected, onClick, disabled }) => {
  const isRed = suit === '♥' || suit === '♦';
  
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 transition-all cursor-pointer transform hover:-translate-y-2 flex flex-col items-center justify-between p-2 shadow-lg
        ${selected ? 'border-yellow-400 ring-4 ring-yellow-400/50 scale-105 z-10' : 'border-slate-700 bg-white'}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-yellow-500/20'}
      `}
    >
      {type === 'number' ? (
        <>
          <div className={`self-start text-lg font-bold ${isRed ? 'text-red-500' : 'text-slate-800'}`}>
            {value}<br /><span className="text-xl">{suit}</span>
          </div>
          <div className={`text-4xl ${isRed ? 'text-red-500' : 'text-slate-800'}`}>{suit}</div>
          <div className={`self-end rotate-180 text-lg font-bold ${isRed ? 'text-red-500' : 'text-slate-800'}`}>
            {value}<br /><span className="text-xl">{suit}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full w-full space-y-2">
          {type === 'zombie' && <Skull className="w-12 h-12 text-green-600" />}
          {type === 'shotgun' && <Crosshair className="w-12 h-12 text-red-600" />}
          {type === 'vaccine' && <Syringe className="w-12 h-12 text-blue-500" />}
          <span className="text-xs font-bold text-slate-800 uppercase">
            {type === 'zombie' ? 'ซอมบี้' : type === 'shotgun' ? 'ปืนลูกซอง' : 'วัคซีน'}
          </span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); // home, lobby, game
  const [roomCode, setRoomCode] = useState('');
  const [isZombie, setIsZombie] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [battleConfirmed, setBattleConfirmed] = useState(false);

  // Mock Hand
  const [hand, setHand] = useState([
    { id: 1, type: 'number', suit: '♠', value: 'A' },
    { id: 2, type: 'number', suit: '♠', value: '4' },
    { id: 3, type: 'number', suit: '♣', value: '10' },
    { id: 4, type: 'number', suit: '♥', value: '2' },
    { id: 5, type: 'number', suit: '♣', value: 'J' },
    { id: 6, type: 'shotgun' },
    { id: 7, type: 'zombie' },
  ]);

  const toggleCard = (id) => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    } else {
      if (selectedCards.length < 3) {
        setSelectedCards([...selectedCards, id]);
      }
    }
  };

  const renderHome = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Skull className="w-20 h-20 text-green-500 animate-pulse" />
            <div className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 border-2 border-slate-800">
              <Crosshair className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">ZOMBIE CARD GAME</h1>
        <p className="text-slate-400 mb-8 font-light italic">"รอดชีวิต หรือ กลายเป็นพวกมัน"</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => setView('lobby')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 shadow-lg shadow-blue-900/40"
          >
            <Plus className="w-5 h-5" />
            <span>สร้างห้องใหม่</span>
          </button>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LogIn className="h-5 w-5 text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="รหัสห้อง (เช่น 99YUBQ)"
              className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              onChange={(e) => setRoomCode(e.target.value)}
            />
          </div>
          <button 
             onClick={() => setView('lobby')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all"
          >
            เข้าร่วมห้อง
          </button>
        </div>
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
              <span className="text-slate-500 text-sm block">รหัสห้อง</span>
              <span className="text-white text-2xl font-mono font-bold">99YUBQ</span>
            </div>
            <button className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-blue-400 transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <span className="text-slate-400 text-sm">พร้อมแล้ว</span>
              <div className="text-white font-bold">4 / 6 ผู้เล่น</div>
            </div>
            <button 
              onClick={() => setView('game')}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-green-900/20"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span>เริ่มเกม</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['คุณ (R)', 'Alice', 'Bob', 'Charlie'].map((name, i) => (
            <div key={i} className={`bg-slate-800 rounded-2xl p-6 border-2 flex flex-col items-center space-y-4 transition-all ${i === 0 ? 'border-blue-500 bg-slate-800/50' : 'border-slate-700'}`}>
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-700 relative">
                <Users className="w-10 h-10 text-slate-600" />
                {i === 0 && <div className="absolute -bottom-1 -right-1 bg-blue-500 text-[10px] text-white px-2 py-0.5 rounded-full font-bold">ME</div>}
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-lg">{name}</h3>
                <span className="text-slate-500 text-sm">รอกดเริ่ม...</span>
              </div>
              <div className="w-full flex justify-center space-x-1">
                {[1,2,3,4,5,6,7].map(j => <div key={j} className="w-2 h-3 bg-slate-700 rounded-sm" />)}
              </div>
            </div>
          ))}
          <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center p-6 text-slate-700 italic">
            รอผู้เล่นเข้าร่วม...
          </div>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden pb-20">
      {/* Top Info Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800 px-3 py-1 rounded text-sm font-mono border border-slate-700">99YUBQ</div>
            <div className="flex items-center text-yellow-500 space-x-1">
              <Clock className="w-4 h-4" />
              <span className="font-bold">14:26</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Battle Arena */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-red-900/20 via-slate-900 to-blue-900/20 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>การประลองกำลังดำเนินการ</span>
            </div>
            <div className="text-xs bg-slate-800 px-2 py-1 rounded uppercase tracking-widest text-slate-500">Battle Table 1</div>
          </div>
          
          <div className="p-8 flex flex-col md:flex-row items-center justify-around space-y-8 md:space-y-0">
            {/* Player R */}
            <div className="text-center space-y-4">
              <div className="flex space-x-2 justify-center">
                {selectedCards.length > 0 ? (
                  selectedCards.map(id => (
                    <div key={id} className="w-16 h-24 bg-blue-600 rounded-lg border-2 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center">
                      <div className="w-full h-full bg-slate-800 rounded-sm m-1 border border-slate-700 flex items-center justify-center">
                        <span className="text-blue-400 font-bold">?</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-16 h-24 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-700 italic text-xs">ว่าง</div>
                )}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-lg">คุณ (R)</div>
                <div className="bg-blue-900/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full inline-block border border-blue-800/50">มนุษย์</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-5xl font-black italic text-slate-800 select-none">VS</div>
              {!battleConfirmed && selectedCards.length > 0 && (
                <button 
                  onClick={() => setBattleConfirmed(true)}
                  className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-black font-black px-6 py-2 rounded-full text-sm uppercase tracking-tighter transition-all"
                >
                  ยืนยันการวางไพ่
                </button>
              )}
            </div>

            {/* Enemy E */}
            <div className="text-center space-y-4">
              <div className="flex space-x-2 justify-center">
                {[1,2].map(i => (
                   <div key={i} className="w-16 h-24 bg-red-900 rounded-lg border-2 border-red-700 shadow-[0_0_15px_rgba(185,28,28,0.4)] flex items-center justify-center">
                    <div className="w-full h-full bg-slate-800 rounded-sm m-1 border border-slate-700 flex items-center justify-center italic text-red-500 text-xs">Hidden</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-lg">Alice (E)</div>
                <div className="bg-red-900/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full inline-block border border-red-800/50">สงสัยว่าเป็นซอมบี้</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 p-3 text-center border-t border-slate-800/50">
             <p className="text-xs text-slate-500 italic flex items-center justify-center">
               <Info className="w-3 h-3 mr-1" /> วางไพ่ดอกเดียวกันกับที่ได้รับ (สูงสุด 3 ใบ)
             </p>
          </div>
        </div>

        {/* User Hand */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xl font-bold flex items-center">
              ไพ่ของคุณ <span className="ml-2 text-slate-500 font-normal">({hand.length})</span>
            </h2>
            <div className="text-xs text-slate-500">เลือกแล้ว {selectedCards.length} / 3</div>
          </div>

          <div className="space-y-8">
            {/* Number Cards */}
            <div>
              <div className="text-xs uppercase text-slate-500 tracking-widest mb-4">ไพ่ตัวเลข</div>
              <div className="flex flex-wrap gap-4">
                {hand.filter(c => c.type === 'number').map(card => (
                  <Card 
                    key={card.id}
                    {...card}
                    selected={selectedCards.includes(card.id)}
                    onClick={() => toggleCard(card.id)}
                    disabled={battleConfirmed}
                  />
                ))}
              </div>
            </div>

            {/* Special Cards */}
            <div>
              <div className="text-xs uppercase text-slate-500 tracking-widest mb-4">ไพ่พิเศษ</div>
              <div className="flex flex-wrap gap-4">
                {hand.filter(c => c.type !== 'number').map(card => (
                  <Card 
                    key={card.id}
                    {...card}
                    selected={selectedCards.includes(card.id)}
                    onClick={() => toggleCard(card.id)}
                    disabled={battleConfirmed}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer (Mobile Only) */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 p-4 flex items-center justify-between md:hidden">
        <div className="text-sm font-bold text-slate-400">
           {selectedCards.length} ใบที่เลือก
        </div>
        <button 
          disabled={selectedCards.length === 0}
          className="bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 px-6 py-2 rounded-lg font-bold flex items-center"
        >
          วางไพ่ <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="font-sans text-slate-200">
      {view === 'home' && renderHome()}
      {view === 'lobby' && renderLobby()}
      {view === 'game' && renderGame()}
    </div>
  );
}