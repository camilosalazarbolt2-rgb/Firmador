import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Type, Check, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { SignatureCanvas } from './SignatureCanvas';

interface SignatureGeneratorProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const FONTS = [
  { name: 'Great Vibes', class: 'font-signature-1', label: 'Elegante' },
  { name: 'Dancing Script', class: 'font-signature-2', label: 'Casual' },
  { name: 'Sacramento', class: 'font-signature-3', label: 'Clásico' },
  { name: 'Allura', class: 'font-signature-4', label: 'Moderno' },
];

export const SignatureGenerator: React.FC<SignatureGeneratorProps> = ({ onSave, onCancel }) => {
  const [mode, setMode] = useState<'draw' | 'type'>('type');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);

  // Canvas for converting text to image
  const textCanvasRef = useRef<HTMLCanvasElement>(null);

  const generateTextSignature = () => {
    const canvas = textCanvasRef.current;
    if (!canvas || !typedName.trim()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Settings
    const fontSize = 60;
    ctx.font = `${fontSize}px "${selectedFont.name}"`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    // Export
    // We want to crop the image to the content so it doesn't take up huge space in PDF
    // For simplicity in this demo, we export the whole box but PDF placement will handle it
    return canvas.toDataURL('image/png');
  };

  const handleTypeSave = () => {
    const dataUrl = generateTextSignature();
    if (dataUrl) onSave(dataUrl);
  };

  // Re-draw on hidden canvas whenever input changes to preview
  useEffect(() => {
    if (mode === 'type') {
      generateTextSignature();
    }
  }, [typedName, selectedFont, mode]);

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${
            mode === 'type' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setMode('type')}
        >
          <Type className="w-4 h-4 mr-2" />
          Escribir Nombre
        </button>
        <button
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${
            mode === 'draw' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setMode('draw')}
        >
          <PenTool className="w-4 h-4 mr-2" />
          Dibujar Firma
        </button>
      </div>

      <div className="p-6">
        {mode === 'type' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tu Nombre</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FONTS.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font)}
                  className={`p-3 border rounded-lg text-center transition-all ${
                    selectedFont.name === font.name
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-2xl ${font.class}`}>Firma</span>
                  <div className="text-xs text-gray-400 mt-1">{font.label}</div>
                </button>
              ))}
            </div>

            {/* Hidden canvas for generation */}
            <canvas 
              ref={textCanvasRef} 
              width={600} 
              height={200} 
              className="hidden" 
            />
            
            {/* Live Preview of the signature image */}
            <div className="h-32 bg-white border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
               {typedName ? (
                 <p className={`text-4xl sm:text-5xl ${selectedFont.class} text-gray-800 px-4`}>
                   {typedName}
                 </p>
               ) : (
                 <span className="text-gray-400 text-sm">Previsualización</span>
               )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
              <Button 
                variant="primary" 
                onClick={handleTypeSave} 
                disabled={!typedName.trim()} 
                className="flex-1"
              >
                Usar esta firma
              </Button>
            </div>
          </div>
        ) : (
          <SignatureCanvas onSave={onSave} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
};