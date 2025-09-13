'use client';

import React, { ReactNode, useEffect, useState, ErrorInfo, Component } from 'react';

// TypeScript interfaces
interface TabContent {
  id: string;
  content: ReactNode;
  label: string;
}

interface TabContainerProps {
  activeTab: string;
  children?: ReactNode;
  tabContents?: TabContent[];
  className?: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

interface TabContainerState {
  hasError: boolean;
  error?: Error;
}

// Error Boundary Component
class TabErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  TabContainerState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TabContainerState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TabContainer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">🕉️</div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Sacred Pause
            </h3>
            <p className="text-amber-600 text-sm mb-4">
              A moment of reflection is needed. Please refresh to continue your spiritual journey.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 rounded-lg border border-amber-200 hover:from-amber-200 hover:to-amber-100 transition-all duration-300"
              style={{ color: '#D4AF37' }}
            >
              Continue Journey
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Loading Component
const TabLoadingState: React.FC<{ message?: string }> = ({ 
  message = "Gathering sacred wisdom..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative">
        {/* Spinning golden circle */}
        <div 
          className="w-12 h-12 border-3 border-amber-200 rounded-full animate-spin"
          style={{ 
            borderTopColor: '#D4AF37',
            borderRightColor: '#D4AF37'
          }}
        />
        {/* Sacred center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg animate-pulse">🕉️</div>
        </div>
      </div>
      
      <p className="text-amber-600 text-sm mt-4 animate-pulse">
        {message}
      </p>
    </div>
  );
};

// Main TabContainer Component
const TabContainer: React.FC<TabContainerProps> = ({
  activeTab,
  children,
  tabContents = [],
  className = '',
  isLoading = false,
  loadingMessage
}) => {
  const [displayedTab, setDisplayedTab] = useState<string>(activeTab);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Handle tab transitions with smooth animation
  useEffect(() => {
    if (activeTab !== displayedTab) {
      setIsTransitioning(true);
      
      // Delay the content switch to allow fade-out animation
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
        setIsTransitioning(false);
      }, 150); // Half of the transition duration

      return () => clearTimeout(timer);
    }
  }, [activeTab, displayedTab]);

  // Find active tab content
  const activeTabContent = tabContents.find(tab => tab.id === displayedTab);

  return (
    <TabErrorBoundary>
      <main
        className={`
          min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/50
          pb-20 transition-all duration-300 ease-in-out
          ${className}
        `}
        role="main"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {/* Sacred background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 40% 40%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)`
            }}
          />
        </div>

        {/* Content container with accessibility */}
        <div
          className={`
            relative z-10 transition-all duration-300 ease-in-out
            ${isTransitioning 
              ? 'opacity-0 transform translate-y-2' 
              : 'opacity-100 transform translate-y-0'
            }
          `}
          tabIndex={-1}
          aria-label={activeTabContent ? `${activeTabContent.label} content` : 'Tab content'}
        >
          {/* Loading State */}
          {isLoading && (
            <TabLoadingState message={loadingMessage} />
          )}

          {/* Tab Content */}
          {!isLoading && (
            <>
              {/* Render specific tab content if provided */}
              {activeTabContent && (
                <section
                  role="tabpanel"
                  aria-labelledby={`tab-${activeTabContent.id}`}
                  aria-hidden={isTransitioning}
                  className="animate-fadeIn"
                >
                  {activeTabContent.content}
                </section>
              )}

              {/* Render children if no specific tab contents */}
              {!activeTabContent && children && (
                <section
                  role="tabpanel"
                  aria-labelledby={`tab-${activeTab}`}
                  aria-hidden={isTransitioning}
                  className="animate-fadeIn"
                >
                  {children}
                </section>
              )}

              {/* Empty state */}
              {!activeTabContent && !children && !isLoading && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-6xl mb-4 opacity-50">🕉️</div>
                  <h3 className="text-lg font-semibold text-amber-800 mb-2 opacity-75">
                    Sacred Space
                  </h3>
                  <p className="text-amber-600 text-sm opacity-75">
                    This sacred space awaits your presence.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom safe area for navigation */}
        <div className="h-20" aria-hidden="true" />
      </main>
    </TabErrorBoundary>
  );
};

export default TabContainer;

// Helper hook for managing tab state
export const useTabContainer = (initialTab: string = 'home') => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const switchTab = (tabId: string, withLoading: boolean = false) => {
    if (withLoading) {
      setIsLoading(true);
      setTimeout(() => {
        setActiveTab(tabId);
        setIsLoading(false);
      }, 500);
    } else {
      setActiveTab(tabId);
    }
  };

  return {
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    switchTab
  };
};
