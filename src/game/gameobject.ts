import { CoreEvent } from "../core/event.js";
import { negMod } from "../math/utility.js";
import { Canvas } from "../renderer/canvas.js";
import { Vector2 } from "../vector/vector.js";
import { Direction } from "./direction.js";
import { ObjectType } from "./objecttype.js";
import { Stage } from "./stage.js";
import { TileEffect, tileEffectToDirection } from "./tileeffect.js";



export abstract class GameObject {


    protected type : ObjectType = 0;

    protected pos : Vector2;
    protected renderPos : Vector2;
    protected target : Vector2;

    protected exist : boolean;

    protected moving : boolean = false;
    protected moveTimer : number = 0.0;
    protected automatedMovement : boolean = false;

    protected dir : Direction = Direction.None;


    constructor(x : number, y : number, exist = true) {

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();

        this.exist = true;
    }


    protected updateMovement(moveSpeed : number,
        stage : Stage, event : CoreEvent, resetTimer = true) : void {

        if (!this.moving)
            return;

        this.moveTimer -= moveSpeed * event.step;
        if (this.moveTimer <= 0.0) {

            this.target.x = negMod(this.target.x, stage.getWidth());
            this.target.y = negMod(this.target.y, stage.getHeight());

            stage.updateObjectLayerTile(this.target.x, this.target.y, this);

            this.pos = this.target.clone();
            this.renderPos = this.pos.clone();

            this.moving = false;
            if (resetTimer) {

                this.moveTimer = 0.0;
            }
        }
        this.renderPos = Vector2.lerp(this.pos, this.target, 1.0-this.moveTimer);
    }


    protected abstract checkMovement(stage : Stage, event : CoreEvent) : boolean
    protected updateAnimation(event : CoreEvent) : void {};
    protected tileEffectEvent(stage : Stage, eff : TileEffect) : void {}


    protected handleTileEffect(stage : Stage, eff : TileEffect) : boolean {

        switch (eff) {

            case TileEffect.InsideFlame:

                if ((this.type & ObjectType.DestroyFlames) != 0) {

                    this.tileEffectEvent(stage, eff);

                    this.exist = false;
                    stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
                    stage.updateObjectLayerTile(this.target.x, this.target.y, undefined);
                }
                break;

            // Arrows
            case TileEffect.MoveDown:
            case TileEffect.MoveLeft:
            case TileEffect.MoveRight:
            case TileEffect.MoveUp:

                if (this.moveTo(tileEffectToDirection(eff), stage)) {

                    this.automatedMovement = true;
                    return true;
                }
                return false;

            // Collectibles:
            case TileEffect.Key:
            case TileEffect.Torch:

                if ((this.type & ObjectType.CanCollectItems) != 0) {

                    this.tileEffectEvent(stage, eff);

                    stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
                }
                break;
    
            default:
                break;
        }

        return false;
    }


    protected moveTo(dir : Direction, stage : Stage) : boolean {

        const DIR_X = [1, 0, -1 , 0];
        const DIR_Y = [0, -1, 0, 1];

        if (dir == Direction.None) {

            this.target = this.pos.clone();
            this.moving = true;
            this.moveTimer += 1.0;

            this.dir = dir;

            return true;
        }

        let dirx = DIR_X[dir-1];
        let diry = DIR_Y[dir-1];

        if ((dirx != 0 || diry != 0) &&
            stage.canMoveTo(this.pos.x + dirx, this.pos.y + diry, this.type)) {

            this.target = Vector2.add(this.pos, new Vector2(dirx, diry));
            this.moving = true;
            this.moveTimer += 1.0;

            this.dir = dir;

            stage.updateObjectLayerTile(this.pos.x, this.pos.y, undefined);

            return true;
        }
        return false;
    }


    public update(moveSpeed : number, stage : Stage, event : CoreEvent, canControl : boolean) : boolean {

        if (!this.exist)
            return false;

        this.updateAnimation(event);

        if (this.moving) {

            this.updateMovement(moveSpeed, stage, event, false);
            if (this.moving) {

                return false;
            }
        }

        let eff = stage.checkUnderlyingTile(this.pos.x, this.pos.y);
        if (this.handleTileEffect(stage, eff)) {

            return true;
        }

        if (canControl) {

            if (!this.checkMovement(stage, event)) {

                this.moveTimer = 0;
            }
            else {

                this.automatedMovement = false;
                return true;
            }
        }
        return false;
    }

    
    public checkConflicts(stage : Stage) : void {

        if (!this.moving)
            return;

        let o = stage.getObjectInTile(this.target.x, this.target.y);
        if (o != undefined && o != this) {

            this.moving = false;
            this.moveTimer = 0.0;
            this.target = this.pos.clone();
            this.renderPos = this.pos.clone();

            stage.updateObjectLayerTile(this.pos.x, this.pos.y, this);
        }
    }


    public setPosition(x : number, y : number) : void {

        this.pos.x = x;
        this.pos.y = y;

        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();

        this.moving = false;
        this.moveTimer = 0;

        this.exist = true;
    }


    public getPosition = () : Vector2 => this.pos.clone();
    public getRenderPosition = () : Vector2 => this.renderPos.clone();


    public getType = () : ObjectType => this.type;
    public doesExist = () : boolean => this.exist;
    public isMoving = () : boolean => this.moving;


    abstract draw(canvas : Canvas, stage : Stage, shiftx? : number, shifty? : number) : void;
}
