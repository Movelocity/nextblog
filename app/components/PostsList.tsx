import { Post } from '../common/config';
import Link from 'next/link';

interface PostsListProps {
  posts: Post[];
  onDelete?: (id: string) => void;
}

export default function PostsList({ posts, onDelete }: PostsListProps) {
  if (!Array.isArray(posts)) {
    return <div className="text-gray-600">Loading posts...</div>;
  }

  if (posts.length === 0) {
    return <div className="text-gray-600">No posts available.</div>;
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
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-red-500 hover:text-red-700"
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