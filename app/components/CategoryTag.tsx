import Link from 'next/link';
import { useCategoryStore } from '../stores/CategoryStore';
import classNames from 'classnames';

interface CategoryTagProps {
  category: string;
  className?: string;
  showLink?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

const CategoryTag = ({ 
  category, 
  className = '', 
  showLink = true,
  onClick,
  selected = false 
}: CategoryTagProps) => {
  const getColorForCategory = useCategoryStore(state => state.getColorForCategory);
  const colorClasses = getColorForCategory(category);
  
  const baseClasses = classNames(
    'px-0.5 rounded-md text-sm font-medium transition-colors border-2',
    colorClasses,
    {
      'hover:opacity-90': showLink && !onClick,
      'cursor-pointer hover:opacity-80': onClick,
      'border-current': selected,
      'border-transparent': !selected
    },
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClasses}
      >
        {category}
      </button>
    );
  }

  if (showLink) {
    return (
      <Link
        href={`/posts/category/${category}`}
        className={baseClasses}
      >
        {category}
      </Link>
    );
  }

  return (
    <span className={baseClasses}>
      {category}
    </span>
  );
};

export default CategoryTag; 
