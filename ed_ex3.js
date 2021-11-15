(`POLYTOPE`/*
const { TextEditorElement } = await import('./editor.js');

const code = await (await fetch('./ed_ex2.js')).text();
return new TextEditorElement({ code: code.split("") });
*/)
