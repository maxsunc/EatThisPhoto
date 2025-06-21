let uploadedFile = null;

// File upload handling
// const fileInput = document.getElementById('fileInput');
// const uploadArea = document.querySelector('.upload-area');
const cameraInput = document.getElementById('cameraInput');
const uploadArea = document.querySelector('.upload-area');
const uploadedImageContainer = document.getElementById('uploadedImageContainer');
const uploadedImage = document.getElementById('uploadedImage');

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // fileInput.addEventListener('change', handleFileSelect);
    cameraInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }

    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage.src = e.target.result;
        uploadedImageContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function showError(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error');
    existingErrors.forEach(error => error.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.upload-section').appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Menu processing with Gemini APIs
async function processMenu() {
    const processing = document.getElementById('processing');
    const menuResults = document.getElementById('menuResults');
    const geminiKey = document.getElementById('geminiKey').value.trim();
    
    if (!geminiKey) {
        showError('Please provide a Gemini API key for processing.');
        return;
    }
    
    if (!uploadedFile) {
        showError('Please upload a menu image first.');
        return;
    }
    
    processing.style.display = 'block';
    menuResults.style.display = 'none';

    try {
        // Step 1: Extract menu text using Gemini Vision
        updateProcessingText('Extracting menu text with Gemini...');
        const menuItems = await extractMenuTextWithGemini(uploadedFile, geminiKey);
        
        if (!menuItems || menuItems.length === 0) {
            throw new Error('No menu items could be extracted from the image');
        }
        
        // Step 2: Generate images for each menu item using Gemini
        updateProcessingText('Generating food images with Gemini...');
        const itemsWithImages = await generateImagesWithGemini(menuItems, geminiKey);
        
        processing.style.display = 'none';
        displayMenuItems(itemsWithImages);
        
    } catch (error) {
        processing.style.display = 'none';
        showError(`Error processing menu: ${error.message}`);
        console.error('Processing error:', error);
    }
}

function updateProcessingText(text) {
    const processingDiv = document.getElementById('processing');
    const textElement = processingDiv.querySelector('p');
    if (textElement) {
        textElement.textContent = text;
    }
}

// Extract menu text using Gemini Vision API
async function extractMenuTextWithGemini(imageFile, apiKey) {
    try {
        const base64Image = await fileToBase64(imageFile);
        const mimeType = imageFile.type;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `Please analyze this menu image and extract all menu items. For each item, provide:
                            1. name (string)
                            2. description (string, if available)
                            3. price (string, if available)
                            
                            Return the data as a JSON array like this:
                            [
                                {
                                    "name": "Item Name",
                                    "description": "Item description",
                                    "price": "$0.00"
                                }
                            ]
                            
                            If no description is available, create a brief appetizing description based on the item name. If no price is available, use "Market Price". Please ensure the response is valid JSON format and that all fields are strings (not null or undefined).`
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(`Gemini API error: ${errorMessage}`);
        }

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;
        
        try {
            // Extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const menuItems = JSON.parse(jsonMatch[0]);
                
                // Validate and sanitize the menu items
                const validatedItems = Array.isArray(menuItems) ? menuItems.map(item => ({
                    name: item.name || 'Unknown Item',
                    description: item.description || 'Delicious menu item',
                    price: item.price || 'Market Price'
                })) : [];
                
                return validatedItems;
            } else {
                throw new Error('No valid JSON array found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse JSON:', content);
            throw new Error('Failed to parse menu data from Gemini response');
        }
    } catch (error) {
        if (error.message.includes('API key') || error.message.includes('403')) {
            throw new Error('Invalid Gemini API key. Please check your API key and try again.');
        } else if (error.message.includes('quota') || error.message.includes('429')) {
            throw new Error('Gemini API quota exceeded. Please check your usage limits.');
        } else if (error.message.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw error;
    }
}

// Generate images using Gemini
async function generateImagesWithGemini(menuItems, geminiApiKey) {
    const itemsWithImages = [];
    
    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        updateProcessingText(`Generating image ${i + 1}/${menuItems.length}: ${item.name}`);
        
        try {
            const imageData = await generateGeminiImage(item, geminiApiKey);
            
            itemsWithImages.push({
                ...item,
                imageUrl: imageData.url,
                imageData: imageData.base64
            });
            
            console.log(`Successfully generated image for: ${item.name}`);
        } catch (error) {
            console.warn(`Failed to generate image for ${item.name}:`, error);
            itemsWithImages.push({
                ...item,
                imageUrl: null,
                imageError: error.message
            });
        }
        
        // Add delay between requests to avoid rate limiting
        if (i < menuItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return itemsWithImages;
}

// Generate image using Gemini API
async function generateGeminiImage(item, apiKey) {
    try {
        // Create a detailed prompt for professional food photography
        const prompt = createFoodPrompt(item);
        
        console.log(`Generating image for ${item.name} with prompt: ${prompt}`);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"]
                }
            })
        });

        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(`Gemini API error (${response.status}): ${errorMessage}`);
        }

        const data = await response.json();
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
                        mimeType: mimeType
                    };
                }
            }
        }
        
        throw new Error('No image was generated in the response');
        
    } catch (error) {
        console.error(`Error generating image for ${item.name}:`, error);
        
        // Provide more specific error messages
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Unable to connect to Gemini API.');
        } else if (error.message.includes('401')) {
            throw new Error('Invalid Gemini API key. Please check your API key.');
        } else if (error.message.includes('403')) {
            throw new Error('Gemini API access forbidden. Check your API key permissions.');
        } else if (error.message.includes('429')) {
            throw new Error('Gemini API rate limit exceeded. Please wait and try again.');
        }
        
        throw error;
    }
}

// Create optimized prompt for food photography
function createFoodPrompt(item) {
    const basePrompt = `Professional food photography of ${item.name}`;
    
    // Add style descriptors based on food type
    const styleDescriptors = [
        "beautifully plated",
        "restaurant quality presentation", 
        "appetizing",
        "high-end culinary photography",
        "studio lighting",
        "shallow depth of field",
        "garnished",
        "fresh ingredients"
    ];
    
    // Add specific details based on item description if available
    let enhancedPrompt = basePrompt;
    if (item.description && item.description !== 'Delicious menu item') {
        enhancedPrompt += `, ${item.description}`;
    }
    
    // Add random style elements for variety
    const selectedStyles = styleDescriptors
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    enhancedPrompt += `, ${selectedStyles.join(', ')}`;
    
    // Add technical photography terms
    enhancedPrompt += ", 85mm lens, natural lighting, food styling, commercial photography";
    
    return enhancedPrompt;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

function displayMenuItems(items) {
    const menuResults = document.getElementById('menuResults');
    const menuGrid = document.getElementById('menuGrid');
    
    menuGrid.innerHTML = '';
    
    items.forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        // Create image element
        let imageElement;
        if (item.imageUrl) {
            imageElement = `<img src="${item.imageUrl}" class="menu-item-image" alt="${escapeHtml(item.name)}" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <div class="menu-item-image fallback-image" style="display: none;">🍽️ ${escapeHtml(item.name)}</div>`;
        } else {
            const errorMsg = item.imageError ? ` (${item.imageError})` : '';
            imageElement = `<div class="menu-item-image fallback-image">🍽️ ${escapeHtml(item.name)}${errorMsg}</div>`;
        }
        
        menuItem.innerHTML = `
            ${imageElement}
            <div class="menu-item-content">
                <div class="menu-item-name">${escapeHtml(item.name)}</div>
                <div class="menu-item-description">${escapeHtml(item.description)}</div>
                <div class="menu-item-price">${escapeHtml(item.price)}</div>
                ${item.imageData ? `<button class="download-btn" onclick="downloadItemImage('${escapeHtml(item.name)}', '${item.imageData}', '${item.mimeType || 'image/png'}')">📥 Download Image</button>` : ''}
            </div>
        `;
        
        menuGrid.appendChild(menuItem);
        
        // Animate items in
        setTimeout(() => {
            menuItem.style.opacity = '0';
            menuItem.style.transform = 'translateY(20px)';
            menuItem.style.transition = 'all 0.5s ease';
            requestAnimationFrame(() => {
                menuItem.style.opacity = '1';
                menuItem.style.transform = 'translateY(0)';
            });
        }, index * 100);
    });
    
    menuResults.style.display = 'block';
}

// Function to download individual item images
function downloadItemImage(itemName, base64Data, mimeType) {
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
        showError('Failed to download image. Please try again.');
    }
}

// Utility function to escape HTML to prevent XSS - Fixed to handle null/undefined values
function escapeHtml(unsafe) {
    // Handle null, undefined, or non-string values
    if (unsafe == null || typeof unsafe !== 'string') {
        return '';
    }
    
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}