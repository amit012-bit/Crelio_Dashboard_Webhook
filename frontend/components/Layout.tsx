/**
 * Layout Component
 * 
 * Main layout wrapper that includes:
 * - Sidebar navigation
 * - Top header/navbar
 * - Main content area
 * 
 * This component provides the overall structure for all pages.
 */

import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}

