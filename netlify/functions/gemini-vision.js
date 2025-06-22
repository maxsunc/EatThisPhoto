// netlify/functions/gemini-vision.js
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { imageData, mimeType } = JSON.parse(event.body);
    
    if (!imageData || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: imageData, mimeType' })
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                    data: imageData,
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}` 
        })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Error in gemini-vision function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};