# EatThis.photo - React TypeScript Version

A React TypeScript refactor of the original vanilla JavaScript EatThis.photo application. Transform menu images into beautiful food visuals with AI.

## Features

- **React + TypeScript**: Modern, type-safe development
- **AI-Powered**: Uses Gemini AI for menu text extraction and food image generation
- **Drag & Drop**: Easy file upload with visual feedback
- **Real-time Processing**: Live updates during image generation
- **Responsive Design**: Works on desktop and mobile devices
- **Netlify Functions**: Serverless backend integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── IntroScreen.tsx
│   ├── Header.tsx
│   ├── UploadSection.tsx
│   ├── ProcessingScreen.tsx
│   ├── MenuResults.tsx
│   ├── MenuItem.tsx
│   └── ErrorMessage.tsx
├── hooks/              # Custom React hooks
│   ├── useFileUpload.ts
│   └── useMenuProcessing.ts
├── services/           # API service functions
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── index.ts
└── App.tsx            # Main application component
```

## Key Improvements from Vanilla JS Version

1. **Type Safety**: Full TypeScript integration prevents runtime errors
2. **Component Architecture**: Modular, reusable React components
3. **Custom Hooks**: Encapsulated state management and side effects
4. **Better Error Handling**: Comprehensive error states and user feedback
5. **Modern Tooling**: Vite for fast development and building
6. **Accessibility**: Improved focus management and ARIA attributes

## API Integration

The application uses Netlify Functions for backend API calls:

- `/.netlify/functions/gemini-vision` - Menu text extraction
- `/.netlify/functions/gemini-image` - Food image generation

## Deployment

The application is designed for Netlify deployment with the existing Netlify Functions preserved.

```bash
# Build and deploy to Netlify
npm run build
# Upload dist/ folder to Netlify
```

## Technologies Used

- React 18
- TypeScript
- Vite
- CSS3 with custom properties
- Netlify Functions
- Google Gemini AI API