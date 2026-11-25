/* PalettePop Shared JavaScript Utilities */

const PaletteUtils = (() => {
  const SAVED_KEY = 'palettepop_saved_palettes';
  const DRAFT_KEY = 'palettepop_editor_draft';
  let toastTimeout = null;

  /**
   * Validate a 6-digit HEX color string (#RRGGBB).
   */
  function isValidHex(hex) {
    if (typeof hex !== 'string') return false;
    return /^#[0-9A-Fa-f]{6}$/.test(hex.trim());
  }

  /**
   * Normalize user input into uppercase #RRGGBB format, or return null if invalid.
   */
  function normalizeHex(input) {
    if (typeof input !== 'string') return null;
    let cleaned = input.trim().toUpperCase();
    if (!cleaned.startsWith('#')) {
      cleaned = '#' + cleaned;
    }
    if (/^#[0-9A-F]{3}$/.test(cleaned)) {
      cleaned =
        '#' +
        cleaned[1] +
        cleaned[1] +
        cleaned[2] +
        cleaned[2] +
        cleaned[3] +
        cleaned[3];
    }
    return isValidHex(cleaned) ? cleaned : null;
  }

  /**
   * Return dark or light text color for readable contrast over a given HEX background.
   */
  function getContrastColor(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) return '#292821';
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? '#292821' : '#FFFFFF';
  }

  /**
   * Show a brief toast notification at the bottom-right of the screen.
   */
  function showToast(message) {
    let toast = document.getElementById('palettepop-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'palettepop-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  /**
   * Copy text to clipboard and show feedback.
   */
  async function copyToClipboard(text, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      showToast(successMessage || `Copied ${text}`);
      return true;
    } catch (error) {
      showToast('Could not copy to clipboard.');
      return false;
    }
  }

  /**
   * Generate a unique ID for saved palettes.
   */
  function generateId() {
    return 'pal_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Read saved palettes from localStorage.
   */
  function getSavedPalettes() {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save a palette to localStorage, preventing exact color duplicates.
   */
  function savePalette({ name, colors, source = 'Custom' }) {
    const normalizedColors = colors
      .map((c) => normalizeHex(c))
      .filter(Boolean);

    if (normalizedColors.length < 2) {
      return { saved: false, reason: 'Palette must have at least 2 valid colors.' };
    }

    const existing = getSavedPalettes();
    const signature = normalizedColors.join(',');
    const duplicate = existing.find(
      (item) => Array.isArray(item.colors) && item.colors.join(',') === signature
    );

    if (duplicate) {
      return { saved: false, reason: 'This palette is already in My Saved Palettes.' };
    }

    const newEntry = {
      id: generateId(),
      name: (name || 'Untitled Palette').trim(),
      colors: normalizedColors,
      source,
      createdAt: new Date().toISOString()
    };

    existing.unshift(newEntry);
    localStorage.setItem(SAVED_KEY, JSON.stringify(existing));
    return { saved: true, palette: newEntry };
  }

  /**
   * Update an existing saved palette by ID, preventing duplicate color sets on other entries.
   */
  function updateSavedPalette(id, { name, colors }) {
    const normalizedColors = colors
      .map((c) => normalizeHex(c))
      .filter(Boolean);

    if (normalizedColors.length < 2) {
      return { saved: false, reason: 'Palette must have at least 2 valid colors.' };
    }

    const existing = getSavedPalettes();
    const index = existing.findIndex((item) => item.id === id);
    if (index === -1) {
      return savePalette({ name, colors: normalizedColors, source: 'Edited' });
    }

    const signature = normalizedColors.join(',');
    const duplicate = existing.find(
      (item) =>
        item.id !== id &&
        Array.isArray(item.colors) &&
        item.colors.join(',') === signature
    );

    if (duplicate) {
      return { saved: false, reason: 'Another saved palette already has these exact colors.' };
    }

    existing[index] = {
      ...existing[index],
      name: (name || existing[index].name || 'Untitled Palette').trim(),
      colors: normalizedColors,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(SAVED_KEY, JSON.stringify(existing));
    return { saved: true, palette: existing[index] };
  }

  /**
   * Delete a saved palette by ID.
   */
  function deleteSavedPalette(id) {
    const updated = getSavedPalettes().filter((item) => item.id !== id);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Store a palette temporarily to load into editor.html.
   */
  function setEditorDraft(palette) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(palette));
  }

  /**
   * Read and clear the editor draft palette if present.
   */
  function consumeEditorDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      localStorage.removeItem(DRAFT_KEY);
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  /**
   * Initialize responsive mobile navigation toggle.
   */
  function initNavigation() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  return {
    isValidHex,
    normalizeHex,
    getContrastColor,
    showToast,
    copyToClipboard,
    getSavedPalettes,
    savePalette,
    updateSavedPalette,
    deleteSavedPalette,
    setEditorDraft,
    consumeEditorDraft,
    initNavigation
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  PaletteUtils.initNavigation();
});
