// Camera processing utilities for consistent sign language detection
export class CameraProcessor {
  constructor() {
    // Standard processing parameters for sign language detection
    this.STANDARD_WIDTH = 640
    this.STANDARD_HEIGHT = 480
    this.JPEG_QUALITY = 0.95
    this.PREPROCESSING_ENABLED = true
  }

  /**
   * Create a standardized canvas from video element
   * This ensures consistent processing between camera and upload
   */
  createStandardizedCanvas(video, options = {}) {
    const {
      width = this.STANDARD_WIDTH,
      height = this.STANDARD_HEIGHT,
      mirrored = true,
      preprocessing = this.PREPROCESSING_ENABLED
    } = options

    // Create canvas with exact dimensions
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw video frame with proper scaling and mirroring
    ctx.save()
    
    if (mirrored) {
      // Mirror horizontally for natural hand movements
      ctx.scale(-1, 1)
      ctx.drawImage(video, -width, 0, width, height)
    } else {
      ctx.drawImage(video, 0, 0, width, height)
    }
    
    ctx.restore()

    // Apply preprocessing if enabled
    if (preprocessing) {
      this.applyPreprocessing(ctx, canvas)
    }

    return canvas
  }

  /**
   * Apply preprocessing to improve sign language detection
   * This matches the backend preprocessing expectations
   */
  applyPreprocessing(ctx, canvas) {
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 1. Normalize brightness - crucial for consistent detection
      const brightnessFactor = this.calculateOptimalBrightness(data)
      
      // 2. Enhance contrast for better hand-background separation
      const contrastFactor = 1.15

      // 3. Apply color space adjustments
      for (let i = 0; i < data.length; i += 4) {
        // Get RGB values
        let r = data[i]
        let g = data[i + 1] 
        let b = data[i + 2]

        // Apply brightness normalization
        r = Math.min(255, r * brightnessFactor)
        g = Math.min(255, g * brightnessFactor)
        b = Math.min(255, b * brightnessFactor)

        // Apply contrast enhancement
        r = Math.min(255, Math.max(0, (r - 128) * contrastFactor + 128))
        g = Math.min(255, Math.max(0, (g - 128) * contrastFactor + 128))
        b = Math.min(255, Math.max(0, (b - 128) * contrastFactor + 128))

        // Store processed values
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        // Alpha channel remains unchanged
      }

      // Apply processed data back to canvas
      ctx.putImageData(imageData, 0, 0)

      // 4. Apply slight gaussian blur to reduce noise (similar to backend)
      ctx.filter = 'blur(0.5px)'
      ctx.drawImage(canvas, 0, 0)
      ctx.filter = 'none'

    } catch (error) {
      console.warn('Preprocessing failed, using original image:', error)
    }
  }

  /**
   * Calculate optimal brightness based on image histogram
   */
  calculateOptimalBrightness(data) {
    let totalBrightness = 0
    let pixelCount = 0

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Calculate perceived brightness
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
      totalBrightness += brightness
      pixelCount++
    }

    const avgBrightness = totalBrightness / pixelCount
    const targetBrightness = 128 // Target middle brightness

    // Calculate adjustment factor
    let factor = targetBrightness / avgBrightness

    // Clamp factor to reasonable range
    factor = Math.max(0.7, Math.min(1.5, factor))

    return factor
  }

  /**
   * Convert canvas to high-quality base64 for API
   */
  canvasToBase64(canvas, format = 'image/jpeg', quality = this.JPEG_QUALITY) {
    try {
      return canvas.toDataURL(format, quality)
    } catch (error) {
      console.error('Failed to convert canvas to base64:', error)
      // Fallback with lower quality
      return canvas.toDataURL('image/jpeg', 0.8)
    }
  }

  /**
   * Create optimized blob for API upload
   */
  async canvasToBlob(canvas, format = 'image/jpeg', quality = this.JPEG_QUALITY) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      }, format, quality)
    })
  }

  /**
   * Process video frame for camera prediction
   * This method ensures consistency with upload processing
   */
  async processVideoFrame(video, options = {}) {
    try {
      // Create standardized canvas
      const canvas = this.createStandardizedCanvas(video, options)
      
      // Convert to base64 for camera API
      const dataURL = this.canvasToBase64(canvas)
      
      // Also create blob for potential fallback
      const blob = await this.canvasToBlob(canvas)
      
      return {
        dataURL,
        blob,
        canvas,
        width: canvas.width,
        height: canvas.height
      }
    } catch (error) {
      console.error('Video frame processing failed:', error)
      throw new Error('Failed to process video frame for prediction')
    }
  }

  /**
   * Validate video element is ready for processing
   */
  isVideoReady(video) {
    return video && 
           video.readyState >= 2 && 
           video.videoWidth > 0 && 
           video.videoHeight > 0 &&
           !video.paused &&
           !video.ended
  }

  /**
   * Get optimal capture timing (avoid motion blur)
   */
  async waitForStableFrame(video, maxWait = 100) {
    return new Promise((resolve) => {
      let attempts = 0
      const maxAttempts = maxWait / 16 // ~60fps check rate

      const checkFrame = () => {
        if (this.isVideoReady(video) || attempts >= maxAttempts) {
          resolve(true)
          return
        }
        
        attempts++
        requestAnimationFrame(checkFrame)
      }

      checkFrame()
    })
  }
}

// Create singleton instance
export const cameraProcessor = new CameraProcessor()

// Utility functions for easier use
export const processVideoForPrediction = async (video, options = {}) => {
  return cameraProcessor.processVideoFrame(video, options)
}

export const createStandardCanvas = (video, options = {}) => {
  return cameraProcessor.createStandardizedCanvas(video, options)
}

export const isVideoElementReady = (video) => {
  return cameraProcessor.isVideoReady(video)
}