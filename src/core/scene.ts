import { Canvas } from "../renderer/canvas.js";
import { Assets } from "./assets.js";
import { CoreEvent } from "./event.js";


export type SceneParam = number | string | null;


export interface Scene {

    init(param : SceneParam, event : CoreEvent, assets : Assets) : void;
    update(event : CoreEvent, assets : Assets) : void;
    updatePhysics(event : CoreEvent, assets : Assets) : void;
    redraw(canvas : Canvas, assets : Assets, interpolationStep? : number) : void;
}

