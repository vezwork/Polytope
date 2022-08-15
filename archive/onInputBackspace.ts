private onInputBackspace(e: KeyboardEvent) {
    this.parentEditor()?.deleteChildEditor(this);
    e.stopPropagation();
  }


  deleteChildEditor(editor: EditorElement) {
    const childEditors = this.childEditors();
    const deleteIndex = childEditors.indexOf(editor);
    if (deleteIndex === -1)
      throw "deleteChildEditor: editor was not found in the parent";

    const prevChild = childEditors[deleteIndex - 1];
    if (prevChild) {
      prevChild.focusFromParentEditor({
        direction: EnterEditorDirection.left,
      });
    } else {
      this.makeFocused(); // this may behave strangely, not sure if this case will even come up
    }

    editor.parentNode.removeChild(editor);
  }