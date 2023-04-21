import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Vector2 } from "../vector/vector.js";
import { Stage } from "./stage.js";


export abstract class GameObject {
    
    
    protected pos : Vector2;
    protected renderPos : Vector2;

    protected exist : boolean;


    constructor(x : number, y : number, exist = true) {

        this.pos = new Vector2(x, y);
        this.renderPos = this.pos.clone();

        this.exist = exist;
    }


    abstract update(stage : Stage, event : CoreEvent) : void;
    abstract draw(canvas : Canvas, stage : Stage) : void;
}
