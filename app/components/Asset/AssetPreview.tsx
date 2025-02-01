import { FiFile, FiFileText, FiImage, FiMusic, FiVideo } from 'react-icons/fi';

type AssetPreviewProps = {
  type: string;
  url: string;
  name: string;
};

const getIconByType = (type: string) => {
  if (type.startsWith('image/')) return FiImage;
  if (type.startsWith('video/')) return FiVideo;
  if (type.startsWith('audio/')) return FiMusic;
  if (type.startsWith('text/')) return FiFileText;
  return FiFile;
};

export const AssetPreview: React.FC<AssetPreviewProps> = ({ type, url, name }) => {
  const isImage = type.startsWith('image/');
  const Icon = getIconByType(type);

  if (isImage) {
    return (
      <img
        src={url}
        alt={name}
        className="object-cover w-full h-full"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-50">
      <Icon size={32} className="text-gray-400" />
    </div>
  );
}; 