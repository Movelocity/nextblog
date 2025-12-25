import { BlogMeta } from '@/app/common/types';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaEye } from 'react-icons/fa';
import { MdPublish, MdUnpublished } from 'react-icons/md';
import classNames from 'classnames';
import Modal from '@/app/components/ui/Modal';
import CategoryTag from '@/app/components/CategoryTag';

// Types
type SortField = 'title' | 'updatedAt' | 'published' | 'createdAt';
type SortDirection = 'asc' | 'desc';

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
      <p className="text-gray-700 dark:text-gray-300 px-4">
        Are you sure you want to delete the post &quot;<span className="font-medium">{postTitle}</span>&quot;? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 p-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

const StatusBadge = ({ published, onClick }: { published: boolean; onClick?: () => void }) => (
  <button
    onClick={onClick}
    type="button"
    disabled={!onClick}
    className={classNames(
      'px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full transition-all duration-200',
      published 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40' 
        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40',
      onClick ? 'cursor-pointer' : 'cursor-default'
    )}
    aria-label={`${published ? 'Published' : 'Draft'}${onClick ? ' - Click to toggle status' : ''}`}
  >
    {published ? (
      <MdPublish className="w-3.5 h-3.5" />
    ) : (
      <MdUnpublished className="w-3.5 h-3.5" />
    )}
    <span>{published ? 'Published' : 'Draft'}</span>
  </button>
);

const SortIcon = ({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) => (
  <span className={classNames(
    'transition-colors',
    field === currentField 
      ? 'text-blue-600 dark:text-blue-400' 
      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
  )}>
    {field === currentField
      ? direction === 'asc' ? <FaSortUp className="w-3.5 h-3.5" /> : <FaSortDown className="w-3.5 h-3.5" />
      : <FaSort className="w-3.5 h-3.5" />}
  </span>
);

interface PostsTableProps {
  posts: BlogMeta[];
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, currentStatus: boolean) => void;
  footer?: React.ReactNode;
}

export default function PostsTable({ posts, onDelete, onTogglePublish, footer }: PostsTableProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const deletePost = useMemo(() => 
    posts.find(p => p.id === deletePostId), 
    [posts, deletePostId]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

  const togglePublish = (postId: string, published: boolean) => {
    onTogglePublish?.(postId, published);
  };

  const handleBulkPublish = (publish: boolean) => {
    if (!onTogglePublish || !window.confirm(`Are you sure you want to ${publish ? 'publish' : 'unpublish'} ${selectedPosts.length} selected post${selectedPosts.length > 1 ? 's' : ''}?`)) return;
    selectedPosts.forEach(id => onTogglePublish?.(id, !publish));
    setSelectedPosts([]);
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="px-10 py-2 flex justify-between items-center text-gray-600 dark:text-gray-300">
        <span className="text-sm">我的文档</span>
        <Link href="/posts-view" className="text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          新版管理页面
        </Link>
      </div>
      {selectedPosts.length > 0 && (
        <div className="flex items-center space-x-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="mr-2">
            <input
              type="checkbox"
              id="select-all-button"
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              checked={sortedPosts.length > 0 && selectedPosts.length === sortedPosts.length}
              onChange={(e) => setSelectedPosts(e.target.checked ? sortedPosts.map(post => post.id) : [])}
              disabled={sortedPosts.length === 0}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {selectedPosts.length} selected
          </span>
          {onTogglePublish && (
            <>
              <button
                onClick={() => handleBulkPublish(true)}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <MdPublish className="w-4 h-4" />
                Publish
              </button>
              <button
                onClick={() => handleBulkPublish(false)}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <MdUnpublished className="w-4 h-4" />
                Unpublish
              </button>
            </>
          )}
        </div>
      )}
      {sortedPosts.length === 0 ? (
        <div className="px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No posts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Get started by creating your first post and share your ideas with the world
          </p>
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto w-full flex-1 min-h-0">
          <table className="min-w-full divide-y dark:divide-gray-700 divide-gray-200 flex-1 min-h-0">
          { selectedPosts.length === 0 && (
            <thead>
              <tr className="group text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                <th scope="col" className="py-3 px-2 text-left w-6">
                  <input
                    type="checkbox"
                    id="select-all"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    checked={sortedPosts.length > 0 && selectedPosts.length === sortedPosts.length}
                    onChange={(e) => setSelectedPosts(e.target.checked ? sortedPosts.map(post => post.id) : [])}
                    disabled={sortedPosts.length === 0}
                  />
                </th>
                {[
                  { field: 'title' as const, label: '标题' },
                  { field: 'published' as const, label: '状态' },
                  { field: 'createdAt' as const, label: '创建' }
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    scope="col"
                    className="p-3 text-left cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort(field)}
                  >
                    <div className="flex items-center gap-2 select-none">
                      <span>{label}</span>
                      <SortIcon field={field} currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                ))}
                <th scope="col" className="p-3 text-left text-nowrap">
                  分类
                </th>
                <th scope="col" className="sticky right-0 py-3 px-6 text-right bg-gray-50 dark:bg-gray-800">
                  操作
                </th>
              </tr>
            </thead>
          )}
            <tbody className="divide-y dark:divide-gray-700 divide-gray-200 bg-white dark:bg-gray-800">
              {sortedPosts.map((post) => (
                <tr key={post.id} className="group transition-colors">
                  {/* Checkbox */}
                  <td className="py-3 px-2 whitespace-nowrap w-6 group-hover:brightness-95">
                    <input
                      type="checkbox"
                      id={post.id}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => setSelectedPosts(
                        selectedPosts.includes(post.id)
                          ? selectedPosts.filter(id => id !== post.id)
                          : [...selectedPosts, post.id]
                      )}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/posts/${post.id}`}>
                      <div className="max-w-md">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {post.title}
                        </div>
                        {post.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {post.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <StatusBadge 
                      published={post.published} 
                      onClick={() => togglePublish(post.id, post.published)}
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-3">
                    {post.categories && post.categories.length > 0 ? (
                      // <CategoryTags categories={post.categories} />
                      <div className="flex flex-wrap gap-1">
                        {post.categories?.map((category) => (
                          <CategoryTag
                            key={category}
                            category={category}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="sticky right-0 p-3 whitespace-nowrap text-right text-sm font-medium bg-white dark:bg-gray-800 group-hover:brightness-95">
                  <div className="flex justify-end items-center space-x-2">
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 rounded-lg transition-all"
                    >
                      {/* <FaEdit className="w-3.5 h-3.5" /> */}
                      <span>编辑</span>
                    </Link>
                    
                    <button
                      onClick={() => setDeletePostId(post.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-all"
                    >
                      {/* <FaTrash className="w-3.5 h-3.5" /> */}
                      <span>删除</span>
                    </button>
                  </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footer}

      <DeleteConfirmationModal
        isOpen={deletePostId !== null}
        onClose={() => setDeletePostId(null)}
        onConfirm={() => {
          if (deletePostId) {
            onDelete?.(deletePostId);
          }
          setDeletePostId(null);
        }}
        postTitle={deletePost?.title ?? ''}
      />
    </div>
  );
}