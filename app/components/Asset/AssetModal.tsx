import React, { useCallback, useEffect, useState } from 'react';
import { assetService } from '@/app/services/assets';
import { Asset } from '@/app/common/types';
import { FiImage } from 'react-icons/fi';
import { useToast } from '@/app/components/Toast/context';
import Modal from '@/app/components/Modal';
import { AssetCard } from './AssetCard';
import { UploadArea } from './UploadArea';

type AssetModalProps = {
  blogId: string;
};

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
    const assetUrl = assetService.getAssetUrl(blogId, fileName);
    const markdownUrl = `![${fileName}](${assetUrl})`;
    const copyToClipboard = (text: string) => {
      // Try using the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => showToast('URL copied to clipboard', 'success'))
          .catch(() => showToast('Failed to copy URL', 'error'));
        return;
      }

      // Fallback for non-HTTPS environments
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Style to make it invisible but still functional
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        document.execCommand('copy');
        textArea.remove();
        showToast('URL copied to clipboard', 'success');
      } catch (err) {
        showToast('Failed to copy URL', 'error');
      }
    };

    copyToClipboard(markdownUrl);
  }, [blogId, showToast]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 hover:text-blue-500 transition-colors"
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
          <div className="overflow-y-auto max-h-[calc(90vh-350px)]">
            <div className="flex flex-wrap gap-4">
              <UploadArea
                onDrag={handleDrag}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
                isDragActive={dragActive}
              />
              {isLoading ? (
                <div className="w-full text-center py-8 text-gray-500">Loading assets...</div>
              ) : (
                assets.map((asset) => (
                  <AssetCard
                    key={asset.path}
                    asset={asset}
                    blogId={blogId}
                    onDelete={handleDelete}
                    onCopy={handleCopyUrl}
                    assetUrl={assetService.getAssetUrl(blogId, asset.name)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}; 