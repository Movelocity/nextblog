import { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import classNames from 'classnames';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export const TableOfContents = ({ content, className }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));
    
    const extractedHeadings = matches.map((match) => {
      const level = match[1].length;
      const text = match[2];
      // Create an id from the heading text
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      return { id, text, level };
    });

    setHeadings(extractedHeadings);
  }, [content]);

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className={classNames("p-4", className)}>
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Table of Contents
        </h3>
        {isCollapsed ? (
          <FaChevronRight className="w-4 h-4 text-gray-300" />
        ) : (
          <FaChevronDown className="w-4 h-4 text-gray-300" />
        )}
      </div>
      
      {!isCollapsed && (
        <nav className="space-y-1">
          {headings.map((heading, index) => (
            <button
              key={index}
              onClick={() => handleHeadingClick(heading.id)}
              className={classNames(
                "block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                {
                  "pl-2": heading.level === 1,
                  "pl-4": heading.level === 2,
                  "pl-6": heading.level === 3,
                  "pl-8": heading.level === 4,
                  "pl-10": heading.level === 5,
                  "pl-12": heading.level === 6,
                }
              )}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}; 