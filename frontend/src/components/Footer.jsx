import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram } from 'lucide-react'
import logo from '../assets/logo.png'

const Footer = () => {
  return (
    <footer className="bg-[#009DFF] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <div className="flex flex-col items-center md:items-start mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                <img src={logo} alt="SILENT Logo" className="w-12 h-12 object-contain rounded-lg p-1" />
              </div>
              <span className="font-bold text-xl">SILENT</span>
            </div>
            <p className="text-blue-100 text-sm">
              interpretasi dan penerjemah ekspresi bahasa isyarat
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-blue-100 hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/translate" className="text-blue-100 hover:text-white transition-colors">
                  Terjemahan
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-blue-100 hover:text-white transition-colors">
                  Riwayat
                </Link>
              </li>
            </ul>
          </div>

          {/* Our Services */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Layanan Kami</h3>
            <ul className="space-y-2 text-blue-100 text-sm">
              <li>Terjemahan Isyarat Real-time</li>
              <li>Terjemahan Berbasis Gambar</li>
              <li>Terjemahan Berbasis Kamera</li>
              <li>Integrasi API untuk Aksesibilitas</li>
            </ul>
          </div>

          {/* Community & Support */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Komunitas & Dukungan</h3>
            <ul className="space-y-2 text-blue-100 text-sm">
              <li>Forum Komunitas</li>
              <li>Kontribusi Data</li>
              <li>Kolaborasi Riset</li>
              <li>Laporkan Masalah</li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-blue-600 mt-12 pt-8">
          <div className="flex flex-col items-center md:flex-row md:justify-between gap-4">
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Instagram size={20} />
              </a>
            </div>

            {/* Copyright */}
            <div className="text-blue-100 text-sm text-center md:text-right">
              © 2025 BISINDO & SIBI Translator.
            </div>
          </div>
        </div>
      </div>
    </footer>

  )
}

export default Footer