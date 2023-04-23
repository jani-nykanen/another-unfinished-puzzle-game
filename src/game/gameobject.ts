import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Vector2 } from "../vector/vector.js";
import { Stage } from "./stage.js";
import { ObjectType } from "./objecttype.js";


export abstract class GameObject {
    
    
    protected pos : Vector2;
    protected renderPos : Vector2;

    protected exist : boolean;

    protected type : ObjectType = 0;


    constructor(x : number, y : number, exist = true) {

        this.pos = new Vector2(x, y);
        this.renderPos = this.pos.clone();

        this.exist = exist;
    }


    public getType = () : ObjectType => this.type;


    abstract update(moveSpeed : number, stage : Stage, event : CoreEvent, canControl? : boolean) : boolean;
    abstract draw(canvas : Canvas, stage : Stage) : void;
    abstract isMoving() : boolean;


    public doesExist = () : boolean => this.exist;


    public makeExist() : void {

        this.exist = true;
    }
}
