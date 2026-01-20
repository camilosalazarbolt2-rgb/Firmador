import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SignaturePosition } from '../types';

export const signPdf = async (
  pdfBytes: ArrayBuffer,
  signaturePngBase64: string,
  position: SignaturePosition,
  includeDate: boolean = true
): Promise<Uint8Array> => {
  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Embed the font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed the signature image
  const signatureImage = await pdfDoc.embedPng(signaturePngBase64);
  
  // Use the dimensions from the positioning step, or default to scaled image
  // We want to maintain aspect ratio of the embedded image but fit into the width user selected or a default
  // Ideally, we trust the relative sizing passed from the UI
  
  // Get pages
  const pages = pdfDoc.getPages();
  const pageIndex = Math.min(position.pageIndex, pages.length - 1);
  const page = pages[pageIndex];
  // const { width: pageWidth, height: pageHeight } = page.getSize();

  // Draw signature
  // Note: pdf-lib uses a coordinate system where (0,0) is bottom-left.
  // The UI usually gives us top-left coordinates. The Positioner component should handle this flip,
  // but if it passes Top-Left Y, we need to flip it here: y = pageHeight - y_ui - height
  // However, let's assume the Positioner passes us the correct PDF coordinates (Bottom-Left origin)
  
  page.drawImage(signatureImage, {
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
  });

  if (includeDate) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const text = `Firmado: ${dateStr} ${timeStr}`;
    const textSize = 8;
    // Calculate text width to center it under signature
    const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);
    const textX = position.x + (position.width / 2) - (textWidth / 2);
    
    // Position text below signature
    page.drawText(text, {
      x: textX,
      y: position.y - 10, 
      size: textSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytesSaved = await pdfDoc.save();
  return pdfBytesSaved;
};