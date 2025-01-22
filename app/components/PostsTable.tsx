import { Post } from '../common/types';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaEdit, FaTrash } from 'react-icons/fa';
import { MdPublish, MdUnpublished } from 'react-icons/md';
import classNames from 'classnames';
import Modal from './Modal';

// Types
type SortField = 'title' | 'updatedAt' | 'published';
type SortDirection = 'asc' | 'desc';

interface PostsTableProps {
  posts: Post[];
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, currentStatus: boolean) => void;
}

// Components
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  postTitle 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  postTitle: string; 
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" size="sm">
    <div className="space-y-4">
      <p className="text-gray-700">
        Are you sure you want to delete the post "<span className="font-medium">{postTitle}</span>"? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

const StatusBadge = ({ published }: { published: boolean }) => (
  <span
    className={classNames(
      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
      published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
    )}
  >
    {published ? 'Published' : 'Draft'}
  </span>
);

const CategoryTags = ({ categories }: { categories?: string[] }) => (
  <div className="flex flex-wrap gap-1">
    {categories?.map((category) => (
      <span
        key={category}
        className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
      >
        {category}
      </span>
    ))}
  </div>
);

const SortIcon = ({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) => (
  <span className="text-gray-400 group-hover:text-gray-600">
    {field === currentField
      ? direction === 'asc' ? <FaSortUp /> : <FaSortDown />
      : <FaSort />}
  </span>
);

const ActionButtons = ({ post, onTogglePublish, onDelete }: { post: Post } & Pick<PostsTableProps, 'onTogglePublish' | 'onDelete'>) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="flex justify-end items-center space-x-2">
        <Link
          href={`/posts/${post.id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <FaEdit className="w-4 h-4" />
          <span>Edit</span>
        </Link>
        {onTogglePublish && (
          <button
            onClick={() => onTogglePublish(post.id, post.published)}
            className={classNames(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
              post.published 
                ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                : "text-green-700 bg-green-50 hover:bg-green-100"
            )}
          >
            {post.published ? (
              <>
                <MdUnpublished className="w-4 h-4" />
                <span>Unpublish</span>
              </>
            ) : (
              <>
                <MdPublish className="w-4 h-4" />
                <span>Publish</span>
              </>
            )}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <FaTrash className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (onDelete) {
            onDelete(post.id);
          }
          setShowDeleteModal(false);
        }}
        postTitle={post.title}
      />
    </>
  );
};

const TableHeader = ({
  selectedPosts,
  onTogglePublish,
  onDelete,
  setSelectedPosts
}: {
  selectedPosts: string[];
  setSelectedPosts: (posts: string[]) => void;
} & Pick<PostsTableProps, 'onTogglePublish' | 'onDelete'>) => {
  const handleBulkPublish = (publish: boolean) => {
    if (!onTogglePublish || !window.confirm(`Are you sure you want to ${publish ? 'publish' : 'unpublish'} the selected posts?`)) return;
    selectedPosts.forEach(id => onTogglePublish(id, !publish));
    setSelectedPosts([]);
  };

  return (
    <div className="px-6 py-4 border-b flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-900">Manage Posts</h2>
      <div className="flex items-center gap-3">
        {selectedPosts.length > 0 && (
          <>
            {onTogglePublish && (
              <>
                <button
                  onClick={() => handleBulkPublish(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                >
                  Publish Selected
                </button>
                <button
                  onClick={() => handleBulkPublish(false)}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-amber-600 border border-amber-600 rounded hover:bg-amber-50"
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
                className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Delete Selected
              </button>
            )}
          </>
        )}
        <Link
          href="/posts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>
    </div>
  );
};

// Mobile View Component
const MobileView = ({ posts, selectedPosts, setSelectedPosts, ...props }: {
  posts: Post[];
  selectedPosts: string[];
  setSelectedPosts: (posts: string[]) => void;
} & Pick<PostsTableProps, 'onTogglePublish' | 'onDelete'>) => (
  <div className="space-y-4">
    <TableHeader
      selectedPosts={selectedPosts}
      setSelectedPosts={setSelectedPosts}
      {...props}
    />
    <div className="px-4">
      <div className="text-sm text-gray-700 mb-4">
        {selectedPosts.length} selected
      </div>
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm border p-4 space-y-3 transition-all hover:shadow-md mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedPosts.includes(post.id)}
                onChange={() => setSelectedPosts(
                  selectedPosts.includes(post.id)
                    ? selectedPosts.filter(id => id !== post.id)
                    : [...selectedPosts, post.id]
                )}
              />
              <div>
                <div className="font-medium text-gray-900">{post.title}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Updated {new Date(post.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <StatusBadge published={post.published} />
          </div>
          {post.categories && <CategoryTags categories={post.categories} />}
          <div className="flex justify-end items-center gap-3 pt-2 border-t">
            <ActionButtons post={post} {...props} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Desktop View Component
const DesktopView = ({ posts, selectedPosts, setSelectedPosts, ...props }: {
  posts: Post[];
  selectedPosts: string[];
  setSelectedPosts: (posts: string[]) => void;
} & Pick<PostsTableProps, 'onTogglePublish' | 'onDelete'>) => {
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  return (
    <div className="overflow-hidden">
      <TableHeader
        selectedPosts={selectedPosts}
        setSelectedPosts={setSelectedPosts}
        {...props}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedPosts.length === posts.length}
                  onChange={(e) => setSelectedPosts(e.target.checked ? posts.map(post => post.id) : [])}
                />
              </th>
              {[
                { field: 'title' as const, label: 'Title' },
                { field: 'published' as const, label: 'Status' },
                { field: 'updatedAt' as const, label: 'Updated' }
              ].map(({ field, label }) => (
                <th
                  key={field}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleSort(field)}
                >
                  <div className="flex items-center gap-2">
                    {label}
                    <SortIcon field={field} currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
              ))}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categories
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
                    onChange={() => setSelectedPosts(
                      selectedPosts.includes(post.id)
                        ? selectedPosts.filter(id => id !== post.id)
                        : [...selectedPosts, post.id]
                    )}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                    {post.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge published={post.published} />
                </td>
                <td className="px-6 py-4">
                  <CategoryTags categories={post.categories} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(post.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <ActionButtons post={post} {...props} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function PostsTable(props: PostsTableProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const viewProps = {
    ...props,
    selectedPosts,
    setSelectedPosts,
  };

  return isMobile ? <MobileView {...viewProps} /> : <DesktopView {...viewProps} />;
}