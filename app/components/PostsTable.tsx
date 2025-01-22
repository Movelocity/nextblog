import { Post } from '../common/types';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';

interface PostsTableProps {
  posts: Post[];
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, currentStatus: boolean) => void;
}

type SortField = 'title' | 'updatedAt' | 'published';

export default function PostsTable({ posts, onDelete, onTogglePublish }: PostsTableProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPosts(e.target.checked ? posts.map(post => post.id) : []);
  };

  const handleSelectPost = (id: string) => {
    setSelectedPosts(prev =>
      prev.includes(id) ? prev.filter(postId => postId !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'updatedAt') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortField === 'published') {
        comparison = Number(a.published) - Number(b.published);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [posts, sortField, sortDirection]);

  const handleBulkPublish = (publish: boolean) => {
    if (onTogglePublish && window.confirm(`Are you sure you want to ${publish ? 'publish' : 'unpublish'} the selected posts?`)) {
      selectedPosts.forEach(id => {
        const post = posts.find(p => p.id === id);
        if (post && post.published !== publish) {
          onTogglePublish(id, post.published);
        }
      });
      setSelectedPosts([]);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-700">
            {selectedPosts.length} selected
          </div>
          {selectedPosts.length > 0 && (
            <div className="flex gap-2">
              {onTogglePublish && (
                <>
                  <button
                    onClick={() => handleBulkPublish(true)}
                    className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                  >
                    Publish Selected
                  </button>
                  <button
                    onClick={() => handleBulkPublish(false)}
                    className="px-3 py-1 text-sm text-amber-600 border border-amber-600 rounded hover:bg-amber-50"
                  >
                    Unpublish Selected
                  </button>
                </>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete the selected posts?')) {
                      selectedPosts.forEach(id => onDelete(id));
                      setSelectedPosts([]);
                    }
                  }}
                  className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  Delete Selected
                </button>
              )}
            </div>
          )}
        </div>
        {sortedPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border p-4 space-y-3 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedPosts.includes(post.id)}
                  onChange={() => handleSelectPost(post.id)}
                />
                <div>
                  <div className="font-medium text-gray-900">{post.title}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Updated {new Date(post.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  post.published
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {post.published ? 'Published' : 'Draft'}
              </span>
            </div>
            {post.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-end items-center gap-3 pt-2 border-t">
              <Link
                href={`/posts/${post.id}/edit`}
                className="text-blue-600 hover:text-blue-900"
              >
                Edit
              </Link>
              {onTogglePublish && (
                <button
                  onClick={() => onTogglePublish(post.id, post.published)}
                  className={`${
                    post.published ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'
                  }`}
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
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-700">
          {selectedPosts.length} selected
        </div>
        {selectedPosts.length > 0 && (
          <div className="flex gap-2">
            {onTogglePublish && (
              <>
                <button
                  onClick={() => handleBulkPublish(true)}
                  className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                >
                  Publish Selected
                </button>
                <button
                  onClick={() => handleBulkPublish(false)}
                  className="px-3 py-1 text-sm text-amber-600 border border-amber-600 rounded hover:bg-amber-50"
                >
                  Unpublish Selected
                </button>
              </>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete the selected posts?')) {
                    selectedPosts.forEach(id => onDelete(id));
                    setSelectedPosts([]);
                  }
                }}
                className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Delete Selected
              </button>
            )}
          </div>
        )}
      </div>
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
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-2">
                Title
                <span className="text-gray-400 group-hover:text-gray-600">
                  {sortField === 'title' ? (
                    sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSort />
                  )}
                </span>
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
              onClick={() => handleSort('published')}
            >
              <div className="flex items-center gap-2">
                Status
                <span className="text-gray-400 group-hover:text-gray-600">
                  {sortField === 'published' ? (
                    sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSort />
                  )}
                </span>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categories
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
              onClick={() => handleSort('updatedAt')}
            >
              <div className="flex items-center gap-2">
                Updated
                <span className="text-gray-400 group-hover:text-gray-600">
                  {sortField === 'updatedAt' ? (
                    sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : (
                    <FaSort />
                  )}
                </span>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedPosts.map((post) => (
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


    </div>
  );
}