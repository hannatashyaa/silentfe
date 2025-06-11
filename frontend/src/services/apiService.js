// DEBUGGING VERSION - apiService.js
class DebugApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 
                   import.meta.env.VITE_API_BASE_URL || 
                   'https://silenbek-production.up.railway.app'

    this.timeout = 30000
    
    console.log('🚀 DebugApiService initialized')
    console.log('📡 Backend URL:', this.baseURL)
    console.log('🌍 Environment:', import.meta.env.MODE)
    
    // Test connection immediately
    this.testConnectionOnInit()
  }

  async testConnectionOnInit() {
    try {
      console.log('🧪 Testing initial connection...')
      const health = await this.healthCheck()
      console.log('✅ Backend connected:', health)
      
      const models = await this.getModelInfo()
      console.log('🤖 Model status:', models)
    } catch (error) {
      console.error('❌ Initial connection failed:', error)
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      timeout: this.timeout,
      ...options,
      headers: {
        'User-Agent': 'SILENT-Frontend/1.0',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    console.log('📤 Making request:', {
      url,
      method: config.method || 'GET',
      hasBody: !!config.body,
      headers: config.headers
    })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Request failed:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Response data:', data)
      return data
    } catch (error) {
      console.error('💥 Request error:', error)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Please check your internet connection and try again')
      }
      
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Network error - Cannot connect to backend at ${this.baseURL}`)
      }
      
      throw error
    }
  }

  async healthCheck() {
    console.log('🏥 Performing health check...')
    const response = await this.request('/api/health')
    console.log('💚 Health check result:', response)
    return response
  }

  async getModelInfo() {
    console.log('🤖 Getting model info...')
    const response = await this.request('/api/models')
    console.log('📊 Model info:', response)
    return response
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      console.log('🖼️ Converting file to base64:', {
        name: file.name,
        type: file.type,
        size: file.size
      })
      
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result
        const base64Data = base64.split(',')[1]
        console.log('✅ Base64 conversion complete, length:', base64Data.length)
        resolve(base64Data)
      }
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error)
        reject(error)
      }
      reader.readAsDataURL(file)
    })
  }

  async predictImage(imageInput, language = 'bisindo') {
    try {
      console.log('🔮 Starting prediction...')
      console.log('📋 Input params:', { hasImage: !!imageInput, language })
      
      let imageFile = null
      
      if (imageInput instanceof FormData) {
        imageFile = imageInput.get('image')
        const formLanguage = imageInput.get('dataset_type')
        if (formLanguage) language = formLanguage
        console.log('📦 Extracted from FormData:', { hasImageFile: !!imageFile, language })
      } else if (imageInput instanceof File || imageInput instanceof Blob) {
        imageFile = imageInput
        console.log('📁 Direct file input:', { type: imageFile.type, size: imageFile.size })
      } else {
        throw new Error('Invalid image input type')
      }

      if (!imageFile) {
        throw new Error('No image file found in input')
      }

      this.validateImageFile(imageFile)

      console.log('🔄 Converting to base64...')
      const base64Image = await this.fileToBase64(imageFile)
      console.log('✅ Base64 conversion complete')

      console.log('📡 Sending to backend...')
      const requestData = {
        image: base64Image,
        language_type: language
      }
      
      console.log('📤 Request payload:', {
        has_image: !!requestData.image,
        image_length: requestData.image?.length,
        language_type: requestData.language_type
      })

      const response = await this.request('/api/translate', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })

      console.log('🎉 Prediction response:', response)
      return response
    } catch (error) {
      console.error('💥 Prediction failed:', error)
      throw error
    }
  }

  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp']
    const maxSize = 16 * 1024 * 1024 // 16MB

    console.log('🔍 Validating image file:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    if (!allowedTypes.includes(file.type)) {
      const error = 'Invalid file type. Please use JPEG, PNG, or BMP images.'
      console.error('❌ Validation failed:', error)
      throw new Error(error)
    }

    if (file.size > maxSize) {
      const error = 'File too large. Maximum size is 16MB.'
      console.error('❌ Validation failed:', error)
      throw new Error(error)
    }

    console.log('✅ File validation passed')
    return true
  }

  async debugFullFlow() {
    console.log('🔧 === FULL DEBUG FLOW ===')
    
    try {
      // 1. Health check
      console.log('1️⃣ Testing health check...')
      const health = await this.healthCheck()
      
      // 2. Model info
      console.log('2️⃣ Testing model info...')
      const models = await this.getModelInfo()
      
      // 3. Test alphabet prediction
      console.log('3️⃣ Testing alphabet prediction...')
      
      // Create a simple test image (1x1 pixel)
      const testImageB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      
      try {
        const testResult = await this.request('/api/translate', {
          method: 'POST',
          body: JSON.stringify({
            image: testImageB64,
            language_type: 'bisindo'
          })
        })
        
        console.log('✅ Test prediction result:', testResult)
        
        // Validate it's alphabet only
        const isAlphabet = /^[A-Z]$/.test(testResult.prediction)
        console.log(`📝 Prediction "${testResult.prediction}" is valid alphabet: ${isAlphabet}`)
        
      } catch (predError) {
        console.error('❌ Test prediction failed:', predError)
      }
      
      console.log('4️⃣ Backend tests completed')
      
      return {
        health,
        models,
        status: 'debug_complete'
      }
      
    } catch (error) {
      console.error('💥 Debug flow failed:', error)
      throw error
    }
  }
}

// Export debug version
export const apiService = new DebugApiService()
export default DebugApiService

// Add global debug function
window.debugAPI = () => {
  return apiService.debugFullFlow()
}

console.log('🔧 Debug API Service loaded - run window.debugAPI() to test')