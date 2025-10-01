# CokePrintApp

A web-based application to convert 700x700 PNG images to PDF with specific formatting for printing.

## Features

- Select up to 3 images (700x700 PNG) via file dialog or drag-and-drop
- Preview selected images before conversion
- Generate PDF with exact dimensions (210mm × 148mm)
- Arrange images as 2×2 inch squares in 3 columns
- Images positioned 3/8 inch from bottom of page
- Automatic PDF download with sequential naming (finaloutput.001.pdf, finaloutput.002.pdf, etc.)
- Drag and drop PDF to other applications
- Auto-clear images after PDF generation

## Technologies Used

- React 19
- jsPDF (PDF generation)
- Lucide React (icons)
- TailwindCSS (styling)

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/[username]/CokePrintApp
cd CokePrintApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Building for Production

To create a production build:

```bash
npm run build
```

The build files will be created in the `build` directory, ready to be deployed to any static web server.

## Usage Instructions

1. Click the "Select 3 Images" button or drag and drop your 700x700 PNG images into the drop zone
2. If you select more than 3 images, you'll enter selection mode where you can choose exactly 3
3. Review your selected images in the preview area
4. Click "Generate PDF (210mm × 148mm)" to create your formatted PDF
5. The PDF will automatically download with 2×2 inch images arranged in 3 columns, positioned 3/8 inch from the bottom

## PDF Layout Specifications

- **Page Size**: 210mm × 148mm (landscape)
- **Image Size**: 2×2 inches (50.8mm × 50.8mm) each
- **Layout**: 3 columns with equal spacing
- **Bottom Margin**: 3/8 inch (9.525mm)
- **Side Margins**: 10mm each
- **Column Spacing**: 10mm between columns

## Credits

Created by MoZeus