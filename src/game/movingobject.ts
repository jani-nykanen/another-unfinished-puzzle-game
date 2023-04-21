import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Vector2 } from "../vector/vector.js";
import { GameObject } from "./gameobject.js";
import { Stage } from "./stage.js";



export abstract class MovingObject extends GameObject {


    protected target : Vector2;
    
    protected moving : boolean = false;
    protected moveTimer : number = 0.0;


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);
    }


    protected updateMovement(moveSpeed : number, 
        event : CoreEvent, resetTimer = true) : void {

        if (!this.moving)
            return;

        this.moveTimer -= moveSpeed * event.step;

        if (this.moveTimer <= 0.0) {

            this.pos = this.target.clone();
            this.renderPos = this.pos.clone();

            this.moving = false;
            if (resetTimer) {

                this.moveTimer = 0.0;
            }
            return;
        }

        this.renderPos = Vector2.lerp(this.pos, this.target, 1.0-this.moveTimer);
    }
}
