import { Assets } from "./assets.js";
import { AudioSystem } from "../audio/audiosystem.js";
import { Canvas } from "../renderer/canvas.js";
import { Transition } from "./transition.js";
import { CoreEvent } from "./event.js";
import { Scene, SceneParam } from "./scene.js";
import { InputManager } from "../input/inputmanager.js";
import { RenderContext } from "../renderer/rendercontext.js";


class GeneralCoreEvent extends CoreEvent {


    public setDeltaStep(step : number) : void {

        this.deltaStep = step;
    }


    public setPhysicsStep(step : number) : void {

        this.physicsStep = step;
    }


    public setInterpolationStep(interpolationStep : number) : void {

        this.interpolationStep = interpolationStep;
    }
}


export class Core {


    private canvas : Canvas;
    private input : InputManager;
    private audio : AudioSystem;
    private assets : Assets;
    private transition : Transition;
    private renderer : RenderContext;
    private event : GeneralCoreEvent;

    private scenes : Map<string, Scene>;
    private activeScene : Scene | undefined = undefined;

    private timeSum = 0.0;
    private oldTime = 0.0;

    private initialized : boolean = false;


    constructor(fixedSizeCanvas = false, canvasWidth = 320, canvasHeight = 240, preserveSquarePixels = false) {

        this.renderer = new RenderContext();
        this.audio = new AudioSystem();
        this.assets = new Assets(this.audio, this.renderer);
        this.canvas = new Canvas(this.renderer, 
            fixedSizeCanvas, canvasWidth, canvasHeight, 
            preserveSquarePixels,
            (name : string) => this.assets.getBitmap(name)
        );
        this.transition = new Transition();
        this.input = new InputManager();

        this.event = new GeneralCoreEvent(
            this.input, this.audio, 
            this.canvas, this.transition, 
            this.renderer, this.assets,
            this);

        this.scenes = new Map<string, Scene> ();
    }


    private drawLoadingScreen(canvas : Canvas) : void {

        const OUTLINE = 2;
        const WIDTH = 96;
        const HEIGHT = 16;

        let p = this.assets.getLoadingPercentage();

        let dx = canvas.width/2 - WIDTH/2;
        let dy = canvas.height/2 - HEIGHT/2;

        canvas.transform
            .setView(canvas.width, canvas.height)
            .loadIdentity()
            .use();

        canvas.clear(0, 0, 0);
        canvas.setColor();
        canvas.fillRect(dx, dy, WIDTH, HEIGHT);
        canvas.setColor(0, 0, 0);
        canvas.fillRect(dx + OUTLINE, dy + OUTLINE, WIDTH - OUTLINE*2, HEIGHT - OUTLINE*2);
        canvas.setColor();
        canvas.fillRect(dx + OUTLINE*2, dy + OUTLINE*2, (WIDTH - OUTLINE*4)*p, HEIGHT - OUTLINE*4);
    }
    

    private renderContent(canvas : Canvas, interpolationStep : number) : void {

        if (!this.assets.hasLoaded()) {

            this.drawLoadingScreen(canvas);
        }
        else {

            if (this.activeScene != undefined) {

                this.activeScene.redraw(canvas, this.assets, interpolationStep);
            }

            this.transition.draw(canvas);
        }
    }


    private loop(ts : number, frameSkip = 0) : void {

        const MAX_DELTA = 1000.0/10.0;

        const MAX_REFRESH_COUNT = 5;
        const FRAME_TIME = 16.66667 * (frameSkip + 1);

        let delta = ts - this.oldTime;
        // TODO: The following might be redundant
        if (delta > MAX_DELTA) {

            delta = MAX_DELTA;
        }

        this.event.setDeltaStep(delta);
        this.event.setPhysicsStep(frameSkip+1);
        this.event.setInterpolationStep

        this.timeSum += delta;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_TIME, this.timeSum);
        this.oldTime = ts;

        this.input.updateStick();

        if (this.assets.hasLoaded() && !this.initialized) {

            if (this.activeScene != undefined) {

                this.activeScene.init(null, this.event, this.assets);
            }
            this.initialized = true;
        }

        // Update "physics" (i.e. fixed time step logic)
        let refreshCount = (this.timeSum / FRAME_TIME) | 0;

        this.event.setInterpolationStep((this.timeSum - refreshCount * FRAME_TIME) / FRAME_TIME);

        while ((refreshCount --) > 0) {

            if (this.activeScene != undefined &&
                this.assets.hasLoaded()) {

                this.activeScene.updatePhysics(this.event, this.assets);
            }
            this.transition.update(this.event, frameSkip + 1);

            this.timeSum -= FRAME_TIME;
        }

        // Update general logic (that is, anything that involves input)
        if (this.activeScene != undefined &&
            this.assets.hasLoaded()) {

            this.activeScene.update(this.event, this.assets);
        }

        this.input.update();

        // Rendering
        this.renderer.resetVertexAndFragmentTransforms();
        this.canvas.drawToFramebuffer(
            (canvas : Canvas) => this.renderContent(canvas, this.timeSum / FRAME_TIME)
        );
        this.canvas.renderFramebuffer();
        
        window.requestAnimationFrame(ts => this.loop(ts));
    }


    public run(initialScene : string, 
        onstart : ((event : CoreEvent, assets : Assets) => void) = () => {}) : void {

        this.activeScene = this.scenes.get(initialScene);

        onstart(this.event, this.assets);
        this.loop(0);
    }


    public addScene(name : string,  scene : Scene) : Core {

        this.scenes.set(name, scene);
        return this;
    }


    public changeScene(name : string, param : SceneParam = 0) : void {

        let newScene = this.scenes.get(name);
        if (newScene == undefined) {

            throw "No scene with name: " + name;
        }

        newScene.init(param, this.event, this.assets);
        this.activeScene = newScene;
    }
}
