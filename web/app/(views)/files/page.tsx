'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiUpload, FiCopy, FiTrash2, FiFile } from 'react-icons/fi';
import { assetService } from '@/app/services/assets';
import { Asset } from '@/app/common/types';
import Pagination from '@/app/components/Pagination';
import { useAuth } from '@/app/hooks/useAuth';
import { useToast } from '@/app/components/layout/ToastHook';

const FILES_PER_PAGE = 24;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mimeType: string): boolean {
  return mimeType?.startsWith('image/') ?? false;
}

interface FileCardProps {
  file: Asset;
  onCopy: () => void;
  onDeleteRequest: () => void;
}

function FileCard({ file, onCopy, onDeleteRequest }: FileCardProps) {
  const isImage = isImageMime(file.mimeType);
  const ext = file.filename?.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'FILE';

  return (
    <div className="group relative bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
      <div className="aspect-square bg-gray-100 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={assetService.getAssetThumbnailUrl(file.id, 240)}
            alt={file.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
            <FiFile className="w-8 h-8" />
            <span className="text-xs font-mono">{ext}</span>
          </div>
        )}
      </div>

      <div className="p-2 space-y-0.5">
        <p className="text-xs text-gray-700 dark:text-gray-300 truncate" title={file.filename}>
          {file.filename}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(file.size)}</p>
      </div>

      {/* Hover actions */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onCopy}
          title="Copy URL"
          className="p-1 bg-white dark:bg-zinc-700 rounded shadow hover:bg-blue-50 dark:hover:bg-zinc-600"
        >
          <FiCopy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={onDeleteRequest}
          title="Delete"
          className="p-1 bg-white dark:bg-zinc-700 rounded shadow hover:bg-red-50 dark:hover:bg-zinc-600"
        >
          <FiTrash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

function FilesDashboardContent() {
  const [files, setFiles] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { isAuthenticated, isLoading, openLoginModal } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(total / FILES_PER_PAGE);

  useEffect(() => {
    document.title = 'Files';
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal({ onSuccess: fetchFiles });
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [page, isAuthenticated]);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const result = await assetService.listAllAssets(page, FILES_PER_PAGE);
      setFiles(result.data ?? []);
      setTotal(result.total);
    } catch {
      showToast('Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(fileList)) {
      try {
        await assetService.uploadFile(file);
        successCount++;
      } catch {
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }
    setUploading(false);
    if (successCount > 0) {
      showToast(`${successCount} file(s) uploaded`, 'success');
      fetchFiles();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    await handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async (fileId: string) => {
    try {
      await assetService.deleteAsset(fileId);
      showToast('File deleted', 'success');
      setDeleteId(null);
      fetchFiles();
    } catch {
      showToast('Failed to delete file', 'error');
    }
  };

  const handleCopyUrl = async (fileId: string) => {
    const url = assetService.getAssetUrl(fileId);
    try {
      await navigator.clipboard.writeText(url);
      showToast('URL copied', 'success');
    } catch {
      showToast('Failed to copy URL', 'error');
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/files?${params.toString()}`);
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <button className="text-gray-900 dark:text-gray-300" onClick={() => openLoginModal()}>
          LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Files</h1>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-copy'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <FiUpload
          className={`mx-auto mb-3 w-8 h-8 transition-colors ${
            isDragActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
          }`}
        />
        <p className={`text-sm transition-colors ${
          isDragActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {uploading
            ? 'Uploading…'
            : isDragActive
            ? 'Drop files here'
            : 'Drop files or click to upload'}
        </p>
      </div>

      {/* File count */}
      {!loading && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {total} file{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No files yet</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onCopy={() => handleCopyUrl(file.id)}
              onDeleteRequest={() => setDeleteId(file.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-zinc-800 rounded-lg p-6 space-y-4 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-800 dark:text-gray-200">Delete this file permanently?</p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                onClick={() => handleDelete(deleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FilesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
        </div>
      }
    >
      <FilesDashboardContent />
    </Suspense>
  );
}
