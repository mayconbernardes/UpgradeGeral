import React, { useState, useEffect } from 'react';
import { historyTopicGroups } from './data/historyData';
import type { Topic } from './types';
import Sidebar from './components/Sidebar';
import ContentDisplay from './components/ContentDisplay';
import ThemeToggle from './components/ThemeToggle';

const App: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic>(historyTopicGroups[0].topics[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to visible
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen font-sans">
      <Sidebar
        groups={historyTopicGroups}
        activeTopicId={selectedTopic.id}
        onSelectTopic={handleSelectTopic}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-gray-100 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? (
                  <i className="fas fa-times w-6 h-6"></i>
                ) : (
                  <i className="fas fa-bars w-6 h-6"></i>
                )}
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                History Companion
              </h1>
            </div>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <ContentDisplay topic={selectedTopic} />
        </div>
      </main>
    </div>
  );
};

export default App;