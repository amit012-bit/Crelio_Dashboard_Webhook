/**
 * Footer Component
 * 
 * Displays footer with copyright and purchase link
 */

export default function Footer() {
  return (
    <footer className="py-6 px-6 border-t border-gray-200" style={{ backgroundColor: '#F6F7FB' }}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <p className="text-sm text-gray-500">
          © 2024 Multipurpose Themes. All Rights Reserved.
        </p>
        <a
          href="#"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Purchase Now
        </a>
      </div>
    </footer>
  )
}

