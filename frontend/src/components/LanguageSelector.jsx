import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHandPeace, faHands } from '@fortawesome/free-solid-svg-icons'

const LanguageSelector = ({ selectedLanguage, onLanguageChange }) => {
  const languages = [
    {
      code: 'bisindo',
      name: 'BISINDO',
      fullName: 'Bahasa Isyarat Indonesia',
      // description: 'Sistem bahasa isyarat yang berkembang secara alami di komunitas tuli Indonesia'
      icon: faHands,
    },
    {
      code: 'sibi',
      name: 'SIBI',
      fullName: 'Sistem Isyarat Bahasa Indonesia',
      // description: 'Sistem isyarat yang dikembangkan secara formal untuk pendidikan'
      icon: faHandPeace,
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">Pilih Bahasa Isyarat</h2>
        <p className="text-gray-600">
          Pilih jenis bahasa isyarat yang ingin Anda terjemahkan
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {languages.map((language) => (
          <div
            key={language.code}
            className={`card-hover cursor-pointer transition-all duration-200 ${
              selectedLanguage === language.code
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                : 'hover:border-blue-300'
            }`}
            onClick={() => onLanguageChange(language.code)}
          >
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                selectedLanguage === language.code 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <span className="text-2xl font-bold">
                  <FontAwesomeIcon icon={language.icon} size="lg" />
                </span>
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${
                selectedLanguage === language.code ? 'text-blue-600' : 'text-gray-800'
              }`}>
                {language.name}
              </h3>
              
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {language.fullName}
              </h4>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {language.description}
              </p>

              {selectedLanguage === language.code && (
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Dipilih
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Language Info */}
      {selectedLanguage && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-800">
            <span className="font-medium">Bahasa yang dipilih:</span>{' '}
            {languages.find(lang => lang.code === selectedLanguage)?.fullName}
          </p>
        </div>
      )}
    </div>
  )
}

export default LanguageSelector