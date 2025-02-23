import { FiUpload } from 'react-icons/fi';
import classNames from 'classnames';

type UploadAreaProps = {
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDragActive: boolean;
};

export const UploadArea: React.FC<UploadAreaProps> = ({
  onDrag,
  onDrop,
  onFileSelect,
  isDragActive,
}) => {
  const areaClasses = classNames(
    'w-full border-2 border-dashed rounded-lg text-center transition-colors aspect-square flex items-center justify-center',
    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
  );

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      className={areaClasses}
      role="button"
      tabIndex={0}
      aria-label="Upload files"
    >
      <input
        type="file"
        onChange={onFileSelect}
        className="hidden"
        id="file-upload"
        multiple
        accept="*/*"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center p-2 md:p-4"
        role="button"
        tabIndex={0}
      >
        <FiUpload 
          className={classNames(
            'mb-2 transition-colors',
            isDragActive ? 'text-blue-500' : 'text-gray-500'
          )} 
          size={24} 
        />
        <p className={classNames(
          'text-sm md:text-base text-center transition-colors',
          isDragActive ? 'text-blue-600' : 'text-gray-600'
        )}>
          {isDragActive ? 'Drop files here' : 'Drop files or click to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          All file types supported
        </p>
      </label>
    </div>
  );
}; 