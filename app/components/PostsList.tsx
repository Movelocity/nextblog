import { Post } from '../common/types';
import Link from 'next/link';

interface PostsListProps {
  posts: Post[];
  isLoading?: boolean;
  editable?: boolean;
  onDelete?: (id: string) => void;
}

export default function PostsList({ posts, isLoading = false, editable = false, onDelete }: PostsListProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-4 border rounded-lg shadow-sm">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-gray-600 p-4 text-center border rounded-lg">
        No posts available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article key={post.id} className="p-4 border rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <Link 
                href={`/posts/${post.id}`}
                className="text-xl font-semibold hover:text-blue-600"
              >
                {post.title}
              </Link>
              <p className="text-gray-600 mt-2">
                {post.content.substring(0, 200)}...
              </p>
            </div>
            {onDelete && editable && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-red-500 hover:text-red-700"
                aria-label="Delete post"
              >
                Delete
              </button>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>Updated: {new Date(post.updatedAt).toLocaleDateString()}</span>
          </div>
        </article>
      ))}
    </div>
  );
} 