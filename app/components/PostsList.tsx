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
        <article key={post.id} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-grow space-y-4">
              <div>
                <Link 
                  href={`/posts/${post.id}`}
                  className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {post.title}
                </Link>
                {post.published ? (
                  <span className="ml-3 px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Published
                  </span>
                ) : (
                  <span className="ml-3 px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                    Draft
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 text-base leading-relaxed line-clamp-2">
                {post.content.substring(0, 200)}...
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {post.categories?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex flex-wrap gap-2">
                      {post.categories.map(category => (
                        <Link
                          key={category}
                          href={`/posts/category/${category}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {category}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {post.tags?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <time dateTime={post.updatedAt} className="text-gray-500">
                    Updated {new Date(post.updatedAt).toLocaleDateString()}
                  </time>
                </div>
              </div>
            </div>

            {onDelete && editable && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete post"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}