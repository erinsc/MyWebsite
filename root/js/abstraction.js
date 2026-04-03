import {default as V} from "/js/vectors.js";

const BORDER_THICKNESS = 5;
const INNER_BUFFER = 40;
const OUTER_BUFFER = 20;

let nextId = 0;
let root;

export default {
    root,

    initRoot(canvas) {
        let CV = V.new(canvas.width, canvas.height);
        CV = V.scale(CV, 0.5);
        this.root = this.createAbstraction(CV, CV.x);
    },
    createAbstraction(pos, radius) {
        return {
            id: nextId++,
            pos, radius,
            vel: V.new(1, 0),
            parent,
            children: [],
        };
    },
    deepestContaining(node, pos) {
        const dist = V.len(V.sub(node.pos, pos));
        if (dist >= node.radius) {
            return null;
        }
        for (const child of node.children) {
            const found = this.deepestContaining(child, pos);
            if (found)
                return found;
        }
        return node;
    },
    drawAbstraction(node, ctx) {
        
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = BORDER_THICKNESS;
        ctx.stroke();

        for (const child of node.children) {
            const diff = V.normalized(V.sub(child.pos, node.pos));

            const start = V.add(node.pos, V.scale(diff, node.radius));
            const end = V.add(child.pos, V.scale(diff, child.radius));

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = BORDER_THICKNESS;
            ctx.stroke();

            this.drawAbstraction(child, ctx);
        }
    },
    updateAbstraction(node, offset) {
        for (const child of node.children) {
            const diff = V.sub(child.pos, node.pos);

            child.vel = V.scale(child.vel, 0.999);

            child.pos = V.add(child.pos, offset);
            child.pos = V.add(child.pos, child.vel);
            let new_offset = V.add(offset, child.vel);
            
            const dist = node.radius - V.len(diff) - child.radius - INNER_BUFFER;
            if (dist <= 0) {
                //const inset = V.normalized(diff);
                //child.pos = V.sub(child.pos, inset);

                const norm = V.normalized(diff);
                const scalar = Math.min(1, -dist / (INNER_BUFFER*INNER_BUFFER));

                child.vel = V.sub(child.vel, V.scale(norm, scalar));
            }

            for (const other of node.children) {
                if (other.id <= child.id)
                    continue;
                const diff = V.sub(child.pos, other.pos);
                const dist = V.len(diff) - child.radius - other.radius - 2*OUTER_BUFFER;

                if (dist < 0) {
                    const norm = V.normalized(diff);
                    const scalar = Math.min(1, -dist / (OUTER_BUFFER*OUTER_BUFFER)) / 4;
                    child.vel = V.sub(child.vel, V.scale(norm, -scalar));
                    other.vel = V.sub(other.vel, V.scale(norm, scalar));
                }
            }

            this.updateAbstraction(child, new_offset);
        }
    },
    addChild(parent, mouse) {
        const radius = parent.radius / 3;

        const child = this.createAbstraction(mouse, radius, parent);
        parent.children.push(child);
    }
}