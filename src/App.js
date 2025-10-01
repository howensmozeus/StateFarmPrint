import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, FileText, Check, X } from 'lucide-react';
import * as _ from 'lodash';
// Import jsPDF for PDF generation
import { jsPDF } from 'jspdf';
// Import custom CSS
import './ImageToPdfConverter.css';

export default function ImageToPdfConverter() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [fileCounter, setFileCounter] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPdf, setDraggedPdf] = useState(false);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoDeleteSuccess, setAutoDeleteSuccess] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('version1');
  const fileInputRef = useRef(null);
  const pdfRef = useRef(null);

  // Version configurations
  const versions = {
    version1: {
      name: '3-Column Layout (700x700)',
      maxImages: 3,
      pdfWidth: 210,
      pdfHeight: 148,
      imageSize: 50.8, // 2 inches
      bottomPadding: 9.525, // 3/8 inch
      layout: '3-column'
    },
    version2: {
      name: 'Strip Layout (73mm x 10mm)',
      maxImages: 6,
      pdfWidth: 210,
      pdfHeight: 148,
      imageWidth: 73,
      imageHeight: 10,
      bottomPadding: 9.525, // 3/8 inch
      layout: 'strips'
    }
  };

  const currentConfig = versions[selectedVersion];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    // Handle image files
    if (imageFiles.length > 0) {
      // Show selection mode if more than maxImageCount images are selected
      if (imageFiles.length > currentConfig.maxImages) {
        setAvailableImages(imageFiles);
        setShowSelectionMode(true);
      } else {
        // Add files
        const newFiles = [...selectedFiles, ...imageFiles].slice(0, currentConfig.maxImages);
        setSelectedFiles(newFiles);
      }
    }

    // Handle PDF files
    if (pdfFiles.length > 0) {
      const newPdfs = [...selectedPdfs, ...pdfFiles];
      setSelectedPdfs(newPdfs);
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

    // Handle image files
    if (imageFiles.length > 0) {
      // Show selection mode if more than maxImageCount images are dropped
      if (imageFiles.length > currentConfig.maxImages) {
        setAvailableImages(imageFiles);
        setShowSelectionMode(true);
      } else {
        // Add files
        const newFiles = [...selectedFiles, ...imageFiles].slice(0, currentConfig.maxImages);
        setSelectedFiles(newFiles);
      }
    }

    // Handle PDF files
    if (pdfFiles.length > 0) {
      const newPdfs = [...selectedPdfs, ...pdfFiles];
      setSelectedPdfs(newPdfs);
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

  const removePdf = (index) => {
    const newPdfs = [...selectedPdfs];
    newPdfs.splice(index, 1);
    setSelectedPdfs(newPdfs);
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
    // Also clear PDFs for consistency
    setSelectedPdfs([]);

    // Show auto-delete success message
    setAutoDeleteSuccess(true);

    // Hide the success message after 3 seconds
    setTimeout(() => {
      setAutoDeleteSuccess(false);
    }, 3000);
  };

  // Layout function for 3-column layout
  const generateThreeColumnLayout = async (pdf, imageDataUrls, config, pdfWidth, pdfHeight) => {
    const sideMargin = 10; // mm margin from left/right edges
    const bottomPadding = config.bottomPadding; // From config
    const topMargin = 10; // mm margin from top
    const columnGap = 10; // mm gap between columns
    const availableWidth = pdfWidth - (2 * sideMargin); // Total width minus side margins
    const columnWidth = (availableWidth - (2 * columnGap)) / 3; // Width per column

    // Add images to the PDF in 3 columns
    for (let i = 0; i < Math.min(imageDataUrls.length, config.maxImages); i++) {
      // Create a temporary image to get dimensions
      const tempImg = new Image();
      await new Promise((resolve) => {
        tempImg.onload = resolve;
        tempImg.src = imageDataUrls[i];
      });

      // Set image dimensions from config
      const imageWidth = config.imageSize;
      const imageHeight = config.imageSize;

      // Calculate column position and center image within column
      const columnIndex = i;
      const columnStart = sideMargin + (columnIndex * (columnWidth + columnGap));
      const xOffset = columnStart + (columnWidth - imageWidth) / 2; // Center image in column

      // Position image starting from bottom padding (images extend upward)
      const yOffset = pdfHeight - bottomPadding - imageHeight;

      // Process 700x700 square images
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = tempImg.width;
      canvas.height = tempImg.height;

      // Draw the image directly
      ctx.drawImage(tempImg, 0, 0);

      // Get the processed image data
      const processedImageData = canvas.toDataURL('image/png', 1.0);

      // Add image to PDF
      pdf.addImage(
        processedImageData,
        'PNG',
        xOffset,
        yOffset,
        imageWidth,
        imageHeight
      );
    }
  };

  // Layout function for strip layout (73mm x 10mm images)
  const generateStripLayout = async (pdf, imageDataUrls, config, pdfWidth, pdfHeight) => {
    const sideMargin = 10; // mm margin from left/right edges
    const bottomPadding = config.bottomPadding; // From config
    const stripGap = 5; // mm gap between strips
    const imageWidth = config.imageWidth; // 73mm
    const imageHeight = config.imageHeight; // 10mm

    // Center the strips horizontally
    const availableWidth = pdfWidth - (2 * sideMargin);
    const xOffset = sideMargin + (availableWidth - imageWidth) / 2;

    // Start from bottom and work upward
    let yPos = pdfHeight - bottomPadding - imageHeight;

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
      canvas.width = imageWidth * 4; // Higher resolution for better quality
      canvas.height = imageHeight * 4;

      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image stretched to fit the strip dimensions
      ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);

      const processedImageData = canvas.toDataURL('image/png', 1.0);

      // Add image to PDF
      pdf.addImage(
        processedImageData,
        'PNG',
        xOffset,
        yPos,
        imageWidth,
        imageHeight
      );

      // Move up for next strip
      yPos -= (imageHeight + stripGap);

      // Stop if we would go above the top margin
      if (yPos < 10) break;
    }
  };

  // Generate PDF with specific dimensions and landscape orientation
  const generatePDF = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
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
      
      // Load all images as data URLs
      const imagePromises = selectedFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
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

      // Generate PDF based on selected layout version
      if (currentConfig.layout === '3-column') {
        await generateThreeColumnLayout(pdf, imageDataUrls, currentConfig, pdfWidth, pdfHeight);
      } else if (currentConfig.layout === 'strips') {
        await generateStripLayout(pdf, imageDataUrls, currentConfig, pdfWidth, pdfHeight);
      }
      
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
      <h1 className="page-title">Image to PDF Converter</h1>

      {/* Version Selection Dropdown */}
      <div className="version-selector">
        <label htmlFor="version-select" className="version-label">Layout Version:</label>
        <select
          id="version-select"
          value={selectedVersion}
          onChange={(e) => {
            setSelectedVersion(e.target.value);
            setSelectedFiles([]); // Clear selected files when changing version
            setSelectedPdfs([]); // Clear selected PDFs when changing version
          }}
          className="version-dropdown"
        >
          {Object.entries(versions).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>
      </div>
      
      {/* Selection Mode */}
      {showSelectionMode ? (
        <div>
          <div className="selection-header">
            <h2 className="selection-title">
              Select exactly {currentConfig.maxImages} images ({selectedFiles.length}/{currentConfig.maxImages})
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
            {availableImages.map((image, index) => (
              <div 
                key={index}
                className={`image-card ${isImageSelected(image) ? 'selected' : ''}`}
                onClick={() => toggleImageSelection(image)}
              >
                <img 
                  src={URL.createObjectURL(image)} 
                  alt={`Available ${index}`} 
                  className="image-preview" 
                />
                {isImageSelected(image) && (
                  <div className="selection-mark">
                    <Check size={16} />
                  </div>
                )}
                <div className="image-name">{image.name}</div>
              </div>
            ))}
          </div>
          
          {selectedFiles.length > currentConfig.maxImages && (
            <p className="alert-danger">
              Please select exactly {currentConfig.maxImages} images. You've selected {selectedFiles.length} images.
            </p>
          )}

          {selectedFiles.length < currentConfig.maxImages && (
            <p className="alert-warning">
              Please select {currentConfig.maxImages - selectedFiles.length} more images.
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
              Select {currentConfig.maxImages} Images
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
              <span>Images automatically cleared after PDF creation</span>
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
            <p className="drop-zone-subtext">(Maximum {currentConfig.maxImages} images + unlimited PDFs)</p>
          </div>
          
          {/* Selected Images Preview */}
          {selectedFiles.length > 0 && (
            <div className="selected-images">
              <h2 className="selected-images-title">Selected Images ({selectedFiles.length}/{currentConfig.maxImages})</h2>
              <div className="selected-grid">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="selected-image-card">
                    <div className="image-container">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="selected-image"
                      />
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

          {/* Selected PDFs Preview */}
          {selectedPdfs.length > 0 && (
            <div className="selected-pdfs">
              <h2 className="selected-pdfs-title">Selected PDFs ({selectedPdfs.length})</h2>
              <div className="selected-pdf-list">
                {selectedPdfs.map((file, index) => (
                  <div key={index} className="selected-pdf-card">
                    <div className="pdf-info">
                      <FileText size={24} className="pdf-icon" />
                      <div className="pdf-details">
                        <p className="pdf-name">{file.name}</p>
                        <p className="pdf-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePdf(index);
                      }}
                      className="delete-btn"
                    >
                      <Trash2 size={16} />
                    </button>
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