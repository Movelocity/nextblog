import React, { useCallback, useEffect, useState } from 'react';
import { assetService } from '@/app/services/assets';
import { Asset } from '@/app/common/types';
import { FiUpload, FiCopy, FiTrash2, FiImage } from 'react-icons/fi';
import { useToast } from '@/app/components/Toast/context';
import classNames from 'classnames';
import Modal from '@/app/components/Modal';

type AssetModalProps = {
  blogId: string;
};

type AssetCardProps = {
  asset: Asset;
  blogId: string;
  onDelete: (fileName: string) => Promise<void>;
  onCopy: (fileName: string) => void;
};

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  blogId,
  onDelete,
  onCopy,
}) => {
  const assetUrl = assetService.getAssetUrl(blogId, asset.name);
  const isImage = asset.type.startsWith('image/');
  const sizeInKb = (asset.size / 1024).toFixed(1);

  return (
    <div
      className="relative group border rounded-lg p-2 hover:border-blue-500 transition-all"
      role="article"
      aria-label={`Asset: ${asset.name}`}
    >
      <div className="aspect-square mb-2 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={assetUrl}
            alt={asset.name}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-400 text-sm">{asset.type}</div>
        )}
      </div>

      <div className="text-sm truncate mb-1">{asset.name}</div>
      <div className="text-xs text-gray-500">{sizeInKb} KB</div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => onCopy(asset.name)}
          className="p-1.5 text-gray-600 hover:text-blue-500 bg-white rounded-full shadow-sm"
          aria-label={`Copy URL for ${asset.name}`}
        >
          <FiCopy size={16} />
        </button>
        <button
          onClick={() => onDelete(asset.name)}
          className="p-1.5 text-gray-600 hover:text-red-500 bg-white rounded-full shadow-sm"
          aria-label={`Delete ${asset.name}`}
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const UploadArea: React.FC<{
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDragActive: boolean;
}> = ({ onDrag, onDrop, onFileSelect, isDragActive }) => (
  <div
    onDragEnter={onDrag}
    onDragLeave={onDrag}
    onDragOver={onDrag}
    onDrop={onDrop}
    className={classNames(
      'border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors',
      {
        'border-blue-500 bg-blue-50': isDragActive,
        'border-gray-300 hover:border-blue-500': !isDragActive
      }
    )}
  >
    <input
      type="file"
      onChange={onFileSelect}
      className="hidden"
      id="file-upload"
      multiple
      accept="image/*"
    />
    <label 
      htmlFor="file-upload" 
      className="cursor-pointer flex flex-col items-center"
      role="button"
      tabIndex={0}
    >
      <FiUpload className="mb-2" size={24} />
      <p className="text-gray-600">
        {isDragActive ? 'Drop files here' : 'Drag and drop files here or click to upload'}
      </p>
    </label>
  </div>
);

export const AssetModal: React.FC<AssetModalProps> = ({ blogId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { showToast } = useToast();

  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleOpen = useCallback(() => setIsOpen(true), []);

  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await assetService.listAssets(blogId);
      console.log("assets", data);
      setAssets(data);
    } catch (error) {
      showToast('Failed to load assets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [blogId, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, loadAssets]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    try {
      await Promise.all(
        files.map(file => assetService.uploadAsset(blogId, file))
      );
      showToast('Assets uploaded successfully', 'success');
      loadAssets();
    } catch (error) {
      showToast('Failed to upload assets', 'error');
    }
  }, [blogId, loadAssets, showToast]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      await Promise.all(
        files.map(file => assetService.uploadAsset(blogId, file))
      );
      showToast('Assets uploaded successfully', 'success');
      loadAssets();
    } catch (error) {
      showToast('Failed to upload assets', 'error');
    }
  }, [blogId, loadAssets, showToast]);

  const handleDelete = useCallback(async (fileName: string) => {
    try {
      await assetService.deleteAsset(blogId, fileName);
      showToast('Asset deleted successfully', 'success');
      loadAssets();
    } catch (error) {
      showToast('Failed to delete asset', 'error');
    }
  }, [blogId, loadAssets, showToast]);

  const handleCopyUrl = useCallback((fileName: string) => {
    const url = assetService.getAssetUrl(blogId, fileName);
    navigator.clipboard.writeText(url);
    showToast('URL copied to clipboard', 'success');
  }, [blogId, showToast]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium hover:text-blue-500 transition-colors"
        aria-label="Open Asset Manager"
      >
        <FiImage className="w-4 h-4" />
        Assets
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Asset Manager"
        size="xl"
      >
        <div className="p-6">
          <UploadArea
            onDrag={handleDrag}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            isDragActive={dragActive}
          />

          <div className="overflow-y-auto max-h-[calc(90vh-350px)]">
            {isLoading ? (
              <div className="text-center py-8">Loading assets...</div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No assets found</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.path}
                    asset={asset}
                    blogId={blogId}
                    onDelete={handleDelete}
                    onCopy={handleCopyUrl}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}; 