export class Vector2 {
    constructor(x = 0.0, y = 0.0) {
        this.clone = () => new Vector2(this.x, this.y);
        this.swap = () => new Vector2(this.y, this.x);
        this.equals = (v, eps = 0.001) => (Math.abs(v.x - this.x) + Math.abs(v.y - this.y)) < eps * 2;
        this.x = x;
        this.y = y;
    }
    get length() {
        return Math.hypot(this.x, this.y);
    }
    normalize(forceUnit = false) {
        const EPS = 0.0001;
        let l = this.length;
        if (l < EPS) {
            this.x = forceUnit ? 1 : 0;
            this.y = 0;
            return this.clone();
        }
        this.x /= l;
        this.y /= l;
        return this.clone();
    }
    zeros() {
        this.x = 0;
        this.y = 0;
    }
    scalarMultiply(s) {
        this.x *= s;
        this.y *= s;
    }
    static cap(v, r, eps = 0.0001) {
        let out = v.clone();
        if (out.length >= r - eps) {
            out.normalize();
            out.x *= r;
            out.y *= r;
        }
        return out;
    }
    static mean(vectors) {
        let out = new Vector2();
        for (let v of vectors) {
            out.x += v.x;
            out.y += v.y;
        }
        out.x /= vectors.length;
        out.y /= vectors.length;
        return out;
    }
    // Same as normalize, but without side effects
    static unit(v, forceUnit = false) {
        const EPS = 0.0001;
        let u = v.clone();
        let l = u.length;
        if (l < EPS) {
            u.x = forceUnit ? 1 : 0;
            u.y = 0;
            return u;
        }
        u.x /= l;
        u.y /= l;
        return u;
    }
}
Vector2.dot = (u, v) => u.x * v.x + u.y * v.y;
Vector2.normalize = (v, forceUnit = false) => v.clone().normalize(forceUnit);
Vector2.scalarMultiply = (v, s) => new Vector2(v.x * s, v.y * s);
Vector2.distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
Vector2.direction = (a, b) => (new Vector2(b.x - a.x, b.y - a.y)).normalize(true);
Vector2.add = (a, b) => new Vector2(a.x + b.x, a.y + b.y);
Vector2.subtract = (a, b) => new Vector2(a.x - b.x, a.y - b.y);
Vector2.project = (u, v) => Vector2.scalarMultiply(v, Vector2.dot(u, v));
Vector2.lerp = (a, b, t) => new Vector2((1 - t) * a.x + t * b.x, (1 - t) * a.y + t * b.y);
Vector2.max = (v) => Math.max(v.x, v.y);
