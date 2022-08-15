const paletteEl = document.createElement("div");
    paletteEl.className = "palette";
    paletteEl.innerText = meta?.name ?? "_";

    .palette {
        display: none;
      }

      :host(.isFocused) .palette {
        display: block;
        font-size: 14px;
        padding: 2px 5px;
        background: var(--editor-color);
        color: var(--editor-name-color);
        position: absolute;
        top: 100%;
        left: -2px;
        border-radius: 0 0 4px 4px;
        font-family: monospace;
        z-index: 10;
    }