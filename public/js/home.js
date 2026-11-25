/* PalettePop Home Page Script */

document.addEventListener('DOMContentLoaded', () => {
  loadSamplePalettes();
});

/**
 * Fetch curated palettes from the backend API and display 4 sample palettes.
 */
async function loadSamplePalettes() {
  const grid = document.getElementById('sample-palettes-grid');
  if (!grid) return;

  try {
    const response = await fetch('/api/palettes');
    if (!response.ok) {
      throw new Error('Failed to fetch palettes');
    }

    const data = await response.json();
    const allPalettes = Array.isArray(data.palettes) ? data.palettes : [];

    // Pick 4 varied sample palettes across categories
    const sampleIds = [
      'warm-terracotta-sun',
      'cool-nordic-fjord',
      'pastel-soft-bloom',
      'nature-forest-moss'
    ];
    let samples = sampleIds
      .map((id) => allPalettes.find((palette) => palette.id === id))
      .filter(Boolean);

    if (samples.length < 4) {
      samples = allPalettes.slice(0, 4);
    }

    if (samples.length === 0) {
      grid.innerHTML = '<div class="status-box">No sample palettes available.</div>';
      return;
    }

    grid.innerHTML = '';
    samples.forEach((palette) => {
      grid.appendChild(createSamplePaletteCard(palette));
    });
  } catch (error) {
    grid.innerHTML =
      '<div class="status-box">Unable to load sample palettes right now. Please make sure the server is running.</div>';
  }
}

/**
 * Build a sample palette card with clickable swatches, Copy, Save, and Edit buttons.
 */
function createSamplePaletteCard(palette) {
  const card = document.createElement('article');
  card.className = 'palette-card';

  const swatches = document.createElement('div');
  swatches.className = 'palette-swatches';

  palette.colors.forEach((hex) => {
    const swatch = document.createElement('div');
    swatch.className = 'palette-swatch';
    swatch.style.backgroundColor = hex;
    swatch.title = `Click to copy ${hex}`;

    const badge = document.createElement('span');
    badge.className = 'swatch-hex-badge';
    badge.textContent = hex;

    swatch.appendChild(badge);
    swatch.addEventListener('click', () => {
      PaletteUtils.copyToClipboard(hex, `Copied ${hex}`);
    });

    swatches.appendChild(swatch);
  });

  const body = document.createElement('div');
  body.className = 'palette-card-body';

  const info = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'palette-title';
  title.textContent = palette.name;

  const meta = document.createElement('div');
  meta.className = 'palette-meta';
  meta.textContent = palette.category;

  info.appendChild(title);
  info.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'palette-actions';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn btn-ghost';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    PaletteUtils.copyToClipboard(
      palette.colors.join(', '),
      `Copied "${palette.name}" HEX codes`
    );
  });

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-secondary btn-sm';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    const result = PaletteUtils.savePalette({
      name: palette.name,
      colors: palette.colors,
      source: palette.category || 'Explore'
    });
    if (result.saved) {
      PaletteUtils.showToast(`Saved "${palette.name}" to My Saved Palettes`);
    } else {
      PaletteUtils.showToast(result.reason);
    }
  });

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn-secondary btn-sm';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => {
    PaletteUtils.setEditorDraft({
      name: palette.name,
      colors: palette.colors,
      source: palette.category || 'Explore'
    });
    window.location.href = '/editor.html';
  });

  actions.appendChild(copyBtn);
  actions.appendChild(saveBtn);
  actions.appendChild(editBtn);

  body.appendChild(info);
  body.appendChild(actions);

  card.appendChild(swatches);
  card.appendChild(body);

  return card;
}
