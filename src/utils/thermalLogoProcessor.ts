/**
 * Utility for processing and optimizing uploaded logos for thermal label & receipt printers.
 * Performs client-side resizing (max width/height 250px) and monochrome thresholding (1-bit Black & White).
 */

export interface ThermalLogoOptions {
  maxWidth?: number; // Default 250px
  maxHeight?: number; // Default 250px
  threshold?: number; // 0-255, default 128 (pixels brighter than threshold become pure white, else pure black)
}

/**
 * Converts an uploaded image Data URL / URL into a thermal-optimized 1-bit Black & White PNG Data URL
 */
export const processThermalLogoDataUrl = (
  dataUrl: string,
  options: ThermalLogoOptions = {}
): Promise<string> => {
  const { maxWidth = 250, maxHeight = 250, threshold = 128 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // 1. Resize / Compress aspect ratio preserving
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2d context for thermal logo canvas'));
        return;
      }

      // Fill pure white background so transparent alpha becomes pure white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      // 2. Monochrome B/W Thresholding (1-bit)
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Luminance formula (ITU-R BT.601)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        // If pixel is transparent or bright -> turn pure white (255, 255, 255)
        // Otherwise -> turn pure black (0, 0, 0)
        if (a < 128 || brightness > threshold) {
          data[i] = 255;     // Red
          data[i + 1] = 255; // Green
          data[i + 2] = 255; // Blue
          data[i + 3] = 255; // Alpha
        } else {
          data[i] = 0;       // Red
          data[i + 1] = 0;   // Green
          data[i + 2] = 0;   // Blue
          data[i + 3] = 255; // Alpha
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Export as crisp, compact 1-bit PNG Data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
};

/**
 * Converts an uploaded image File into a thermal-optimized 1-bit Black & White PNG Data URL
 */
export const processThermalLogoFile = (
  file: File,
  options: ThermalLogoOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        reject(new Error('Failed to read image file'));
        return;
      }
      processThermalLogoDataUrl(src, options).then(resolve).catch(reject);
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
