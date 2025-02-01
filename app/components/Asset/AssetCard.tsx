import { Asset } from '@/app/common/types';
import { FiCopy, FiDownload, FiTrash2 } from 'react-icons/fi';
import { AssetPreview } from './AssetPreview';

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
  const sizeInKb = (asset.size / 1024).toFixed(1);

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
      className="relative group bg-white w-48 rounded-lg p-3 border border-gray-200 hover:border-blue-400 transition-colors h-full"
      role="article"
      aria-label={`Asset: ${asset.name}`}
    >
      <div className="aspect-square mb-2 rounded overflow-hidden">
        <AssetPreview type={asset.type} url={assetUrl} name={asset.name} />
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => onCopy(asset.name)}
          className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
          aria-label={`Copy URL for ${asset.name}`}
        >
          <FiCopy size={16} />
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
          aria-label={`Download ${asset.name}`}
        >
          <FiDownload size={16} />
        </button>
        <button
          onClick={() => onDelete(asset.name)}
          className="p-1.5 text-gray-600 hover:text-red-500 bg-white shadow-sm rounded-full"
          aria-label={`Delete ${asset.name}`}
        >
          <FiTrash2 size={16} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-300/50">
        <div className="text-sm truncate mb-1 text-gray-700">{asset.name}</div>
        <div className="text-xs text-gray-500">{sizeInKb} KB</div>
      </div>
    </div>
  );
}; 