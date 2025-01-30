import { Post } from '../common/types';
import Link from 'next/link';
import { FaTags, FaCalendarAlt } from 'react-icons/fa';
import classNames from 'classnames';
import CategoryTag from './CategoryTag';

interface ArticleItemProps {
  post: Post;
}

const ArticleItem = ({ post }: ArticleItemProps) => {
  const contentPreview = post.content
    .replace(/<[^>]*>?/gm, '')
    .replace(/[#`-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 50)
    .join(' ');

  return (
    <article className="group p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Title Section */}
      <Link 
        href={`/posts/${post.id}`}
        className="block mb-3"
        aria-label={`Read article: ${post.title}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-500 transition-colors">
          {post.title}
        </h2>

        {/* Content Preview */}
        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-4 line-clamp-3">
          {contentPreview}...
        </p>
      </Link>

      

      {/* Metadata Section */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {post.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.categories.map(category => (
              <CategoryTag
                key={category}
                category={category}
              />
            ))}
          </div>
        )}

        {post.tags?.length > 0 && (
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