
import React, { useRef, useState } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { Language } from '../App';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
  lang: Language;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded, lang }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type === 'application/pdf');
    if (files.length > 0) onFilesAdded(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((f: File) => f.type === 'application/pdf');
      if (files.length > 0) onFilesAdded(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
        isDragging 
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 scale-[1.01]' 
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50/50'
      }`}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf"
        multiple
      />

      <div className="flex flex-col items-center justify-center">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
          isDragging ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
        }`}>
          <Upload className="w-10 h-10" />
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {lang === 'en' ? 'Drop your PDFs here' : 'Húzza ide a PDF-eket'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-lg leading-relaxed">
          {lang === 'en' ? 'Select one or multiple files to intelligently convert to Word documents.' : 'Válasszon ki egy vagy több fájlt az intelligens Word-dokumentummá alakításhoz.'}
        </p>

        <button
          onClick={() => inputRef.current?.click()}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-2 group"
        >
          <FileUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          {lang === 'en' ? 'BROWSE FILES' : 'FÁJLOK TALLÓZÁSA'}
        </button>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            {lang === 'en' ? 'Up to 20MB per file' : 'Max 20MB fájlonként'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            {lang === 'en' ? 'Batch processing' : 'Batch feldolgozás'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
