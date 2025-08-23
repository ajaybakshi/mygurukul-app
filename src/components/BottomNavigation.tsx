'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Clock, User } from 'lucide-react'

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home'
    },
    {
      href: '/submit',
      icon: MessageCircle,
      label: 'Ask'
    },
    {
      href: '/history',
      icon: Clock,
      label: 'History'
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile'
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bottom-nav z-50">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-spiritual-600 bg-spiritual-50'
                  : 'text-spiritual-400 hover:text-spiritual-600 hover:bg-spiritual-25'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-spiritual-600' : 'text-spiritual-400'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-spiritual-600' : 'text-spiritual-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
