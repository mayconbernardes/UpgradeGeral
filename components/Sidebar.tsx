import React, { useState } from 'react';
import type { Topic, TopicGroup } from '../types';

interface SidebarProps {
  groups: TopicGroup[];
  activeTopicId: string;
  onSelectTopic: (topic: Topic) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ groups, activeTopicId, onSelectTopic, isOpen, setIsOpen }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:transition-width
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                   md:${isOpen ? 'w-72' : 'w-0'}`}
      >
        <div className={`h-full flex flex-col overflow-y-auto ${!isOpen && 'md:hidden'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tópicos de História</h2>
          </div>
          <nav className="flex-grow">
            {groups.map((group, index) => (
              <div key={index} className="py-2 border-b border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex justify-between items-center px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <span>{group.title}</span>
                  <i className={`fas fa-chevron-down transition-transform duration-300 ${expandedGroups.has(group.title) ? 'rotate-180' : ''}`}></i>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedGroups.has(group.title) ? 'max-h-screen' : 'max-h-0'}`}>
                  <ul className="pt-2">
                    {group.topics.map(topic => (
                      <li key={topic.id}>
                        <button
                          onClick={() => onSelectTopic(topic)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 flex items-center gap-3 ${
                            activeTopicId === topic.id
                              ? 'bg-primary-500 text-white font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                        >
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