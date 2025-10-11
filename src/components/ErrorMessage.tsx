import React, { useEffect } from 'react';
import './ErrorMessage.css';

interface ErrorMessageProps {
    message: string | null;
    onClose: () => void;
    autoClose?: boolean;
    duration?: number;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
    message,
    onClose,
    autoClose = true,
    duration = 5000
}) => {
    useEffect(() => {
        if (message && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, autoClose, duration, onClose]);

    if (!message) return null;

    return (
        <div className="error">
            <span>⚠️ {message}</span>
            <button className="error-close" onClick={onClose} aria-label="Close error">
                ×
            </button>
        </div>
    );
};

export default ErrorMessage;