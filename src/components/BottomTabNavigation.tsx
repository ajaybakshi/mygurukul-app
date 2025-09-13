'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

// TypeScript interfaces
interface TabItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  ariaLabel: string;
}

interface BottomTabNavigationProps {
  className?: string;
}

const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({ className = '' }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Tab configuration following spiritual aesthetic
  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: '🕉️',
      path: '/',
      ariaLabel: 'Navigate to Home - Sacred wisdom and daily guidance'
    },
    {
      id: 'ask',
      label: 'Ask',
      icon: '💬',
      path: '/submit',
      ariaLabel: 'Ask for guidance - Submit your spiritual questions'
    },
    {
      id: 'library',
      label: 'Library',
      icon: '📚',
      path: '/history',
      ariaLabel: 'Wisdom Library - Access your spiritual journey history'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/profile',
      ariaLabel: 'Sacred Profile - Your spiritual path and preferences'
    }
  ];

  const handleTabPress = (path: string) => {
    router.push(path);
  };

  const isActiveTab = (path: string): boolean => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-amber-50 to-white/95 backdrop-blur-md border-t border-amber-200/30 shadow-lg ${className}`}
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Sacred gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-50/80 via-white/60 to-transparent pointer-events-none" />
      
      {/* Navigation container */}
      <div className="relative flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab.path);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.path)}
              className={`
                flex flex-col items-center justify-center 
                min-w-[60px] py-2 px-3 rounded-xl
                transition-all duration-300 ease-in-out
                transform hover:scale-105 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2
                ${isActive 
                  ? 'bg-gradient-to-b from-amber-100 to-amber-50 text-amber-800 shadow-md scale-105' 
                  : 'text-amber-600 hover:bg-amber-50/70 hover:text-amber-700'
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.ariaLabel}
              tabIndex={0}
            >
              {/* Icon container with golden glow effect for active state */}
              <div 
                className={`
                  text-xl mb-1 transition-all duration-300
                  ${isActive 
                    ? 'filter drop-shadow-md transform scale-110' 
                    : 'transform scale-100'
                  }
                `}
                style={isActive ? { 
                  filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))' 
                } : {}}
              >
                {tab.icon}
              </div>
              
              {/* Label with sacred typography */}
              <span 
                className={`
                  text-xs font-medium tracking-wide
                  transition-all duration-300
                  ${isActive 
                    ? 'text-amber-800 font-semibold' 
                    : 'text-amber-600'
                  }
                `}
                style={isActive ? { 
                  color: '#D4AF37',
                  textShadow: '0 1px 2px rgba(212, 175, 55, 0.3)'
                } : {}}
              >
                {tab.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div 
                  className="absolute -top-1 w-1 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: '#D4AF37' }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Sacred bottom border */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
        style={{ backgroundColor: '#D4AF37', opacity: 0.3 }}
      />
    </nav>
  );
};

export default BottomTabNavigation;
