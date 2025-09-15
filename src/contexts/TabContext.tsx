'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { DiscoveryEngineResponse } from '@/lib/discoveryEngine';

// Types for tab-level state management
interface EnhancedRawTextAnnotation {
  // Primary Information
  textName: string;
  tradition: string;
  chapter: string;
  section: string;
  
  // Context Information  
  spiritualTheme: string;
  characters?: string[];
  location?: string;
  
  // Cultural Context
  historicalPeriod?: string;
  literaryGenre: string;
  
  // Reference Information (for scholars)
  technicalReference?: string;
  estimatedAge?: string;
  
  // Legacy fields for backward compatibility
  theme?: string;
  source?: string;
}

interface TodaysWisdomData {
  rawText: string;
  rawTextAnnotation: EnhancedRawTextAnnotation;
  wisdom: string;
  context: string;
  type: 'story' | 'verse' | 'teaching';
  sourceName: string;
  encouragement: string;
  // Enhanced properties from API response
  selectedSource?: string;
  selectionMethod?: string;
  selectedSourceInfo?: {
    displayName: string;
    category: string;
  };
  message?: string;
}

interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
  citations?: Array<any>;
  timestamp: Date;
}

interface TabState {
  // Tab Management
  activeTab: string;
  
  // Home Tab State
  todaysWisdom: TodaysWisdomData | null;
  isLoadingWisdom: boolean;
  wisdomError: string | null;
  homeTabCard: 'sacred' | 'interpretation';
  
  // Ask Tab State
  question: string;
  category: string;
  isSubmitting: boolean;
  aiResponse: DiscoveryEngineResponse | null;
  isLoadingAI: boolean;
  aiError: string | null;
  messages: Message[];
  showValidationError: boolean;
  
  // Cross-Tab Session Management
  sessionId: string | null;
  wisdomContext: TodaysWisdomData | null;
  
  // Library Tab State
  expandedCategories: Set<string>;
  searchQuery: string;
  
  // Profile Tab State
  notificationsEnabled: boolean;
  darkMode: boolean;
  soundEnabled: boolean;
}

interface TabContextType extends TabState {
  // Tab Actions
  switchTab: (tabId: string, preserveState?: boolean) => void;
  
  // Home Tab Actions
  setTodaysWisdom: (wisdom: TodaysWisdomData | null) => void;
  setIsLoadingWisdom: (loading: boolean) => void;
  setWisdomError: (error: string | null) => void;
  setHomeTabCard: (card: 'sacred' | 'interpretation') => void;
  switchToAskWithWisdom: (wisdom: TodaysWisdomData) => void;
  
  // Ask Tab Actions
  setQuestion: (question: string) => void;
  setCategory: (category: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setAiResponse: (response: DiscoveryEngineResponse | null) => void;
  setIsLoadingAI: (loading: boolean) => void;
  setAiError: (error: string | null) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setShowValidationError: (show: boolean) => void;
  
  // Session Management
  setSessionId: (sessionId: string | null) => void;
  clearSession: () => void;
  
  // Library Tab Actions
  toggleCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Profile Tab Actions
  setNotificationsEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Utility Actions
  resetAllTabs: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

// Initial state
const getInitialState = (): TabState => ({
  // Tab Management
  activeTab: 'home',
  
  // Home Tab State
  todaysWisdom: null,
  isLoadingWisdom: false,
  wisdomError: null,
  homeTabCard: 'sacred',
  
  // Ask Tab State
  question: '',
  category: '',
  isSubmitting: false,
  aiResponse: null,
  isLoadingAI: false,
  aiError: null,
  messages: [],
  showValidationError: false,
  
  // Cross-Tab Session Management
  sessionId: null,
  wisdomContext: null,
  
  // Library Tab State
  expandedCategories: new Set<string>(),
  searchQuery: '',
  
  // Profile Tab State
  notificationsEnabled: false,
  darkMode: false,
  soundEnabled: true,
});

// Provider component
interface TabProviderProps {
  children: ReactNode;
  initialTab?: string;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children, initialTab = 'ask' }) => {
  const [state, setState] = useState<TabState>(() => ({
    ...getInitialState(),
    activeTab: initialTab
  }));

  // Persist session state to localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('mygurukul_tab_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setState(prevState => ({
          ...prevState,
          sessionId: sessionData.sessionId,
          messages: sessionData.messages || [],
          // Don't restore activeTab to allow fresh start
        }));
      } catch (error) {
        console.error('Error loading session data:', error);
        localStorage.removeItem('mygurukul_tab_session');
      }
    }
  }, []);

  // Save session state whenever it changes
  useEffect(() => {
    if (state.sessionId || state.messages.length > 0) {
      const sessionData = {
        sessionId: state.sessionId,
        messages: state.messages,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('mygurukul_tab_session', JSON.stringify(sessionData));
    }
  }, [state.sessionId, state.messages]);

  // Tab Actions
  const switchTab = useCallback((tabId: string, preserveState: boolean = true) => {
    setState(prevState => ({
      ...prevState,
      activeTab: tabId,
      // Clear validation errors when switching tabs
      showValidationError: false,
    }));
  }, []);

  // Home Tab Actions
  const setTodaysWisdom = useCallback((wisdom: TodaysWisdomData | null) => {
    setState(prevState => ({ ...prevState, todaysWisdom: wisdom }));
  }, []);

  const setIsLoadingWisdom = useCallback((loading: boolean) => {
    setState(prevState => ({ ...prevState, isLoadingWisdom: loading }));
  }, []);

  const setWisdomError = useCallback((error: string | null) => {
    setState(prevState => ({ ...prevState, wisdomError: error }));
  }, []);

  const setHomeTabCard = useCallback((card: 'sacred' | 'interpretation') => {
    setState(prevState => ({ ...prevState, homeTabCard: card }));
  }, []);

  const switchToAskWithWisdom = useCallback((wisdom: TodaysWisdomData) => {
    const contextMessage = `I just read today's wisdom from ${wisdom.sourceName}: "${wisdom.rawText.substring(0, 100)}..." Can you help me understand how to apply this to my life?`;
    
    setState(prevState => ({
      ...prevState,
      activeTab: 'ask',
      wisdomContext: wisdom,
      question: contextMessage,
      showValidationError: false,
    }));
  }, []);

  // Ask Tab Actions
  const setQuestion = useCallback((question: string) => {
    setState(prevState => ({ ...prevState, question }));
  }, []);

  const setCategory = useCallback((category: string) => {
    setState(prevState => ({ ...prevState, category }));
  }, []);

  const setIsSubmitting = useCallback((submitting: boolean) => {
    setState(prevState => ({ ...prevState, isSubmitting: submitting }));
  }, []);

  const setAiResponse = useCallback((response: DiscoveryEngineResponse | null) => {
    setState(prevState => ({ ...prevState, aiResponse: response }));
  }, []);

  const setIsLoadingAI = useCallback((loading: boolean) => {
    setState(prevState => ({ ...prevState, isLoadingAI: loading }));
  }, []);

  const setAiError = useCallback((error: string | null) => {
    setState(prevState => ({ ...prevState, aiError: error }));
  }, []);

  const addMessage = useCallback((message: Message) => {
    setState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, message]
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prevState => ({ ...prevState, messages: [] }));
  }, []);

  const setShowValidationError = useCallback((show: boolean) => {
    setState(prevState => ({ ...prevState, showValidationError: show }));
  }, []);

  // Session Management
  const setSessionId = useCallback((sessionId: string | null) => {
    setState(prevState => ({ ...prevState, sessionId }));
  }, []);

  const clearSession = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      sessionId: null,
      messages: [],
      aiResponse: null,
      aiError: null,
      question: '',
      wisdomContext: null,
    }));
    localStorage.removeItem('mygurukul_tab_session');
  }, []);

  // Library Tab Actions
  const toggleCategory = useCallback((categoryId: string) => {
    setState(prevState => {
      const newExpandedCategories = new Set(prevState.expandedCategories);
      if (newExpandedCategories.has(categoryId)) {
        newExpandedCategories.delete(categoryId);
      } else {
        newExpandedCategories.add(categoryId);
      }
      return { ...prevState, expandedCategories: newExpandedCategories };
    });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prevState => ({ ...prevState, searchQuery: query }));
  }, []);

  // Profile Tab Actions
  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setState(prevState => ({ ...prevState, notificationsEnabled: enabled }));
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    setState(prevState => ({ ...prevState, darkMode: enabled }));
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setState(prevState => ({ ...prevState, soundEnabled: enabled }));
  }, []);

  // Utility Actions
  const resetAllTabs = useCallback(() => {
    setState(getInitialState());
    localStorage.removeItem('mygurukul_tab_session');
  }, []);

  const contextValue: TabContextType = {
    // State
    ...state,
    
    // Actions
    switchTab,
    setTodaysWisdom,
    setIsLoadingWisdom,
    setWisdomError,
    setHomeTabCard,
    switchToAskWithWisdom,
    setQuestion,
    setCategory,
    setIsSubmitting,
    setAiResponse,
    setIsLoadingAI,
    setAiError,
    addMessage,
    clearMessages,
    setShowValidationError,
    setSessionId,
    clearSession,
    toggleCategory,
    setSearchQuery,
    setNotificationsEnabled,
    setDarkMode,
    setSoundEnabled,
    resetAllTabs,
  };

  return (
    <TabContext.Provider value={contextValue}>
      {children}
    </TabContext.Provider>
  );
};

// Hook to use the TabContext
export const useTabContext = (): TabContextType => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

// Utility hook for specific tab state
export const useTabState = (tabName: string) => {
  const context = useTabContext();
  
  const isActive = context.activeTab === tabName;
  
  return {
    isActive,
    switchToTab: () => context.switchTab(tabName),
    ...context,
  };
};

export default TabContext;
