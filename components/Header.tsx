
import React from 'react';
import { FileText, Github, HelpCircle, Moon, Sun, Languages } from 'lucide-react';
import { Language, Theme } from '../App';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ lang, setLang, theme, setTheme }) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
            <FileText className="text-white w-6 h-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              SmartPDF
            </h1>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">
              AI POWERED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-slate-700 text-indigo-300 shadow-sm' : 'text-slate-500'}`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>

          <button
            onClick={() => setLang(lang === 'en' ? 'hu' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Languages className="w-4 h-4 text-indigo-500" />
            <span className="hidden xs:inline">{lang === 'en' ? 'English' : 'Magyar'}</span>
            <span className="xs:hidden">{lang.toUpperCase()}</span>
          </button>
          
          <div className="hidden md:flex h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>

          <button className="hidden md:flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all">
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </button>

          <button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 rounded-xl font-black text-sm hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm">
            {lang === 'en' ? 'SIGN IN' : 'BELÉPÉS'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
