import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logo from '../assets/logo.png'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Beranda', href: '/' },
    { name: 'Terjemahan', href: '/translate' },
    { name: 'Histori', href: '/history' },
    { name: 'Tentang Kami', href: '/about' },
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const isHomePage = location.pathname === '/'

  return (
    <header className="bg-[#009DFF] fixed top-0 w-full z-50">

      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={logo}
              alt="SILENT Logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg p-1"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-white hover:text-blue-200 transition-colors font-medium ${isActive(item.href)
                  ? 'text-blue-200 border-b-2 border-blue-200 pb-1'
                  : ''
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <Menu
                size={24}
                className={`transform transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''
                  }`}
              />

            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-blue-300 border-t border-blue-200 shadow-md z-40">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block py-2 px-4 rounded-md transition-all duration-200 font-medium ${isActive(item.href)
                      ? 'bg-blue-gradient text-white font-semibold'
                      : 'text-white hover:bg-blue-gradient'  // <-- ubah ini
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
