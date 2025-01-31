import { BlogMeta } from '../../common/types';
import ArticleItem from './ArticleItem';

interface PostsListProps {
  posts: BlogMeta[];
  isLoading?: boolean;
}

export default function PostsList({ posts, isLoading = false }: PostsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="flex gap-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-gray-600 p-4 text-center rounded-lg">
        No posts available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <ArticleItem key={post.id} post={post} />
      ))}
    </div>
  );
}