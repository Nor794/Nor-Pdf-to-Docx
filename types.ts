
export enum ConversionStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: ConversionStatus;
  progress: number;
  errorMessage?: string;
  resultUrl?: string;
  statusMessage?: string;
  pageSelection?: string; // e.g., "1-5, 10, 12-15"
}

export interface StructuredContent {
  sections: Array<{
    type: 'heading' | 'paragraph' | 'list';
    level?: number;
    text: string;
    items?: string[];
    fontFamily?: string;
    fontSize?: number;
  }>;
}

export type ProgressCallback = (percent: number, message: string) => void;
