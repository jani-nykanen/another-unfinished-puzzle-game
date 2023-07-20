import { inverseDirection } from "./direction.js";
import { GameObject } from "./gameobject.js";
export class Crate extends GameObject {
    constructor(x, y) {
        super(x, y, true);
        this.type = 2 /* ObjectType.DestroyFlames */;
    }
    checkMovement(stage, event) {
        const EPS = 0.25;
        let dir = 0 /* Direction.None */;
        let o;
        let stick = event.input.stick;
        if (stick.length < EPS) {
            return false;
        }
        if (Math.abs(stick.x) >= Math.abs(stick.y)) {
            dir = stick.x < 0 ? 3 /* Direction.Left */ : 1 /* Direction.Right */;
        }
        else {
            dir = stick.y < 0 ? 2 /* Direction.Up */ : 4 /* Direction.Down */;
        }
        o = stage.getObjectInDirection(this.pos.x, this.pos.y, inverseDirection(dir));
        if (o == undefined || (o.getType() & 1 /* ObjectType.CanPushObject */) == 0)
            return false;
        return this.moveTo(dir, stage);
    }
    tileEffectEvent(stage, eff) {
        if (eff == 5 /* TileEffect.InsideFlame */) {
            this.exist = false;
            stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
            stage.updateObjectLayerTile(this.target.x, this.target.y, undefined);
            stage.spawnAnimationEffect(0, this.target.x, this.target.y);
        }
        return false;
    }
    draw(canvas, stage, shiftx = 0, shifty = 0) {
        if (!this.exist)
            return;
        let bmp = canvas.getBitmap("tileset1");
        if (bmp == undefined)
            return;
        canvas.drawBitmapRegion(bmp, 16, 0, 16, 16, Math.round((this.renderPos.x + shiftx) * stage.tileWidth) | 0, Math.round((this.renderPos.y + shifty) * stage.tileHeight) | 0);
    }
}
