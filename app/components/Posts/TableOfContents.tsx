import { useEffect, useState, useRef, useCallback } from 'react';
import cn from 'classnames';
import { RiMenuLine, RiCloseLine } from 'react-icons/ri';

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
  const [showToc, setShowToc] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

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

  // Track active heading based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  // Click outside to close
  useEffect(() => {
    if (!showToc) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (elemRef.current && !elemRef.current.contains(event.target as Node)) {
        setShowToc(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showToc]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showToc) {
        setShowToc(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showToc]);


  if (headings.length === 0) return null;

  return (
    <div className={cn(
      "z-50 h-screen fixed right-0 top-0 transition-all duration-300",
      showToc ? "w-[240px] lg:w-[280px]" : "w-10"
    )}>
      <div 
        ref={elemRef} 
        className={cn(
          "fixed rounded-l-xl border transition-all duration-300 mt-20 overflow-hidden",
          "border-gray-200/80 dark:border-gray-700/50",
          "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm",
          showToc 
            ? "w-[240px] lg:w-[280px] shadow-xl" 
            : "w-10 opacity-50 hover:opacity-100 shadow-md"
        )}
      >
        {/* Toggle Button */}
        <button
          className={cn(
            "flex items-center select-none text-sm font-medium w-full transition-all duration-200",
            "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
            "border-b border-gray-200/80 dark:border-gray-700/50",
            showToc ? "p-3 justify-between" : "p-2 justify-center"
          )}
          onClick={() => setShowToc(!showToc)}
          aria-label={showToc ? "Close table of contents" : "Open table of contents"}
        >
          {showToc ? (
            <>
              <span className="text-sm">📑 目录</span>
              <RiCloseLine className="w-4 h-4" />
            </>
          ) : (
            <RiMenuLine className="w-5 h-5" />
          )}
        </button>
        
        {/* Headings List */}
        {showToc && (
          <div className="py-2 text-sm w-full max-h-[calc(100vh-12rem)] overflow-y-auto muted-scrollbar">
            {headings.map((heading, index) => {
              const isActive = activeId === heading.id;
              const cleanText = heading.text.replace(/\*/g, '').trim();
              
              return (
                <div
                  key={index}
                  onClick={() => handleHeadingClick(heading.id)}
                  className={cn(
                    "w-full text-left py-2 px-3 border-l-2 transition-all duration-200 cursor-pointer group",
                    "hover:bg-gray-100/80 dark:hover:bg-gray-800/50",
                    isActive
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600",
                    {
                      "pl-3": heading.level === 1,
                      "pl-5": heading.level === 2,
                      "pl-7": heading.level === 3,
                      "pl-9": heading.level === 4,
                      "pl-11": heading.level === 5,
                      "pl-13": heading.level === 6,
                    }
                  )}
                  title={cleanText}
                >
                  <span className={cn(
                    "block truncate transition-transform duration-200",
                    isActive ? "scale-105" : "group-hover:translate-x-1"
                  )}>
                    {cleanText}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 