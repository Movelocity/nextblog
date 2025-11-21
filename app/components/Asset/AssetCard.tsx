import { Asset } from '@/app/common/types';
import { FiCopy, FiDownload, FiTrash2, FiFileText, FiEye } from 'react-icons/fi';
import { AssetPreview } from './AssetPreview';
import { ImageViewer } from './ImageViewer';
import { useState } from 'react';

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
  const MAX_PREVIEW_SIZE = 2 * 1024 * 1024; // 2MB in bytes
  const isImage = asset.type.startsWith('image/');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = assetUrl;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (

    <div
      className="relative group bg-white w-full rounded-lg overflow-hidden hover:border-blue-400 transition-colors h-full min-h-20"
      role="article"
      aria-label={`Asset: ${asset.name}`}
    >
      <div className="aspect-square rounded overflow-hidden">
        {asset.size > MAX_PREVIEW_SIZE ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
            <FiFileText size={32} className="mb-2" />
            <span className="text-xs text-center px-2">Beyond 2MB</span>
          </div>
        ) : (
          <AssetPreview type={asset.type} url={assetUrl} name={asset.name} />
        )}
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isImage && asset.size <= MAX_PREVIEW_SIZE && (
          <button
            onClick={() => setShowPreview(true)}
            className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
            aria-label={`Preview ${asset.name}`}
          >
            <FiEye size={14} className="md:w-4 md:h-4" />
          </button>
        )}
        <button
          onClick={() => onCopy(asset.name)}
          className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
          aria-label={`Copy URL for ${asset.name}`}
        >
          <FiCopy size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
          aria-label={`Download ${asset.name}`}
        >
          <FiDownload size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={() => onDelete(asset.name)}
          className="p-1.5 text-gray-600 hover:text-red-500 bg-white shadow-sm rounded-full"
          aria-label={`Delete ${asset.name}`}
        >
          <FiTrash2 size={14} className="md:w-4 md:h-4" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full py-1 px-2 space-y-1 bg-gray-300/70 text-gray-900 text-sm">
        <div className="truncate">{asset.name}</div>
        <div className="">{sizeInKb} KB</div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={assetUrl}
        imageName={asset.name}
      />
    </div>
  );
}; 