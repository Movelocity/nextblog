import { useEffect, useState, useRef } from 'react';
import cn from 'classnames';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  // const [tocCollapsed, setTocCollapsed] = useState(false);
  const [showToc, setShowToc] = useState(false);

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
            // .replace(/[^a-z0-9]+/g, '-')
            // .replace(/(^-|-$)/g, '');
          
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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const elemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(elemRef.current) {
      const handleClickOutside = (event: MouseEvent) => {
        if(elemRef.current && !elemRef.current.contains(event.target as Node)) {
          setShowToc(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showToc]);


  return (
    <div className={cn("z-50 h-screen fixed right-0 top-0 ", showToc ? "w-[180px] lg:w-[220px]": "w-8")}>
      <div 
        ref={elemRef} 
        className={cn(
          "fixed rounded-l-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 mt-32",
          showToc ? "w-[180px] md:w-full": "w-8 opacity-60 hover:opacity-100"
        )}
      >
        {headings.length > 0 && <button
          className="flex items-center justify-between select-none break-all text-sm text-gray-500 dark:text-gray-400 w-full p-2 rounded-tl-lg border-b border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={() => setShowToc(!showToc)}
        >
          目录
        </button>}
        
        {showToc && (
          <div className="space-y-1 text-sm w-full max-h-96 overflow-y-auto muted-scrollbar text-gray-700 dark:text-gray-400">
            {headings.map((heading, index) => (
              <div
                key={index}
                onClick={() => handleHeadingClick(heading.id)}
                className={cn(
                  " w-full text-left px-2 py-1 border-l-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
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
          </div>
        )}
      </div>
    </div>
  );
}; 