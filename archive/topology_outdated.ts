this.contents = code || [];
for (const slotOrChar of this.contents) {
  if (typeof slotOrChar !== "string") {
    const slot = slotOrChar as EditorElement;
    slot.parentEditor = this;
  }
}



// 2
this.addEventListener("subEditorDeleted", (e: CustomEvent) => {
    this.focusEditor(e.detail, 1);
    setTimeout(() => {
      this.contents = this.contents.filter(
        (slotOrChar) => slotOrChar !== e.detail
      );
      this.render();
    });
  });
  this.addEventListener("subEditorReplaced", (e: CustomEvent) => {
    const index = this.contents.indexOf(e.detail.old);
    this.contents.splice(index, 1, e.detail.new);
    this.render();
    setTimeout(() => {
      e.detail.new.focusEditor();
    });
  });


  // 3 - from focusEditor

  for (const [slotOrChar, i] of withIndex(this.contents)) {
    if (slotOrChar === fromEl) {
      // case: exiting from slot
      this.caret = i + position;
      if (!isSelecting) this.minorCaret = this.caret;
      this.render();
      return;
    }
  }

  // 4 
  lineIndicesFromCaret(index) {
    let start = 0;
    let end = this.contents.length;
    for (let i = index - 1; i >= 0; i--) {
      if (this.contents[i] === "\n") {
        start = i + 1;
        break;
      }
    }
    for (let i = index; i <= this.contents.length; i++) {
      if (this.contents[i] === "\n") {
        end = i;
        break;
      }
    }
    return [start, end];
  }

  moveCaretUp(isSelecting) {
    const [lineStart, lineEnd] = this.lineIndicesFromCaret(this.caret);
    if (lineStart === 0) {
      this.caret = 0;
      if (!isSelecting) this.minorCaret = this.caret;
      return;
    }
    const caretOffsetLineStart = this.caret - lineStart;
    const [prevLineStart, prevLineEnd] = this.lineIndicesFromCaret(
      lineStart - 1
    );
    this.caret = Math.min(prevLineStart + caretOffsetLineStart, prevLineEnd);
    if (!isSelecting) this.minorCaret = this.caret;
  }

  moveCaretDown(isSelecting) {
    const [lineStart, lineEnd] = this.lineIndicesFromCaret(this.caret);
    if (lineEnd === this.contents.length) {
      this.caret = this.contents.length;
      if (!isSelecting) this.minorCaret = this.caret;
      return;
    }
    const caretOffsetLineStart = this.caret - lineStart;
    const [nextLineStart, nextLineEnd] = this.lineIndicesFromCaret(lineEnd + 1);
    this.caret = Math.min(nextLineStart + caretOffsetLineStart, nextLineEnd);
    if (!isSelecting) this.minorCaret = this.caret;
  }

  // 5
  else if (e.key === "ArrowUp") {
    e.preventDefault();
    this.moveCaretUp(e.shiftKey);
    this.render();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    this.moveCaretDown(e.shiftKey);
    this.render();
  } 