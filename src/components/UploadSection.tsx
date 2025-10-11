import React, { useRef, ChangeEvent } from 'react';
import { useFileUpload } from '../hooks/useFileUpload';
import ErrorMessage from './ErrorMessage';
import './UploadSection.css';

interface UploadSectionProps {
    onProcessMenu: (file: File) => void;
    isProcessing: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onProcessMenu, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        uploadedFile,
        previewUrl,
        isDragOver,
        error,
        handleFileSelect,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        clearError,
    } = useFileUpload();

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        handleFileSelect(file);
    };

    const handleUploadAreaClick = () => {
        fileInputRef.current?.click();
    };

    const handleProcessClick = () => {
        if (uploadedFile && !isProcessing) {
            onProcessMenu(uploadedFile);
        }
    };

    return (
        <div className="upload-section">
            <div className="status-badge">
                <span className="status-indicator"></span>
                Live Mode Active - Real API Integration
            </div>

            <div
                className={`upload-area ${isDragOver ? 'dragover' : ''}`}
                onClick={handleUploadAreaClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="upload-content">
                    <div className="upload-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </div>
                    <div className="upload-text">📸 Scan Menu Image</div>
                    <div className="upload-subtext">Click to capture or drag & drop your menu</div>
                    <div className="upload-formats">Supports JPG, PNG, WEBP</div>
                </div>
                <div className="upload-glow"></div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />

            {previewUrl && (
                <div className="uploaded-container">
                    <div className="image-preview">
                        <img src={previewUrl} className="uploaded-image" alt="Uploaded menu" />
                        <div className="image-overlay">
                            <div className="image-info">
                                <span className="image-status">✅ Image Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {uploadedFile && (
                <button
                    className="btn-primary"
                    onClick={handleProcessClick}
                    disabled={isProcessing}
                >
                    <span>{isProcessing ? '🔄 Processing...' : '🚀 Generate Menu Items'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            <ErrorMessage message={error} onClose={clearError} />
        </div>
    );
};

export default UploadSection;