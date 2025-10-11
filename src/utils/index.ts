// Utility function to escape HTML to prevent XSS
export const escapeHtml = (unsafe: string | null | undefined): string => {
    // Handle null, undefined, or non-string values
    if (unsafe == null || typeof unsafe !== 'string') {
        return '';
    }

    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Validate file type and size
export const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
        return 'Please select an image file (JPG, PNG, WEBP).';
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        return 'File size too large. Please select an image under 10MB.';
    }

    return null;
};

// Animation helpers
export const animateIn = (element: HTMLElement): void => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    setTimeout(() => {
        element.style.transition = 'all 0.5s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, 100);
};

export const animateOut = (element: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            resolve();
        }, 500);
    });
};