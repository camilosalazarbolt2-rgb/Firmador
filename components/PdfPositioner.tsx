import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { SignaturePosition } from '../types';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

interface PdfPositionerProps {
  pdfBuffer: ArrayBuffer;
  signatureDataUrl: string;
  onConfirm: (position: SignaturePosition) => void;
  onCancel: () => void;
}

export const PdfPositioner: React.FC<PdfPositionerProps> = ({
  pdfBuffer,
  signatureDataUrl,
  onConfirm,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 100 }); // CSS relative position
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 }); // PDF Points

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };
    loadPdf();
  }, [pdfBuffer]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNum);
      
      // Calculate scale to fit container width
      const containerWidth = Math.min(containerRef.current!.clientWidth - 32, 800);
      const viewportUnscaled = page.getViewport({ scale: 1 });
      const newScale = containerWidth / viewportUnscaled.width;
      
      setScale(newScale);
      setPageDimensions({ width: viewportUnscaled.width, height: viewportUnscaled.height });

      const viewport = page.getViewport({ scale: newScale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;
    };

    renderPage();
  }, [pdfDoc, pageNum]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // Bounds check roughly
    if (canvasRef.current) {
      const maxX = canvasRef.current.width - 150; // approx signature width
      const maxY = canvasRef.current.height - 50;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert visual position to PDF Coordinates (Points)
  const handleConfirm = () => {
    // Current signature visual dimensions (approximate based on CSS width usually)
    // The image displayed has width="150" in style below
    const visualSigWidth = 150; 
    const aspectRatio = 300 / 100; // Aspect ratio of signature generation usually 3:1
    const visualSigHeight = visualSigWidth / aspectRatio;

    // Convert CSS px coordinates to PDF point coordinates
    // PDF coordinates usually originate bottom-left, but pdf-lib documentation says:
    // "The coordinate system ... starts at the bottom left"
    // However, when we draw visually on HTML Canvas, (0,0) is top left.
    // We need to map:
    // x_pdf = x_html / scale
    // y_pdf = (canvas_height - y_html - sig_height_html) / scale
    
    if (!canvasRef.current) return;

    const pdfX = position.x / scale;
    // Invert Y axis for PDF standard (0,0 at bottom left)
    const pdfY = (canvasRef.current.height - position.y - visualSigHeight) / scale;

    const signaturePos: SignaturePosition = {
      pageIndex: pageNum - 1, // 0-based index for pdf-lib
      x: pdfX,
      y: pdfY,
      width: visualSigWidth / scale,
      height: visualSigHeight / scale
    };

    onConfirm(signaturePos);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="w-full flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
           <span className="font-medium text-gray-700">Página {pageNum} de {numPages}</span>
           <div className="flex gap-1">
             <button 
               onClick={() => setPageNum(p => Math.max(1, p - 1))}
               disabled={pageNum <= 1}
               className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
             >
               <ChevronLeft className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
               disabled={pageNum >= numPages}
               className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
             >
               <ChevronRight className="w-5 h-5" />
             </button>
           </div>
        </div>
        <div className="text-sm text-gray-500 hidden sm:block">
          Arrastra la firma para colocarla
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel} className="text-sm px-3">Atrás</Button>
            <Button onClick={handleConfirm} className="text-sm px-3">
              <Check className="w-4 h-4 mr-2" />
              Confirmar Posición
            </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative bg-gray-500/10 p-4 rounded-xl overflow-hidden shadow-inner w-full flex justify-center min-h-[400px]"
      >
        {loading && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Cargando PDF...</div>}
        
        <div className="relative shadow-xl inline-block bg-white">
          <canvas ref={canvasRef} className="block max-w-full" />
          
          {/* Draggable Signature Overlay */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            style={{
              position: 'absolute',
              left: position.x,
              top: position.y,
              width: '150px', // Visual width reference
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: 10,
              touchAction: 'none' // Prevent scrolling while dragging on touch
            }}
            className="group"
          >
            <div className={`border-2 border-indigo-500 rounded p-1 bg-white/20 hover:bg-white/40 backdrop-blur-[1px] ${isDragging ? 'scale-105 shadow-lg' : ''} transition-all`}>
              <img src={signatureDataUrl} alt="Firma" className="w-full h-auto pointer-events-none" />
              <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Arrastrame
              </div>
            </div>
            {/* Date placeholder visual aid */}
            <div className="text-[8px] text-gray-500 text-center mt-1 select-none bg-white/50 px-1 rounded">
               Firmado: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};