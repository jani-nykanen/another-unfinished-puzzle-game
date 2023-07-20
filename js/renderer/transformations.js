import { Matrix3 } from "../vector/matrix.js";
import { Vector2 } from "../vector/vector.js";
export class Transformations {
    constructor(activeShader) {
        this.getViewport = () => this.viewport.clone();
        this.model = Matrix3.identity();
        this.modelStack = new Array();
        this.view = Matrix3.identity();
        this.product = Matrix3.identity();
        this.productComputed = true;
        this.viewport = new Vector2(1, 1);
        this.activeShader = activeShader;
    }
    computeProduct() {
        if (this.productComputed)
            return;
        this.product = Matrix3.multiply(this.view, this.model);
        this.productComputed = true;
    }
    setActiveShader(shader) {
        this.activeShader = shader;
    }
    loadIdentity() {
        this.model = Matrix3.identity();
        this.productComputed = false;
        return this;
    }
    translate(x = 0, y = 0) {
        this.model = Matrix3.multiply(this.model, Matrix3.translate(x, y));
        this.productComputed = false;
        return this;
    }
    scale(sx = 1, sy = 1) {
        this.model = Matrix3.multiply(this.model, Matrix3.scale(sx, sy));
        this.productComputed = false;
        return this;
    }
    rotate(angle = 0) {
        this.model = Matrix3.multiply(this.model, Matrix3.rotate(angle));
        this.productComputed = false;
        return this;
    }
    setView(width, height) {
        this.view = Matrix3.view(0, width, height, 0);
        this.productComputed = false;
        this.viewport = new Vector2(width, height);
        return this;
    }
    fitHeight(height, aspectRatio) {
        let width = height * aspectRatio;
        return this.setView(width, height);
    }
    fitGivenDimension(dimension, aspectRatio) {
        if (aspectRatio >= 1) {
            return this.fitHeight(dimension, aspectRatio);
        }
        else {
            return this.setView(dimension, dimension / aspectRatio);
        }
    }
    push() {
        if (this.modelStack.length == 128) {
            throw "Model stack got too big, beep boop!";
        }
        this.modelStack.push(this.model.clone());
        return this;
    }
    pop() {
        let m = this.modelStack.pop();
        if (m == null)
            return this;
        this.model = m;
        this.productComputed = false;
        return this;
    }
    use() {
        this.computeProduct();
        this.activeShader.setTransformMatrix(this.product);
    }
    clearStacks() {
        this.modelStack.length = 0;
    }
}
