import React from 'react'
import { CheckCircle, AlertCircle, XCircle, Clock, Zap } from 'lucide-react'

const PredictionResult = ({ result }) => {
  if (!result) return null

  // Get confidence level and styling
  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.8) return { level: 'Tinggi', color: 'green', label: 'Tinggi' }
    if (confidence >= 0.6) return { level: 'Tengah', color: 'yellow', label: 'Tengah' }
    return { level: 'Rendah', color: 'red', label: 'Rendah' }
  }

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return <CheckCircle className="w-5 h-5" />
    if (confidence >= 0.6) return <AlertCircle className="w-5 h-5" />
    return <XCircle className="w-5 h-5" />
  }

  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <XCircle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">Prediksi gagal</h3>
        </div>
        <p className="text-red-700">{result.error || 'An error occurred during prediction'}</p>
        
        {/* Troubleshooting Tips */}
        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Troubleshooting Tips:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            <li>• Ensure the hand is clearly visible in the image</li>
            <li>• Check if the lighting is adequate</li>
            <li>• Make sure the image is not blurry</li>
            <li>• Try a different angle or hand position</li>
            <li>• For BISINDO: try using both hands</li>
            <li>• For SIBI: use single hand gestures</li>
          </ul>
        </div>
      </div>
    )
  }

  const confidence = result.confidence || 0
  const confidenceInfo = getConfidenceLevel(confidence)

  return (
    <div className={`prediction-result ${confidenceInfo.level}-confidence fade-in`}>
      {/* Main Result */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 bg-${confidenceInfo.color}-100 rounded-full flex items-center justify-center`}>
            <span className="text-3xl font-bold text-gray-800">{result.prediction}</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Huruf "{result.prediction}"
            </h3>
            <p className="text-gray-600">
              {result.dataset || result.language_type || 'Sign Language'} Pengakuan
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 text-${confidenceInfo.color}-600`}>
          {getConfidenceIcon(confidence)}
          <div className="text-right">
            <div className="font-medium">{confidenceInfo.label}</div>
            <div className="text-sm">akurasi</div>
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">akurasi score</span>
          <span className="text-sm font-bold text-gray-800">{(confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`bg-${confidenceInfo.color}-500 h-3 rounded-full transition-all duration-500`}
            style={{ width: `${confidence * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {result.processing_time && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {(result.processing_time * 1000).toFixed(0)}ms
            </span>
          </div>
        )}
        
        {result.model_type && (
          <div className="flex items-center gap-2 text-gray-600">
            <Zap className="w-4 h-4" />
            <span className="text-sm">{result.model_type}</span>
          </div>
        )}

        {result.timestamp && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {new Date(result.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-sm">
            {result.dataset || result.language_type || 'Unknown'} Model
          </span>
        </div>
      </div>

      {/* Confidence Interpretation */}
      <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Interpretasi:</h4>
        <p className="text-sm text-gray-700">
          {confidence >= 0.9 && "Luar biasa! Model tersebut sangat yakin dengan prediksi ini."}
          {confidence >= 0.8 && confidence < 0.9 && "Bagus! Model tersebut yakin dengan prediksi ini."}
          {confidence >= 0.6 && confidence < 0.8 && "Bagus! Modelnya cukup meyakinkan, tetapi Anda mungkin ingin mencoba lagi untuk mendapatkan akurasi yang lebih baik."}
          {confidence < 0.6 && "Model tersebut kurang percaya diri. Pertimbangkan untuk meningkatkan kualitas gambar atau posisi tangan."}
        </p>
      </div>

      {/* Alternative Predictions */}
      {result.all_predictions && Object.keys(result.all_predictions).length > 1 && (
        <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">INterpretasi alternatif:</h4>
          <div className="space-y-2">
            {Object.entries(result.all_predictions).map(([dataset, pred]) => (
              <div key={dataset} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{dataset.toUpperCase()}: {pred.prediction}</span>
                <span className="text-gray-600">{(pred.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(result.prediction)
              alert('Result copied to clipboard!')
            }
          }}
          className="btn-secondary text-sm flex-1"
        >
          📋 Salin Hasil
        </button>
        <button 
          onClick={() => {
            const resultText = `Sign Language: ${result.prediction} (${(confidence * 100).toFixed(1)}% confidence)`
            if (navigator.share) {
              navigator.share({ text: resultText })
            } else {
              // Fallback
              if (navigator.clipboard) {
                navigator.clipboard.writeText(resultText)
                alert('Result copied to clipboard!')
              }
            }
          }}
          className="btn-secondary text-sm flex-1"
        >
          📤 Bagikan
        </button>
      </div>
    </div>
  )
}

export default PredictionResult