import { 
  FiFileText, 
  FiImage, 
  FiMusic, 
  FiVideo,
  FiArchive,
  FiCode,
  FiPaperclip,
  FiBook,
  FiGrid
} from 'react-icons/fi';

type AssetPreviewProps = {
  type: string;
  url: string;
  name: string;
  thumbnailUrl?: string; // Optional thumbnail URL for images
};

const getIconByType = (type: string) => {
  // Images
  if (type.startsWith('image/')) return FiImage;
  
  // Videos
  if (type.startsWith('video/')) return FiVideo;
  
  // Audio
  if (type.startsWith('audio/')) return FiMusic;
  
  // Documents
  if (type.startsWith('application/pdf')) return FiBook;
  if (type.startsWith('application/msword') || 
      type.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return FiFileText;
  if (type.startsWith('application/vnd.ms-excel') || 
      type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return FiGrid;
  
  // Archives
  if (type.includes('zip') || 
      type.includes('tar') || 
      type.includes('rar') || 
      type.includes('7z') || 
      type.includes('gzip') || 
      type.includes('bzip2')) return FiArchive;
  
  // Code and text
  if (type.startsWith('text/')) {
    if (['javascript', 'typescript', 'css', 'html', 'xml'].some(ext => type.includes(ext))) {
      return FiCode;
    }
    return FiFileText;
  }
  
  // Default
  return FiPaperclip;
};

export const AssetPreview: React.FC<AssetPreviewProps> = ({ type, url, name, thumbnailUrl }) => {
  const isImage = type.startsWith('image/');
  const isVideo = type.startsWith('video/');
  const isAudio = type.startsWith('audio/');
  const Icon = getIconByType(type);

  if (isImage) {
    return (
      <img
        src={thumbnailUrl || url}
        alt={name}
        className="object-cover w-full h-full"
        loading="lazy"
      />
    );
  }

  if (isVideo) {
    return (
      <div className="relative w-full h-full bg-gray-50">
        <video
          src={url}
          className="absolute inset-0 w-full h-full object-cover"
          controls={false}
          muted
          loop
          poster={url + '?poster=true'}
        >
          <source src={url} type={type} />
        </video>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Icon size={32} className="text-white" />
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50 py-4">
        <Icon size={32} className="text-gray-400 mb-2" />
        <audio controls className="w-full max-w-[190px]" preload="metadata">
          <source src={url} type={type} />
        </audio>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50 p-4">
      <Icon size={32} className="text-gray-400 mb-2" />
      <span className="text-xs text-gray-500 text-center break-all">
        {name.split('.').pop()?.toUpperCase()}
      </span>
    </div>
  );
}; 