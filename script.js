let uploadedFile = null

// File upload handling
const cameraInput = document.getElementById("cameraInput")
const uploadArea = document.querySelector(".upload-area")
const uploadedImageContainer = document.getElementById("uploadedImageContainer")
const uploadedImage = document.getElementById("uploadedImage")

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  cameraInput.addEventListener("change", handleFileSelect)

  // Enhanced drag and drop with visual feedback
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
    uploadArea.style.borderColor = "var(--primary)"
    uploadArea.style.background = "linear-gradient(135deg, rgb(99 102 241 / 0.1) 0%, rgb(99 102 241 / 0.05) 100%)"
  })

  uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    uploadArea.style.borderColor = ""
    uploadArea.style.background = ""
  })

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    uploadArea.style.borderColor = ""
    uploadArea.style.background = ""
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  })
})

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    handleFile(file)
  }
}

function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    showError("Please select an image file (JPG, PNG, WEBP).")
    return
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showError("File size too large. Please select an image under 10MB.")
    return
  }

  uploadedFile = file
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.src = e.target.result
    uploadedImageContainer.style.display = "block"

    // Add smooth reveal animation
    uploadedImageContainer.style.opacity = "0"
    uploadedImageContainer.style.transform = "translateY(20px)"
    setTimeout(() => {
      uploadedImageContainer.style.transition = "all 0.5s ease"
      uploadedImageContainer.style.opacity = "1"
      uploadedImageContainer.style.transform = "translateY(0)"
    }, 100)
  }
  reader.readAsDataURL(file)
}

function showError(message) {
  // Remove existing error messages
  const existingErrors = document.querySelectorAll(".error")
  existingErrors.forEach((error) => error.remove())

  const errorDiv = document.createElement("div")
  errorDiv.className = "error"
  errorDiv.innerHTML = `⚠️ ${message}`
  document.querySelector(".upload-section").appendChild(errorDiv)

  // Enhanced error animation
  errorDiv.style.opacity = "0"
  errorDiv.style.transform = "translateY(-10px)"
  setTimeout(() => {
    errorDiv.style.transition = "all 0.3s ease"
    errorDiv.style.opacity = "1"
    errorDiv.style.transform = "translateY(0)"
  }, 100)

  setTimeout(() => {
    errorDiv.style.opacity = "0"
    errorDiv.style.transform = "translateY(-10px)"
    setTimeout(() => errorDiv.remove(), 300)
  }, 5000)
}

// Menu processing with Netlify Functions (no API key needed from user)
async function processMenu() {
  const processing = document.getElementById("processing")
  const menuResults = document.getElementById("menuResults")

  if (!uploadedFile) {
    showError("Please upload a menu image first.")
    return
  }

  // Enhanced processing display
  processing.style.display = "block"
  processing.style.opacity = "0"
  processing.style.transform = "translateY(20px)"
  setTimeout(() => {
    processing.style.transition = "all 0.5s ease"
    processing.style.opacity = "1"
    processing.style.transform = "translateY(0)"
  }, 100)

  menuResults.style.display = "none"

  try {
    // Step 1: Extract menu text using Netlify function
    updateProcessingText("🔍 Extracting menu text...")
    const menuItems = await extractMenuTextWithNetlify(uploadedFile)

    if (!menuItems || menuItems.length === 0) {
      throw new Error("No menu items could be extracted from the image")
    }

    // Step 2: Generate images for each menu item using Netlify function
    updateProcessingText("🎨 Generating food images...")
    const itemsWithImages = await generateImagesWithNetlify(menuItems)

    // Enhanced completion animation
    processing.style.opacity = "0"
    processing.style.transform = "translateY(-20px)"
    setTimeout(() => {
      processing.style.display = "none"
    }, 500)

    displayMenuItems(itemsWithImages)
  } catch (error) {
    processing.style.opacity = "0"
    processing.style.transform = "translateY(-20px)"
    setTimeout(() => {
      processing.style.display = "none"
    }, 500)

    showError(`Error processing menu: ${error.message}`)
    console.error("Processing error:", error)
  }
}

function updateProcessingText(text) {
  const processingDiv = document.getElementById("processing")
  const textElement = processingDiv.querySelector("p")
  if (textElement) {
    textElement.style.opacity = "0"
    setTimeout(() => {
      textElement.textContent = text
      textElement.style.transition = "opacity 0.3s ease"
      textElement.style.opacity = "1"
    }, 150)
  }
}

// Extract menu text using Netlify function
async function extractMenuTextWithNetlify(imageFile) {
  try {
    const base64Image = await fileToBase64(imageFile)
    const mimeType = imageFile.type

    const response = await fetch('/.netlify/functions/gemini-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: base64Image,
        mimeType: mimeType
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(`API error: ${errorMessage}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const menuItems = JSON.parse(jsonMatch[0])

        // Validate and sanitize the menu items
        const validatedItems = Array.isArray(menuItems)
          ? menuItems.map((item) => ({
              name: item.name || "Unknown Item",
              description: item.description || "Delicious menu item",
              price: item.price || "Market Price",
              nutrition: item.nutrition || "Nutrition info unavailable",
            }))
          : []

        return validatedItems
      } else {
        throw new Error("No valid JSON array found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse JSON:", content)
      throw new Error("Failed to parse menu data from API response")
    }
  } catch (error) {
    if (error.message.includes("quota") || error.message.includes("429")) {
      throw new Error("API quota exceeded. Please try again later.")
    } else if (error.message.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.")
    }
    throw error
  }
}

// Generate images using Netlify function
async function generateImagesWithNetlify(menuItems) {
  const menuResults = document.getElementById("menuResults")
  const menuGrid = document.getElementById("menuGrid")
  menuGrid.innerHTML = ""

  // Enhanced results display
  menuResults.style.display = "block"
  menuResults.style.opacity = "0"
  menuResults.style.transform = "translateY(20px)"
  setTimeout(() => {
    menuResults.style.transition = "all 0.5s ease"
    menuResults.style.opacity = "1"
    menuResults.style.transform = "translateY(0)"
  }, 100)

  const processedItems = []

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i]
    updateProcessingText(`🎨 Generating image ${i + 1}/${menuItems.length}: ${item.name}`)

    try {
      const imageData = await generateNetlifyImage(item)

      const itemWithImage = {
        ...item,
        imageUrl: imageData.url,
        imageData: imageData.base64,
        mimeType: imageData.mimeType,
      }

      appendMenuItem(itemWithImage)
      processedItems.push(itemWithImage)

      console.log(`✅ Image generated for: ${item.name}`)
    } catch (error) {
      console.warn(`⚠️ Failed to generate image for ${item.name}:`, error)
      const itemWithError = {
        ...item,
        imageUrl: null,
        imageError: error.message,
      }
      appendMenuItem(itemWithError)
      processedItems.push(itemWithError)
    }

    // Throttle requests
    if (i < menuItems.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Done
  document.getElementById("processing").style.display = "none"

  return processedItems
}

// Generate image using Netlify function
async function generateNetlifyImage(item) {
  try {
    // Create a detailed prompt for professional food photography
    const prompt = createFoodPrompt(item)

    console.log(`Generating image for ${item.name} with prompt: ${prompt}`)

    const response = await fetch('/.netlify/functions/gemini-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt
      }),
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(`API error (${response.status}): ${errorMessage}`)
    }

    const data = await response.json()
    console.log("Generate response data:", data)

    // Process the response to find image data
    const candidate = data.candidates?.[0]
    if (!candidate) {
      throw new Error("No content generated")
    }

    for (const part of candidate.content.parts) {
      if (part.inline_data || part.inlineData) {
        const imageData = part.inline_data?.data || part.inlineData?.data
        const mimeType = part.inline_data?.mime_type || part.inlineData?.mime_type || "image/png"

        if (imageData) {
          // Create data URL for display
          const dataUrl = `data:${mimeType};base64,${imageData}`
          return {
            url: dataUrl,
            base64: imageData,
            mimeType: mimeType,
          }
        }
      }
    }

    throw new Error("No image was generated in the response")
  } catch (error) {
    console.error(`Error generating image for ${item.name}:`, error)

    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Network error: Unable to connect to API.")
    } else if (error.message.includes("429")) {
      throw new Error("API rate limit exceeded. Please wait and try again.")
    }

    throw error
  }
}

// Create optimized prompt for food photography
function createFoodPrompt(item) {
  const basePrompt = `Professional food photography of ${item.name}`

  // Add style descriptors based on food type
  const styleDescriptors = [
    "beautifully plated",
    "restaurant quality presentation",
    "appetizing",
    "high-end culinary photography",
    "studio lighting",
    "shallow depth of field",
    "garnished",
    "fresh ingredients",
    "vibrant colors",
    "artistic composition",
  ]

  // Add specific details based on item description if available
  let enhancedPrompt = basePrompt
  if (item.description && item.description !== "Delicious menu item") {
    enhancedPrompt += `, ${item.description}`
  }

  // Add random style elements for variety
  const selectedStyles = styleDescriptors.sort(() => 0.5 - Math.random()).slice(0, 4)

  enhancedPrompt += `, ${selectedStyles.join(", ")}`

  // Add technical photography terms
  enhancedPrompt += ", 85mm lens, natural lighting, food styling, commercial photography, high resolution"

  return enhancedPrompt
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(",")[1])
    reader.onerror = (error) => reject(error)
  })
}

function displayMenuItems(items) {
  const menuResults = document.getElementById("menuResults")
  const menuGrid = document.getElementById("menuGrid")

  menuGrid.innerHTML = ""

  items.forEach((item, index) => {
    const menuItem = document.createElement("div")
    menuItem.className = "menu-item"

    // Create image element
    let imageElement
    if (item.imageUrl) {
      imageElement = `<img src="${item.imageUrl}" class="menu-item-image" alt="${escapeHtml(item.name)}" style="width: 100%; height: 250px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <div class="menu-item-image fallback-image" style="display: none;">🍽️ ${escapeHtml(item.name)}</div>`
    } else {
      const errorMsg = item.imageError ? ` (${item.imageError})` : ""
      imageElement = `<div class="menu-item-image fallback-image">🍽️ ${escapeHtml(item.name)}${errorMsg}</div>`
    }

    menuItem.innerHTML = `
            ${imageElement}
            <div class="menu-item-content">
                <div class="menu-item-name">${escapeHtml(item.name)}</div>
                <div class="menu-item-description">${escapeHtml(item.description)}</div>
                <div class="menu-item-price">💰 ${escapeHtml(item.price)}</div>
                ${item.nutrition ? `<div class="menu-item-nutrition">📊 ${escapeHtml(item.nutrition)}</div>` : ""}
            </div>
        `

    menuGrid.appendChild(menuItem)

    // Enhanced animate items in
    setTimeout(() => {
      menuItem.style.opacity = "0"
      menuItem.style.transform = "translateY(30px) scale(0.95)"
      menuItem.style.transition = "all 0.6s ease"
      requestAnimationFrame(() => {
        menuItem.style.opacity = "1"
        menuItem.style.transform = "translateY(0) scale(1)"
      })
    }, index * 150)
  })

  menuResults.style.display = "block"
}

function appendMenuItem(item) {
  const menuGrid = document.getElementById("menuGrid")

  const menuItem = document.createElement("div")
  menuItem.className = "menu-item"

  let imageElement
  if (item.imageUrl) {
    imageElement = `<img src="${item.imageUrl}" class="menu-item-image" alt="${escapeHtml(item.name)}" style="width: 100%; height: 250px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="menu-item-image fallback-image" style="display: none;">🍽️ ${escapeHtml(item.name)}</div>`
  } else {
    const errorMsg = item.imageError ? ` (${item.imageError})` : ""
    imageElement = `<div class="menu-item-image fallback-image">🍽️ ${escapeHtml(item.name)}${errorMsg}</div>`
  }

  menuItem.innerHTML = `
        ${imageElement}
        <div class="menu-item-content">
            <div class="menu-item-name">${escapeHtml(item.name)}</div>
            <div class="menu-item-description">${escapeHtml(item.description)}</div>
            <div class="menu-item-price">💰 ${escapeHtml(item.price)}</div>
            ${item.nutrition ? `<div class="menu-item-nutrition">📊 ${escapeHtml(item.nutrition)}</div>` : ""}
        </div>
    `

  menuGrid.appendChild(menuItem)

  // Enhanced animation
  menuItem.style.opacity = "0"
  menuItem.style.transform = "translateY(30px) scale(0.95)"
  menuItem.style.transition = "all 0.6s ease"
  requestAnimationFrame(() => {
    menuItem.style.opacity = "1"
    menuItem.style.transform = "translateY(0) scale(1)"
  })
}

// Function to download individual item images
function downloadItemImage(itemName, base64Data, mimeType) {
  try {
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${itemName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading image:", error)
    showError("Failed to download image. Please try again.")
  }
}

// Utility function to escape HTML to prevent XSS - Fixed to handle null/undefined values
function escapeHtml(unsafe) {
  // Handle null, undefined, or non-string values
  if (unsafe == null || typeof unsafe !== "string") {
    return ""
  }

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// ===== INTRO SCREEN FUNCTIONALITY =====
// Function to start the app (hide intro screen)
function startApp() {
  const introScreen = document.getElementById("introScreen")
  const container = document.querySelector(".container")

  // Add fade-out class to intro screen
  introScreen.classList.add("fade-out")

  // Hide intro screen after animation completes
  setTimeout(() => {
    introScreen.style.display = "none"
    // Make sure main container is visible
    if (container) {
      container.style.display = "block"
    }
  }, 800) // Match the CSS transition duration
}