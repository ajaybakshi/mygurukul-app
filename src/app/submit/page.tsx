'use client';

import React, { useState, ErrorInfo, Component } from 'react';
import { ArrowLeft, Home, MessageSquare, BookOpen, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Import our tab components
import HomeTab from '@/components/tabs/HomeTab';
import AskTab from '@/components/tabs/AskTab';
import LibraryTab from '@/components/tabs/LibraryTab';
import ProfileTab from '@/components/tabs/ProfileTab';

// Import TabContext
import { TabProvider, useTabContext } from '@/contexts/TabContext';

// Tab configuration with spiritual golden theme
interface TabConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'home',
    name: 'Sacred Reading',
    icon: <Home className="w-5 h-5" />,
    component: HomeTab,
    description: 'Begin with today\'s divine wisdom'
  },
  {
    id: 'ask',
    name: 'Spiritual Guidance',
    icon: <MessageSquare className="w-5 h-5" />,
    component: AskTab,
    description: 'Seek wisdom from ancient texts'
  },
  {
    id: 'library',
    name: 'Sacred Library',
    icon: <BookOpen className="w-5 h-5" />,
    component: LibraryTab,
    description: 'Explore spiritual sources'
  },
  {
    id: 'profile',
    name: 'Spiritual Path',
    icon: <User className="w-5 h-5" />,
    component: ProfileTab,
    description: 'Your journey and preferences'
  }
];

// Error Boundary for individual tab components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  tabName?: string;
}

class TabErrorBoundary extends Component<
  { children: React.ReactNode; tabName: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false, tabName: props.tabName };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.tabName}:`, error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-8 shadow-lg text-center">
            <div className="text-red-600 text-6xl mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-4">
              {this.state.tabName} Error
            </h3>
            <p className="text-red-600 text-sm mb-6">
              An error occurred while rendering the {this.state.tabName} component.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
              <p className="text-red-700 text-xs font-mono break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inner component that uses TabContext
const SubmitPageContent: React.FC = () => {
  const tabContext = useTabContext();
  const { activeTab, switchTab } = tabContext;

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const CurrentComponent = currentTab?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/50">
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

      {/* Fixed header with navigation */}
      <div className="relative z-50 bg-white/80 backdrop-blur-md border-b border-amber-200 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Top nav */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center text-amber-600 hover:text-amber-800 transition-colors hover:bg-amber-50 p-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Home</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
                🕉️ MyGurukul - Spiritual Guidance
              </h1>
              <p className="text-amber-600 text-sm">
                Your journey to wisdom through ancient sacred texts
              </p>
            </div>
            
            <div className="text-amber-600 text-sm">
              Active: <span className="font-semibold">{currentTab?.name}</span>
              {tabContext.sessionId && (
                <div className="text-xs mt-1">
                  Session: {tabContext.sessionId.substring(0, 8)}...
                </div>
              )}
            </div>
          </div>

          {/* Tab navigation with spiritual golden theme */}
          <div className="flex justify-center">
            <div className="bg-amber-100/50 backdrop-blur-sm border border-amber-200 rounded-xl p-2 shadow-md">
              <div className="flex space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 font-medium min-w-[100px] ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 shadow-md transform scale-105'
                        : 'text-amber-600 hover:bg-amber-50/50 hover:text-amber-700'
                    }`}
                    style={activeTab === tab.id ? { color: '#D4AF37' } : {}}
                    title={tab.description}
                  >
                    <div className={`transition-all duration-300 ${
                      activeTab === tab.id ? 'transform scale-110' : 'group-hover:scale-105'
                    }`}>
                      {tab.icon}
                    </div>
                    <span className="text-xs text-center leading-tight">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab content area */}
      <div className="relative z-10">
        {CurrentComponent && (
          <TabErrorBoundary tabName={currentTab.name}>
            <CurrentComponent />
          </TabErrorBoundary>
        )}
        
        {!CurrentComponent && (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-bold text-amber-800 mb-2">
                Tab Not Found
              </h3>
              <p className="text-amber-600">
                The selected tab could not be loaded. Please try again.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sacred footer with spiritual guidance */}
      <div className="relative z-50 bg-white/80 backdrop-blur-md border-t border-amber-200 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-center">
            <h3 className="font-bold text-amber-800 mb-2">🕉️ Your Spiritual Journey</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-amber-600">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Sacred Reading</div>
                <div>Start your day with divine wisdom from ancient scriptures like the Ramayana</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Spiritual Guidance</div>
                <div>Ask questions and receive AI-powered wisdom from sacred texts and teachings</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Sacred Library</div>
                <div>Explore your collection of spiritual sources and wisdom texts</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Spiritual Path</div>
                <div>Track your journey, preferences, and personal spiritual growth</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-lg">
              <div className="text-amber-800 font-semibold mb-2">🌟 Enhanced Experience</div>
              <div className="text-amber-700 text-sm">
                All your spiritual journey data is preserved as you navigate between tabs. 
                Start with today&apos;s wisdom, then continue your discussion for deeper insights.
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-amber-600 font-serif">
              <div>May this wisdom guide your path to spiritual enlightenment</div>
              <div className="mt-2 text-amber-500">
                🕉️ In the tradition of Guru-Shishya परंपरा 🕉️
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main submit page component with TabProvider - Default to "home" tab for Today's Wisdom
export default function SubmitPage() {
  return (
    <TabProvider initialTab="home">
      <SubmitPageContent />
    </TabProvider>
  );
}