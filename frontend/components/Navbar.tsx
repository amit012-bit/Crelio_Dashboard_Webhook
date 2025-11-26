/**
 * Navbar Component
 * 
 * Top navigation bar with:
 * - Search bar
 * - Notifications
 * - User profile
 * - Settings icons
 */

import { useState } from 'react'
import { HiSearch, HiSun, HiMoon, HiBell, HiChat, HiGlobe, HiArrowsExpand, HiMenu } from 'react-icons/hi'

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Search */}
        <div className="flex items-center space-x-4 flex-1">
          <h2 className="text-xl font-bold text-gray-800">MedShell</h2>
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Right side - Icons and Profile */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            title="Toggle Dark Mode"
          >
            {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative text-gray-600"
            title="Notifications"
          >
            <HiBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Chat */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            title="Chat"
          >
            <HiChat className="w-5 h-5" />
          </button>

          {/* Language/Region */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            title="Language"
          >
            <HiGlobe className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            title="Fullscreen"
          >
            <HiArrowsExpand className="w-5 h-5" />
          </button>

          {/* Grid/Menu */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            title="Menu"
          >
            <HiMenu className="w-5 h-5" />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors ml-2">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              Admin
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

