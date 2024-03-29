import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Direction, inverseDirection } from "./direction.js";
import { GameObject } from "./gameobject.js";
import { ObjectType } from "./objecttype.js";
import { Stage } from "./stage.js";
import { TileEffect } from "./tileeffect.js";


export class Crate extends GameObject {


    constructor(x : number, y : number) {

        super(x, y, true);

        this.type = ObjectType.DestroyFlames;
    }


    protected checkMovement(stage: Stage, event: CoreEvent): boolean {
        
        const EPS = 0.25;
        
        let dir = Direction.None;
        let o : GameObject;

        let stick = event.input.stick;
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

        if (o == undefined || (o.getType() & ObjectType.CanPushObject) == 0)
            return false;

        return this.moveTo(dir, stage);
    }


    protected tileEffectEvent(stage : Stage, eff : TileEffect) : boolean { 
        
        if (eff == TileEffect.InsideFlame) {

            this.exist = false;
            stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
            stage.updateObjectLayerTile(this.target.x, this.target.y, undefined);

            stage.spawnAnimationEffect(0, this.target.x, this.target.y);
        }
        return false; 
    }


    public draw(canvas : Canvas, stage : Stage, shiftx = 0, shifty = 0) : void {
        
        if (!this.exist)
            return;

        let bmp = canvas.getBitmap("tileset1");
        if (bmp == undefined)
            return;

        canvas.drawBitmapRegion(bmp, 16, 0, 16, 16,
            Math.round((this.renderPos.x + shiftx) * stage.tileWidth) | 0,
            Math.round((this.renderPos.y + shifty) * stage.tileHeight) | 0);
    }
}
