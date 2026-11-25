/* PalettePop My Saved Palettes Page */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('saved-palettes-container');
  const emptyState = document.getElementById('saved-empty-state');
  const countLabel = document.getElementById('saved-count');

  // Preview modal elements
  const previewModal = document.getElementById('preview-modal');
  const previewTitle = document.getElementById('preview-modal-title');
  const previewMeta = document.getElementById('preview-modal-meta');
  const previewSwatches = document.getElementById('preview-modal-swatches');
  const previewCopyBtn = document.getElementById('preview-modal-copy');
  const previewEditBtn = document.getElementById('preview-modal-edit');
  const previewCloseBtn = document.getElementById('preview-modal-close');

  // Delete confirmation modal elements
  const deleteModal = document.getElementById('delete-modal');
  const deleteText = document.getElementById('delete-modal-text');
  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  const deleteConfirmBtn = document.getElementById('delete-confirm-btn');

  let activePreviewPalette = null;
  let pendingDeleteId = null;

  function renderSavedPalettes() {
    if (!container || !emptyState) return;
    const saved = PaletteUtils.getSavedPalettes();

    if (countLabel) {
      countLabel.textContent = `${saved.length} saved palette${saved.length === 1 ? '' : 's'}`;
    }

    if (saved.length === 0) {
      container.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    container.innerHTML = '';

    saved.forEach((palette) => {
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
      meta.textContent = `${palette.colors.length} colors · ${palette.source || 'Saved'}`;

      info.appendChild(title);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'palette-actions';

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'btn btn-ghost';
      openBtn.textContent = 'Open';
      openBtn.addEventListener('click', () => openPreviewModal(palette));

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

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        PaletteUtils.setEditorDraft({
          id: palette.id,
          name: palette.name,
          colors: palette.colors,
          source: palette.source || 'Saved'
        });
        window.location.href = '/editor.html';
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-ghost';
      deleteBtn.style.color = 'var(--danger)';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => openDeleteModal(palette));

      actions.appendChild(openBtn);
      actions.appendChild(copyBtn);
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      body.appendChild(info);
      body.appendChild(actions);

      card.appendChild(swatches);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  function openPreviewModal(palette) {
    if (!previewModal || !previewSwatches) return;
    activePreviewPalette = palette;

    if (previewTitle) previewTitle.textContent = palette.name;
    if (previewMeta) {
      previewMeta.textContent = `${palette.colors.length} colors · ${palette.source || 'Saved'}`;
    }

    previewSwatches.innerHTML = '';
    palette.colors.forEach((hex) => {
      const row = document.createElement('div');
      row.className = 'preview-modal-row';

      const chip = document.createElement('div');
      chip.className = 'preview-modal-chip';

      const dot = document.createElement('span');
      dot.className = 'preview-modal-dot';
      dot.style.backgroundColor = hex;

      const label = document.createElement('strong');
      label.textContent = hex;

      chip.appendChild(dot);
      chip.appendChild(label);

      const copyOneBtn = document.createElement('button');
      copyOneBtn.type = 'button';
      copyOneBtn.className = 'btn btn-secondary btn-sm';
      copyOneBtn.textContent = 'Copy';
      copyOneBtn.addEventListener('click', () => {
        PaletteUtils.copyToClipboard(hex, `Copied ${hex}`);
      });

      row.appendChild(chip);
      row.appendChild(copyOneBtn);
      previewSwatches.appendChild(row);
    });

    previewModal.hidden = false;
  }

  function closePreviewModal() {
    if (previewModal) previewModal.hidden = true;
    activePreviewPalette = null;
  }

  function openDeleteModal(palette) {
    if (!deleteModal) return;
    pendingDeleteId = palette.id;
    if (deleteText) {
      deleteText.textContent = `Are you sure you want to delete "${palette.name}"? This action cannot be undone.`;
    }
    deleteModal.hidden = false;
  }

  function closeDeleteModal() {
    if (deleteModal) deleteModal.hidden = true;
    pendingDeleteId = null;
  }

  previewCopyBtn?.addEventListener('click', () => {
    if (!activePreviewPalette) return;
    PaletteUtils.copyToClipboard(
      activePreviewPalette.colors.join(', '),
      `Copied "${activePreviewPalette.name}" HEX codes`
    );
  });

  previewEditBtn?.addEventListener('click', () => {
    if (!activePreviewPalette) return;
    PaletteUtils.setEditorDraft({
      id: activePreviewPalette.id,
      name: activePreviewPalette.name,
      colors: activePreviewPalette.colors,
      source: activePreviewPalette.source || 'Saved'
    });
    window.location.href = '/editor.html';
  });

  previewCloseBtn?.addEventListener('click', closePreviewModal);
  previewModal?.addEventListener('click', (event) => {
    if (event.target === previewModal) closePreviewModal();
  });

  deleteCancelBtn?.addEventListener('click', closeDeleteModal);
  deleteModal?.addEventListener('click', (event) => {
    if (event.target === deleteModal) closeDeleteModal();
  });

  deleteConfirmBtn?.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    PaletteUtils.deleteSavedPalette(pendingDeleteId);
    closeDeleteModal();
    renderSavedPalettes();
    PaletteUtils.showToast('Palette deleted');
  });

  renderSavedPalettes();
});
