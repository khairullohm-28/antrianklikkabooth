/**
 * Image Compression Utility
 * Resizes and compresses image files to lightweight Data URLs before uploading to Firestore.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export const compressImageFile = (
  file: File,
  options: CompressImageOptions = {}
): Promise<string> => {
  const { maxWidth = 600, maxHeight = 600, quality = 0.8, mimeType = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving scale
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2d context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      };

      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const compressImage = (
  file: File,
  maxWidth: number = 600,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<string> => {
  return compressImageFile(file, { maxWidth, maxHeight, quality });
};

