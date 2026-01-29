
import React from 'react';
import { FileItem, ConversionStatus } from '../types';
import { FileText, Download, Loader2, CheckCircle2, AlertCircle, Trash2, Hash, RotateCcw, Play } from 'lucide-react';
import { Language } from '../App';

interface FileCardProps {
  item: FileItem;
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onUpdateSelection: (id: string, selection: string) => void;
  onProcess: (id: string) => void;
  lang: Language;
}

const FileCard: React.FC<FileCardProps> = ({ item, onRemove, onDownload, onUpdateSelection, onProcess, lang }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isProcessing = item.status === ConversionStatus.PROCESSING || item.status === ConversionStatus.UPLOADING;
  const isCompleted = item.status === ConversionStatus.COMPLETED;
  const isFailed = item.status === ConversionStatus.FAILED;
  const isIdle = item.status === ConversionStatus.IDLE;

  const canEditSelection = !isProcessing;

  const labelPages = lang === 'en' ? 'Pages to convert:' : 'Oldalak konvertálása:';
  const labelSuccess = lang === 'en' ? 'Conversion successful' : 'Sikeres konvertálás';
  const labelFailed = lang === 'en' ? 'Conversion failed' : 'Sikertelen konvertálás';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md group">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl flex-shrink-0 ${
          isFailed ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
          isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
          'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          <FileText className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate pr-4">
              {item.name}
            </h4>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {formatSize(item.size)}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {isIdle && (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{item.statusMessage}</span>
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-semibold">{item.statusMessage}</span>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">{labelSuccess}</span>
              </div>
            )}

            {isFailed && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold truncate max-w-[200px]">
                  {item.errorMessage || labelFailed}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted && (
            <button
              onClick={() => onDownload(item.id)}
              className="p-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100 dark:shadow-none"
            >
              <Download className="w-5 h-5" />
            </button>
          )}

          {(isIdle || isFailed) && (
             <button
              onClick={() => onProcess(item.id)}
              className="p-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              <Play className="w-5 h-5 fill-current" />
            </button>
          )}

          {isCompleted && (
             <button
              onClick={() => onProcess(item.id)}
              className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={() => onRemove(item.id)}
            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
        isCompleted ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800' : 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm whitespace-nowrap min-w-[130px]">
          <Hash className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>{labelPages}</span>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="e.g. 1-5, 8, 11-15"
            value={item.pageSelection || ''}
            onChange={(e) => onUpdateSelection(item.id, e.target.value)}
            disabled={!canEditSelection}
            className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-950 dark:text-slate-100 px-3 py-1.5 rounded-lg placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 focus:border-indigo-500 disabled:bg-slate-50/50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 disabled:border-slate-100 transition-all"
          />
        </div>
        {canEditSelection && item.pageSelection && (
          <button 
            onClick={() => onUpdateSelection(item.id, '')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-black hover:underline px-2"
          >
            {lang === 'en' ? 'CLEAR' : 'TÖRLÉS'}
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden -mt-1 shadow-inner">
          <div 
            className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default FileCard;
