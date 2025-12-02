import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

export const convertPptxToPdf = async (file: File): Promise<string> => {
  // 1. Basic validation
  if (file.size === 0) {
    throw new Error("The uploaded file is empty.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const result = e.target?.result as ArrayBuffer;
        if (!result) {
          throw new Error("Failed to read file.");
        }

        const uint8Array = new Uint8Array(result);

        // 2. Validate Magic Bytes (File Signature)
        // ZIP files (PPTX, DOCX) start with PK.. (0x50, 0x4B)
        if (uint8Array.length < 4) {
             throw new Error("File is too small to be a valid presentation.");
        }

        if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
            // Check for OLE signature (D0 CF 11 E0) - Legacy PPT
            if (uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF && uint8Array[2] === 0x11 && uint8Array[3] === 0xE0) {
                 throw new Error("This appears to be a legacy PowerPoint (.ppt) file. Please save it as a modern PowerPoint (.pptx) or PDF before uploading.");
            }
             throw new Error("Invalid file format. Please ensure you are uploading a valid .pptx file, not a renamed .ppt.");
        }

        // 3. Load ZIP
        const zip = new JSZip();
        let content;
        try {
            content = await zip.loadAsync(uint8Array);
        } catch (zipErr) {
             throw new Error("Corrupted or invalid PPTX file structure.");
        }

        // 4. Find Slides
        const slideFiles: { name: string; content: string }[] = [];
        // PPTX stores slides in ppt/slides/slideX.xml
        const slideRegex = /^ppt\/slides\/slide(\d+)\.xml$/;

        for (const fileName in content.files) {
          const match = fileName.match(slideRegex);
          if (match) {
            const slideXml = await content.files[fileName].async('string');
            slideFiles.push({ name: fileName, content: slideXml });
          }
        }

        if (slideFiles.length === 0) {
          throw new Error("No slides found in this PPTX. It might be encrypted or empty.");
        }

        // Sort numerically
        slideFiles.sort((a, b) => {
          const matchA = a.name.match(slideRegex);
          const matchB = b.name.match(slideRegex);
          const numA = matchA ? parseInt(matchA[1]) : 0;
          const numB = matchB ? parseInt(matchB[1]) : 0;
          return numA - numB;
        });

        // 5. Initialize PDF
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const parser = new DOMParser();

        // 6. Extract and Write Text
        slideFiles.forEach((slide, index) => {
           if (index > 0) doc.addPage();
           
           doc.setFontSize(16);
           doc.setTextColor(0,0,0);
           doc.text(`Slide ${index + 1} (Extracted Text)`, 10, 15);

           // Parse XML
           const xmlDoc = parser.parseFromString(slide.content, "text/xml");
           
           // PPTX text hierarchy: <p:sp> (shape) -> <a:p> (paragraph) -> <a:r> (run) -> <a:t> (text)
           // We target <a:p> to preserve paragraph breaks, then aggregate <a:t> within.
           const paragraphs = xmlDoc.getElementsByTagName("a:p");
           let extractedText: string[] = [];
           
           for (let i = 0; i < paragraphs.length; i++) {
               const p = paragraphs[i];
               const textNodes = p.getElementsByTagName("a:t");
               let pText = "";
               for (let j = 0; j < textNodes.length; j++) {
                   pText += textNodes[j].textContent || "";
               }
               if (pText.trim()) extractedText.push(pText);
           }
           
           // Fallback if structure is unexpected (try flat extraction)
           if (extractedText.length === 0) {
               const textNodes = xmlDoc.getElementsByTagName("a:t");
               let tempText = "";
               for(let i=0; i<textNodes.length; i++) {
                   tempText += textNodes[i].textContent || " ";
               }
               if (tempText.trim()) extractedText.push(tempText);
           }

           doc.setFontSize(12);
           let yPos = 30;
           const pageWidth = doc.internal.pageSize.getWidth();
           const margin = 10;
           const maxWidth = pageWidth - (margin * 2);

           if (extractedText.length > 0) {
             extractedText.forEach(line => {
                const splitLines = doc.splitTextToSize(line, maxWidth);
                 // Check page bounds
                 if (yPos + (splitLines.length * 6) > doc.internal.pageSize.getHeight() - 10) {
                     doc.addPage();
                     yPos = 20;
                 }
                 doc.text(splitLines, margin, yPos);
                 yPos += (splitLines.length * 6) + 2;
             });
           } else {
              doc.setFontSize(10);
              doc.setTextColor(150,150,150);
              doc.text("[No textual content detected on this slide]", 10, 30);
           }
           
           doc.setFontSize(8);
           doc.setTextColor(150, 150, 150);
           doc.text("Generated from PPTX by SmartSlide Reviewer", 10, doc.internal.pageSize.getHeight() - 5);
        });
        
        const dataUri = doc.output('datauristring');
        resolve(dataUri.split(',')[1]);

      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file. Please try again."));
    reader.readAsArrayBuffer(file);
  });
};