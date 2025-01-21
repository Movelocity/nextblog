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
            <div className="flex-grow">
              <Link 
                href={`/posts/${post.id}`}
                className="text-xl font-semibold hover:text-blue-600"
              >
                {post.title}
              </Link>
              <p className="text-gray-600 mt-2 mb-4">
                {post.content.substring(0, 200)}...
              </p>
              
              <div className="space-y-2">
                {post.categories?.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 mr-2">Categories:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {post.categories.map(category => (
                        <Link
                          key={category}
                          href={`/posts/category/${category}`}
                          className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                        >
                          {category}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {post.tags?.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 mr-2">Tags:</span>
                    <div className="inline-flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {onDelete && editable && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-red-500 hover:text-red-700 ml-4"
                aria-label="Delete post"
              >
                Delete
              </button>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-500 border-t pt-4">
            <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>Updated: {new Date(post.updatedAt).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>Status: {post.published ? 'Published' : 'Draft'}</span>
          </div>
        </article>
      ))}
    </div>
  );
} 