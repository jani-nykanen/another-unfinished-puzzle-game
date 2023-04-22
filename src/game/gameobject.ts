import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Vector2 } from "../vector/vector.js";
import { Stage } from "./stage.js";


export abstract class GameObject {
    
    
    protected pos : Vector2;
    protected renderPos : Vector2;

    protected exist : boolean;

    protected canPushObjects : boolean = false;


    public get canMoveObjects() : boolean {

        return this.canPushObjects;
    }


    constructor(x : number, y : number, exist = true) {

        this.pos = new Vector2(x, y);
        this.renderPos = this.pos.clone();

        this.exist = exist;
    }


    abstract update(moveSpeed : number, stage : Stage, event : CoreEvent, canControl? : boolean) : boolean;
    abstract draw(canvas : Canvas, stage : Stage) : void;
    abstract isMoving() : boolean;
}
