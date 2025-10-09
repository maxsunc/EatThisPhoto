export interface MenuItem {
  name: string;
  description: string;
  price: string;
  nutrition?: string;
  imageUrl?: string;
  imageData?: string;
  mimeType?: string;
  imageError?: string;
}

export interface APIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inline_data?: {
          data: string;
          mime_type: string;
        };
        inlineData?: {
          data: string;
          mime_type: string;
        };
      }>;
    };
  }>;
}

export interface ProcessingState {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
}

export interface ErrorState {
  message: string;
  timestamp: number;
}