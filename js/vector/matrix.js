import { Vector2 } from "./vector.js";
/*
 * TODO: For better performance consider storing the elements
 * in the arrays in the "transposed" format (so no need to transpose
 * the matrix afterwards when passing to an WebGL shader)
 */
export class Matrix3 {
    constructor(data = null) {
        this.clone = () => new Matrix3(this.m);
        this.m = data != null ?
            Float32Array.from(data) :
            (new Float32Array(3 * 3)).fill(0);
    }
    static rotate(angle) {
        let A = Matrix3.identity();
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        A.m[0] = c;
        A.m[1] = -s;
        A.m[3] = s;
        A.m[4] = c;
        return A;
    }
    static multiply(left, right) {
        let out = new Matrix3();
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                for (let k = 0; k < 3; ++k) {
                    out.m[i * 3 + j] += left.m[i * 3 + k] * right.m[k * 3 + j];
                }
            }
        }
        return out;
    }
    static transpose(A) {
        let out = new Matrix3();
        for (let j = 0; j < 3; ++j) {
            for (let i = 0; i < 3; ++i) {
                out.m[i * 3 + j] = A.m[j * 3 + i];
            }
        }
        return out;
    }
    static inverse2x2(A) {
        let invDet = 1.0 / (A.m[0] * A.m[4] - A.m[3] * A.m[1]);
        return new Matrix3(new Float32Array([
            invDet * A.m[4], -invDet * A.m[1], 0,
            -invDet * A.m[3], invDet * A.m[0], 0,
            0, 0, 1
        ]));
    }
    static multiplyVector(A, v) {
        let out = new Vector2();
        out.x = A.m[0] * v.x + A.m[1] * v.y + A.m[2];
        out.y = A.m[3] * v.x + A.m[4] * v.y + A.m[5];
        return out;
    }
    passToShader(gl, uniform) {
        gl.uniformMatrix3fv(uniform, false, Matrix3.transpose(this).m);
    }
}
Matrix3.identity = () => new Matrix3(new Float32Array([1, 0, 0,
    0, 1, 0,
    0, 0, 1]));
Matrix3.translate = (x = 0, y = 0) => new Matrix3(new Float32Array([1, 0, x,
    0, 1, y,
    0, 0, 1]));
Matrix3.scale = (sx = 1, sy = 1) => new Matrix3(new Float32Array([sx, 0, 0,
    0, sy, 0,
    0, 0, 1]));
Matrix3.view = (left, right, bottom, top) => new Matrix3(new Float32Array([2.0 / (right - left), 0, -(right + left) / (right - left),
    0, 2.0 / (top - bottom), -(top + bottom) / (top - bottom),
    0, 0, 1]));
