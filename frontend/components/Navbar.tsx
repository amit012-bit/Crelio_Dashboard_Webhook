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
import { motion } from 'framer-motion'

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Search */}
        <div className="flex items-center space-x-4 flex-1">
          <h2 className="text-2xl font-bold text-gray-800">Crelio</h2>
          <div className="hidden md:flex flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Right side - Icons and Profile */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            title="Notifications"
          >
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Chat */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Chat"
          >
            💬
          </button>

          {/* Language/Region */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Language"
          >
            🇺🇸
          </button>

          {/* Fullscreen */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Fullscreen"
          >
            ⛶
          </button>

          {/* Grid/Menu */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Menu"
          >
            ⊞
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
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

