import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, CameraOff, Loader, Square, Timer, Play, Pause, FlipHorizontal2, Type, Trash2, Space, Copy, RotateCcw } from 'lucide-react'
import { apiService } from '../services/apiService'

const CameraCapture = ({ language, onPrediction }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const autoIntervalRef = useRef(null)
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState(null)
  const [lastCapture, setLastCapture] = useState(null)
  const [backendStatus, setBackendStatus] = useState(null)
  
  // Camera features
  const [isMirrored, setIsMirrored] = useState(true)
  const [isAutoCapture, setIsAutoCapture] = useState(false)
  const [timerMode, setTimerMode] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(3)
  const [countdown, setCountdown] = useState(0)
  const [captureCount, setCaptureCount] = useState(0)

  // IMPROVED: Auto Letter Display System (Always Active)
  const [letterSequence, setLetterSequence] = useState([])
  // GLOBAL: Track last prediction to prevent ANY double calls
  const lastPredictionRef = useRef(0)
  const isProcessingRef = useRef(false)
  // GLOBAL: Track to prevent double history entries
  const lastHistoryRef = useRef(0)
  const sentToHistoryRef = useRef(new Set())
  // CLEAN: Single source of truth for prediction calls
  const isTimerActiveRef = useRef(false)
  const predictionSourceRef = useRef('manual')
  const [sequenceHistory, setSequenceHistory] = useState([])

  // Check backend connectivity on component mount
  useEffect(() => {
    checkBackendConnectivity()
  }, [])

  const checkBackendConnectivity = async () => {
    try {
      console.log('Checking backend connectivity...')
      const available = await apiService.isBackendAvailable()
      
      if (available) {
        console.log('Backend is available')
        setBackendStatus('connected')
        try {
          const status = await apiService.getApiStatus()
          console.log('Backend status:', status)
        } catch (err) {
          console.warn('Could not get full backend status:', err)
        }
      } else {
        console.log('Backend is not available')
        setBackendStatus('disconnected')
        setError('Backend server tidak tersedia. Pastikan server Python berjalan di http://localhost:5000')
      }
    } catch (err) {
      console.error('Backend connectivity check failed:', err)
      setBackendStatus('error')
      setError(`Backend error: ${err.message}`)
    }
  }

  const startCamera = async () => {
    setError(null)
    setIsLoading(true)

    try {
      console.log('🎥 Requesting camera access...')
      
      if (!videoRef.current) {
        throw new Error('Video element not found')
      }
      
      const constraints = { 
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30 }
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!stream || !stream.active) {
        throw new Error('Failed to get active camera stream')
      }
      
      streamRef.current = stream
      videoRef.current.srcObject = stream
      videoRef.current.autoplay = true
      videoRef.current.playsInline = true
      videoRef.current.muted = true
      
      await new Promise((resolve, reject) => {
        const video = videoRef.current
        
        const onLoadedMetadata = () => {
          console.log('📹 Video ready:', {
            width: video.videoWidth,
            height: video.videoHeight
          })
          cleanup()
          resolve()
        }
        
        const onError = (error) => {
          cleanup()
          reject(new Error('Video failed to load'))
        }
        
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
        
        setTimeout(() => {
          cleanup()
          reject(new Error('Video loading timeout'))
        }, 5000)
        
        if (video.readyState >= 1) {
          onLoadedMetadata()
        }
      })
      
      try {
        await videoRef.current.play()
      } catch (playError) {
        console.warn('Video play promise rejected (usually safe):', playError)
      }
      
      if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        throw new Error('Video dimensions not available')
      }
      
      setIsStreaming(true)
      setIsLoading(false)
      
      console.log('🎉 Camera ready!')
      
    } catch (err) {
      console.error('❌ Camera startup failed:', err)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      
      let errorMessage = 'Camera failed to start'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied - please allow camera access'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found - check camera connection'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is busy - close other apps using camera'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const stopCamera = () => {
    console.log('🛑 Stopping camera...')
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load()
    }
    
    setIsStreaming(false)
    setIsLoading(false)
    setIsCapturing(false)
    setIsAutoCapture(false)
    setError(null)
    
    clearTimers()
  }

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current)
      autoIntervalRef.current = null
    }
    
    // CLEAN: Reset all flags
    isTimerActiveRef.current = false
    predictionSourceRef.current = 'manual'
    setCountdown(0)
    
    console.log('🧹 CLEAN: All timers and flags reset')
  }

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    if (isMirrored) {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.1 + 128))
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.1 + 128))
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.1 + 128))
    }
    
    ctx.putImageData(imageData, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    })
  }, [isStreaming, isMirrored])

  // UNIVERSAL: Anti-double protection for ALL modes (Auto, Timer, Manual)
  const addLetterToSequence = (prediction, confidence) => {
    const currentTime = Date.now()
    
    // Universal cooldown for ALL modes
    if (currentTime - lastPredictionRef.current < 2500) {
      console.log(`⏳ UNIVERSAL Cooldown active, skipping: ${prediction} (${currentTime - lastPredictionRef.current}ms ago)`)
      return false
    }
    
    // Check for exact same letter in last 5 seconds
    const recentSame = letterSequence.find(item => 
      item.letter === prediction && 
      (currentTime - new Date(item.timestamp).getTime()) < 5000
    )
    
    if (recentSame) {
      console.log(`🚫 UNIVERSAL DUPLICATE BLOCKED: ${prediction} already exists in last 5 seconds`)
      return false
    }
    
    // Very low confidence threshold
    if (confidence >= 0.2) {
      const newLetter = {
        id: currentTime,
        letter: prediction,
        confidence: confidence,
        timestamp: new Date(),
        source: isAutoCapture ? 'auto' : (countdown > 0 ? 'timer' : 'manual')
      }
      
      setSequenceHistory(prev => [...prev.slice(-9), [...letterSequence]])
      setLetterSequence(prev => {
        const newSequence = [...prev, newLetter]
        console.log(`✅ UNIVERSAL ADD: ${prediction} (${(confidence * 100).toFixed(1)}%) from ${newLetter.source} mode - Total: ${newSequence.length}`)
        return newSequence
      })
      
      lastPredictionRef.current = currentTime
      console.log(`🎯 Letter added universally: ${prediction} from ${newLetter.source} mode`)
      return true
    } else {
      console.log(`❌ Confidence too low: ${prediction} (${(confidence * 100).toFixed(1)}%)`)
      return false
    }
  }

  // Sequence controls
  const clearSequence = () => {
    setSequenceHistory(prev => [...prev.slice(-9), [...letterSequence]])
    setLetterSequence([])
    console.log('Letter sequence cleared')
  }

  const undoLastLetter = () => {
    if (sequenceHistory.length > 0) {
      const previousSequence = sequenceHistory[sequenceHistory.length - 1]
      setLetterSequence(previousSequence)
      setSequenceHistory(prev => prev.slice(0, -1))
      console.log('Undid last letter')
    }
  }

  // FIXED: Add space to sequence (don't affect prediction flow)
  const addSpaceToSequence = () => {
    const spaceItem = {
      id: Date.now(),
      letter: ' ',
      confidence: 1.0,
      timestamp: new Date(),
      isSpace: true,
      source: 'manual'
    }
    
    setSequenceHistory(prev => [...prev.slice(-9), [...letterSequence]])
    setLetterSequence(prev => [...prev, spaceItem])
    
    // DON'T update lastPredictionTime - this allows next prediction to work normally
    console.log('✅ Space added to sequence - prediction flow continues normally')
  }

  const copySequenceText = () => {
    const text = letterSequence.map(item => item.letter).join('')
    navigator.clipboard.writeText(text)
    alert('Text copied to clipboard!')
  }

  // IMPROVED: Main prediction function with auto-sequence
  const predictFromCamera = useCallback(async () => {
    if (!isStreaming || !videoRef.current) return

    if (backendStatus !== 'connected') {
      setError('Backend tidak tersedia. Cek koneksi ke server Python.')
      return
    }

    try {
      setIsCapturing(true)
      setError(null)

      console.log('Capturing image from camera...')
      
      const imageBlob = await captureImage()
      if (!imageBlob) {
        throw new Error('Failed to capture image from camera')
      }

      console.log('Image captured, making prediction...')
      console.log('Using language:', language)

      setCaptureCount(prev => prev + 1)

      // Save last capture for preview
      const imageUrl = URL.createObjectURL(imageBlob)
      if (lastCapture) URL.revokeObjectURL(lastCapture)
      setLastCapture(imageUrl)

      console.log('Sending to backend API...')
      const result = await apiService.predictImage(imageBlob, language)
      
      console.log('Prediction result:', result)
      
      // SUPER STRICT: Only add once, with strong duplicate prevention
      if (result.success && result.prediction && result.prediction !== "No hand detected") {
        console.log(`🎯 ATTEMPTING to add "${result.prediction}" (confidence: ${result.confidence})`)
        const wasAdded = addLetterToSequence(result.prediction, result.confidence)
        console.log(`📊 Add result: ${wasAdded ? 'SUCCESS' : 'BLOCKED'}`)
      } else {
        console.log(`❌ SKIPPED: success=${result.success}, prediction="${result.prediction}"`)
      }
      
      // Send to parent for history (this might be causing the double in history too)
      console.log(`📤 Sending to history: ${result.prediction}`)
      onPrediction(result, imageUrl)

    } catch (err) {
      console.error('Prediction error:', err)
      
      let errorMessage = err.message || 'Failed to predict image'
      
      if (err.message.includes('Network error')) {
        errorMessage = 'Tidak bisa menghubungi server. Pastikan backend Python berjalan di http://localhost:5000'
        setBackendStatus('disconnected')
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Server terlalu lama merespons. Coba lagi.'
      }
      
      setError(errorMessage)
      
      onPrediction({
        success: false,
        error: errorMessage
      })
    } finally {
      setIsCapturing(false)
    }
  }, [isStreaming, captureImage, language, onPrediction, lastCapture, backendStatus, isAutoCapture])

  // CLEAN: Timer with explicit source tracking
  const startTimerCapture = () => {
    if (!isStreaming) return
    
    // CLEAN: Prevent multiple timer instances
    if (isTimerActiveRef.current) {
      console.log('⏰ TIMER: Already active, ignoring')
      return
    }

    clearTimers()
    isTimerActiveRef.current = true
    predictionSourceRef.current = 'timer'
    setCountdown(timerSeconds)
    
    console.log(`⏰ TIMER: Starting ${timerSeconds}s countdown`)
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          console.log(`⏰ TIMER: Countdown finished - calling prediction`)
          
          // CLEAN: Direct call with explicit source
          setTimeout(() => {
            if (isTimerActiveRef.current) { // Double check timer is still active
              predictFromCamera('timer')
            }
          }, 200)
          
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    timerRef.current = timer
  }

  // CLEAN: Auto capture with explicit source
  const toggleAutoCapture = () => {
    if (isAutoCapture) {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current)
        autoIntervalRef.current = null
      }
      setIsAutoCapture(false)
      predictionSourceRef.current = 'manual'
      console.log('🤖 AUTO: Stopped')
    } else {
      setIsAutoCapture(true)
      predictionSourceRef.current = 'auto'
      console.log('🤖 AUTO: Started')
      
      autoIntervalRef.current = setInterval(() => {
        if (!isCapturing && isStreaming && backendStatus === 'connected') {
          predictFromCamera('auto')
        }
      }, 3000)
    }
  }

  const toggleMirror = () => {
    setIsMirrored(!isMirrored)
    console.log('Mirror mode:', !isMirrored ? 'ON' : 'OFF')
  }

  // Auto-start camera when component mounts
  useEffect(() => {
    console.log('🚀 Component mounted - checking video element...')
    
    const checkAndStart = () => {
      if (videoRef.current) {
        console.log('Video element found, starting camera...')
        startCamera()
      } else {
        console.log('Video element not ready, retrying...')
        setTimeout(checkAndStart, 100)
      }
    }
    
    const initTimer = setTimeout(checkAndStart, 200)
    
    return () => {
      clearTimeout(initTimer)
      stopCamera()
      clearTimers()
      if (lastCapture) {
        URL.revokeObjectURL(lastCapture)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Backend Status Indicator */}
      {backendStatus && (
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              backendStatus === 'connected' ? 'bg-green-500' : 
              backendStatus === 'disconnected' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`}></div>
            <span className="text-sm font-medium">
              {
                backendStatus === 'connected' ? 'Connected' :
                backendStatus === 'disconnected' ? 'Disconnected' :
                'Checking...'
              }
            </span>
          </div>
          
          {backendStatus !== 'connected' && (
            <button
              onClick={checkBackendConnectivity}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Camera Controls Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Terjemahan Kamera Waktu Nyata
          {isStreaming && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Siaran Langsung
            </span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          {captureCount > 0 && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              📸 {captureCount}
            </span>
          )}
          
          {!isStreaming && !isLoading ? (
            <button
              onClick={startCamera}
              className="btn-primary flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Mulai Kamera
            </button>
          ) : isLoading ? (
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed"
            >
              <Loader className="w-4 h-4 animate-spin" />
              Memulai...
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <CameraOff className="w-4 h-4" />
              Berhenti Kamera
            </button>
          )}
        </div>
      </div>

      {/* Camera Preview */}
      <div className="relative">
        <div className="camera-preview bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${
              isStreaming ? 'block' : 'hidden'
            }`}
          />
          
          {isLoading && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-blue-50">
              <div className="text-center">
                <Camera className="w-12 h-12 text-blue-500 mx-auto mb-2 animate-pulse" />
                <p className="text-blue-700 font-medium">Connecting to camera...</p>
                <div className="mt-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              </div>
            </div>
          )}
          
          {!isLoading && !isStreaming && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">Kamera Otomatis-Mulai</p>
                <button 
                  onClick={startCamera}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {isLoading ? 'Starting...' : 'Manual Start'}
                </button>
              </div>
            </div>
          )}
        </div>

        {isCapturing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Prediksi...</p>
            </div>
          </div>
        )}

        {isAutoCapture && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Mode Otomatis • Huruf Otomatis-Tertambah
          </div>
        )}

        {countdown > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <div className="text-6xl font-bold mb-2">{countdown}</div>
              <p className="text-lg">Bersiap...</p>
            </div>
          </div>
        )}

        {isMirrored && isStreaming && (
          <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            Mode Cermin
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* FIXED: Letter Sequence Display - ALWAYS show when has letters */}
      {letterSequence.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-green-900 flex items-center gap-2">
              🔤 Urutan Huruf Langsung
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                {letterSequence.filter(item => !item.isSpace).length} Huruf
              </span>
            </h4>
            <div className="flex items-center gap-2">
              {sequenceHistory.length > 0 && (
                <button
                  onClick={undoLastLetter}
                  className="text-orange-500 hover:text-orange-700 p-1"
                  title="Undo last letter"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={clearSequence}
                className="text-red-500 hover:text-red-700 p-1"
                title="Clear sequence"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Letter Display - Clean A L V I N format */}
          <div className="text-center mb-4">
            <div className="flex justify-center items-center gap-3 flex-wrap mb-3">
              {letterSequence.map((item, index) => (
                <div
                  key={item.id}
                  className={`
                    relative
                    ${item.isSpace ? 'w-6 h-8 bg-gray-300' : 'w-14 h-14 bg-white border-2 border-green-300 shadow-lg'}
                    rounded-lg flex items-center justify-center
                    transition-all duration-300 hover:scale-105
                    ${item.source === 'auto' ? 'ring-2 ring-blue-400' : ''}
                    ${item.source === 'timer' ? 'ring-2 ring-purple-400' : ''}
                  `}
                  title={item.isSpace ? 'Space' : `${item.letter} (${(item.confidence * 100).toFixed(0)}%) - ${item.source}`}
                >
                  {!item.isSpace && (
                    <>
                      <span className="text-3xl font-bold text-green-600">
                        {item.letter}
                      </span>
                      <span className="absolute -bottom-1 text-xs text-gray-500 bg-white px-1 rounded border">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                      {item.source === 'auto' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" title="Auto capture"></span>
                      )}
                      {item.source === 'timer' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" title="Timer capture"></span>
                      )}
                      {item.source === 'manual' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" title="Manual capture"></span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {/* Statistics */}
            <p className="text-green-700 text-sm mb-3">
              {letterSequence.filter(item => !item.isSpace).length} Huruf • {letterSequence.filter(item => item.isSpace).length} Spasi
              • Confidence: {letterSequence.length > 0 ? 
                (letterSequence.filter(item => !item.isSpace).reduce((acc, item) => acc + item.confidence, 0) / 
                letterSequence.filter(item => !item.isSpace).length * 100).toFixed(0) : 0}% Rata-rata
            </p>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-2 flex-wrap mb-3">
              <button
                onClick={addSpaceToSequence}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"
              >
                <Space className="w-3 h-3" />
                Tambah Spasi
              </button>
              <button
                onClick={copySequenceText}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Salin Text
              </button>
            </div>
          </div>
          
          {/* Final Text Preview */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-gray-600 text-sm mb-2">Hasil Terjemahan:</p>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2 tracking-wider">
                {letterSequence.map(item => item.letter).join('')}
              </div>
              <p className="text-green-700 text-sm">
                {letterSequence.filter(item => !item.isSpace).length} huruf berhasil diterjemahkan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder message when no letters yet */}
      {letterSequence.length === 0 && isStreaming && backendStatus === 'connected' && (
        <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center">
          <div className="text-blue-400 mb-2">
            <Type className="w-8 h-8 mx-auto" />
          </div>
          <h4 className="font-medium text-blue-900 mb-2">Siap untuk Terjemahan</h4>
          <p className="text-blue-700 text-sm">
            Huruf akan muncul secara otomatis di sini setelah capture pertama
          </p>
        </div>
      )}

      {/* Camera Features */}
      {isStreaming && backendStatus === 'connected' && (
        <div className="space-y-4">
          {/* Camera Settings */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Camera Settings</span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMirror}
                className={`p-2 rounded-lg flex items-center gap-1 text-sm ${
                  isMirrored 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Toggle Mirror Mode"
              >
                <FlipHorizontal2 className="w-4 h-4" />
                {isMirrored ? 'Cermin Nyala' : 'Cermin Mati'}
              </button>
            </div>
          </div>

          {/* Capture Controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                predictionSourceRef.current = 'manual'
                predictFromCamera('manual')
              }}
              disabled={!isStreaming || isCapturing || backendStatus !== 'connected'}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCapturing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {isCapturing ? 'Predicting...' : 'Tangkap sekarang'}
            </button>

            <button
              onClick={startTimerCapture}
              disabled={!isStreaming || isCapturing || countdown > 0 || backendStatus !== 'connected'}
              className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Timer className="w-4 h-4" />
              Tangkap Pengatur Waktu ({timerSeconds}s)
            </button>

            <button
              onClick={toggleAutoCapture}
              disabled={backendStatus !== 'connected'}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                isAutoCapture
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {isAutoCapture ? (
                <>
                  <Pause className="w-4 h-4" />
                  Hentikan Otomatis
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Tangkap Otomatis
                </>
              )}
            </button>

            <div className="flex items-center gap-1">
              <select
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={3}>3 detik</option>
                <option value={5}>5 detik</option>
                <option value={10}>10 detik</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Last Capture Preview */}
      {lastCapture && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Last Capture:</h4>
          <img
            src={lastCapture}
            alt="Last capture"
            className="w-32 h-24 object-cover rounded-lg border border-gray-200 mx-auto"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Petunjuk Penggunaan:</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <strong>Tampilan Huruf Otomatis:</strong> Huruf akan muncul otomatis di bawah kamera saat prediksi berhasil (min 20%)</li>
          <li>• <strong>Tangkap Otomatis:</strong> Ambil foto otomatis setiap 3 detik - huruf langsung muncul</li>
          <li>• <strong>Tangkap Pengatur Waktu:</strong> Countdown capture - huruf juga langsung muncul</li>
          <li>• <strong>Tangkap Manual:</strong> Klik "Capture Now" - huruf akan ditambahkan otomatis</li>
          <li>• <strong>Mode Cermin NYALA:</strong> Untuk tangan kiri (natural movement)</li>
          <li>• <strong>Mode Cermin MATI:</strong> Untuk tangan kanan atau 2 tangan (BISINDO)</li>
          <li>• Confidence minimum 20% untuk ditambahkan ke sequence (sangat permisif)</li>
          <li>• <strong>Perlindungan Riwayat:</strong> Mencegah double entry di sidebar history</li>
          <li>• Cooldown history 1.5 detik + unique key system untuk semua mode</li>
          <li>• Cooldown global 2.5 detik + duplicate check 5 detik untuk semua mode</li>
          <li>• Mengabaikan "No hand detected" secara otomatis</li>
          <li>• Add Space tidak mengganggu prediksi selanjutnya</li>
          <li>• Gunakan "Tambah Spasi", "Batalkan", dan "Salin" untuk kontrol sequence</li>
          <li>• Huruf dengan dot hijau = otomatis dari Auto/Timer mode</li>
        </ul>
      </div>
    </div>
  )
}

export default CameraCapture