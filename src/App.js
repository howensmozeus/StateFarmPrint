import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, FileText, Check, X } from 'lucide-react';
import * as _ from 'lodash';
// Import jsPDF for PDF generation
import { jsPDF } from 'jspdf';
// Import PDF.js for PDF processing
import * as pdfjsLib from 'pdfjs-dist/webpack';
// Import custom CSS
import './ImageToPdfConverter.css';

export default function ImageToPdfConverter() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [fileCounter, setFileCounter] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPdf, setDraggedPdf] = useState(false);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoDeleteSuccess, setAutoDeleteSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const pdfRef = useRef(null);

  // Configuration for strip layout
  const currentConfig = {
    name: 'Strip Layout (73mm x 10mm)',
    maxImages: 2,
    pdfWidth: 210,
    pdfHeight: 148,
    imageWidth: 73,
    imageHeight: 10,
    bottomPadding: 33, // 33mm from bottom
    sideMargin: 16, // 16mm from sides
    layout: 'strips'
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    const allFiles = [...imageFiles, ...pdfFiles];

    // Handle all files (images and PDFs)
    if (allFiles.length > 0) {
      // Show selection mode if more than maxImages files are selected
      if (allFiles.length > currentConfig.maxImages) {
        setAvailableImages(allFiles);
        setShowSelectionMode(true);
      } else {
        // Add files
        const newFiles = [...selectedFiles, ...allFiles].slice(0, currentConfig.maxImages);
        setSelectedFiles(newFiles);
      }
    }

    // Reset file input
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    const allFiles = [...imageFiles, ...pdfFiles];

    // Handle all files (images and PDFs)
    if (allFiles.length > 0) {
      // Show selection mode if more than maxImages files are dropped
      if (allFiles.length > currentConfig.maxImages) {
        setAvailableImages(allFiles);
        setShowSelectionMode(true);
      } else {
        // Add files
        const newFiles = [...selectedFiles, ...allFiles].slice(0, currentConfig.maxImages);
        setSelectedFiles(newFiles);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };


  // Initialize file counter from localStorage
  useEffect(() => {
    const savedCounter = localStorage.getItem('pdfFileCounter');
    if (savedCounter) {
      setFileCounter(parseInt(savedCounter));
    }
  }, []);

  // Make PDF element draggable
  useEffect(() => {
    if (pdfRef.current) {
      pdfRef.current.addEventListener('dragstart', handlePdfDragStart);
      return () => {
        if (pdfRef.current) {
          pdfRef.current.removeEventListener('dragstart', handlePdfDragStart);
        }
      };
    }
  }, [pdfBlob]);

  const handlePdfDragStart = (e) => {
    if (pdfBlob) {
      // This will enable dragging the PDF to other applications
      e.dataTransfer.setData('application/pdf', pdfBlob);
      e.dataTransfer.setData('text/plain', pdfFileName);
      setDraggedPdf(true);
      
      // Create a drag image
      const dragImage = document.createElement('div');
      dragImage.textContent = pdfFileName;
      dragImage.style.background = '#f8f9fa';
      dragImage.style.padding = '10px';
      dragImage.style.borderRadius = '4px';
      dragImage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      document.body.appendChild(dragImage);
      
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Remove the drag image after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  const selectNineImages = () => {
    // Show a file selection dialog that allows selecting exactly 9 files
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const toggleImageSelection = (image) => {
    // Check if image is already selected
    const isSelected = selectedFiles.some(file => file.name === image.name);
    
    if (isSelected) {
      // Remove from selection
      setSelectedFiles(selectedFiles.filter(file => file.name !== image.name));
    } else {
      // Add to selection if less than maxImageCount images are selected
      if (selectedFiles.length < currentConfig.maxImages) {
        setSelectedFiles([...selectedFiles, image]);
      }
    }
  };

  const confirmSelection = () => {
    setShowSelectionMode(false);
    // Selection is already handled by toggleImageSelection
  };

  const cancelSelection = () => {
    setShowSelectionMode(false);
    setAvailableImages([]);
  };

  const isImageSelected = (image) => {
    return selectedFiles.some(file => file.name === image.name);
  };

  // Function to convert PDF to image
  const convertPdfToImage = async (pdfFile) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = async function() {
        try {
          const typedArray = new Uint8Array(this.result);

          // Load PDF document
          const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
          });

          const pdf = await loadingTask.promise;

          // Get first page
          const page = await pdf.getPage(1);

          // Create canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const viewport = page.getViewport({ scale: 2.0 });

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          // Render page to canvas
          await page.render(renderContext).promise;

          // Convert to image data URL
          const imageDataUrl = canvas.toDataURL('image/png');
          resolve(imageDataUrl);

        } catch (error) {
          console.error('PDF processing error:', error);
          reject(error);
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Failed to read PDF file'));
      };

      fileReader.readAsArrayBuffer(pdfFile);
    });
  };

  // Function to clear all image selections
  const clearSelectedImages = () => {
    // Release object URLs to avoid memory leaks
    selectedFiles.forEach(file => {
      if (file._objectUrl) {
        URL.revokeObjectURL(file._objectUrl);
      }
    });

    // Clear the selectedFiles state
    setSelectedFiles([]);

    // Show auto-delete success message
    setAutoDeleteSuccess(true);

    // Hide the success message after 3 seconds
    setTimeout(() => {
      setAutoDeleteSuccess(false);
    }, 3000);
  };


  // Layout function for strip layout (73mm x 10mm strips)
  const generateStripLayout = async (pdf, imageDataUrls, config, pdfWidth, pdfHeight) => {
    const stripWidth = config.imageWidth; // 73mm
    const stripHeight = config.imageHeight; // 10mm
    const topPadding = config.bottomPadding; // 33mm from top (was bottom)
    const sideMargin = config.sideMargin; // 16mm from sides

    // Calculate Y position (33mm from top)
    const yPos = topPadding;

    // Position for left strip (16mm from left side)
    const leftXPos = sideMargin;

    // Position for right strip (16mm from right side)
    const rightXPos = pdfWidth - sideMargin - stripWidth;

    for (let i = 0; i < Math.min(imageDataUrls.length, config.maxImages); i++) {
      // Create a temporary image to get dimensions
      const tempImg = new Image();
      await new Promise((resolve) => {
        tempImg.onload = resolve;
        tempImg.src = imageDataUrls[i];
      });

      // Process image - stretch to fit 73mm x 10mm dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = stripWidth * 4; // Higher resolution for better quality
      canvas.height = stripHeight * 4;

      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotate 180 degrees and draw the image stretched to fit the strip dimensions
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI); // 180 degrees
      ctx.drawImage(tempImg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();

      const processedImageData = canvas.toDataURL('image/png', 1.0);

      // Determine X position based on image index
      const xPos = i === 0 ? leftXPos : rightXPos;

      // Add image to PDF
      pdf.addImage(
        processedImageData,
        'PNG',
        xPos,
        yPos,
        stripWidth,
        stripHeight
      );
    }
  };

  // Generate PDF with specific dimensions and landscape orientation
  const generatePDF = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setIsGenerating(true);

    try {
      // Create a PDF file name with sequential numbering
      const formattedCounter = String(fileCounter).padStart(3, '0');
      const fileName = `finaloutput.${formattedCounter}`;
      setPdfFileName(`${fileName}.pdf`);

      // Store incremented counter in localStorage to persist between sessions
      const nextCounter = fileCounter + 1;
      localStorage.setItem('pdfFileCounter', nextCounter);
      setFileCounter(nextCounter);

      // Process all files (convert PDFs to images, load images as data URLs)
      const imagePromises = selectedFiles.map(async (file) => {
        if (file.type === 'application/pdf') {
          // Convert PDF to image
          try {
            return await convertPdfToImage(file);
          } catch (error) {
            console.error('PDF conversion failed:', error);
            // Create a fallback image for failed PDF conversion
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 400;
            canvas.height = 300;
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PDF Conversion Failed', canvas.width / 2, canvas.height / 2);
            return canvas.toDataURL('image/png');
          }
        } else {
          // Load image file as data URL
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }
      });

      const imageDataUrls = await Promise.all(imagePromises);

      // Create PDF with current config dimensions
      const pdfWidth = currentConfig.pdfWidth; // mm
      const pdfHeight = currentConfig.pdfHeight; // mm

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      // Generate PDF using strip layout with processed image data
      await generateStripLayout(pdf, imageDataUrls, currentConfig, pdfWidth, pdfHeight)
      
      // Convert PDF to blob for download and drag & drop
      const pdfBlob = pdf.output('blob');
      setPdfBlob(pdfBlob);
      
      // Auto-download the PDF - first save the blob reference, then download it
      const currentPdfBlob = pdfBlob;
      setTimeout(() => {
        if (currentPdfBlob) {
          const url = URL.createObjectURL(currentPdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = pdfFileName;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        }
      }, 500);
      
      // Auto-delete images after PDF generation is complete
      clearSelectedImages();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="converter-container">
      <img 
        src={process.env.PUBLIC_URL + "/mozeus-logo.webp"}
        alt="Logo" 
        className="logo"
      />
      <h1 className="page-title">StateFarm PDF Convertor</h1>

      
      {/* Selection Mode */}
      {showSelectionMode ? (
        <div>
          <div className="selection-header">
            <h2 className="selection-title">
              Select exactly {currentConfig.maxImages} files ({selectedFiles.length}/{currentConfig.maxImages})
            </h2>
            <div className="btn-container">
              <button
                onClick={confirmSelection}
                disabled={selectedFiles.length !== currentConfig.maxImages}
                className={`btn ${selectedFiles.length === currentConfig.maxImages ? 'btn-success' : 'btn-primary'}`}
                style={{opacity: selectedFiles.length !== currentConfig.maxImages ? 0.5 : 1}}
              >
                <Check size={16} style={{marginRight: '4px'}} /> Confirm Selection
              </button>
              <button 
                onClick={cancelSelection}
                className="btn btn-danger"
              >
                <X size={16} style={{marginRight: '4px'}} /> Cancel
              </button>
            </div>
          </div>
          
          <div className="images-grid">
            {availableImages.map((file, index) => (
              <div
                key={index}
                className={`image-card ${isImageSelected(file) ? 'selected' : ''}`}
                onClick={() => toggleImageSelection(file)}
              >
                {file.type === 'application/pdf' ? (
                  <div className="pdf-preview">
                    <FileText size={64} className="pdf-icon" />
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Available ${index}`}
                    className="image-preview"
                  />
                )}
                {isImageSelected(file) && (
                  <div className="selection-mark">
                    <Check size={16} />
                  </div>
                )}
                <div className="image-name">{file.name}</div>
              </div>
            ))}
          </div>
          
          {selectedFiles.length > currentConfig.maxImages && (
            <p className="alert-danger">
              Please select exactly {currentConfig.maxImages} files. You've selected {selectedFiles.length} files.
            </p>
          )}

          {selectedFiles.length < currentConfig.maxImages && (
            <p className="alert-warning">
              Please select {currentConfig.maxImages - selectedFiles.length} more files.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* File Selection Options */}
          <div className="file-selection">
            <button
              onClick={selectNineImages}
              className="btn btn-primary"
              style={{display: 'flex', alignItems: 'center', padding: '12px 24px', fontSize: '18px'}}
            >
              Select 2 Files
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,application/pdf"
              style={{display: 'none'}}
            />
          </div>
          
          {/* Auto-Delete Success Message */}
          {autoDeleteSuccess && (
            <div className="success-message">
              <Check size={16} className="success-icon" />
              <span>Files automatically cleared after PDF creation</span>
            </div>
          )}
          
          {/* File Drop Zone */}
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current.click()}
          >
            <Upload className="drop-zone-icon" />
            <p className="drop-zone-text">Drag and drop images or PDFs here, or click to select</p>
            <p className="drop-zone-subtext">(Maximum {currentConfig.maxImages} files)</p>
          </div>
          
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="selected-images">
              <h2 className="selected-images-title">Selected Files ({selectedFiles.length}/{currentConfig.maxImages})</h2>
              <div className="selected-grid">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="selected-image-card">
                    <div className="image-container">
                      {file.type === 'application/pdf' ? (
                        <div className="pdf-preview-large">
                          <FileText size={96} className="pdf-icon" />
                        </div>
                      ) : (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className="selected-image"
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="delete-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="image-name">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {/* Generate PDF Button */}
          <div className="generate-btn-container">
            <button 
              onClick={generatePDF}
              disabled={selectedFiles.length === 0 || isGenerating}
              className="btn btn-primary"
              style={{opacity: selectedFiles.length === 0 || isGenerating ? 0.5 : 1}}
            >
              {isGenerating ? 'Generating...' : `Generate PDF (${currentConfig.pdfWidth}mm × ${currentConfig.pdfHeight}mm)`}
            </button>
          </div>
          
        </>
      )}
    </div>
  );
}