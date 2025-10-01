# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an image-to-PDF converter application built with React for web browsers. It allows users to select up to 9 images and convert them into a PDF document with specific dimensions (210mm × 148mm), arranged in a 3x3 grid layout.

## Key Technologies

- **React**: Frontend UI framework (v19)
- **jsPDF**: Library for PDF generation
- **TailwindCSS**: Utility-first CSS framework

## Commands

### Development

```bash
# Install dependencies
npm install

# Start React development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Architecture

### Frontend (React)

The main component is `ImageToPdfConverter` in `src/App.js`, which handles:
- Image selection (via file dialog or drag-and-drop)
- Image preview and management
- PDF generation with specific dimensions (210mm × 148mm)
- PDF download and drag-and-drop capability

## Key Features

1. **Image Selection**:
   - File dialog selection
   - Drag and drop support
   - Selection mode for choosing exactly 9 images

2. **PDF Generation**:
   - Creates PDF with exact dimensions (210mm × 148mm)
   - Arranges images in a 3x3 grid with specific margins and spacing
   - Auto-clears images after PDF generation

3. **PDF Management**:
   - Download PDF
   - Drag and drop PDF to other applications

## User Experience Improvements

- Auto-downloads PDFs immediately after generation
- Sequential PDF naming with persistent counter (finaloutput.001, finaloutput.002, etc.)
- Improved error handling in browser environment

## Running the App

### Web Mode (Browser)
```bash
npm start
```

### Building for Deployment
```bash
npm run build
```

## Important Notes

1. This is a web-only application and runs entirely in the browser
2. Due to browser security restrictions, the application cannot:
   - Access the local file system directly
   - Move or copy files between folders
   - Access full file paths
3. All file operations are handled in-memory with browser-safe methods