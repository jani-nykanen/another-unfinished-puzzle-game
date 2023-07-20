import { clamp } from "../math/utility.js";
export class RGBA {
    constructor(r = 1, g = r, b = g, a = 1) {
        this.clone = () => new RGBA(this.r, this.g, this.b, this.a);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static get white() {
        return new RGBA(1.0, 1.0, 1.0, 1.0);
    }
    static get black() {
        return new RGBA(0.0, 0.0, 0.0, 1.0);
    }
}
RGBA.scalarMultiply = (color, scalar) => new RGBA(clamp(color.r * scalar, 0.0, 1.0), clamp(color.g * scalar, 0.0, 1.0), clamp(color.b * scalar, 0.0, 1.0), color.a);
RGBA.add = (color1, color2) => new RGBA(clamp(color1.r + color2.g, 0.0, 1.0), clamp(color1.g + color2.g, 0.0, 1.0), clamp(color1.b + color2.b, 0.0, 1.0), clamp(color1.a + color2.a, 0.0, 1.0));
RGBA.addConstantRGB = (color, value) => new RGBA(clamp(color.r + value, 0.0, 1.0), clamp(color.g + value, 0.0, 1.0), clamp(color.b + value, 0.0, 1.0), clamp(color.a, 0.0, 1.0));
