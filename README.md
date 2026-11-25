# PalettePop — Color Palette Generator

PalettePop is a clean, minimal color palette generator web application built with HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, and JSON storage.

## Features (Planned & Implemented)

- **Home (`index.html`)**: Overview, hero call-to-action, and sample palettes.
- **Generate (`generate.html`)**: Random 5-color palette generator with color locking, copying, and saving.
- **Explore (`explore.html`)**: Browse and filter curated palettes stored in `data/palettes.json`.
- **Extract (`extract.html`)**: Extract dominant colors from an uploaded image using the browser Canvas API.
- **Editor (`editor.html`)**: Customize HEX values, add/remove swatches (2–8), and save palettes.
- **Saved (`saved.html`)**: View, copy, edit, and delete palettes saved in `localStorage`.
- **About (`about.html`)**: Project purpose, usage guide, and technology stack.

## Project Structure

```text
palettepop/
  public/
    index.html
    generate.html
    explore.html
    extract.html
    editor.html
    saved.html
    about.html
    css/
      style.css
    js/
      common.js
      home.js
      generate.js
      explore.js
      extract.js
      editor.js
      saved.js
    assets/
      logo.svg
  data/
    palettes.json
  server.js
  package.json
  README.md
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in your browser.
