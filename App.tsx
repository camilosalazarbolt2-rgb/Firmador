import React, { useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { SignatureGenerator } from './components/SignatureGenerator';
import { PdfPositioner } from './components/PdfPositioner';
import { Button } from './components/Button';
import { UploadedFile, AppState, SignaturePosition } from './types';
import { signPdf } from './services/pdfService';
import { FileCheck, Download, RefreshCw, CheckCircle, Move } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    const buffer = await file.arrayBuffer();
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      content: buffer,
    });
    setAppState(AppState.SIGNATURE);
  };

  // Step 2 complete: Signature created (drawn or typed)
  const handleSignatureCreated = (dataUrl: string) => {
    setSignatureData(dataUrl);
    setAppState(AppState.POSITION);
  };

  // Step 3 complete: Position confirmed
  const handlePositionConfirmed = async (pos: SignaturePosition) => {
    if (!uploadedFile || !signatureData) return;
    
    setIsProcessing(true);
    setAppState(AppState.PREVIEW);

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // UI delay

      const signedPdfBytes = await signPdf(uploadedFile.content, signatureData, pos);
      const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error("Error signing PDF", error);
      alert("Hubo un error al firmar el PDF.");
      setAppState(AppState.SIGNATURE);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetApp = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setUploadedFile(null);
    setDownloadUrl(null);
    setSignatureData(null);
    setAppState(AppState.UPLOAD);
  };

  const goBackToSignature = () => {
    setAppState(AppState.SIGNATURE);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Firmador <span className="text-indigo-600">PDF</span>
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
          <span className={appState === AppState.UPLOAD ? 'text-indigo-600' : ''}>1. Subir</span>
          <span>→</span>
          <span className={appState === AppState.SIGNATURE ? 'text-indigo-600' : ''}>2. Crear Firma</span>
          <span>→</span>
          <span className={appState === AppState.POSITION ? 'text-indigo-600' : ''}>3. Posicionar</span>
          <span>→</span>
          <span className={appState === AppState.SUCCESS ? 'text-indigo-600' : ''}>4. Descargar</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full transition-all duration-300 ease-in-out">
        
        {/* Step 1: Upload */}
        {appState === AppState.UPLOAD && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8 text-gray-600 max-w-lg mx-auto">
               Sube tu documento PDF para comenzar el proceso de firma digital segura.
            </div>
            <Dropzone onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* Step 2: Signature Generator */}
        {appState === AppState.SIGNATURE && uploadedFile && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white p-3 rounded-lg border border-gray-200 inline-flex items-center gap-3 mx-auto max-w-2xl w-full">
               <FileCheck className="w-5 h-5 text-indigo-600" />
               <span className="text-sm font-medium truncate flex-1">{uploadedFile.name}</span>
               <button onClick={resetApp} className="text-xs text-red-500 hover:underline">Cancelar</button>
            </div>

            <SignatureGenerator 
              onSave={handleSignatureCreated} 
              onCancel={resetApp} 
            />
          </div>
        )}

        {/* Step 3: Positioner */}
        {appState === AppState.POSITION && uploadedFile && signatureData && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="text-center mb-2">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
                <Move className="w-5 h-5" /> Ubica tu firma
              </h2>
              <p className="text-sm text-gray-500">
                Arrastra la firma a la posición deseada. Usa las flechas para cambiar de página.
              </p>
            </div>
            <PdfPositioner 
              pdfBuffer={uploadedFile.content}
              signatureDataUrl={signatureData}
              onConfirm={handlePositionConfirmed}
              onCancel={goBackToSignature}
            />
          </div>
        )}

        {/* Step 4: Success/Download */}
        {appState === AppState.SUCCESS && downloadUrl && uploadedFile && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up max-w-lg mx-auto mt-8">
            <div className="bg-green-50 p-8 flex flex-col items-center justify-center text-center border-b border-green-100">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Documento Firmado!</h2>
              <p className="text-gray-600 text-sm">
                Tu documento está listo con fecha y hora incrustadas.
              </p>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href={downloadUrl} 
                  download={`Firmado_${uploadedFile.name}`}
                  className="flex-1"
                >
                  <Button className="w-full h-12 text-base shadow-lg shadow-indigo-200">
                    <Download className="w-5 h-5 mr-2" />
                    Descargar PDF
                  </Button>
                </a>
                
                <Button variant="secondary" onClick={resetApp} className="h-12">
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isProcessing && (
           <div className="flex flex-col items-center justify-center py-20 animate-pulse">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
             <p className="text-lg font-medium text-gray-600">Finalizando documento...</p>
           </div>
        )}

      </div>
      
      {/* Footer */}
      <footer className="mt-16 text-center text-gray-400 text-xs pb-6">
        <p>Procesamiento 100% local. Tus archivos no salen de tu dispositivo.</p>
      </footer>
    </div>
  );
};

export default App;