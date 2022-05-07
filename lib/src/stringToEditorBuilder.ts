function concatInPlace(array, otherArray) {
  for (const entry of otherArray) array.push(entry);
}

// processors is an array of functions that take 4 args:
// - char | Editor array to process,
// - output char | Editor array to append to,
// - input string,
// - and input string offset.
// Each processor returns true if it can successfully parse char | Editor array to process, false otherwise.
// Each processor modifies the output array argument if it is able to parse the char | Editor array to process.
export const createBuilder = (processors = []) => {
  const f = (string, hasOpenParen: any = false) => {
    let result = [];

    for (let i = 0; i < string.length; i++) {
      const char = string[i];

      if (char === "(") {
        const { consume, output } = f(
          string.substring(i + 1),
          processors
          //true
        );

        if (
          !processors.some((processor) => processor(output, result, string, i))
        ) {
          result = [...result, "(", ...output, ")"];
        }

        i = i + consume + 1;
      } else if (hasOpenParen && char === ")") {
        return {
          consume: i,
          output: result,
        };
      } else {
        result = [...result, char];
      }
    }
    return {
      consume: string.length,
      output: result,
    };
  };
  return f;
};

const EDITOR_IDENTIFIER = "POLYTOPE$$STRING";
const EDITOR_IDENTIFIER_STRING = `"${EDITOR_IDENTIFIER}"`;
export const createJSONProcessor =
  (editorFactory, validator) => (innerString, result) => {
    try {
      // Replace inner editors with a simple value so that JSON parse can parse
      // the innerString.
      let massagedInnerString = "";
      let innerEditors = [];
      for (let i = 0; i < innerString.length; i++) {
        const slotOrChar = innerString[i];
        if (typeof slotOrChar !== "string") {
          innerEditors.unshift(slotOrChar);
          massagedInnerString += EDITOR_IDENTIFIER_STRING;
        } else {
          const char = slotOrChar;
          massagedInnerString += char;
        }
      }

      const innerJSON = JSON.parse(massagedInnerString);

      const processedJSON = objectValueMap(innerJSON, (value) =>
        value === EDITOR_IDENTIFIER ? innerEditors.pop() : value
      );

      if (!validator(processedJSON)) return false;

      console.log(processedJSON, validator(processedJSON), editorFactory);

      concatInPlace(result, [editorFactory(processedJSON)]);
      return true;
    } catch (e) {
      console.error(e);
    }

    return false;
  };

function objectValueMap(obj, f) {
  const newObj = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === "object") {
      newObj[key] = objectValueMap(value, f);
    } else {
      newObj[key] = f(value);
    }
  }
  return newObj;
}

export const createFunctionProcessor =
  ({ name, arity, ElementConstructor }) =>
  (innerString, result, string, i) => {
    if (string.substring(i - name.length, i) === name) {
      // Only supports unary and binary ops for now.
      if (arity === 1) {
        const joiner = new ElementConstructor({
          code: innerString,
        });
        result.length -= name.length;
        concatInPlace(result, [joiner]);
        return true;
      } else if (arity === 2) {
        const commaIndex = innerString.indexOf(",");
        if (commaIndex !== -1) {
          const joiner = new ElementConstructor({
            leftCode: innerString.slice(0, commaIndex),
            rightCode: innerString.slice(commaIndex + 2),
          });
          result.length -= name.length;
          concatInPlace(result, [joiner]);
          return true;
        }
      }
    }

    return false;
  };

// const DELIMITER = '(`POLYTOPE`/*';
// const ED = ConstructiveUnidirectionalEditor({
//     name: 'del-testing',
//     leftEditorFactory: (code, parentEditor) => new TextEditorElement({
//         code,
//         parentEditor
//     }),
//     leftEditorOutput: (editor) => editor.getOutput(),
// });
// const createTESTINGProcessor = () => (innerString, result, string, i) => {
//     console.log('DEUBGUS', string.substring(i, DELIMITER.length));
//     if (string.substring(i, DELIMITER.length) === DELIMITER) {
//         const innerCode = innerString.slice(DELIMITER.length, -2);
//         console.log('DEBUG INNER', innerString.slice(DELIMITER.length, -2));
//         const editor = new ED({ leftCode: innerCode })
//         concatInPlace(result, [editor]);
//         return true;
//     }
//     return false;
// }
