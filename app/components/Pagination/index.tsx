import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import classNames from 'classnames';
import { useRef, useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const [pageInput, setPageInput] = useState("");
  const pageInputRef = useRef<HTMLInputElement>(null);
  
  const handleJumpChange = () => {
    const inputValue = pageInputRef.current?.value;
    if (!inputValue || inputValue === '') { 
      return;
    }

    try{
      const value = parseInt(inputValue);
      if (value >= 1 && value <= totalPages) {
        onPageChange(value);
      }
    } catch (error) {
      console.error('Invalid input:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = e.currentTarget;
      const page = parseInt(target.getAttribute('data-page') || '1');
      onPageChange(page);
    }
  };

  const baseButtonClasses = "group p-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 hover:enabled:bg-blue-50 dark:hover:enabled:bg-gray-700";

  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 text-gray-800 dark:text-gray-400">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            onPageChange(currentPage - 1);
            setPageInput('');
          }}
          onKeyDown={handleKeyDown}
          disabled={currentPage <= 1}
          data-page={currentPage - 1}
          aria-label={`Go to previous page${currentPage <= 1 ? ' (disabled)' : ''}`}
          title="Previous page"
          className={classNames(
            baseButtonClasses,
            ""
          )}
        >
          <FiChevronLeft className="w-5 h-5 group-hover:enabled:text-blue-600 dark:group-hover:enabled:text-blue-400" />
        </button>

        <div className="px-3 py-1.5 rounded-md">
          <span className="text-sm font-medium">
            {currentPage} / {totalPages}
          </span>
        </div>

        <button
          onClick={() => {
            onPageChange(currentPage + 1);
            setPageInput('');
          }}
          onKeyDown={handleKeyDown}
          disabled={currentPage >= totalPages}
          data-page={currentPage + 1}
          aria-label={`Go to next page${currentPage >= totalPages ? ' (disabled)' : ''}`}
          title="Next page"
          className={classNames(
            baseButtonClasses,
            ""
          )}
        >
          <FiChevronRight className="w-5 h-5 group-hover:enabled:text-blue-600 dark:group-hover:enabled:text-blue-400" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm">
          Jump:
        </label>
        <input
          ref={pageInputRef}
          type="text"
          value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-16 px-2 py-0.5 text-center rounded-sm border border-gray-300 dark:border-gray-600 outline-none bg-transparent"
          aria-label={`Jump to page (1-${totalPages})`}
          title={`Enter a page number between 1 and ${totalPages}`}
        />
        <button
          onClick={() => handleJumpChange()}
          className="px-2 py-0.5 text-center rounded-sm border border-gray-300 dark:border-gray-600 hover:text-blue-500 dark:hover:text-blue-400"
        >
          GO
        </button>
      </div>
    </nav>
  );
};

export default Pagination; 