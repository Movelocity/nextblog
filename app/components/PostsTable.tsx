import { Post } from '../common/types';
import Link from 'next/link';
import { useState } from 'react';

interface PostsTableProps {
  posts: Post[];
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, currentStatus: boolean) => void;
}

export default function PostsTable({ posts, onDelete, onTogglePublish }: PostsTableProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPosts(e.target.checked ? posts.map(post => post.id) : []);
  };

  const handleSelectPost = (id: string) => {
    setSelectedPosts(prev =>
      prev.includes(id) ? prev.filter(postId => postId !== id) : [...prev, id]
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedPosts.length === posts.length}
                onChange={handleSelectAll}
              />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categories
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedPosts.includes(post.id)}
                  onChange={() => handleSelectPost(post.id)}
                />
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                  {post.title}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    post.published
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {post.published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {post.categories?.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(post.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end items-center space-x-3">
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </Link>
                  {onTogglePublish && (
                    <button
                      onClick={() => onTogglePublish(post.id, post.published)}
                      className={`${post.published ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {post.published ? 'Unpublish' : 'Publish'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(post.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPosts.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              {selectedPosts.length} selected
            </span>
          </div>
          <div className="flex space-x-3">
            <button
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (onDelete && window.confirm('Are you sure you want to delete the selected posts?')) {
                  selectedPosts.forEach(id => onDelete(id));
                  setSelectedPosts([]);
                }
              }}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}