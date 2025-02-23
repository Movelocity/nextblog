import { FiUpload, FiEye, FiUploadCloud, FiX } from 'react-icons/fi';
import classNames from 'classnames';
import { useState, useCallback } from 'react';
import Modal from '@/app/components/Modal';

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
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPastedImage(e.target?.result as string);
          };
          reader.readAsDataURL(file);
          
          // Create a properly typed synthetic event
          const input = document.createElement('input');
          input.type = 'file';
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
          
          onFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
        }
      }
    }
  }, [onFileSelect]);

  const handleCancel = useCallback(() => {
    setPastedImage(null);
    setShowPreview(false);
  }, []);

  const areaClasses = classNames(
    'w-full border-2 border-dashed rounded-lg text-center transition-colors aspect-square flex flex-col items-center justify-between relative',
    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
  );

  return (
    <>
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
        {pastedImage ? (
          <div className="absolute inset-0 bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition-colors">
            <div className="aspect-square rounded overflow-hidden">
              <img
                src={pastedImage}
                alt="Pasted preview"
                className="w-full h-full object-cover opacity-90"
                onClick={() => setShowPreview(true)}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  // Handle upload logic here
                  setPastedImage(null);
                  setShowPreview(false);
                }}
                className="p-1.5 text-gray-600 hover:text-blue-500 bg-white shadow-sm rounded-full"
                aria-label="Upload image"
                title="Upload Image"
              >
                <FiUploadCloud size={14} className="md:w-4 md:h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 text-gray-600 hover:text-red-500 bg-white shadow-sm rounded-full"
                aria-label="Cancel upload"
                title="Cancel"
              >
                <FiX size={14} className="md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
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
        )}

        {/* Paste Input */}
        <input
          type="text"
          className="w-full max-w-md px-4 py-2 text-sm border-none bg-transparent outline-none rounded-lg"
          placeholder="Paste image here (Ctrl+V)"
          onPaste={handlePaste}
          aria-label="Paste image input"
        />
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        size="lg"
      >
        <div className="p-4">
          <img
            src={pastedImage || ''}
            alt="Preview"
            className="max-w-full max-h-[80vh] object-contain mx-auto"
          />
        </div>
      </Modal>
    </>
  );
}; 