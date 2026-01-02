'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X, Download } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [scale, setScale] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Simple PDF viewer using iframe as fallback
  // In a production environment, you might want to use react-pdf or PDF.js
  useEffect(() => {
    // For now, we'll use a simple iframe approach
    // This works for most browsers and doesn't require additional dependencies
    setLoading(false);
  }, [pdfUrl]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFitWidth = () => {
    setScale(1);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'menu.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <X size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to load PDF</h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header Controls */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-medium">Menu Viewer</h3>
          
          {/* Page Navigation */}
          <div className="flex items-center gap-2 text-white text-sm">
            <button
              onClick={() => setPageNum(prev => Math.max(prev - 1, 1))}
              disabled={pageNum <= 1}
              className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[60px] text-center">
              Page {pageNum} of {numPages || '?'}
            </span>
            <button
              onClick={() => setPageNum(prev => Math.min(prev + 1, numPages || 1))}
              disabled={pageNum >= (numPages || 1)}
              className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-600 rounded text-white"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-white text-sm min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-600 rounded text-white"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleFitWidth}
              className="p-1 hover:bg-gray-600 rounded text-white"
              title="Fit to width"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Download and Fullscreen */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-700 rounded text-white"
            title="Download PDF"
          >
            <Download size={16} />
          </button>
          
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded text-white"
              title="Exit fullscreen"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {loading ? (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading PDF...</p>
          </div>
        ) : (
          <div className="bg-white shadow-2xl" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
            <iframe
              src={pdfUrl}
              className="border-0"
              style={{
                width: '600px',
                height: '800px',
                minWidth: '300px',
                minHeight: '400px'
              }}
              title="Menu PDF"
              onError={() => setError('Failed to load PDF file')}
            />
          </div>
        )}
      </div>

      {/* Fullscreen Toggle (when not in fullscreen) */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700"
          title="Enter fullscreen"
        >
          <Maximize2 size={20} />
        </button>
      )}
    </div>
  );
}
