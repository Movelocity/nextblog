import { Asset } from '@/app/common/types';
import { FiCopy, FiDownload, FiTrash2, FiFileText, FiEye } from 'react-icons/fi';
import { AssetPreview } from './AssetPreview';
import { ImageViewer } from './ImageViewer';
import { assetService } from '@/app/services/assets';
import { useState } from 'react';

// Configuration: Maximum file size for full preview (in bytes)
const MAX_PREVIEW_SIZE = 10 * 1024 * 1024; // 10MB

type AssetCardProps = {
  asset: Asset;
  blogId: string;
  onDelete: (fileName: string) => Promise<void>;
  onCopy: (fileName: string) => void;
  assetUrl: string;
};

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onDelete,
  onCopy,
  assetUrl,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const sizeInKb = (asset.size / 1024).toFixed(1);
  const isImage = asset.mimeType.startsWith('image/');
  const canPreviewFull = asset.size <= MAX_PREVIEW_SIZE;
  
  // Generate thumbnail URL for all images
  const thumbnailUrl = isImage ? assetService.getAssetThumbnailUrl(asset.id, 260) : undefined;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = assetUrl;
    link.download = asset.mimeType;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="relative group bg-white w-full rounded-lg overflow-hidden hover:border-blue-400 transition-colors h-full min-h-20"
      role="article"
      aria-label={`Asset: ${asset.filename}`}
    >
      <div className="aspect-square rounded overflow-hidden">
        {/* Always show thumbnail for images, or file icon for large non-image files */}
        {isImage ? (
          <AssetPreview type={asset.mimeType} url={assetUrl} name={asset.filename} thumbnailUrl={thumbnailUrl} />
        ) : asset.size > MAX_PREVIEW_SIZE ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
            <FiFileText size={32} className="mb-2" />
            <span className="text-xs text-center px-2">Beyond {MAX_PREVIEW_SIZE / (1024 * 1024)}MB</span>
          </div>
        ) : (
          <AssetPreview type={asset.mimeType} url={assetUrl} name={asset.filename} thumbnailUrl={thumbnailUrl} />
        )}
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Show preview button for images under size limit */}
        {isImage && canPreviewFull && (
          <button
            onClick={() => setShowPreview(true)}
            className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
            aria-label={`Preview ${asset.filename}`}
          >
            <FiEye size={14} className="md:w-4 md:h-4" />
          </button>
        )}
        <button
          onClick={() => onCopy(asset.url)}
          className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
          aria-label={`Copy URL for ${asset.url}`}
        >
          <FiCopy size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
          aria-label={`Download ${asset.filename}`}
        >
          <FiDownload size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={() => onDelete(asset.id)}
          className="p-1.5 text-gray-600 hover:text-red-500 bg-white shadow-sm rounded-full"
          aria-label={`Delete ${asset.filename}`}
        >
          <FiTrash2 size={14} className="md:w-4 md:h-4" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full py-1 px-2 space-y-1 bg-gray-300/70 text-gray-900 text-sm">
        <div className="truncate">{asset.filename}</div>
        <div className="">{sizeInKb} KB</div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={assetUrl}
        imageName={asset.filename}
      />
    </div>
  );
}; 