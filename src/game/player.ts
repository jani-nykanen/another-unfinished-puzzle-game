import { CoreEvent } from "../core/event.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { GameObject } from "./gameobject.js";
import { Stage } from "./stage.js";
import { Direction } from "./direction.js";
import { ObjectType } from "./objecttype.js";
import { Inventory } from "./inventory.js";
import { TileEffect } from "./tileeffect.js";
import { AnimationSpecialEffect } from "./animationeffect.js";
import { nextObject } from "./existingobject.js";


const ANIMATION_ROW = [0, 2, 1, 2, 0];


export class Player extends GameObject {


    private spr : Sprite;
    private flip : Flip = Flip.None;

    private inventory : Inventory;

    private dust : Array<AnimationSpecialEffect>;


    constructor(x : number, y : number, inv : Inventory) {

        super(x, y, true);

        this.spr = new Sprite();
        this.dir = Direction.None;
        this.type = ObjectType.CanPushObject | ObjectType.CanCollectItems;

        this.inventory = inv;

        this.dust = new Array<AnimationSpecialEffect> ();
    }


    private spawnDust(dir : Direction) : void {

        const SHIFT_X = [-0.25, 0, 0.25, 0];
        const SHIFT_Y = [0.125, 0.25, 0.125, -0.25];

        const ANIM_SPEED = 6;

        if (dir == Direction.None)
            return;

        let o = nextObject<AnimationSpecialEffect>(this.dust, AnimationSpecialEffect);
        o.spawn(this.renderPos.x + SHIFT_X[dir-1], this.renderPos.y + SHIFT_Y[dir-1], 3, ANIM_SPEED);
    }


    private checkTileInteraction(stickDir : Direction, stage : Stage, event : CoreEvent) : boolean {

        let dx = 0;
        let dy = 0;

        let dir = this.dir;

        if (event.input.upPress() || 
            (stickDir == Direction.Up && stickDir != this.dir)) {

            dy = -1;
            dir = Direction.Up;
        }
        else if (event.input.downPress() ||
            (stickDir == Direction.Down && stickDir != this.dir)) {

            dy = 1;
            dir = Direction.Down;
        }
        else if (event.input.leftPress() ||
            (stickDir == Direction.Left && stickDir != this.dir)) {

            dx = -1;
            dir = Direction.Left;
        }
        else if (event.input.rightPress() ||
            (stickDir == Direction.Right && stickDir != this.dir)) {

            dx = 1;
            dir = Direction.Right;
        }

        if (dx != 0 || dy != 0) {

            if (stage.interactWithTiles(this.pos.x + dx, this.pos.y + dy)) {

                this.flip = dir == Direction.Left ? Flip.Horizontal : Flip.None;

                this.dir = dir;
                return true;
            }
        }
        return false;
    }


    protected checkMovement(stage : Stage, event : CoreEvent) : boolean {

        const EPS = 0.25;

        let dir = Direction.None;
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

        if (this.checkTileInteraction(dir, stage, event)) {

            this.spr.setFrame(4, ANIMATION_ROW[this.dir]);
            return this.moveTo(Direction.None, stage);
        }
        return this.moveTo(dir, stage);
    }


    protected updateAnimation(event : CoreEvent) : void {

        for (let d of this.dust) {

            d.update(event);
        }

        if (this.moving && this.dir == Direction.None)
            return;

        if (this.automatedMovement || !this.moving) {

            this.spr.setFrame(0, this.spr.getRow());
            return;
        }

        let row = ANIMATION_ROW[this.dir];
        if (this.dir != Direction.None) {

            this.flip = this.dir == Direction.Left ? Flip.Horizontal : Flip.None;
        }

        let frame = 0;
        let shift = Number((this.pos.x | 0) % 2 == (this.pos.y | 0) % 2);

        let oldFrame = this.spr.getFrame();
        if (this.moving) {

            frame = shift*2 + Math.round(this.moveTimer);
            if (frame != oldFrame) {

                this.spawnDust(this.dir);
            }
        }
        this.spr.setFrame(frame, row);
    }


    protected tileEffectEvent(stage : Stage, eff : TileEffect) : boolean {

        switch (eff) {

        case TileEffect.Key:

            this.inventory.addKey();
            stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
            break;

        case TileEffect.Torch:

            this.inventory.addTorch();
            stage.updateStaticLayerTile(this.target.x, this.target.y, 0);
            break;

        default:
            break;
        }
        return false;
    }


    public draw(canvas : Canvas, stage : Stage, shiftx = 0, shifty = 0) : void {
        
        let bmp = canvas.getBitmap("player");
        if (bmp == undefined)
            return;

        for (let d of this.dust) {

            d.draw(canvas, bmp, stage.tileWidth, stage.tileHeight);
        }

        this.spr.draw(canvas, bmp, stage.tileWidth, stage.tileHeight,
            Math.round((this.renderPos.x + shiftx) * stage.tileWidth) | 0,
            Math.round((this.renderPos.y + shifty) * stage.tileHeight) | 0,
            this.flip);
    }
}
