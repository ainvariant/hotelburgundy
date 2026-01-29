import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  gameActive: boolean;
  resetGame?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, toggleTheme, gameActive, resetGame }) => {
  return (
    <div className={`min-h-screen transition-colors duration-700 font-serif selection:bg-burgundy-200 selection:text-burgundy-900
      ${isDarkMode ? 'bg-stone-950 text-stone-300' : 'bg-antique-paper text-stone-900'}
    `}>
      <header className={`p-6 border-b-4 flex justify-between items-center sticky top-0 z-50 shadow-md backdrop-blur-sm
        ${isDarkMode ? 'border-burgundy-900 bg-stone-950/90' : 'border-burgundy-900 bg-antique-white/90'}
      `}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center border-2 rounded-full font-bold text-2xl
             ${isDarkMode ? 'border-burgundy-600 text-burgundy-600' : 'border-burgundy-900 text-burgundy-900'}
          `}>H</div>
          <div>
            <h1 className={`text-3xl font-bold tracking-widest uppercase
               ${isDarkMode ? 'text-burgundy-600' : 'text-burgundy-900'}
            `}>
              호텔 버건디
            </h1>
            <p className="text-xs tracking-[0.2em] opacity-70">EST. 1924</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {gameActive && (
             <button 
              onClick={resetGame}
              className="text-xs uppercase tracking-widest hover:underline text-red-500 mr-4"
             >
               투숙 포기
             </button>
          )}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all border
              ${isDarkMode ? 'bg-stone-900 border-stone-700 hover:text-yellow-400' : 'bg-white border-burgundy-200 hover:text-burgundy-700'}
            `}
          >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        <div className={`border-l-2 border-r-2 min-h-[80vh] p-4 relative
           ${isDarkMode ? 'border-stone-800' : 'border-stone-300'}
        `}>
          {/* Ornamental corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-burgundy-800"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-burgundy-800"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-burgundy-800"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-burgundy-800"></div>
          
          {children}
        </div>
      </main>
      
      <footer className="text-center p-8 opacity-50 text-sm">
        <p>&copy; 1924 Hotel Burgundy Management. 모든 손님은 언젠가 체크아웃을 해야 합니다.</p>
      </footer>
    </div>
  );
};

export default Layout;