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

// Tab configuration
interface TabConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
}

const tabs: TabConfig[] = [
  {
    id: 'home',
    name: 'Home Tab',
    icon: <Home className="w-5 h-5" />,
    component: HomeTab
  },
  {
    id: 'ask',
    name: 'Ask Tab',
    icon: <MessageSquare className="w-5 h-5" />,
    component: AskTab
  },
  {
    id: 'library',
    name: 'Library Tab',
    icon: <BookOpen className="w-5 h-5" />,
    component: LibraryTab
  },
  {
    id: 'profile',
    name: 'Profile Tab',
    icon: <User className="w-5 h-5" />,
    component: ProfileTab
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
const TestTabsContent: React.FC = () => {
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
              <span className="font-medium">Back to App</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
                🧪 Tab Components Test with Context
              </h1>
              <p className="text-amber-600 text-sm">
                Testing tab components with React Context state management
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

          {/* Tab navigation */}
          <div className="flex justify-center">
            <div className="bg-amber-100/50 backdrop-blur-sm border border-amber-200 rounded-xl p-2 shadow-md">
              <div className="flex space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 shadow-md transform scale-105'
                        : 'text-amber-600 hover:bg-amber-50/50 hover:text-amber-700'
                    }`}
                    style={activeTab === tab.id ? { color: '#D4AF37' } : {}}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component test area */}
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
                Component Not Found
              </h3>
              <p className="text-amber-600">
                The selected tab component could not be loaded.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Test information footer */}
      <div className="relative z-50 bg-white/80 backdrop-blur-md border-t border-amber-200 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-center">
            <h3 className="font-bold text-amber-800 mb-2">🧪 Test Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-amber-600">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Home Tab</div>
                <div>Test Today's Wisdom loading, tabbed content, and "Continue Discussion in Ask Tab" button</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Ask Tab</div>
                <div>Test category selection, question input, conversation history, wisdom context display, and API calls</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Library Tab</div>
                <div>Test accordion expansion, text filtering, search interface, and status display</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-semibold text-amber-800 mb-1">Profile Tab</div>
                <div>Test settings toggles, resource links, placeholder sections, and app info</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-lg">
              <div className="text-amber-800 font-semibold mb-2">🛡️ Context State Management</div>
              <div className="text-amber-700 text-sm">
                All tabs now share state through React Context. Session data, conversation history, and wisdom content 
                are preserved when switching between tabs. State is automatically persisted to localStorage.
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-800 font-semibold mb-2">🔄 State Persistence</div>
              <div className="text-blue-700 text-sm">
                Test tab switching with state preservation:
                <ul className="list-disc ml-4 mt-2">
                  <li>Load wisdom in Home tab, switch to Ask tab - context should transfer</li>
                  <li>Start conversation in Ask tab, switch tabs - messages should persist</li>
                  <li>Expand categories in Library tab, switch tabs - expansion state preserved</li>
                  <li>Change settings in Profile tab, switch tabs - preferences maintained</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main test page component with TabProvider
export default function TestTabsPage() {
  return (
    <TabProvider>
      <TestTabsContent />
    </TabProvider>
  );
}
