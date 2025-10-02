import React, { useState, useEffect, useMemo } from 'react';
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

  const flatTopics = useMemo(() => historyTopicGroups.flatMap(group => group.topics), []);

  const currentTopicIndex = useMemo(() => flatTopics.findIndex(topic => topic.id === selectedTopic.id), [flatTopics, selectedTopic]);

  const hasPrevTopic = currentTopicIndex > 0;
  const hasNextTopic = currentTopicIndex < flatTopics.length - 1;

  const handleNextTopic = () => {
    if (hasNextTopic) {
      const nextTopic = flatTopics[currentTopicIndex + 1];
      setSelectedTopic(nextTopic);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevTopic = () => {
    if (hasPrevTopic) {
      const prevTopic = flatTopics[currentTopicIndex - 1];
      setSelectedTopic(prevTopic);
      window.scrollTo(0, 0);
    }
  };


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
    window.scrollTo(0, 0);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen font-sans bg-slate-50 dark:bg-slate-950">
      <Sidebar
        groups={historyTopicGroups}
        activeTopicId={selectedTopic.id}
        onSelectTopic={handleSelectTopic}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle sidebar"
              >
                <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'} w-6 h-6 transition-transform duration-300`}></i>
              </button>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                History Companion
              </h1>
            </div>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <ContentDisplay 
            topic={selectedTopic}
            onPrevTopic={handlePrevTopic}
            onNextTopic={handleNextTopic}
            hasPrevTopic={hasPrevTopic}
            hasNextTopic={hasNextTopic}
            groups={historyTopicGroups}
            onSelectTopic={handleSelectTopic}
          />
        </div>
      </main>
    </div>
  );
};

export default App;