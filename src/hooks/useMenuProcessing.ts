import { useState, useCallback } from 'react';
import { MenuItem } from '../types';
import {
    extractMenuTextWithNetlify,
    generateNetlifyImage
} from '../services/api';

export interface UseMenuProcessingReturn {
    processMenu: (file: File) => Promise<void>;
    isProcessing: boolean;
    currentStep: string;
    menuItems: MenuItem[];
    error: string | null;
    clearError: () => void;
}

export const useMenuProcessing = (): UseMenuProcessingReturn => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState('');
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const processMenu = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        setMenuItems([]);

        try {
            // Step 1: Extract menu text
            setCurrentStep('🔍 Extracting menu text...');
            const extractedItems = await extractMenuTextWithNetlify(file);

            if (!extractedItems || extractedItems.length === 0) {
                throw new Error('No menu items could be extracted from the image');
            }

            // Step 2: Generate images for each menu item
            setCurrentStep('🎨 Generating food images...');
            const processedItems: MenuItem[] = [];

            for (let i = 0; i < extractedItems.length; i++) {
                const item = extractedItems[i];
                setCurrentStep(`🎨 Generating image ${i + 1}/${extractedItems.length}: ${item.name}`);

                try {
                    const imageData = await generateNetlifyImage(item);

                    const itemWithImage: MenuItem = {
                        ...item,
                        imageUrl: imageData.url,
                        imageData: imageData.base64,
                        mimeType: imageData.mimeType,
                    };

                    processedItems.push(itemWithImage);
                    setMenuItems([...processedItems]); // Update incrementally

                    console.log(`✅ Image generated for: ${item.name}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to generate image for ${item.name}:`, error);
                    const itemWithError: MenuItem = {
                        ...item,
                        imageUrl: undefined,
                        imageError: error instanceof Error ? error.message : 'Unknown error',
                    };
                    processedItems.push(itemWithError);
                    setMenuItems([...processedItems]); // Update incrementally
                }

                // Throttle requests
                if (i < extractedItems.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(`Error processing menu: ${errorMessage}`);
            console.error('Processing error:', error);
        } finally {
            setIsProcessing(false);
            setCurrentStep('');
        }
    }, []);

    return {
        processMenu,
        isProcessing,
        currentStep,
        menuItems,
        error,
        clearError,
    };
};