import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Vector2 } from "../vector/vector.js";
import { Direction, inverseDirection } from "./direction.js";
import { GameObject } from "./gameobject.js";
import { MovingObject } from "./movingobject.js";
import { ObjectType } from "./objecttype.js";
import { Stage } from "./stage.js";
import { TileEffect } from "./tileeffect.js";


export class Crate extends MovingObject {


    constructor(x : number, y : number) {

        super(x, y, true);

        this.type = ObjectType.DestroyFlames;
    }


    protected checkMovement(stage: Stage, event: CoreEvent, 
        autoDir = Direction.None, canControl = true): boolean {
        
        const EPS = 0.25;

        let stick : Vector2;
        let dir = autoDir;
        let o : GameObject;

        if (dir == Direction.None && canControl) {

            stick = event.input.stick;
            if (stick.length < EPS) {

                return false;
            }

            if (Math.abs(stick.x) >= Math.abs(stick.y)) {

                dir = stick.x < 0 ? Direction.Left : Direction.Right;
            }
            else {

                dir = stick.y < 0 ? Direction.Up : Direction.Down;
            }

            o = stage.getObjectInDirection(this.pos.x, this.pos.y, inverseDirection(dir));

            // TODO: Check if "not player"
            if (o == undefined || (o.getType() & ObjectType.CanPushObject) == 0)
                return false;

            // console.log(typeof(o));
        }
        return this.moveTo(dir, stage);
    }


    protected handleTileEffect(stage : Stage, eff : TileEffect) : void {

        switch (eff) {

        case TileEffect.InsideFlame:

            this.exist = false;
            stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
            stage.updateObjectLayerTile(this.target.x, this.target.y, undefined);
            break;

        default:
            break;
        }
    }


    public draw(canvas : Canvas, stage : Stage) : void {
        
        if (!this.exist)
            return;

        let bmp = canvas.getBitmap("tileset1");
        if (bmp == undefined)
            return;

        canvas.drawBitmapRegion(bmp, 16, 0, 16, 16,
            Math.round(this.renderPos.x * stage.tileWidth) | 0,
            Math.round(this.renderPos.y * stage.tileHeight) | 0);
    }
}
