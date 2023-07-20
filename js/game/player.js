import { Sprite } from "../renderer/sprite.js";
import { GameObject } from "./gameobject.js";
import { AnimationSpecialEffect } from "./animationeffect.js";
import { nextObject } from "./existingobject.js";
const ANIMATION_ROW = [0, 2, 1, 2, 0];
export class Player extends GameObject {
    constructor(x, y, inv) {
        super(x, y, true);
        this.flip = 0 /* Flip.None */;
        this.spr = new Sprite();
        this.dir = 0 /* Direction.None */;
        this.type = 1 /* ObjectType.CanPushObject */ | 4 /* ObjectType.CanCollectItems */;
        this.inventory = inv;
        this.dust = new Array();
    }
    spawnDust(dir) {
        const SHIFT_X = [-0.25, 0, 0.25, 0];
        const SHIFT_Y = [0.125, 0.25, 0.125, -0.25];
        const ANIM_SPEED = 6;
        if (dir == 0 /* Direction.None */)
            return;
        let o = nextObject(this.dust, AnimationSpecialEffect);
        o.spawn(this.renderPos.x + SHIFT_X[dir - 1], this.renderPos.y + SHIFT_Y[dir - 1], 3, ANIM_SPEED);
    }
    checkTileInteraction(stickDir, stage, event) {
        let dx = 0;
        let dy = 0;
        let dir = this.dir;
        if (event.input.upPress() ||
            (stickDir == 2 /* Direction.Up */ && stickDir != this.dir)) {
            dy = -1;
            dir = 2 /* Direction.Up */;
        }
        else if (event.input.downPress() ||
            (stickDir == 4 /* Direction.Down */ && stickDir != this.dir)) {
            dy = 1;
            dir = 4 /* Direction.Down */;
        }
        else if (event.input.leftPress() ||
            (stickDir == 3 /* Direction.Left */ && stickDir != this.dir)) {
            dx = -1;
            dir = 3 /* Direction.Left */;
        }
        else if (event.input.rightPress() ||
            (stickDir == 1 /* Direction.Right */ && stickDir != this.dir)) {
            dx = 1;
            dir = 1 /* Direction.Right */;
        }
        if (dx != 0 || dy != 0) {
            if (stage.interactWithTiles(this.pos.x + dx, this.pos.y + dy)) {
                this.flip = dir == 3 /* Direction.Left */ ? 1 /* Flip.Horizontal */ : 0 /* Flip.None */;
                this.dir = dir;
                return true;
            }
        }
        return false;
    }
    resetEvent() {
        for (let d of this.dust) {
            d.kill();
        }
    }
    checkMovement(stage, event) {
        const EPS = 0.25;
        let dir = 0 /* Direction.None */;
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
        if (this.checkTileInteraction(dir, stage, event)) {
            this.spr.setFrame(4, ANIMATION_ROW[this.dir]);
            return this.moveTo(0 /* Direction.None */, stage);
        }
        return this.moveTo(dir, stage);
    }
    updateAnimation(event) {
        for (let d of this.dust) {
            d.update(event);
        }
        if (this.moving && this.dir == 0 /* Direction.None */)
            return;
        if (this.automatedMovement || !this.moving) {
            this.spr.setFrame(0, this.spr.getRow());
            return;
        }
        let row = ANIMATION_ROW[this.dir];
        if (this.dir != 0 /* Direction.None */) {
            this.flip = this.dir == 3 /* Direction.Left */ ? 1 /* Flip.Horizontal */ : 0 /* Flip.None */;
        }
        let frame = 0;
        let shift = Number((this.pos.x | 0) % 2 == (this.pos.y | 0) % 2);
        let oldFrame = this.spr.getFrame();
        if (this.moving) {
            frame = shift * 2 + Math.round(this.moveTimer);
            if (frame != oldFrame) {
                this.spawnDust(this.dir);
            }
        }
        this.spr.setFrame(frame, row);
    }
    tileEffectEvent(stage, eff) {
        switch (eff) {
            case 6 /* TileEffect.Key */:
                this.inventory.addKey();
                stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
                break;
            case 7 /* TileEffect.Torch */:
                this.inventory.addTorch();
                stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
                break;
            case 8 /* TileEffect.Stairway */:
                stage.markCleared();
                break;
            default:
                break;
        }
        return false;
    }
    draw(canvas, stage, shiftx = 0, shifty = 0) {
        let bmp = canvas.getBitmap("player");
        if (bmp == undefined)
            return;
        for (let d of this.dust) {
            d.draw(canvas, bmp, stage.tileWidth, stage.tileHeight);
        }
        this.spr.draw(canvas, bmp, stage.tileWidth, stage.tileHeight, Math.round((this.renderPos.x + shiftx) * stage.tileWidth) | 0, Math.round((this.renderPos.y + shifty) * stage.tileHeight) | 0, this.flip);
    }
}
