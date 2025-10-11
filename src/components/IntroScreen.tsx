import React from 'react';
import './IntroScreen.css';

interface IntroScreenProps {
    onStart: () => void;
    isVisible: boolean;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="intro-screen">
            <div className="intro-background">
                <div className="floating-elements">
                    <div className="element element-1">🍟</div>
                    <div className="element element-2">🍕</div>
                    <div className="element element-3">🌮</div>
                    <div className="element element-4">🍰</div>
                    <div className="element element-5">🥗</div>
                    <div className="element element-6">🍜</div>
                    <div className="element element-7">🍔</div>
                    <div className="element element-8">🥘</div>
                </div>
            </div>

            <div className="intro-content">
                <div className="hamburger-container">
                    <div className="hamburger">
                        <div className="bun-top">
                            <div className="sesame sesame-1"></div>
                            <div className="sesame sesame-2"></div>
                            <div className="sesame sesame-3"></div>
                            <div className="sesame sesame-4"></div>
                            <div className="sesame sesame-5"></div>
                        </div>
                        <div className="lettuce"></div>
                        <div className="tomato"></div>
                        <div className="patty"></div>
                        <div className="cheese"></div>
                        <div className="bun-bottom"></div>
                    </div>
                </div>

                <h1 className="intro-title">
                    <span className="word">Eat</span>
                    <span className="word">This</span>
                    <span className="word">Photo</span>
                </h1>

                <p className="intro-subtitle">
                    Transform menu images into stunning food visuals with AI magic ✨
                </p>

                <button className="start-button" onClick={onStart}>
                    <span>Start Creating</span>
                    <div className="button-sparkle"></div>
                </button>
            </div>

            <div className="intro-particles"></div>
        </div>
    );
};

export default IntroScreen;