import { useState } from 'react';
import IntroScreen from './components/IntroScreen';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import ProcessingScreen from './components/ProcessingScreen';
import MenuResults from './components/MenuResults';
import { useMenuProcessing } from './hooks/useMenuProcessing';
import './App.css';

function App() {
    const [showIntro, setShowIntro] = useState(true);
    const {
        processMenu,
        isProcessing,
        currentStep,
        menuItems,
        clearError,
    } = useMenuProcessing();

    const handleStartApp = () => {
        setShowIntro(false);
    };

    const handleProcessMenu = (file: File) => {
        clearError();
        processMenu(file);
    };

    return (
        <div className="app">
            <IntroScreen
                isVisible={showIntro}
                onStart={handleStartApp}
            />

            {!showIntro && (
                <div className="container">
                    <Header />

                    <UploadSection
                        onProcessMenu={handleProcessMenu}
                        isProcessing={isProcessing}
                    />

                    <ProcessingScreen
                        isVisible={isProcessing}
                        currentStep={currentStep}
                    />

                    <MenuResults
                        menuItems={menuItems}
                        isVisible={!isProcessing && menuItems.length > 0}
                    />
                </div>
            )}
        </div>
    );
}

export default App;