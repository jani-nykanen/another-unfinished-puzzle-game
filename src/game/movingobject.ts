import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Vector2 } from "../vector/vector.js";
import { Direction } from "./direction";
import { GameObject } from "./gameobject.js";
import { Stage } from "./stage.js";



export abstract class MovingObject extends GameObject {


    protected target : Vector2;
    
    protected moving : boolean = false;
    protected moveTimer : number = 0.0;

    protected dir : Direction = Direction.None;


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


    protected abstract checkMovement(stage : Stage, event : CoreEvent, dir? : Direction) : boolean
    protected updateAnimation(event : CoreEvent) : void {};


    protected moveTo(dir : Direction, stage : Stage) : boolean {

        const DIR_X = [1, 0, -1 , 0];
        const DIR_Y = [0, -1, 0, 1];

        if (dir == Direction.None)
            return false;

        let dirx = DIR_X[dir-1];
        let diry = DIR_Y[dir-1];

        if ((dirx != 0 || diry != 0) &&
            stage.canMoveTo(this.pos.x + dirx, this.pos.y + diry, dir)) {

            this.target = Vector2.add(this.pos, new Vector2(dirx, diry));
            this.moving = true;
            this.moveTimer += 1.0;

            this.dir = dir;

            stage.updateObjectLayerTile(this.pos.x, this.pos.y, undefined);
            stage.updateObjectLayerTile(this.target.x, this.target.y, this);

            return true;
        }
        return false;
    }


    protected stopMovement() : void {

        this.moveTimer = 0;
        this.moving = false;
    }


    public update(moveSpeed : number, stage : Stage, event : CoreEvent) : boolean {

        this.updateAnimation(event);

        if (this.moving) {

            this.updateMovement(moveSpeed, event, false);
            if (!this.moving) {

                if (!this.checkMovement(stage, event,
                    stage.checkUnderlyingTile(this.pos.x, this.pos.y))) {

                    this.stopMovement();
                    return false;
                }       
            }
            return true;
        }
        return this.checkMovement(stage, event);
    }

}
