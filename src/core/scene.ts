import { Canvas } from "../renderer/canvas.js";
import { Assets } from "./assets.js";
import { CoreEvent } from "./event.js";


export type SceneParam = number | string | null;


export interface Scene {

    init(param : SceneParam, event : CoreEvent) : void;
    update(event : CoreEvent) : void;
    updatePhysics(event : CoreEvent) : void;
    redraw(canvas : Canvas, interpolationStep? : number) : void;
}

