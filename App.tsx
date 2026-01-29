
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import FileCard from './components/FileCard';
import { FileItem, ConversionStatus } from './types';
import { extractPdfStructure } from './services/geminiService';
import { generateDocx } from './services/docxService';
import { AlertCircle, Play, CheckCheck, RefreshCw, Wand2, FileStack } from 'lucide-react';

export type Language = 'en' | 'hu';
export type Theme = 'light' | 'dark';

const translations = {
  en: {
    badge: "AI-DRIVEN PAGE PRECISION",
    title: "Convert PDFs to",
    titleAccent: "Smart Word Docs",
    subtitle: "Intelligent extraction that understands structure. Convert all pages or specific ranges with ease.",
    filesSelected: "Files Selected",
    ofConverted: "of {total} converted",
    clearAll: "Clear All",
    convertAll: "Convert All",
    processing: "Processing...",
    addMore: "+ Add more files",
    footer: "Empowering documents with Gemini 3.",
    features: {
      partial: { title: "Partial Extraction", desc: "Target specific sections. Type page numbers to extract exactly what you need." },
      dynamic: { title: "Dynamic Filenames", desc: "Your downloads are automatically tagged with your selected page ranges." },
      native: { title: "Native Word Output", desc: "Produces true .docx files with accessible text and headings." }
    }
  },
  hu: {
    badge: "AI-VEZÉRELT OLDALPONTOSSÁG",
    title: "PDF konvertálása",
    titleAccent: "okos Word dokumentummá",
    subtitle: "Intelligens kinyerés, amely érti a struktúrát. Konvertálja az összes oldalt vagy csak bizonyos tartományokat könnyedén.",
    filesSelected: "Kiválasztott fájlok",
    ofConverted: "{total} fájlból {count} kész",
    clearAll: "Összes törlése",
    convertAll: "Összes konvertálása",
    processing: "Feldolgozás...",
    addMore: "+ További fájlok hozzáadása",
    footer: "Dokumentumok felruházása a Gemini 3 erejével.",
    features: {
      partial: { title: "Részleges kinyerés", desc: "Célozzon meg konkrét szakaszokat. Adja meg az oldalszámokat a pontos kinyeréshez." },
      dynamic: { title: "Dinamikus fájlnevek", desc: "A letöltések automatikusan tartalmazzák a kiválasztott oldaltartományokat." },
      native: { title: "Natív Word kimenet", desc: "Valódi .docx fájlokat hoz létre hozzáférhető szöveggel és címsorokkal." }
    }
  }
};

const App: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [lang, setLang] = useState<Language>('hu');
  const [theme, setTheme] = useState<Theme>('dark');

  const t = translations[lang];

  // Synchronize theme state with document class for Tailwind dark mode to work correctly
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const addFiles = (newFiles: File[]) => {
    const items: FileItem[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      status: ConversionStatus.IDLE,
      progress: 0,
      statusMessage: lang === 'en' ? 'Ready to convert' : 'Készen áll a konvertálásra',
      pageSelection: '',
    }));
    setFiles(prev => [...prev, ...items]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updatePageSelection = (id: string, selection: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, pageSelection: selection } : f));
  };

  const downloadFile = (id: string) => {
    const item = files.find(f => f.id === id);
    if (item?.resultUrl) {
      const link = document.createElement('a');
      link.href = item.resultUrl;
      let suffix = "";
      if (item.pageSelection && item.pageSelection.trim()) {
        const sanitizedSelection = item.pageSelection.replace(/\s+/g, '').replace(/,/g, '_');
        suffix = `_p${sanitizedSelection}`;
      }
      const baseName = item.name.toLowerCase().endsWith('.pdf') ? item.name.slice(0, -4) : item.name;
      link.download = `${baseName}${suffix}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const processFile = async (id: string) => {
    const currentFile = files.find(f => f.id === id);
    if (currentFile?.status === ConversionStatus.PROCESSING) return;

    setFiles(prev => prev.map(f => f.id === id ? { 
      ...f, 
      status: ConversionStatus.PROCESSING, 
      progress: 0,
      statusMessage: lang === 'en' ? 'Reading file...' : 'Fájl olvasása...',
      resultUrl: undefined
    } : f));

    try {
      const item = files.find(f => f.id === id);
      if (!item) return;

      const structure = await extractPdfStructure(item.file, item.pageSelection, (percent, message) => {
        setFiles(prev => prev.map(f => f.id === id ? { 
          ...f, 
          progress: percent,
          statusMessage: message
        } : f));
      });
      
      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        progress: 95,
        statusMessage: lang === 'en' ? 'Generating Word document...' : 'Word dokumentum létrehozása...'
      } : f));

      const docBlob = await generateDocx(structure);
      const url = URL.createObjectURL(docBlob);

      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: ConversionStatus.COMPLETED, 
        progress: 100, 
        resultUrl: url,
        statusMessage: lang === 'en' ? 'Completed' : 'Kész'
      } : f));
    } catch (error: any) {
      console.error(error);
      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: ConversionStatus.FAILED, 
        errorMessage: error.message || 'AI processing failed',
        statusMessage: lang === 'en' ? 'Error' : 'Hiba'
      } : f));
    }
  };

  const convertAll = async () => {
    setIsProcessingAll(true);
    const idleFiles = files.filter(f => f.status !== ConversionStatus.PROCESSING && f.status !== ConversionStatus.COMPLETED);
    for (const file of idleFiles) {
      await processFile(file.id);
    }
    setIsProcessingAll(false);
  };

  const completedCount = files.filter(f => f.status === ConversionStatus.COMPLETED).length;
  const fileNamesString = files.map(f => f.name).join(', ');

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      <Header 
        lang={lang} 
        setLang={setLang} 
        theme={theme} 
        setTheme={setTheme} 
      />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold mb-6">
            <Wand2 className="w-4 h-4" />
            <span>{t.badge}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
            {t.title} <span className="text-indigo-600 dark:text-indigo-400">{t.titleAccent}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {files.length === 0 ? (
          <FileUploader onFilesAdded={addFiles} lang={lang} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl flex-shrink-0">
                  <FileStack className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {files.length} {files.length === 1 ? (lang === 'en' ? 'File' : 'Fájl') : (lang === 'en' ? 'Files' : 'Fájl')} {t.filesSelected}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate mb-1" title={fileNamesString}>
                    {fileNamesString}
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                    {t.ofConverted.replace('{total}', files.length.toString()).replace('{count}', completedCount.toString())}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setFiles([])}
                  className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  disabled={isProcessingAll}
                >
                  {t.clearAll}
                </button>
                <button
                  onClick={convertAll}
                  disabled={isProcessingAll || files.every(f => f.status === ConversionStatus.COMPLETED)}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  {isProcessingAll ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      {t.convertAll}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {files.map(file => (
                <FileCard
                  key={file.id}
                  item={file}
                  onRemove={removeFile}
                  onDownload={downloadFile}
                  onUpdateSelection={updatePageSelection}
                  onProcess={processFile}
                  lang={lang}
                />
              ))}
            </div>

            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
              <div 
                className="cursor-pointer group relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all"
                onClick={() => document.getElementById('add-more-input')?.click()}
              >
                <input
                  id="add-more-input"
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) addFiles(Array.from(e.target.files));
                  }}
                />
                <span className="text-slate-500 dark:text-slate-400 font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t.addMore}
                </span>
              </div>
            </div>
          </div>
        )}

        <section className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{t.features.partial.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t.features.partial.desc}
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{t.features.dynamic.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t.features.dynamic.desc}
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <CheckCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{t.features.native.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t.features.native.desc}
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
            &copy; 2024 SmartPDF AI Converter. {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
