import { RGBA } from "../vector/rgba.js";
import { Bitmap } from "./bitmap.js";
import { Mesh } from "./mesh.js";
import { Shader } from "./shader.js";
import { FragmentSource, VertexSource } from "./shadersource.js";
import { Transformations } from "./transformations.js";
const createCanvasElement = (width, height) => {
    let div = document.createElement("div");
    div.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");
    let canvas = document.createElement("canvas");
    canvas.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");
    canvas.width = width;
    canvas.height = height;
    div.appendChild(canvas);
    document.body.appendChild(div);
    return [
        canvas,
        canvas.getContext("webgl", { alpha: false, antialias: true, stencil: true })
    ];
};
export class RenderContext {
    get width() {
        return this.canvasWidth;
    }
    get height() {
        return this.canvasHeight;
    }
    constructor() {
        // To make sure we do not need to access canvas element
        // each frame
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.activeMesh = null;
        this.activeTexture = null;
        this.activeColor = new RGBA(1);
        this.createRectangleMesh = () => new Mesh(this.glCtx, new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1,
        ]), new Uint16Array([
            0, 1, 2,
            2, 3, 0
        ]), new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ]), new Float32Array([
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0
        ]));
        this.constructMesh = (vertices, indices, textureCoordinates, colors) => (new Mesh(this.glCtx, vertices, indices, textureCoordinates, colors));
        [this.canvas, this.glCtx] = createCanvasElement(window.innerWidth, window.innerHeight);
        this.resize(window.innerWidth, window.innerHeight);
        this.initOpenGL();
        window.addEventListener("resize", () => this.resize(window.innerWidth, window.innerHeight));
        this.shaders = new Map();
        this.shaders["textured"] = new Shader(this.glCtx, VertexSource.Textured, FragmentSource.Textured);
        this.shaders["notexture"] = new Shader(this.glCtx, VertexSource.NoTexture, FragmentSource.NoTexture);
        this.shaders["fixedcolor"] = new Shader(this.glCtx, VertexSource.Textured, FragmentSource.TexturedFixedColor);
        this.shaders["rgb222"] = new Shader(this.glCtx, VertexSource.Textured, FragmentSource.TexturedRGB222);
        this.activeShader = this.shaders["textured"];
        this.activeShader.use();
        this.meshRectangle = this.createRectangleMesh();
        this.meshRectangle.bind(this.glCtx);
        this.transform = new Transformations(this.activeShader);
    }
    initOpenGL() {
        let gl = this.glCtx;
        gl.activeTexture(gl.TEXTURE0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.stencilMask(0xff);
        gl.disable(gl.STENCIL_TEST);
    }
    resize(width, height) {
        let gl = this.glCtx;
        gl.viewport(0, 0, width, height);
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvasWidth = width;
        this.canvasHeight = height;
    }
    useShader(newShader) {
        if (newShader === null || newShader === this.activeShader)
            return;
        this.activeShader = newShader;
        this.activeShader.use();
        this.transform.setActiveShader(this.activeShader);
        this.transform.use();
        this.activeShader.setColor(this.activeColor.r, this.activeColor.g, this.activeColor.b, this.activeColor.a);
    }
    clear(r = 1, g = r, b = g) {
        let gl = this.glCtx;
        gl.clearColor(r, g, b, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    }
    bindMesh(mesh = this.meshRectangle) {
        if (this.activeMesh === mesh)
            return;
        mesh.bind(this.glCtx);
    }
    rebindMesh() {
        this.activeMesh?.bind(this.glCtx);
    }
    bindTexture(bmp) {
        bmp?.bind(this.glCtx);
        this.activeTexture = bmp;
    }
    rebindTexture() {
        this.activeTexture?.bind(this.glCtx);
    }
    resetVertexAndFragmentTransforms() {
        this.activeShader.setVertexTransform(0, 0, 1, 1);
        this.activeShader.setFragTransform(0, 0, 1, 1);
    }
    setVertexTransform(x, y, w, h) {
        this.activeShader.setVertexTransform(x, y, w, h);
    }
    setFragmentTransform(x = 0.0, y = 0.0, w = 1.0, h = 1.0) {
        this.activeShader.setFragTransform(x, y, w, h);
    }
    changeShader(type) {
        this.useShader(this.shaders[type]);
    }
    setColor(r = 1, g = r, b = g, a = 1, storeOld = true) {
        this.activeShader.setColor(r, g, b, a);
        if (storeOld) {
            this.activeColor = new RGBA(r, g, b, a);
        }
    }
    drawMesh(mesh = this.meshRectangle) {
        this.bindMesh(mesh);
        mesh.draw(this.glCtx);
    }
    createBitmap(image, linearFilter = false) {
        return new Bitmap(this.glCtx, image, linearFilter);
    }
    createFramebuffer(width, height, linearFilter = false) {
        return new Bitmap(this.glCtx, undefined, linearFilter, true, width, height);
    }
    destroyMesh(mesh) {
        mesh.dispose(this.glCtx);
    }
    resetColor() {
        this.activeShader.setColor(this.activeColor.r, this.activeColor.g, this.activeColor.b, this.activeColor.a);
    }
    clearStencilBuffer() {
        let gl = this.glCtx;
        gl.clear(gl.STENCIL_BUFFER_BIT);
    }
    toggleStencilTest(state) {
        let gl = this.glCtx;
        if (state) {
            gl.enable(gl.STENCIL_TEST);
        }
        else {
            gl.disable(gl.STENCIL_TEST);
        }
    }
    setViewport(x = 0, y = 0, width = this.width, height = this.height) {
        this.glCtx.viewport(x, y, width, height);
    }
    toggleScissorTest(state = false) {
        let gl = this.glCtx;
        if (state)
            gl.enable(gl.SCISSOR_TEST);
        else
            gl.disable(gl.SCISSOR_TEST);
    }
    setScissorBox(x = 0, y = 0, width = this.width, height = this.height) {
        let gl = this.glCtx;
        gl.scissor(x, y, width, height);
    }
}
