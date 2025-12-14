import { BlogMeta } from '../../common/types';
import Link from 'next/link';
import { FaTags, FaCalendarAlt } from 'react-icons/fa';
import CategoryTag from '@/app/components/CategoryTag';
import './ArticleItem.css';

interface ArticleItemProps {
  post: BlogMeta;
}

const ArticleItem = ({ post }: ArticleItemProps) => {
  const contentPreview = post.description ? post.description.slice(0, 130) : '';

  return (
    <article className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-md shadow-sm hover:shadow-md transition-all duration-200">
      {/* Title Section */}
      <Link 
        href={`/posts/${post.id}`}
        className="item-title text-gray-900 dark:text-gray-200"
        aria-label={`Read article: ${post.title}`}
      >
        {post.title}
      </Link>

      {/* Content Preview */}
      <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-4 break-all">
        {contentPreview}...
      </p>

      {/* Metadata Section */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {post.categories && post.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.categories.map(category => (
              <CategoryTag
                key={category}
                category={category}
              />
            ))}
          </div>
        )}

        {post.tags && post.tags?.length > 0 && (
          <div className="flex items-center gap-2">
            <FaTags className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="text-gray-600 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <FaCalendarAlt className="w-4 h-4 text-gray-400" />
          <time 
            dateTime={post.updatedAt}
            className="text-gray-500"
          >
            {new Date(post.updatedAt).toLocaleDateString()}
          </time>
        </div>
      </div>
    </article>
  );
};

export default ArticleItem; 