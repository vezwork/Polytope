import { TextEditorElement, MathEditorElement } from "./editor.js";
import { PlusJoinerElement, DivJoinerElement, ExpJoinerElement, RadicalJoinerElement } from "./sub_math_editors.js";

export const stringToEditor = (string) => {
    let result = [];

    for (let i = 0; i < string.length; i++) {
        const char = string[i];

        if (char === '(') {
            const prefix4 = string.substring(i-4, i);
            const prefix3 = string.substring(i-3, i);

            if (prefix4 === 'plus') {
                result.length -= 4;
                const { consume, output } = stringToEditor(string.substring(i+1));
                i += consume + 1;
                const commaIndex = output.indexOf(',');
                if (commaIndex !== -1) {
                    const joiner = new PlusJoinerElement({
                        leftCode: output.slice(0, commaIndex),
                        rightCode: output.slice(commaIndex+2)
                    })
                    result = [...result, joiner];
                } else {
                    result = [...result, ...output];
                }
            }
            else if (prefix4 === 'sqrt') {
                result.length -= 4;
                const { consume, output } = stringToEditor(string.substring(i+1));
                i += consume + 1;
                const joiner = new RadicalJoinerElement({
                    code: output
                })
                result = [...result, joiner];
            }
            else if (prefix3 === 'div') {
                result.length -= 3;
                const { consume, output } = stringToEditor(string.substring(i+1));
                i += consume + 1;
                const commaIndex = output.indexOf(',');
                if (commaIndex !== -1) {
                    const joiner = new DivJoinerElement({
                        leftCode: output.slice(0, commaIndex),
                        rightCode: output.slice(commaIndex+2)
                    })
                    result = [...result, joiner];
                } else {
                    result = [...result, ...output];
                }
            }
            else if (prefix3 === 'exp') {
                result.length -= 3;
                const { consume, output } = stringToEditor(string.substring(i+1));
                i += consume + 1;
                const commaIndex = output.indexOf(',');
                if (commaIndex !== -1) {
                    const joiner = new ExpJoinerElement({
                        leftCode: output.slice(0, commaIndex),
                        rightCode: output.slice(commaIndex+2)
                    })
                    result = [...result, joiner];
                } else {
                    result = [...result, ...output];
                }
            }
            else {
                const { consume, output } = stringToEditor(string.substring(i+1));
                i += consume + 1;
                result = [...result, ...['(', ...output, ')']];
            }
        }
        else if (char === ')'){
            return {
                consume: i,
                output: result
            }
        }
        else {
            result = [...result, char];
        }
    }
    return {
        consume: string.length,
        output: result
    };
}
