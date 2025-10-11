import React from 'react';
import './ProcessingScreen.css';

interface ProcessingScreenProps {
    isVisible: boolean;
    currentStep: string;
}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ isVisible, currentStep }) => {
    if (!isVisible) return null;

    return (
        <div className="processing">
            <div className="processing-content">
                <div className="spinner-container">
                    <div className="spinner"></div>
                    <div className="spinner-glow"></div>
                </div>
                <h3>🔄 Processing Menu</h3>
                <p>{currentStep || 'Extracting text and generating visuals...'}</p>
                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>
        </div>
    );
};

export default ProcessingScreen;