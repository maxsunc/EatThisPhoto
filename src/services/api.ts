import { MenuItem, APIResponse } from '../types';

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

// Extract menu text using Netlify function or direct API
export const extractMenuTextWithNetlify = async (imageFile: File): Promise<MenuItem[]> => {
    try {
        const base64Image = await fileToBase64(imageFile);
        const mimeType = imageFile.type;

        // Check if we're in development mode and have an API key
        const isDevelopment = import.meta.env.VITE_APP_MODE === 'development';
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        let response: Response;

        if (isDevelopment && apiKey) {
            // Direct API call to Google Gemini in development
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Please analyze this menu image and extract all menu items. For each item, provide:
1. name (string)
2. description (string, if available)
3. price (string, if available)
4. estimated nutrition facts as a string (e.g., "Calories: 450, Protein: 12g, Fat: 20g, Carbs: 55g")

Return the data as a JSON array like this:
[
    {
        "name": "Item Name",
        "description": "Item description",
        "price": "$0.00",
        "nutrition": "Calories: 450, Protein: 12g, Fat: 20g, Carbs: 55g"
    }
]

If no description is available, create one based on the name. If no price is available, use "Market Price". If nutrition cannot be determined from the name, make a reasonable guess. Ensure all fields are strings and the response is valid JSON.`,
                                    },
                                    {
                                        inline_data: {
                                            mime_type: mimeType,
                                            data: base64Image,
                                        },
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.4,
                            topK: 32,
                            topP: 1,
                            maxOutputTokens: 2048,
                        },
                    }),
                }
            );
        } else {
            // Use Netlify function in production or when no API key
            response = await fetch('/.netlify/functions/gemini-vision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData: base64Image,
                    mimeType: mimeType,
                }),
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(`API error: ${errorMessage}`);
        }

        const data: APIResponse = await response.json();
        const content = data.candidates[0].content.parts[0].text;

        if (!content) {
            throw new Error('No content received from API');
        }

        try {
            // Extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const menuItems = JSON.parse(jsonMatch[0]);

                // Validate and sanitize the menu items
                const validatedItems: MenuItem[] = Array.isArray(menuItems)
                    ? menuItems.map((item: any) => ({
                        name: item.name || 'Unknown Item',
                        description: item.description || 'Delicious menu item',
                        price: item.price || 'Market Price',
                        nutrition: item.nutrition || 'Nutrition info unavailable',
                    }))
                    : [];

                return validatedItems;
            } else {
                throw new Error('No valid JSON array found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse JSON:', content);
            throw new Error('Failed to parse menu data from API response');
        }
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('quota') || error.message.includes('429')) {
                throw new Error('API quota exceeded. Please try again later.');
            } else if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
        }
        throw error;
    }
};

// Create optimized prompt for food photography
export const createFoodPrompt = (item: MenuItem): string => {
    const basePrompt = `Professional food photography of ${item.name}`;

    // Add style descriptors based on food type
    const styleDescriptors = [
        'beautifully plated',
        'restaurant quality presentation',
        'appetizing',
        'high-end culinary photography',
        'studio lighting',
        'shallow depth of field',
        'garnished',
        'fresh ingredients',
        'vibrant colors',
        'artistic composition',
    ];

    // Add specific details based on item description if available
    let enhancedPrompt = basePrompt;
    if (item.description && item.description !== 'Delicious menu item') {
        enhancedPrompt += `, ${item.description}`;
    }

    // Add random style elements for variety
    const selectedStyles = styleDescriptors.sort(() => 0.5 - Math.random()).slice(0, 4);

    enhancedPrompt += `, ${selectedStyles.join(', ')}`;

    // Add technical photography terms
    enhancedPrompt += ', 85mm lens, natural lighting, food styling, commercial photography, high resolution';

    return enhancedPrompt;
};

// Generate image using Netlify function or direct API
export const generateNetlifyImage = async (item: MenuItem): Promise<{
    url: string;
    base64: string;
    mimeType: string;
}> => {
    try {
        // Create a detailed prompt for professional food photography
        const prompt = createFoodPrompt(item);

        console.log(`Generating image for ${item.name} with prompt: ${prompt}`);

        // Check if we're in development mode and have an API key
        const isDevelopment = import.meta.env.VITE_APP_MODE === 'development';
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        let response: Response;

        if (isDevelopment && apiKey) {
            // Direct API call to Google Gemini in development
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            responseModalities: ['TEXT', 'IMAGE'],
                        },
                    }),
                }
            );
        } else {
            // Use Netlify function in production or when no API key
            response = await fetch('/.netlify/functions/gemini-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                }),
            });
        }

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(`API error (${response.status}): ${errorMessage}`);
        }

        const data: APIResponse = await response.json();
        console.log('Generate response data:', data);

        // Process the response to find image data
        const candidate = data.candidates?.[0];
        if (!candidate) {
            throw new Error('No content generated');
        }

        for (const part of candidate.content.parts) {
            if (part.inline_data || part.inlineData) {
                const imageData = part.inline_data?.data || part.inlineData?.data;
                const mimeType = part.inline_data?.mime_type || part.inlineData?.mime_type || 'image/png';

                if (imageData) {
                    // Create data URL for display
                    const dataUrl = `data:${mimeType};base64,${imageData}`;
                    return {
                        url: dataUrl,
                        base64: imageData,
                        mimeType: mimeType,
                    };
                }
            }
        }

        throw new Error('No image was generated in the response');
    } catch (error) {
        console.error(`Error generating image for ${item.name}:`, error);

        // Provide more specific error messages
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Unable to connect to API.');
        } else if (error instanceof Error && error.message.includes('429')) {
            throw new Error('API rate limit exceeded. Please wait and try again.');
        }

        throw error;
    }
};

// Download item image
export const downloadItemImage = (itemName: string, base64Data: string, mimeType: string): void => {
    try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading image:', error);
        throw new Error('Failed to download image. Please try again.');
    }
};