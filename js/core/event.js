export class CoreEvent {
    constructor(input, audio, canvas, transition, renderer, assets, core) {
        this.timeStep = 1.0;
        this.constructMesh = (vertices, indices, textureCoordinates, colors) => this.renderer.constructMesh(vertices, indices, textureCoordinates, colors);
        this.input = input;
        this.audio = audio;
        this.canvas = canvas;
        this.transition = transition;
        this.renderer = renderer;
        this.assets = assets;
        this.core = core;
    }
    get screenWidth() {
        return this.canvas.width;
    }
    get screenHeight() {
        return this.canvas.height;
    }
    get step() {
        return this.timeStep;
    }
    changeScene(name, param = 0) {
        this.core.changeScene(name, param);
    }
    getCursorPositionFitToViewport(minDimension) {
        let aspectRatio = this.canvas.aspectRatio;
        let width = 0;
        let height = 0;
        if (aspectRatio < 1.0) {
            width = minDimension;
            height = width / aspectRatio;
        }
        else {
            height = minDimension;
            width = height * aspectRatio;
        }
        return this.input.mouse.scaleToViewport(this.screenWidth, this.screenHeight, width, height);
    }
}
