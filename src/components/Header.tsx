import React from 'react';
import './Header.css';

const Header: React.FC = () => {
    return (
        <div className="header">
            <div className="header-content">
                <div className="logo-section">
                    <div className="logo-icon">🍽️</div>
                    <h1>EatThis.photo</h1>
                </div>
                <p className="header-subtitle">
                    Transform menu images into beautiful item visuals with AI
                </p>
                <div className="feature-badges">
                    <span className="badge">AI-Powered</span>
                    <span className="badge">Instant Results</span>
                    <span className="badge">High Quality</span>
                </div>
            </div>
        </div>
    );
};

export default Header;