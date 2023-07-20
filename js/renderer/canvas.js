import { clamp } from "../math/utility.js";
import { Vector2 } from "../vector/vector.js";
;
;
export class Canvas {
    get width() {
        return this.framebuffer == null ? this.renderer.width : this.framebuffer.width;
    }
    get height() {
        return this.framebuffer == null ? this.renderer.height : this.framebuffer.height;
    }
    get aspectRatio() {
        return this.framebuffer == null ?
            this.renderer.width / this.renderer.height :
            this.framebuffer.width / this.framebuffer.height;
    }
    get transform() {
        return this.renderer.transform;
    }
    constructor(renderer, createFramebuffer = false, width = 320, height = 240, preserveSquarePixels = false, getBitmapFunction) {
        this.framebuffer = null;
        this.preserveSquarePixels = false;
        this.silhouetteActive = false;
        this.renderer = renderer;
        if (createFramebuffer) {
            this.framebuffer = this.renderer.createFramebuffer(width, height, !preserveSquarePixels);
            this.preserveSquarePixels = preserveSquarePixels;
        }
        this.getBitmapFunction = getBitmapFunction;
        this.translation = new Vector2();
        this.createOuterCircleMesh(120);
        this.renderer.toggleScissorTest(true);
    }
    createOuterCircleMesh(precision) {
        const MAX_RADIUS = Math.SQRT2 + 0.1;
        let vertices = new Array();
        let uvs = new Array();
        let indices = new Array();
        uvs = (new Array(precision * 6 * 2)).fill(0.0);
        let angle;
        let angleStep = Math.PI * 2 / precision;
        let A = new Vector2();
        let B = new Vector2();
        let C = new Vector2();
        let D = new Vector2();
        for (let i = 0; i < precision; ++i) {
            angle = i * angleStep;
            A.x = Math.cos(angle);
            A.y = Math.sin(angle);
            B.x = clamp(A.x * MAX_RADIUS, -1, 1);
            B.y = clamp(A.y * MAX_RADIUS, -1, 1);
            C.x = Math.cos(angle + angleStep);
            C.y = Math.sin(angle + angleStep);
            D.x = clamp(C.x * MAX_RADIUS, -1, 1);
            D.y = clamp(C.y * MAX_RADIUS, -1, 1);
            vertices.push(A.x, A.y, B.x, B.y, D.x, D.y, D.x, D.y, C.x, C.y, A.x, A.y);
        }
        for (let i = 0; i < vertices.length / 2; ++i) {
            indices.push(indices.length);
        }
        this.meshOuterCircle = this.renderer.constructMesh(new Float32Array(vertices), new Uint16Array(indices), new Float32Array(uvs));
    }
    drawMesh(mesh, texture, dx = 0.0, dy = 0.0, dw = 1.0, dh = 1.0) {
        if (texture == null || texture == undefined) {
            this.renderer.changeShader("notexture");
        }
        else {
            this.renderer.changeShader("textured");
            this.renderer.bindTexture(texture);
        }
        this.renderer.setVertexTransform(dx, dy, dw, dh);
        this.renderer.setFragmentTransform(0, 0, 1, 1);
        this.renderer.drawMesh(mesh);
    }
    drawScaledBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, dw, dh, flip = 0 /* Flip.None */) {
        if (bmp == undefined)
            return;
        dx += this.translation.x;
        dy += this.translation.y;
        if ((flip & 1 /* Flip.Horizontal */) == 1 /* Flip.Horizontal */) {
            dx += dw;
            dw *= -1;
        }
        if ((flip & 2 /* Flip.Vertical */) == 2 /* Flip.Vertical */) {
            dy += dh;
            dh *= -1;
        }
        sx /= bmp.width;
        sy /= bmp.height;
        sw /= bmp.width;
        sh /= bmp.height;
        if (this.silhouetteActive) {
            this.renderer.changeShader("fixedcolor");
        }
        else {
            this.renderer.changeShader("textured");
        }
        this.renderer.setVertexTransform(dx, dy, dw, dh);
        this.renderer.setFragmentTransform(sx, sy, sw, sh);
        this.renderer.bindTexture(bmp);
        this.renderer.drawMesh();
    }
    drawBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, flip = 0 /* Flip.None */) {
        this.drawScaledBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, sw, sh, flip);
    }
    drawBitmap(bmp, dx, dy, flip = 0 /* Flip.None */) {
        if (bmp == undefined)
            return;
        let sw = bmp.width;
        let sh = bmp.height;
        this.drawScaledBitmapRegion(bmp, 0, 0, sw, sh, dx, dy, sw, sh, flip);
    }
    drawScaledBitmap(bmp, dx, dy, dw, dh, flip = 0 /* Flip.None */) {
        if (bmp == undefined)
            return;
        let sw = bmp.width;
        let sh = bmp.height;
        this.drawScaledBitmapRegion(bmp, 0, 0, sw, sh, dx, dy, dw, dh, flip);
    }
    fillRect(x = 0, y = 0, w = this.width, h = this.height) {
        this.renderer.changeShader("notexture");
        this.renderer.setVertexTransform(x, y, w, h);
        this.renderer.drawMesh();
    }
    drawText(font, str, dx, dy, xoff = 0.0, yoff = 0.0, align = 0 /* TextAlign.Left */, scalex = 1.0, scaley = 1.0) {
        if (font == undefined)
            return;
        let cw = (font.width / 16) | 0;
        let ch = cw;
        let x = dx;
        let y = dy;
        let chr;
        if (align == 1 /* TextAlign.Center */) {
            dx -= (str.length * (cw + xoff)) * scalex / 2.0;
            x = dx;
        }
        else if (align == 2 /* TextAlign.Right */) {
            dx -= (str.length * (cw + xoff)) * scalex;
            x = dx;
        }
        for (let i = 0; i < str.length; ++i) {
            chr = str.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {
                x = dx;
                y += (ch + yoff) * scaley;
                continue;
            }
            this.drawScaledBitmapRegion(font, (chr % 16) * cw, ((chr / 16) | 0) * ch, cw, ch, x, y, cw * scalex, ch * scaley);
            x += (cw + xoff) * scalex;
        }
    }
    clear(r = 1.0, g = r, b = g) {
        this.renderer.clear(r, g, b);
    }
    fillCircleOutside(r) {
        let cx = this.width / 2;
        let cy = this.height / 2;
        let end = Math.min(this.height, cy + r);
        this.renderer.changeShader("notexture");
        // Top bar & bottom bards
        if (cy - r > 0) {
            this.fillRect(0, 0, this.width, cy - r);
            this.fillRect(0, end, this.width, this.height - end);
        }
        // Left & right bars
        if (cx - r > 0) {
            this.fillRect(0, end, cx - r, this.height - end * 2);
            this.fillRect(cx + r, end, cx - r, this.height - end * 2);
        }
        this.renderer.setVertexTransform(cx, cy, r, r);
        this.renderer.drawMesh(this.meshOuterCircle);
    }
    move(x, y) {
        this.translation.x += x;
        this.translation.y += y;
    }
    moveTo(x = 0, y = 0) {
        this.translation.x = x;
        this.translation.y = y;
    }
    setColor(r = 1.0, g = r, b = g, a = 1.0) {
        if (this.silhouetteActive)
            return;
        this.renderer.setColor(r, g, b, a);
    }
    reset() {
        this.renderer.transform
            .setView(this.width, this.height)
            .loadIdentity()
            .use();
        this.renderer.setColor();
        this.renderer.resetVertexAndFragmentTransforms();
        this.renderer.transform.clearStacks();
        this.moveTo();
    }
    toggleSilhouetteRendering(state = false) {
        this.silhouetteActive = state;
    }
    drawToFramebuffer(cb) {
        if (this.framebuffer == null) {
            cb(this);
            return;
        }
        this.renderer.setViewport(0, 0, this.framebuffer.width, this.framebuffer.height);
        this.framebuffer.drawTo(_ => cb(this));
        this.renderer.setViewport();
    }
    renderFramebuffer() {
        if (this.framebuffer == null)
            return;
        this.renderer.changeShader("rgb222");
        this.renderer.toggleScissorTest(false);
        this.renderer.clear(0.0);
        this.renderer.transform
            .loadIdentity()
            .translate(0, this.renderer.height)
            .scale(1, -1)
            .setView(this.renderer.width, this.renderer.height)
            .use();
        let m = Math.min(this.renderer.width / this.framebuffer.width, this.renderer.height / this.framebuffer.height);
        if (this.preserveSquarePixels && m >= 1.0) {
            m = Math.floor(m);
        }
        let w = this.framebuffer.width * m;
        let h = this.framebuffer.height * m;
        let x = this.renderer.width / 2 - w / 2;
        let y = this.renderer.height / 2 - h / 2;
        this.setColor();
        this.renderer.setVertexTransform(x, y, w, h);
        this.renderer.setFragmentTransform(0, 0, 1, 1);
        this.renderer.bindTexture(this.framebuffer);
        this.renderer.drawMesh();
        this.renderer.toggleScissorTest(true);
        this.renderer.changeShader("textured");
    }
    getBitmap(name) {
        if (this.getBitmapFunction == undefined)
            return undefined;
        return this.getBitmapFunction(name);
    }
    setViewport(x = 0, y = 0, w = this.width, h = this.height) {
        this.renderer.setScissorBox(x, y, w, h);
    }
}
