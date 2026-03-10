import { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface UploadZoneProps {
  label: string;
  accept?: string;
  onFileLoaded: (text: string, filename: string) => void;
  loaded?: boolean;
  loadedFilename?: string;
  error?: string | null;
}

export function UploadZone({
  label,
  accept = '.csv',
  onFileLoaded,
  loaded = false,
  loadedFilename,
  error,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoaded(text, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    readFile(files[0]);
  }

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer',
        {
          'border-blue-400 bg-blue-50': dragging,
          'border-green-400 bg-green-50': loaded && !error,
          'border-red-300 bg-red-50': !!error,
          'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white':
            !dragging && !loaded && !error,
        }
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {loaded && !error ? (
        <>
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-sm font-medium text-green-700">{loadedFilename}</p>
          <p className="text-xs text-green-600 mt-1">Geladen — klik om te vervangen</p>
        </>
      ) : error ? (
        <>
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-xs text-red-600">{error}</p>
          <p className="text-xs text-slate-500 mt-1">Klik om opnieuw te proberen</p>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500 mt-1">Sleep bestand hierheen of klik</p>
        </>
      )}
    </div>
  );
}
