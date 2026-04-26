export default {
  new(x, y) {
    if (x === undefined) {
      return {
        x: 0,
        y: 0,
      };
    }
    return {
      x, y,
    };
  },
  add(a, b) {
    return this.new(a.x + b.x, a.y + b.y);
  },
  sub(a, b) {
    return this.new(a.x - b.x, a.y - b.y);
  },
  len(a) {
    return Math.sqrt(a.x*a.x + a.y*a.y);
  },
  scale(a, f) {
    return this.new(a.x * f, a.y * f);
  },
  negate(a) {
    return this.new(-a.x, -a.y);
  },
  normalized(a) {
    let d = this.len(a);
    if (d === 0) {
      return this.new(1, 0);
    }

    return this.scale(a, 1/d);
  },
  normal(a) {
    return this.new(a.y, -a.x);
  },
  dot(a, b) {
    return a.x * b.x + a.y * b.y;
  },
  // Projects vec onto base (base has to be normalized)
  project(vec, base) {
    return this.scale(base, this.dot(vec, base));
  }
}