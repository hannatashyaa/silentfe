import React, { useState, useEffect } from 'react'
import { Info, Brain, Database, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { apiService } from '../services/apiService'

const ModelInfo = ({ selectedLanguage }) => {
  const [modelInfo, setModelInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Fetch model information
  const fetchModelInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const info = await apiService.getModelInfo(selectedLanguage)
      setModelInfo(info)
    } catch (err) {
      console.error('Error fetching model info:', err)
      setError('Failed to load model information')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedLanguage) {
      fetchModelInfo()
    }
  }, [selectedLanguage])

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Model Information</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">Model Information</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!modelInfo) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600">Model Information</h3>
        </div>
        <p className="text-gray-500">Select a language to view model information</p>
      </div>
    )
  }

  const formatAccuracy = (accuracy) => {
    if (typeof accuracy === 'number') {
      return `${(accuracy * 100).toFixed(1)}%`
    }
    return 'N/A'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      return new Date(timestamp).toLocaleDateString()
    } catch {
      return timestamp
    }
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Model Information</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Accuracy</span>
          </div>
          <p className="text-xl font-bold text-blue-900">
            {formatAccuracy(modelInfo.accuracy)}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Model Type</span>
          </div>
          <p className="text-lg font-semibold text-green-900">
            {modelInfo.model_type || 'N/A'}
          </p>
        </div>
      </div>

      {/* Dataset Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Dataset Information</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Language:</span>
            <span className="font-medium ml-2">{selectedLanguage.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-gray-600">Classes:</span>
            <span className="font-medium ml-2">
              {modelInfo.classes ? modelInfo.classes.length : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Training Samples:</span>
            <span className="font-medium ml-2">
              {modelInfo.training_samples || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Test Samples:</span>
            <span className="font-medium ml-2">
              {modelInfo.test_samples || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Information */}
      {isExpanded && (
        <div className="space-y-4 fade-in">
          {/* Training Info */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Training Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-700">Training Time:</span>
                <span className="font-medium ml-2">
                  {modelInfo.training_time ? `${modelInfo.training_time.toFixed(2)}s` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-purple-700">Last Updated:</span>
                <span className="font-medium ml-2">
                  {formatDate(modelInfo.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Supported Classes */}
          {modelInfo.classes && (
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Supported Letters</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {modelInfo.classes.map((letter) => (
                  <span
                    key={letter}
                    className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs font-medium"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Model Status */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-medium">Model Status</span>
            </div>
            <span className="text-green-700 text-sm">Ready for Prediction</span>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Model performance may vary based on image quality and lighting conditions
        </p>
      </div>
    </div>
  )
}

export default ModelInfo