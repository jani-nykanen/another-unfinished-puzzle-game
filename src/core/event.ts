import { AudioPlayer } from "../audio/audioplayer.js";
import { Canvas } from "../renderer/canvas.js";
import { Transition } from "./transition.js";
import { Core } from "./core.js";
import { SceneParam } from "./scene.js";
import { InputManager } from "../input/inputmanager.js";
import { RenderContext } from "../renderer/rendercontext.js";
import { Mesh } from "../renderer/mesh.js";
import { Vector2 } from "../vector/vector.js";
import { Assets } from "./assets.js";


export class CoreEvent {


    public readonly input : InputManager;
    public readonly audio : AudioPlayer;
    public readonly transition : Transition;
    public readonly renderer : RenderContext;
    public readonly assets : Assets;

    private readonly canvas : Canvas;
    private readonly core : Core;

    protected deltaStep : number = 1.0;
    protected physicsStep : number = 1.0;
    protected interpolationStep : number = 1.0;


    constructor(input : InputManager, audio : AudioPlayer, canvas : Canvas, 
        transition : Transition, renderer : RenderContext,
        assets : Assets, core : Core) {

        this.input = input;
        this.audio = audio;
        this.canvas = canvas;
        this.transition = transition;
        this.renderer = renderer;
        this.assets = assets;
        this.core = core;
    }


    public get screenWidth() : number { 
        
        return this.canvas.width; 
    }

    
    public get screenHeight() : number { 
        
        return this.canvas.height; 
    }


    public get delta() : number {

        return this.deltaStep;
    }


    public get step() : number {

        return this.physicsStep;
    }


    public get interpolation() : number {

        return this.interpolationStep;
    }


    public changeScene(name : string, param : SceneParam = 0) : void {

        this.core.changeScene(name, param);
    }


    public constructMesh = (vertices : Float32Array, 
        indices : Uint16Array,
        textureCoordinates? : Float32Array,
        colors? : Float32Array) : Mesh => 
            this.renderer.constructMesh(
                vertices, indices, textureCoordinates, colors
            );


    public getCursorPositionFitToViewport(minDimension : number) : Vector2 {

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
