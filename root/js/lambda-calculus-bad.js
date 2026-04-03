const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const MIN_RADIUS = 10;
const BORDER_THICKNESS = 4;
const MAX_SPEED = 0.8;

let nextId = 0;

function makeAbstraction(x, y, radius, parent) {
  return {
    id: nextId++,
    x, y, radius,
    vx: (Math.random() * 2 - 1) * MAX_SPEED,
    vy: (Math.random() * 2 - 1) * MAX_SPEED,
    parent,       // reference to parent abstraction (null for root)
    children: [], // child abstractions living inside this one
  };
}

// The root abstraction is centered on the canvas and nearly fills it
const ROOT_RADIUS = canvas.width / 2 - 20;
const root = makeAbstraction(canvas.width / 2, canvas.height / 2, ROOT_RADIUS, null);

function spawnChild(parent, mouseX, mouseY) {
  // Available space: parent radius minus border
  const maxR = parent.radius - BORDER_THICKNESS * 2;
  if (maxR < MIN_RADIUS * 2) return; // no room

  const minR = MIN_RADIUS;
  const radius = minR + Math.random() * (maxR * 0.4 - minR);

  // Clamp spawn position so child fits inside parent
  const dx = mouseX - parent.x;
  const dy = mouseY - parent.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = parent.radius - radius - BORDER_THICKNESS;
  let cx = mouseX, cy = mouseY;
  if (dist > maxDist) {
    cx = parent.x + (dx / dist) * maxDist;
    cy = parent.y + (dy / dist) * maxDist;
  }

  const child = makeAbstraction(cx, cy, radius, parent);
  parent.children.push(child);
}

// Find the deepest abstraction that contains point (x, y)
function findDeepestContaining(node, x, y) {
  const dx = x - node.x;
  const dy = y - node.y;
  if (dx * dx + dy * dy > node.radius * node.radius) return null;

  // Check children deepest-first
  for (const child of node.children) {
    const found = findDeepestContaining(child, x, y);
    if (found) return found;
  }
  return node;
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const target = findDeepestContaining(root, mx, my);
  if (target) {
    spawnChild(target, mx, my);
  }
});

// Physics: update positions of children inside a parent
function updateChildren(parent) {
  const children = parent.children;

  for (const c of children) {
    c.x += c.vx;
    c.y += c.vy;

    // Bounce off parent wall
    const dx = c.x - parent.x;
    const dy = c.y - parent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = parent.radius - c.radius - BORDER_THICKNESS;

    if (dist > maxDist && dist > 0) {
      // Reflect velocity about the normal
      const nx = dx / dist;
      const ny = dy / dist;
      const dot = c.vx * nx + c.vy * ny;
      c.vx -= 2 * dot * nx;
      c.vy -= 2 * dot * ny;
      // Push back inside
      c.x = parent.x + nx * maxDist;
      c.y = parent.y + ny * maxDist;
    }

    // Elastic collisions between siblings
    for (const other of children) {
      if (other.id <= c.id) continue;
      const ex = other.x - c.x;
      const ey = other.y - c.y;
      const d = Math.sqrt(ex * ex + ey * ey);
      const minDist = c.radius + other.radius + BORDER_THICKNESS;
      if (d < minDist && d > 0) {
        // Swap velocity components along collision axis
        const nx = ex / d;
        const ny = ey / d;
        const p = (c.vx - other.vx) * nx + (c.vy - other.vy) * ny;
        c.vx -= p * nx;
        c.vy -= p * ny;
        other.vx += p * nx;
        other.vy += p * ny;
        // Separate
        const overlap = (minDist - d) / 2;
        c.x -= overlap * nx;
        c.y -= overlap * ny;
        other.x += overlap * nx;
        other.y += overlap * ny;
      }
    }

    // Recurse into grandchildren
    updateChildren(c);
  }
}

// Draw an abstraction and all its descendants
function drawAbstraction(node) {
  ctx.beginPath();
  ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = BORDER_THICKNESS;
  ctx.stroke();

  // Draw lines from parent wall to each child's center, passing through child center
  for (const child of node.children) {
    const dx = child.x - node.x;
    const dy = child.y - node.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Direction from parent center toward child center
    const nx = dist > 0 ? dx / dist : 1;
    const ny = dist > 0 ? dy / dist : 0;

    // Wall point: on the parent's circumference in the direction of the child
    const wallX = node.x + nx * node.radius;
    const wallY = node.y + ny * node.radius;

    ctx.beginPath();
    ctx.moveTo(wallX, wallY);
    ctx.lineTo(child.x, child.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw the child and recurse
    drawAbstraction(child);
  }
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateChildren(root);
  drawAbstraction(root);
  requestAnimationFrame(loop);
}

loop();
