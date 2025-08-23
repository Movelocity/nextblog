import Link from 'next/link';
// import { useCategoryStore } from '@/app/stores/CategoryStore';
import classNames from 'classnames';

interface CategoryTagProps {
  category: string;
  className?: string;
  showLink?: boolean;
  onClick?: () => void;
  selected?: boolean;  // true, false, undefined
}

const CategoryTag = ({ 
  category, 
  className = '', 
  showLink = true,
  onClick,
  selected, 
}: CategoryTagProps) => {
  // const getColorForCategory = useCategoryStore(state => state.getColorForCategory);
  // const colorClasses = getColorForCategory(category);
  const colorClasses = 'category-blue';
  
  const baseClasses = classNames(
    'px-1.5 py-0.5 rounded-sm text-xs font-bold transition-colors',
    colorClasses,
    {
      'hover:opacity-90': showLink && !onClick,
      'cursor-pointer hover:opacity-80': onClick,
      'opacity-50': selected === false  // transparent for false. normal for undefined
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
