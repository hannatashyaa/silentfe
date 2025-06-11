import React, { useState } from 'react'
import { Bug, Info, Eye, EyeOff } from 'lucide-react'

const DebugPanel = ({ lastPrediction, isVisible = false }) => {
  const [showDebug, setShowDebug] = useState(isVisible)

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 z-50"
        title="Show Debug Panel"
      >
        <Bug className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Bug className="w-4 h-4" />
          Debug Panel
        </h4>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {lastPrediction ? (
        <div className="space-y-3 text-sm">
          {/* Basic Result */}
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium text-blue-800 mb-1">Prediction Result</div>
            <div className="text-blue-700">
              <div><strong>Letter:</strong> {lastPrediction.prediction || 'None'}</div>
              <div><strong>Confidence:</strong> {lastPrediction.confidence ? `${(lastPrediction.confidence * 100).toFixed(1)}%` : 'N/A'}</div>
              <div><strong>Dataset:</strong> {lastPrediction.dataset || 'Unknown'}</div>
            </div>
          </div>

          {/* Processing Info */}
          {lastPrediction.processing_info && (
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-800 mb-1">Processing Info</div>
              <div className="text-green-700">
                <div><strong>Source:</strong> {lastPrediction.processing_info.source}</div>
                <div><strong>Dimensions:</strong> {lastPrediction.processing_info.dimensions}</div>
                <div><strong>Mirrored:</strong> {lastPrediction.processing_info.mirrored ? 'Yes' : 'No'}</div>
                <div><strong>Preprocessing:</strong> {lastPrediction.processing_info.preprocessing ? 'Enabled' : 'Disabled'}</div>
                <div><strong>Endpoint:</strong> {lastPrediction.processing_info.endpoint}</div>
              </div>
            </div>
          )}

          {/* Top Predictions */}
          {lastPrediction.top_predictions && lastPrediction.top_predictions.length > 0 && (
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium text-purple-800 mb-1">Top Predictions</div>
              <div className="space-y-1">
                {lastPrediction.top_predictions.slice(0, 3).map((pred, idx) => (
                  <div key={idx} className="text-purple-700 flex justify-between">
                    <span>{pred.label}</span>
                    <span>{(pred.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance */}
          {lastPrediction.processing_time && (
            <div className="bg-orange-50 p-3 rounded">
              <div className="font-medium text-orange-800 mb-1">Performance</div>
              <div className="text-orange-700">
                <div><strong>Processing Time:</strong> {(lastPrediction.processing_time * 1000).toFixed(0)}ms</div>
                <div><strong>Model:</strong> {lastPrediction.model_type || 'Unknown'}</div>
              </div>
            </div>
          )}

          {/* Error Info */}
          {!lastPrediction.success && (
            <div className="bg-red-50 p-3 rounded">
              <div className="font-medium text-red-800 mb-1">Error Details</div>
              <div className="text-red-700 text-xs">
                {lastPrediction.error || 'Unknown error'}
              </div>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="bg-yellow-50 p-3 rounded">
            <div className="font-medium text-yellow-800 mb-1">Tips</div>
            <div className="text-yellow-700 text-xs space-y-1">
              {lastPrediction.confidence && lastPrediction.confidence < 0.6 && (
                <div>⚠️ Low confidence - try better lighting or clearer hand position</div>
              )}
              {lastPrediction.processing_info?.source === 'camera' && (
                <div>📷 Camera mode - using real-time preprocessing</div>
              )}
              {lastPrediction.processing_info?.source === 'upload' && (
                <div>📤 Upload mode - using file preprocessing</div>
              )}
              <div>💡 Different preprocessing may give different results</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm text-center py-4">
          <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          No prediction data yet.
          <br />
          Make a prediction to see debug info.
        </div>
      )}
    </div>
  )
}

export default DebugPanel