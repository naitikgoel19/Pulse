/* PalettePop Palette Editor Page */

document.addEventListener('DOMContentLoaded', () => {
  const MIN_COLORS = 2;
  const MAX_COLORS = 8;
  const STARTER_PALETTE = {
    name: 'Linen Studio',
    colors: ['#8A7A5C', '#B5A892', '#DED6C6', '#292821', '#FAF8F3'],
    source: 'Custom'
  };

  const emptyNotice = document.getElementById('editor-empty-notice');
  const workspace = document.getElementById('editor-workspace');
  const loadStarterBtn = document.getElementById('load-starter-btn');

  const nameInput = document.getElementById('editor-name-input');
  const countLabel = document.getElementById('editor-count');
  const previewStrip = document.getElementById('editor-live-preview');
  const swatchesGrid = document.getElementById('editor-swatches-grid');

  const addColorBtn = document.getElementById('add-color-btn');
  const resetBtn = document.getElementById('reset-editor-btn');
  const copyAllBtn = document.getElementById('copy-editor-btn');
  const exportBtn = document.getElementById('export-editor-btn');
  const saveBtn = document.getElementById('save-editor-btn');

  let originalState = null;
  let currentColors = [];
  let savedId = null;

  /**
   * Initialize the editor from a passed draft or show the empty notice.
   */
  function initEditor() {
    const draft = PaletteUtils.consumeEditorDraft();

    if (draft && Array.isArray(draft.colors) && draft.colors.length >= MIN_COLORS) {
      const validColors = draft.colors
        .map((c) => PaletteUtils.normalizeHex(c))
        .filter(Boolean)
        .slice(0, MAX_COLORS);

      if (validColors.length >= MIN_COLORS) {
        loadPaletteIntoEditor({
          id: draft.id || null,
          name: draft.name || 'Custom Palette',
          colors: validColors
        });
        if (emptyNotice) emptyNotice.hidden = true;
        if (workspace) workspace.hidden = false;
        return;
      }
    }

    // No palette passed: show helpful message and hide workspace until starter is loaded
    if (emptyNotice) emptyNotice.hidden = false;
    if (workspace) workspace.hidden = true;
  }

  function loadPaletteIntoEditor({ id = null, name, colors }) {
    savedId = id;
    originalState = {
      id,
      name,
      colors: [...colors]
    };
    currentColors = [...colors];
    if (nameInput) nameInput.value = name;
    renderEditor();
  }

  function renderEditor() {
    renderLivePreview();
    renderColorCards();
    updateControlsState();
  }

  function renderLivePreview() {
    if (!previewStrip) return;
    previewStrip.innerHTML = '';

    currentColors.forEach((hex) => {
      const swatch = document.createElement('div');
      swatch.className = 'editor-preview-swatch';
      swatch.style.backgroundColor = hex;
      swatch.style.color = PaletteUtils.getContrastColor(hex);
      swatch.textContent = hex;
      previewStrip.appendChild(swatch);
    });
  }

  function renderColorCards() {
    if (!swatchesGrid) return;
    swatchesGrid.innerHTML = '';

    currentColors.forEach((hex, index) => {
      const card = document.createElement('article');
      card.className = 'editor-color-card';

      const colorPreview = document.createElement('div');
      colorPreview.className = 'editor-color-preview';
      colorPreview.style.backgroundColor = hex;

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.className = 'color-picker-input';
      picker.value = hex;
      picker.setAttribute('aria-label', `Pick color ${index + 1}`);

      colorPreview.appendChild(picker);

      const inputRow = document.createElement('div');
      inputRow.className = 'hex-input-row';

      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'hex-input';
      hexInput.value = hex;
      hexInput.maxLength = 7;
      hexInput.setAttribute('aria-label', `HEX value for color ${index + 1}`);

      const errorText = document.createElement('div');
      errorText.className = 'hex-error';

      inputRow.appendChild(hexInput);
      inputRow.appendChild(errorText);

      // Sync native color picker -> text input & live preview
      picker.addEventListener('input', () => {
        const nextHex = picker.value.toUpperCase();
        currentColors[index] = nextHex;
        hexInput.value = nextHex;
        hexInput.classList.remove('invalid');
        errorText.textContent = '';
        colorPreview.style.backgroundColor = nextHex;
        renderLivePreview();
      });

      // Validate and apply HEX text input
      hexInput.addEventListener('input', () => {
        const normalized = PaletteUtils.normalizeHex(hexInput.value);
        if (!normalized) {
          hexInput.classList.add('invalid');
          errorText.textContent = 'Enter a valid HEX (e.g. #8A7A5C)';
          return;
        }
        hexInput.classList.remove('invalid');
        errorText.textContent = '';
        currentColors[index] = normalized;
        picker.value = normalized;
        colorPreview.style.backgroundColor = normalized;
        renderLivePreview();
      });

      hexInput.addEventListener('blur', () => {
        const normalized = PaletteUtils.normalizeHex(hexInput.value);
        if (normalized) {
          hexInput.value = normalized;
        } else {
          hexInput.value = currentColors[index];
          hexInput.classList.remove('invalid');
          errorText.textContent = '';
        }
      });

      const actions = document.createElement('div');
      actions.className = 'generator-card-actions';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-secondary btn-sm';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        PaletteUtils.copyToClipboard(currentColors[index], `Copied ${currentColors[index]}`);
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-secondary btn-sm';
      removeBtn.textContent = 'Remove';
      removeBtn.disabled = currentColors.length <= MIN_COLORS;
      removeBtn.addEventListener('click', () => {
        if (currentColors.length <= MIN_COLORS) return;
        currentColors.splice(index, 1);
        renderEditor();
      });

      actions.appendChild(copyBtn);
      actions.appendChild(removeBtn);

      card.appendChild(colorPreview);
      card.appendChild(inputRow);
      card.appendChild(actions);
      swatchesGrid.appendChild(card);
    });
  }

  function updateControlsState() {
    if (countLabel) {
      countLabel.textContent = `${currentColors.length} / ${MAX_COLORS} colors`;
    }
    if (addColorBtn) {
      addColorBtn.disabled = currentColors.length >= MAX_COLORS;
    }
  }

  function generateRandomColor() {
    const r = Math.floor(Math.random() * 200 + 35).toString(16).padStart(2, '0');
    const g = Math.floor(Math.random() * 200 + 35).toString(16).padStart(2, '0');
    const b = Math.floor(Math.random() * 200 + 35).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  loadStarterBtn?.addEventListener('click', () => {
    loadPaletteIntoEditor(STARTER_PALETTE);
    if (emptyNotice) emptyNotice.hidden = true;
    if (workspace) workspace.hidden = false;
  });

  addColorBtn?.addEventListener('click', () => {
    if (currentColors.length >= MAX_COLORS) return;
    currentColors.push(generateRandomColor());
    renderEditor();
  });

  resetBtn?.addEventListener('click', () => {
    if (!originalState) return;
    currentColors = [...originalState.colors];
    if (nameInput) nameInput.value = originalState.name;
    renderEditor();
    PaletteUtils.showToast('Palette reset to original colors');
  });

  copyAllBtn?.addEventListener('click', () => {
    if (currentColors.length === 0) return;
    PaletteUtils.copyToClipboard(currentColors.join(', '), 'Copied all HEX codes');
  });

  exportBtn?.addEventListener('click', () => {
    if (currentColors.length === 0) return;
    const name = (nameInput?.value || 'palettepop-palette').trim();
    const payload = {
      name,
      colors: currentColors,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'palette';
    link.href = url;
    link.download = `${slug}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    PaletteUtils.showToast(`Exported ${slug}.json`);
  });

  saveBtn?.addEventListener('click', () => {
    if (currentColors.length < MIN_COLORS) return;
    const name = (nameInput?.value || 'Edited Palette').trim();

    const result = savedId
      ? PaletteUtils.updateSavedPalette(savedId, { name, colors: currentColors })
      : PaletteUtils.savePalette({ name, colors: currentColors, source: 'Editor' });

    if (result.saved) {
      savedId = result.palette.id;
      PaletteUtils.showToast(`Saved "${result.palette.name}" to My Saved Palettes`);
    } else {
      PaletteUtils.showToast(result.reason);
    }
  });

  initEditor();
});
