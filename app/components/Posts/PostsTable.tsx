import { BlogMeta } from '@/app/common/types';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaEdit, FaTrash, FaFilter, FaTimes } from 'react-icons/fa';
import { MdPublish, MdUnpublished } from 'react-icons/md';
import { RiSearchLine } from 'react-icons/ri';
import classNames from 'classnames';
import Modal from '../ui/Modal';
import CategoryTag from '@/app/components/CategoryTag';

// Types
type SortField = 'title' | 'updatedAt' | 'published' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'published' | 'draft';

interface PostsTableProps {
  posts: BlogMeta[];
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
      <p className="text-gray-700 dark:text-gray-300 px-4">
        Are you sure you want to delete the post &quot;<span className="font-medium">{postTitle}</span>&quot;? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 p-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
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

const CategoryTags = ({ categories }: { categories?: string[] }) => (
  <div className="flex flex-wrap gap-1">
    {categories?.map((category) => (
      <CategoryTag
        key={category}
        category={category}
      />
    ))}
  </div>
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

const ActionButtons = ({ post, onDelete }: { post: BlogMeta } & Pick<PostsTableProps, 'onDelete'>) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="flex justify-end items-center space-x-2">
        <Link
          href={`/posts/${post.id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 rounded-lg transition-all"
        >
          <FaEdit className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Link>
        
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-all"
        >
          <FaTrash className="w-3.5 h-3.5" />
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete?.(post.id);
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
  setSelectedPosts,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  totalCount,
  filteredCount
}: {
  selectedPosts: string[];
  setSelectedPosts: (posts: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  totalCount: number;
  filteredCount: number;
} & Pick<PostsTableProps, 'onTogglePublish' | 'onDelete'>) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleBulkPublish = (publish: boolean) => {
    if (!onTogglePublish || !window.confirm(`Are you sure you want to ${publish ? 'publish' : 'unpublish'} ${selectedPosts.length} selected post${selectedPosts.length > 1 ? 's' : ''}?`)) return;
    selectedPosts.forEach(id => onTogglePublish(id, !publish));
    setSelectedPosts([]);
  };

  const hasActiveFilters = searchQuery || filterStatus !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
  };

  return (
    <div className="border-b dark:border-gray-700">
      <div className="px-4 lg:px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Posts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filteredCount} {filteredCount === 1 ? 'post' : 'posts'}
            {hasActiveFilters && totalCount !== filteredCount && (
              <span> (filtered from {totalCount})</span>
            )}
            {selectedPosts.length > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                · {selectedPosts.length} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {selectedPosts.length > 0 ? (
            <>
              {onTogglePublish && (
                <>
                  <button
                    onClick={() => handleBulkPublish(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <MdPublish className="w-4 h-4" />
                    Publish
                  </button>
                  <button
                    onClick={() => handleBulkPublish(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <MdUnpublished className="w-4 h-4" />
                    Unpublish
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedPosts([])}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Clear
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={classNames(
                  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors',
                  hasActiveFilters
                    ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <FaFilter className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-full">
                    •
                  </span>
                )}
              </button>
              <Link
                href="/posts/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 lg:px-6 pb-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts by title..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'published', 'draft'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={classNames(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize',
                    filterStatus === status
                      ? 'bg-blue-600 text-white dark:bg-blue-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  Search: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 dark:hover:text-blue-300">
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded capitalize">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-blue-900 dark:hover:text-blue-300">
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-auto text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add this helper function at the top level
const getToggleHandler = (
  onTogglePublish: ((id: string, currentStatus: boolean) => void) | undefined,
  postId: string,
  published: boolean
) => {
  if (!onTogglePublish) return undefined;
  return () => onTogglePublish(postId, published);
};

// Mobile View Component
const MobileView = ({ posts, selectedPosts, setSelectedPosts, searchQuery, setSearchQuery, filterStatus, setFilterStatus, totalCount, ...props }: {
  posts: BlogMeta[];
  selectedPosts: string[];
  setSelectedPosts: (posts: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  totalCount: number;
} & Pick<PostsTableProps, 'onTogglePublish' | 'onDelete'>) => (
  <div className="space-y-4">
    <TableHeader
      selectedPosts={selectedPosts}
      setSelectedPosts={setSelectedPosts}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      totalCount={totalCount}
      filteredCount={posts.length}
      {...props}
    />
    {posts.length === 0 ? (
      <div className="px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          {searchQuery || filterStatus !== 'all' ? 'No posts found' : 'No posts yet'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {searchQuery || filterStatus !== 'all'
            ? 'Try adjusting your filters or search query'
            : 'Get started by creating your first post'}
        </p>
        {!searchQuery && filterStatus === 'all' && (
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </Link>
        )}
      </div>
    ) : (
      <div className="px-4 space-y-3">
        {posts.map((post) => (
        <div key={post.id} className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                checked={selectedPosts.includes(post.id)}
                onChange={() => setSelectedPosts(
                  selectedPosts.includes(post.id)
                    ? selectedPosts.filter(id => id !== post.id)
                    : [...selectedPosts, post.id]
                )}
              />
              <div className="flex-1 min-w-0">
                <Link href={`/posts/${post.id}`}>
                  <div className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                    {post.title}
                  </div>
                </Link>
                {post.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 max-w-[60vw] text-ellipsis">
                    {post.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge 
              published={post.published} 
              onClick={getToggleHandler(props.onTogglePublish, post.id, post.published)}
            />
          </div>
          
          {post.categories && post.categories.length > 0 && (
            <div className="pt-2">
              <CategoryTags categories={post.categories} />
            </div>
          )}
          <div className="flex justify-end items-center gap-2 pt-2 border-t dark:border-gray-700">
            <ActionButtons post={post} {...props} />
          </div>
        </div>
      ))}
      </div>
    )}
  </div>
);

// Desktop View Component
const DesktopView = ({ posts, selectedPosts, setSelectedPosts, searchQuery, setSearchQuery, filterStatus, setFilterStatus, totalCount, ...props }: {
  posts: BlogMeta[];
  selectedPosts: string[];
  setSelectedPosts: (posts: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  totalCount: number;
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
    <div className="w-full">
      <TableHeader
        selectedPosts={selectedPosts}
        setSelectedPosts={setSelectedPosts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        totalCount={totalCount}
        filteredCount={sortedPosts.length}
        {...props}
      />
      {sortedPosts.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || filterStatus !== 'all' ? 'No posts found' : 'No posts yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters or search query to find what you\'re looking for'
              : 'Get started by creating your first post and share your ideas with the world'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <Link
              href="/posts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y dark:divide-gray-700 divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              <th scope="col" className="px-6 py-4 text-left w-12">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  checked={sortedPosts.length > 0 && selectedPosts.length === sortedPosts.length}
                  onChange={(e) => setSelectedPosts(e.target.checked ? sortedPosts.map(post => post.id) : [])}
                  disabled={sortedPosts.length === 0}
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
                  className="px-6 py-4 text-left cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => handleSort(field)}
                >
                  <div className="flex items-center gap-2 select-none">
                    <span>{label}</span>
                    <SortIcon field={field} currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
              ))}
              <th scope="col" className="px-6 py-4 text-left">
                Categories
              </th>
              <th scope="col" className="sticky right-0 px-6 py-4 text-right bg-gray-50 dark:bg-gray-800/50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700 divide-gray-200 bg-white dark:bg-gray-900">
            {sortedPosts.map((post) => (
              <tr key={post.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {/* Checkbox */}
                <td className="px-6 py-4 whitespace-nowrap w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    checked={selectedPosts.includes(post.id)}
                    onChange={() => setSelectedPosts(
                      selectedPosts.includes(post.id)
                        ? selectedPosts.filter(id => id !== post.id)
                        : [...selectedPosts, post.id]
                    )}
                  />
                </td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge 
                    published={post.published} 
                    onClick={getToggleHandler(props.onTogglePublish, post.id, post.published)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(post.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {post.categories && post.categories.length > 0 ? (
                    <CategoryTags categories={post.categories} />
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                  )}
                </td>
                <td className="sticky right-0 px-6 py-4 whitespace-nowrap text-right text-sm font-medium bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50">
                  <ActionButtons post={post} {...props} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default function PostsTable(props: PostsTableProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Filter and search posts
  const filteredPosts = useMemo(() => {
    return props.posts.filter(post => {
      // Search filter
      const matchesSearch = searchQuery.trim() === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'published' && post.published) ||
        (filterStatus === 'draft' && !post.published);
      
      return matchesSearch && matchesStatus;
    });
  }, [props.posts, searchQuery, filterStatus]);

  const viewProps = {
    ...props,
    posts: filteredPosts,
    selectedPosts,
    setSelectedPosts,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    totalCount: props.posts.length,
  };

  return isMobile ? <MobileView {...viewProps} /> : <DesktopView {...viewProps} />;
}