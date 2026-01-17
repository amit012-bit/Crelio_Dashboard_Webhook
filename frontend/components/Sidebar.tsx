import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter()

  const dashboardItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: '🏠', // House icon
      isMain: true,
    },
    {
      title: 'Dashboard',
      path: '/',
      icon: '●', // Small circle for sub-item
      isSubItem: true,
    },
    {
      title: 'Patients',
      path: '/patients',
      icon: '👥', // Two people icon
    }
  ]

  const isActive = (path: string) => router.pathname === path

  return (
    <motion.aside
      className={`bg-white text-gray-800 transition-all duration-300 border-r border-gray-200 ${
        isOpen ? 'w-52' : 'w-20'
      }`}
      initial={false}
      animate={{ width: isOpen ? 208 : 80 }}
    >
      <div className="py-4">
        {/* Logo/Header - hidden when collapsed */}
        {isOpen && (
          <div className="px-4 mb-6">
            <h1 className="text-xl font-bold text-gray-800">Crelio</h1>
          </div>
        )}

        <nav className="space-y-1">
          {/* DASHBOARD Section */}
          {isOpen && (
            <div className="px-4 mb-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                DASHBOARD
              </h2>
            </div>
          )}

          {dashboardItems.map((item, index) => {
            const active = isActive(item.path) && !item.isSubItem
            const isSubItemActive = isActive(item.path) && item.isSubItem
            
            return (
              <Link
                key={index}
                href={item.path}
                className={`relative flex items-center px-4 py-2.5 transition-colors ${
                  active || isSubItemActive
                    ? 'text-teal-500'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${item.isSubItem ? 'ml-6' : ''}`}
              >
                {/* Vertical bar for active main item only */}
                {active && item.isMain && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r"></div>
                )}

                {/* Icon - different styling for sub-item */}
                {item.isSubItem ? (
                  <span className={`text-xs mr-3 ${isSubItemActive ? 'text-teal-500' : 'text-gray-400'}`}>
                    ●
                  </span>
                ) : (
                  <span className={`text-lg mr-3 ${active ? 'text-teal-500' : 'text-gray-600'}`}>
                    {item.icon}
                  </span>
                )}

                {/* Text */}
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex-1 text-sm font-medium ${
                      active || isSubItemActive ? 'text-teal-500' : 'text-gray-700'
                    }`}
                  >
                    {item.title}
                  </motion.span>
                )}

                {/* Checkmark for active main item or arrow for inactive non-sub items */}
                {isOpen && (
                  <span className="ml-auto">
                    {active && item.isMain ? (
                      <span className="text-teal-500 text-sm font-semibold">✓</span>
                    ) : !active && !item.isSubItem ? (
                      <span className="text-gray-400 text-xs">→</span>
                    ) : null}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </motion.aside>
  )
}

