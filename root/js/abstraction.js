import {default as V} from "/js/vectors.js";

const BORDER_THICKNESS = 2;
const INNER_BUFFER = 10;
const OUTER_BUFFER = 10;
const MIN_RADIUS = 20;

let nextId = 0;
let root;
let nodes = new Map();
let connections = [];

export default {
    init(canvas) {
        this.nodes = new Map();
        this.connections = [];
        this.connections
        let CV = V.new(canvas.width, canvas.height);
        CV = V.scale(CV, 0.5);
        this.root = this.createAbstraction(CV, CV.x);
    },
    createAbstraction(pos, radius) {
        let node = {
            id: nextId++,
            pos: pos,
            radius: radius,
            vel: V.new(),
            parent,
            children: [],
            variables: []
        };
        this.nodes.set(node.id, node);
        return node.id;
    },
    deepestContaining(nid, pos) {
        let node = this.nodes.get(nid);
        const dist = V.len(V.sub(node.pos, pos));
        if (dist >= node.radius) {
            return null;
        }
        for (const cid of node.children) {
            const child = this.nodes.get(cid);
            const found = this.deepestContaining(cid, pos);
            if (found)
                return found;
        }
        return node;
    },
    draw(ctx) {
        this.drawAbstraction(this.root, ctx);
    },
    drawAbstraction(nid, ctx) {
        let node = this.nodes.get(nid);
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = BORDER_THICKNESS;
        ctx.stroke();

        for (const cid of node.children) {
            this.drawAbstraction(cid, ctx);
        }
        for (const vid of node.variables) {
            let child = this.nodes.get(vid);
            const diff = V.normalized(V.sub(child.pos, node.pos));

            const start = V.add(node.pos, V.scale(diff, node.radius));
            const end = V.add(child.pos, V.scale(diff, child.radius));

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = BORDER_THICKNESS;
            ctx.stroke();

            
        }
    },
    update() {
        this.updateAbstraction(this.root);
    },
    updateAbstraction(nid) {
        let node = this.nodes.get(nid);

        if (node.radius < MIN_RADIUS) {
            node.radius += 1;
        } else if (node.radius > MIN_RADIUS) {
            node.radius -= 1;
        }
        // Update child velocity, position, collision with root
        for (const cid of node.children) {
            let child = this.nodes.get(cid);
            const diff = V.sub(child.pos, node.pos);
            const dist = V.len(diff);
            const norm = V.normalized(diff);

            child.pos = V.add(child.pos, child.vel);
            child.vel = V.scale(child.vel, 0.9);

            const wall_dist = node.radius - child.radius - dist - INNER_BUFFER;
            if (wall_dist < 0) {
                node.radius -= wall_dist/2;
                child.pos = V.add(child.pos, V.scale(norm, wall_dist/2));
            }
        }
        // Update collision between children
        for (const lid of node.children) {
            for (const rid of node.children) {
                if (lid <= rid) {
                    continue;
                }
                let left = this.nodes.get(lid);
                let right = this.nodes.get(rid);

                const diff = V.sub(left.pos, right.pos);
                const dist = V.len(diff);
                const norm = V.normalized(diff);
                const wall_dist = dist - left.radius - right.radius - OUTER_BUFFER;

                if (wall_dist >= 0) {
                    continue;
                }

                let vel_diff = V.sub(left.vel, right.vel);
                vel_diff = V.project(vel_diff, norm);
                vel_diff = V.scale(vel_diff, 0.1);

                left.vel = V.sub(left.vel, vel_diff);
                right.vel = V.add(right.vel, vel_diff);

                let pos_diff = V.scale(norm, wall_dist / 2);

                left.pos = V.sub(left.pos, pos_diff);
                right.pos = V.add(right.pos, pos_diff);
            }
        }
        for (const cid of node.children) {
            this.updateAbstraction(cid);
        }
    },
    addChild(parent, mouse) {
        const child = this.createAbstraction(mouse, 0, parent);
        parent.children.push(child);
    }
}