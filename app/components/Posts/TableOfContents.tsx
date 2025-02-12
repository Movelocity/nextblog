import { useEffect, useState } from 'react';
import classNames from 'classnames';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TableOfContents = ({ content, className, style }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Extract headings from markdown content, ignoring code blocks
    const extractHeadings = (content: string): Heading[] => {
      // Split content by code blocks
      const codeBlockRegex = /```[\s\S]*?```/g;
      const sections = content.split(codeBlockRegex);
      
      // Only process non-code-block sections
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const extractedHeadings: Heading[] = [];
      
      sections.forEach(section => {
        const matches = Array.from(section.matchAll(headingRegex));
        matches.forEach(match => {
          const level = match[1].length;
          const text = match[2];
          // Create an id from the heading text
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          
          extractedHeadings.push({ id, text, level });
        });
      });

      return extractedHeadings;
    };

    setHeadings(extractHeadings(content));
  }, [content]);

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className={classNames("toc p-4 text-gray-700 dark:text-gray-400 min-w-[10rem]", className)} style={style}>
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">
          TOC
        </h3>
      </div>
      
      {!isCollapsed && (
        <nav className="space-y-1 text-sm  w-36 lg:w-48">
          {headings.map((heading, index) => (
            <div
              key={index}
              onClick={() => handleHeadingClick(heading.id)}
              className={classNames(
                " w-full text-left px-2 py-1 border-l-2 border-transparent hover:border-gray-300 cursor-pointer",
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
              {heading.text.replace(/\*/g, '')}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}; 