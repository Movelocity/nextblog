import { Asset } from '@/app/common/types';
import { FiCopy, FiDownload, FiTrash2, FiFileText, FiEye } from 'react-icons/fi';
import { AssetPreview } from './AssetPreview';
import { useState } from 'react';
import Modal from '@/app/components/Modal';

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
    <>
      <div
        className="relative group bg-white w-full rounded-lg p-2 md:p-3 border border-gray-200 hover:border-blue-400 transition-colors h-full"
        role="article"
        aria-label={`Asset: ${asset.name}`}
      >
        <div className="aspect-square mb-2 rounded overflow-hidden">
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

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-300/50">
          <div className="text-xs md:text-sm truncate mb-1 text-gray-700">{asset.name}</div>
          <div className="text-xs text-gray-500">{sizeInKb} KB</div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        size="lg"
      >
        <div className="p-4">
          <img
            src={assetUrl}
            alt={asset.name}
            className="max-w-full max-h-[80vh] object-contain mx-auto"
          />
        </div>
      </Modal>
    </>
  );
}; 