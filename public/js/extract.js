/* PalettePop Image Color Extractor Page */

document.addEventListener('DOMContentLoaded', () => {
  const MAX_CANVAS_SIZE = 120;
  const MAX_COLORS = 5;
  const MIN_COLOR_DISTANCE = 45;

  const fileInput = document.getElementById('image-file-input');
  const dropzone = document.getElementById('upload-dropzone');
  const errorBanner = document.getElementById('extract-error');
  const previewBox = document.getElementById('image-preview-box');
  const previewImg = document.getElementById('image-preview');
  const imageMeta = document.getElementById('image-meta');

  const statusText = document.getElementById('extract-status-text');
  const emptyBox = document.getElementById('extracted-empty');
  const resultsBox = document.getElementById('extracted-results');
  const extractedList = document.getElementById('extracted-list');

  const copyAllBtn = document.getElementById('copy-extracted-btn');
  const saveBtn = document.getElementById('save-extracted-btn');
  const editBtn = document.getElementById('edit-extracted-btn');

  let currentColors = [];
  let currentImageName = 'Extracted Palette';

  function showError(message) {
    if (errorBanner) {
      errorBanner.textContent = message;
      errorBanner.hidden = false;
    }
  }

  function clearError() {
    if (errorBanner) {
      errorBanner.textContent = '';
      errorBanner.hidden = true;
    }
  }

  /**
   * Handle a selected File object from input or drag-and-drop.
   */
  function handleFile(file) {
    clearError();

    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      showError('Invalid file type. Please select a valid image file (PNG, JPG, WEBP, GIF, or SVG).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const colors = extractDominantColors(img);
        if (colors.length === 0) {
          showError('Could not extract colors from this image (the image may be completely transparent).');
          URL.revokeObjectURL(objectUrl);
          return;
        }

        currentColors = colors;
        currentImageName = formatPaletteName(file.name);

        if (previewImg) previewImg.src = objectUrl;
        if (previewBox) previewBox.hidden = false;
        if (imageMeta) {
          imageMeta.textContent = `${file.name} (${img.naturalWidth} × ${img.naturalHeight} px)`;
        }

        renderExtractedColors(colors);
      } catch (err) {
        showError('Unable to process this image. Please try a different image file.');
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      showError('Failed to load the selected file as an image. The file may be corrupted or unsupported.');
    };

    img.src = objectUrl;
  }

  /**
   * Downscale the image onto an offscreen canvas and extract up to 5 dominant distinct HEX colors.
   */
  function extractDominantColors(img) {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
      throw new Error('Invalid image dimensions');
    }

    // Scale down large images so pixel processing stays fast and responsive
    const scale = Math.min(1, MAX_CANVAS_SIZE / Math.max(width, height));
    const sampleWidth = Math.max(1, Math.round(width * scale));
    const sampleHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
    const pixelData = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;

    // Quantize RGB channels into buckets of size 24 to group similar shades
    const buckets = new Map();
    const step = 24;

    for (let i = 0; i < pixelData.length; i += 4) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const a = pixelData[i + 3];

      // Ignore transparent pixels
      if (a < 128) continue;

      const qr = Math.min(255, Math.round(r / step) * step);
      const qg = Math.min(255, Math.round(g / step) * step);
      const qb = Math.min(255, Math.round(b / step) * step);
      const key = `${qr},${qg},${qb}`;

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
        buckets.set(key, bucket);
      }

      bucket.count += 1;
      bucket.sumR += r;
      bucket.sumG += g;
      bucket.sumB += b;
    }

    if (buckets.size === 0) return [];

    // Sort buckets by frequency (most dominant first)
    const sorted = Array.from(buckets.values())
      .sort((a, b) => b.count - a.count)
      .map((bucket) => ({
        r: Math.round(bucket.sumR / bucket.count),
        g: Math.round(bucket.sumG / bucket.count),
        b: Math.round(bucket.sumB / bucket.count)
      }));

    // Pick up to 5 distinct colors using Euclidean distance
    const selected = [];
    for (const candidate of sorted) {
      if (selected.length >= MAX_COLORS) break;
      const isDistinct = selected.every(
        (chosen) => colorDistance(chosen, candidate) >= MIN_COLOR_DISTANCE
      );
      if (isDistinct) {
        selected.push(candidate);
      }
    }

    // If the image has very few distinct hues, include remaining unique quantized colors
    if (selected.length < MAX_COLORS) {
      for (const candidate of sorted) {
        if (selected.length >= MAX_COLORS) break;
        const hex = rgbToHex(candidate.r, candidate.g, candidate.b);
        const alreadyIncluded = selected.some(
          (chosen) => rgbToHex(chosen.r, chosen.g, chosen.b) === hex
        );
        if (!alreadyIncluded) {
          selected.push(candidate);
        }
      }
    }

    return selected.map((c) => rgbToHex(c.r, c.g, c.b));
  }

  function colorDistance(c1, c2) {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function rgbToHex(r, g, b) {
    const toHex = (value) => value.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function formatPaletteName(filename) {
    const base = filename.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
    return base ? `${base.slice(0, 28)} Palette` : 'Extracted Palette';
  }

  function renderExtractedColors(colors) {
    if (!extractedList || !resultsBox || !emptyBox) return;

    emptyBox.hidden = true;
    resultsBox.hidden = false;
    extractedList.innerHTML = '';

    if (statusText) {
      statusText.textContent =
        colors.length < MAX_COLORS
          ? `Found ${colors.length} distinct dominant color${colors.length === 1 ? '' : 's'} in this image.`
          : 'Top 5 dominant colors extracted from your image:';
    }

    colors.forEach((hex) => {
      const row = document.createElement('div');
      row.className = 'extracted-item';

      const info = document.createElement('div');
      info.className = 'extracted-color-info';

      const swatch = document.createElement('div');
      swatch.className = 'extracted-swatch';
      swatch.style.backgroundColor = hex;

      const hexLabel = document.createElement('span');
      hexLabel.className = 'extracted-hex';
      hexLabel.textContent = hex;

      info.appendChild(swatch);
      info.appendChild(hexLabel);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-secondary btn-sm';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        PaletteUtils.copyToClipboard(hex, `Copied ${hex}`);
      });

      row.appendChild(info);
      row.appendChild(copyBtn);
      extractedList.appendChild(row);
    });
  }

  fileInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    handleFile(file);
  });

  // Support drag-and-drop on the upload box
  dropzone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone?.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = event.dataTransfer?.files?.[0];
    handleFile(file);
  });

  copyAllBtn?.addEventListener('click', () => {
    if (currentColors.length === 0) return;
    PaletteUtils.copyToClipboard(currentColors.join(', '), 'Copied extracted HEX codes');
  });

  saveBtn?.addEventListener('click', () => {
    if (currentColors.length < 2) {
      PaletteUtils.showToast('At least 2 distinct colors are needed to save a palette.');
      return;
    }
    const result = PaletteUtils.savePalette({
      name: currentImageName,
      colors: currentColors,
      source: 'Extracted'
    });
    if (result.saved) {
      PaletteUtils.showToast(`Saved "${result.palette.name}" to My Saved Palettes`);
    } else {
      PaletteUtils.showToast(result.reason);
    }
  });

  editBtn?.addEventListener('click', () => {
    if (currentColors.length === 0) return;
    const editorColors =
      currentColors.length === 1 ? [currentColors[0], '#FAF8F3'] : currentColors;
    PaletteUtils.setEditorDraft({
      name: currentImageName,
      colors: editorColors,
      source: 'Extracted'
    });
    window.location.href = '/editor.html';
  });
});
