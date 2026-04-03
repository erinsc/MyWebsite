import {default as A} from "/js/abstraction.js";
import {default as V} from "/js/vectors.js";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const mouse = V.new(e.clientX, e.clientY);
    const cpos = V.new(rect.left, rect.top);
    return V.sub(mouse, cpos);
}

canvas.addEventListener('click', (e) => {
    const pos = getMousePos(e);
    const target = A.deepestContaining(A.root, pos);
    if (target) {
        A.addChild(target, pos);
    }
});

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    A.updateAbstraction(A.root, V.new());
    A.drawAbstraction(A.root, ctx);
    requestAnimationFrame(loop);
}

A.initRoot(canvas);
loop();

