// ImageUpload - Drag-and-drop image upload with progress tracking
import React, { useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { createPreviewURL, uploadRecipeImage, uploadUserAvatar, validateImageFile } from '../../lib/imageUpload';

export function ImageUpload({
  label = 'Image',
  value = '',
  variant = 'avatar',
  recipeId = null,
  disabled = false,
  onUploaded,
  onError,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Generate preview URL from selected file or existing value
  const preview = useMemo(() => {
    if (selectedFile) return createPreviewURL(selectedFile);
    return value || '';
  }, [selectedFile, value]);

  // Centralized error reporting to component state and parent callback
  function reportError(message) {
    setError(message);
    if (typeof onError === 'function') onError(message);
  }

  // Validate and select a file for upload
  function pickFile(file) {
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.valid) {
      reportError(check.error);
      return;
    }
    setError('');
    setSelectedFile(file);
    setProgress(0);
  }

  // Upload selected file to backend API with progress tracking
  async function handleUpload() {
    if (!selectedFile || uploading || disabled) return;

    if (variant === 'recipe' && !recipeId) {
      reportError('Recipe must be created before uploading an image');
      return;
    }

    try {
      setUploading(true);
      setError('');
      // Route to appropriate upload handler based on variant
      const result = variant === 'recipe'
        ? await uploadRecipeImage(selectedFile, recipeId, setProgress)
        : await uploadUserAvatar(selectedFile, setProgress);

      setSelectedFile(null);
      setProgress(100);
      if (typeof onUploaded === 'function') {
        onUploaded(result);
      }
    } catch (uploadError) {
      reportError(uploadError.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Reset component state to initial values
  function clearSelection() {
    setSelectedFile(null);
    setProgress(0);
    setError('');
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-warm-gray-60">{label}</label>

      {/* Drag-and-drop zone with visual feedback */}
      <div
        className={[
          'rounded-lg border-2 border-dashed p-4 transition-colors',
          isDragging ? 'border-brand bg-brand-pale' : 'border-warm-gray-30 bg-white',
        ].join(' ')}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          pickFile(event.dataTransfer.files?.[0]);
        }}
      >
        {/* Hidden file input triggered by Select File button */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => pickFile(event.target.files?.[0])}
          disabled={disabled}
        />

        {/* Preview image or placeholder text */}
        {preview ? (
          <img
            src={preview}
            alt="Selected preview"
            className="h-36 w-full rounded-md object-cover"
          />
        ) : (
          <p className="text-sm text-warm-gray-60">
            Drag and drop an image here, or click Select File.
          </p>
        )}
      </div>

      {/* Upload progress bar - shows when upload is in progress */}
      {progress > 0 && (
        <div className="h-2 w-full overflow-hidden rounded bg-warm-gray-20">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error message display */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Action buttons: select file, upload, clear */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          Select File
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!selectedFile || disabled || uploading}
          onClick={handleUpload}
          isLoading={uploading}
        >
          Upload
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || uploading}
          onClick={clearSelection}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
