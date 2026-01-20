import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndPassFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Por favor, sube únicamente archivos PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('El archivo es demasiado grande (máx 10MB).');
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 transition-all duration-200 ease-in-out text-center cursor-pointer group
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 bg-white'
          }
        `}
      >
        <input
          type="file"
          accept="application/pdf"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-gray-100 group-hover:bg-indigo-100'} transition-colors`}>
            {isDragging ? (
              <UploadCloud className="w-10 h-10 text-indigo-600" />
            ) : (
              <FileText className="w-10 h-10 text-gray-500 group-hover:text-indigo-600" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Suelta el PDF aquí' : 'Arrastra y suelta tu PDF aquí'}
            </p>
            <p className="text-sm text-gray-500">
              o haz clic para seleccionar un archivo
            </p>
          </div>
          <p className="text-xs text-gray-400">
            PDF hasta 10MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-center p-3 text-red-600 bg-red-50 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};
