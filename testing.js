// builder

import { MyEditorElement } from "http://localhost:8080/custom.js";
import { GroupAlgebraEditor } from "http://localhost:8080/groupTheoryEditor.js"

export default new MyEditorElement({
    dropdownItems: [{
        name: 'group algebra',
        ElementConstructor: GroupAlgebraEditor('s3')
    }]
});

// built

import { MatrixJoinerElement } from "http://localhost:8080/mathEditors.js";
import { s3 } from "http://localhost:8080/groupTheoryPlayground.js";

const a3Elements = [];
for (const el of s3.elements) {
    a3Elements.push(s3.exponentiate(el, 2))
}
const a3MulTable = {};
for (const a3ElA of a3Elements) {
    for (const a3ElB of a3Elements) {
        if (!a3MulTable[a3ElA]) a3MulTable[a3ElA] = {};
        a3MulTable[a3ElA][a3ElB] = s3.action(a3ElA, a3ElB);
    }
}

export default new MatrixJoinerElement({
    code2DArray: Object.values(a3MulTable).map(
        columnObject => Object.values(columnObject).map(
            el => [el]
        )
    )
})

// end
