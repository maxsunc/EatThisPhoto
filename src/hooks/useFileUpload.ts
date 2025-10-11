import { useState, useCallback, useRef, DragEvent } from 'react';
import { validateFile } from '../utils';

export interface UseFileUploadReturn {
    uploadedFile: File | null;
    previewUrl: string | null;
    isDragOver: boolean;
    error: string | null;
    handleFileSelect: (file: File | null) => void;
    handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: DragEvent<HTMLDivElement>) => void;
    clearFile: () => void;
    clearError: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dragCounterRef = useRef(0);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearFile = useCallback(() => {
        setUploadedFile(null);
        setPreviewUrl(null);
        setError(null);
    }, []);

    const handleFile = useCallback((file: File) => {
        const validationError = validateFile(file);

        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setUploadedFile(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleFileSelect = useCallback((file: File | null) => {
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragCounterRef.current === 0) {
            setIsDragOver(true);
        }
        dragCounterRef.current++;
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        dragCounterRef.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    return {
        uploadedFile,
        previewUrl,
        isDragOver,
        error,
        handleFileSelect,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        clearFile,
        clearError,
    };
};