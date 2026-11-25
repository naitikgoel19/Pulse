/* PalettePop Explore Palettes Page */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('explore-palettes-grid');
  const filterBar = document.getElementById('category-filters');
  const countLabel = document.getElementById('explore-count');

  let activeCategory = 'All';

  /**
   * Fetch palettes from the Express API for the selected category.
   */
  async function loadPalettes(category) {
    if (!grid) return;
    grid.innerHTML = '<div class="status-box">Loading palettes...</div>';

    try {
      const query =
        category && category !== 'All'
          ? `?category=${encodeURIComponent(category)}`
          : '';
      const response = await fetch(`/api/palettes${query}`);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      const palettes = Array.isArray(data.palettes) ? data.palettes : [];

      if (countLabel) {
        countLabel.textContent = `${palettes.length} palette${palettes.length === 1 ? '' : 's'}`;
      }

      if (palettes.length === 0) {
        grid.innerHTML = '<div class="status-box">No palettes found in this category.</div>';
        return;
      }

      grid.innerHTML = '';
      palettes.forEach((palette) => {
        grid.appendChild(createExploreCard(palette));
      });
    } catch (error) {
      if (countLabel) countLabel.textContent = '';
      grid.innerHTML =
        '<div class="status-box">Unable to load palettes. Please ensure the Express server is running.</div>';
    }
  }

  /**
   * Build a palette card with clickable swatches, Copy, Save, and Edit buttons.
   */
  function createExploreCard(palette) {
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

  // Handle category filter clicks
  filterBar?.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-btn');
    if (!button) return;

    const selected = button.dataset.category || 'All';
    if (selected === activeCategory) return;

    activeCategory = selected;
    filterBar.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.toggle('active', btn === button);
    });

    loadPalettes(activeCategory);
  });

  loadPalettes(activeCategory);
});
