import React, { useState, useEffect } from 'react';
import type { Topic, TopicGroup } from '../types';

interface SidebarProps {
  groups: TopicGroup[];
  activeTopicId: string;
  onSelectTopic: (topic: Topic) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ groups, activeTopicId, onSelectTopic, isOpen, setIsOpen }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Find the group of the active topic and expand it by default
    const activeGroup = groups.find(g => g.topics.some(t => t.id === activeTopicId));
    return new Set(activeGroup ? [activeGroup.title] : []);
  });

  useEffect(() => {
    // Automatically expand the group of the selected topic
    const activeGroup = groups.find(g => g.topics.some(t => t.id === activeTopicId));
    if (activeGroup && !expandedGroups.has(activeGroup.title)) {
      setExpandedGroups(prev => new Set(prev).add(activeGroup.title));
    }
  }, [activeTopicId, groups, expandedGroups]);

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          aria-hidden="true"
        ></div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-lg md:shadow-none transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:transition-all
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                   md:${isOpen ? 'w-72' : 'w-0'}`}
      >
        <div className={`h-full flex flex-col overflow-x-hidden ${!isOpen && 'md:hidden'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tópicos de História</h2>
          </div>
          <nav className="flex-grow p-2">
            {groups.map((group, index) => (
              <div key={index} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex justify-between items-center px-3 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  <span>{group.title}</span>
                  <i className={`fas fa-chevron-down transition-transform duration-300 ${expandedGroups.has(group.title) ? 'rotate-180' : ''}`}></i>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedGroups.has(group.title) ? 'max-h-[1000px] mt-1' : 'max-h-0'}`}>
                  <ul>
                    {group.topics.map(topic => (
                      <li key={topic.id}>
                        <button
                          onClick={() => onSelectTopic(topic)}
                          className={`w-full text-left px-3 py-2.5 my-0.5 text-sm transition-colors duration-200 flex items-center gap-3 rounded-md relative ${
                            activeTopicId === topic.id
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className={`absolute left-0 top-0 h-full w-1 rounded-r-md bg-primary-500 ${activeTopicId === topic.id ? 'opacity-100' : 'opacity-0'}`}></span>
                          <span className="truncate">{topic.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;