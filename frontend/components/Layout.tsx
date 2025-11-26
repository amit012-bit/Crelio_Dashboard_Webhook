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
import Footer from './Footer'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F6F7FB' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F6F7FB' }}>
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

