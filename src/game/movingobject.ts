import { CoreEvent } from "../core/event.js";
import { Vector2 } from "../vector/vector.js";
import { Direction } from "./direction.js";
import { GameObject } from "./gameobject.js";
import { Stage } from "./stage.js";
import { TileEffect, tileEffectToDirection } from "./tileeffect.js";



export abstract class MovingObject extends GameObject {


    protected target : Vector2;
    
    protected moving : boolean = false;
    protected moveTimer : number = 0.0;

    protected dir : Direction = Direction.None;


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);

        this.target = this.pos.clone();
    }


    protected updateMovement(moveSpeed : number,
        stage : Stage, event : CoreEvent, resetTimer = true) : void {

        if (!this.moving)
            return;

        this.moveTimer -= moveSpeed * event.step;

        if (this.moveTimer <= 0.0) {

            stage.updateObjectLayerTile(this.target.x, this.target.y, this);

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


    protected abstract checkMovement(stage : Stage, event : CoreEvent, 
        dir? : Direction, canControl? : boolean) : boolean

    protected handleTileEffect(stage : Stage, eff : TileEffect) : void {}
    protected updateAnimation(event : CoreEvent) : void {};


    protected setPositionEvent(x : number, y : number) : void {

        this.target.x = x;
        this.target.y = y;

        this.renderPos = this.pos.clone();

        this.moving = false;
        this.moveTimer = 0;
    }


    protected moveTo(dir : Direction, stage : Stage) : boolean {

        const DIR_X = [1, 0, -1 , 0];
        const DIR_Y = [0, -1, 0, 1];

        if (dir == Direction.None)
            return false;

        let dirx = DIR_X[dir-1];
        let diry = DIR_Y[dir-1];

        if ((dirx != 0 || diry != 0) &&
            stage.canMoveTo(this.pos.x + dirx, this.pos.y + diry, dir, this.type)) {

            this.target = Vector2.add(this.pos, new Vector2(dirx, diry));
            this.moving = true;
            this.moveTimer += 1.0;

            this.dir = dir;

            stage.updateObjectLayerTile(this.pos.x, this.pos.y, undefined);

            return true;
        }
        return false;
    }


    protected stopMovement() : void {

        this.moveTimer = 0;
        this.moving = false;
    }


    public update(moveSpeed : number, stage : Stage, event : CoreEvent, canControl : boolean) : boolean {

        if (!this.exist)
            return false;

        this.updateAnimation(event);

        let eff = TileEffect.None;

        if (this.moving) {

            this.updateMovement(moveSpeed, stage, event, false);
            if (!this.moving) {

                eff = stage.checkUnderlyingTile(this.pos.x, this.pos.y);
                this.handleTileEffect(stage, eff);

                if (!this.checkMovement(stage, event, tileEffectToDirection(eff), canControl)) {

                    this.stopMovement();
                    return false;
                }
                return true;       
            }
            return false;
        }
        /*
        if (canControl) {

            eff = stage.checkUnderlyingTile(this.pos.x, this.pos.y);
            this.handleTileEffect(stage, eff);
        }
        */
        return this.checkMovement(stage, event, tileEffectToDirection(eff), canControl);
    }


    public isMoving() : boolean {

        return this.moving;
    }

    
    public checkConflicts(stage : Stage) : void {

        if (!this.moving)
            return;

        if (stage.getObjectInTile(this.target.x, this.target.y)) {

            this.moving = false;
            this.moveTimer = 0.0;
            this.target = this.pos.clone();
            this.renderPos = this.pos.clone();

            stage.updateObjectLayerTile(this.pos.x, this.pos.y, this);
        }
    }
}
