/* PalettePop Generate Palette Page */

document.addEventListener('DOMContentLoaded', () => {
  const SWATCH_COUNT = 5;

  // Store 5 color slots: { hex: '#RRGGBB', locked: boolean }
  const paletteSlots = Array.from({ length: SWATCH_COUNT }, () => ({
    hex: generateBalancedHex(),
    locked: false
  }));

  const grid = document.getElementById('generator-grid');
  const generateBtn = document.getElementById('generate-btn');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const saveBtn = document.getElementById('save-palette-btn');
  const openEditorBtn = document.getElementById('open-editor-btn');
  const nameInput = document.getElementById('palette-name-input');

  /**
   * Generate a pleasant random HEX color using HSL ranges
   * so colors remain balanced and usable for UI and design work.
   */
  function generateBalancedHex() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 48) + 25; // 25% - 72%
    const lightness = Math.floor(Math.random() * 56) + 24;  // 24% - 79%
    return hslToHex(hue, saturation, lightness);
  }

  /**
   * Convert HSL values to an uppercase #RRGGBB HEX string.
   */
  function hslToHex(h, s, l) {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const chroma = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - chroma / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
      r = chroma; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = chroma; b = 0;
    } else if (h < 180) {
      r = 0; g = chroma; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = chroma;
    } else if (h < 300) {
      r = x; g = 0; b = chroma;
    } else {
      r = chroma; g = 0; b = x;
    }

    const toHex = (value) =>
      Math.round((value + m) * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Generate new colors only for unlocked slots.
   */
  function regenerateUnlocked() {
    paletteSlots.forEach((slot) => {
      if (!slot.locked) {
        slot.hex = generateBalancedHex();
      }
    });
    renderPalette();
  }

  /**
   * Render all 5 color cards into the generator grid.
   */
  function renderPalette() {
    if (!grid) return;
    grid.innerHTML = '';

    paletteSlots.forEach((slot, index) => {
      const card = document.createElement('article');
      card.className = 'generator-card';

      const swatch = document.createElement('div');
      swatch.className = 'generator-swatch';
      swatch.style.backgroundColor = slot.hex;
      swatch.title = `Click to copy ${slot.hex}`;
      swatch.addEventListener('click', () => {
        PaletteUtils.copyToClipboard(slot.hex, `Copied ${slot.hex}`);
      });

      const swatchLabel = document.createElement('span');
      swatchLabel.className = 'generator-swatch-label';
      swatchLabel.textContent = 'Click to copy';
      swatch.appendChild(swatchLabel);

      const body = document.createElement('div');
      body.className = 'generator-card-body';

      const hexText = document.createElement('div');
      hexText.className = 'generator-hex';
      hexText.textContent = slot.hex;

      const actions = document.createElement('div');
      actions.className = 'generator-card-actions';

      const lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.className = `btn btn-secondary lock-btn${slot.locked ? ' locked' : ''}`;
      lockBtn.textContent = slot.locked ? 'Locked' : 'Lock';
      lockBtn.setAttribute('aria-pressed', String(slot.locked));
      lockBtn.addEventListener('click', () => {
        paletteSlots[index].locked = !paletteSlots[index].locked;
        renderPalette();
      });

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-secondary';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        PaletteUtils.copyToClipboard(slot.hex, `Copied ${slot.hex}`);
      });

      actions.appendChild(lockBtn);
      actions.appendChild(copyBtn);

      body.appendChild(hexText);
      body.appendChild(actions);

      card.appendChild(swatch);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  generateBtn?.addEventListener('click', regenerateUnlocked);

  copyAllBtn?.addEventListener('click', () => {
    const allHex = paletteSlots.map((slot) => slot.hex).join(', ');
    PaletteUtils.copyToClipboard(allHex, 'Copied all 5 HEX codes');
  });

  saveBtn?.addEventListener('click', () => {
    const customName = nameInput ? nameInput.value.trim() : '';
    const paletteName = customName || `Generated Palette`;
    const result = PaletteUtils.savePalette({
      name: paletteName,
      colors: paletteSlots.map((slot) => slot.hex),
      source: 'Generated'
    });

    if (result.saved) {
      PaletteUtils.showToast(`Saved "${result.palette.name}" to My Saved Palettes`);
      if (nameInput) nameInput.value = '';
    } else {
      PaletteUtils.showToast(result.reason);
    }
  });

  openEditorBtn?.addEventListener('click', () => {
    const customName = nameInput ? nameInput.value.trim() : '';
    PaletteUtils.setEditorDraft({
      name: customName || 'Generated Palette',
      colors: paletteSlots.map((slot) => slot.hex),
      source: 'Generated'
    });
    window.location.href = '/editor.html';
  });

  // Allow Spacebar shortcut to generate when focus is not inside a text input or button
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    event.preventDefault();
    regenerateUnlocked();
  });

  renderPalette();
});
