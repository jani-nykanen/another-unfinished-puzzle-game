import { CoreEvent } from "../core/event.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { GameObject } from "./gameobject.js";
import { Stage } from "./stage.js";
import { Direction } from "./direction.js";
import { ObjectType } from "./objecttype.js";
import { Inventory } from "./inventory.js";
import { TileEffect } from "./tileeffect";


const ANIMATION_ROW = [0, 2, 1, 2, 0];


export class Player extends GameObject {


    private spr : Sprite;
    private flip : Flip = Flip.None;

    private inventory : Inventory;


    constructor(x : number, y : number, inv : Inventory) {

        super(x, y, true);

        this.spr = new Sprite();

        this.dir = Direction.None;

        this.type = ObjectType.CanPushObject | ObjectType.CanCollectItems;

        this.inventory = inv;
    }


    private checkTileInteraction(stage : Stage, event : CoreEvent) : boolean {

        let dx = 0;
        let dy = 0;

        let dir = this.dir;

        if (event.input.upPress()) {

            dy = -1;
            dir = Direction.Up;
        }
        else if (event.input.downPress()) {

            dy = 1;
            dir = Direction.Down;
        }
        else if (event.input.leftPress()) {

            dx = -1;
            dir = Direction.Left;
        }
        else if (event.input.rightPress()) {

            dx = 1;
            dir = Direction.Right;
        }

        if (dx != 0 || dy != 0) {

            if (stage.interactWithTiles(this.pos.x + dx, this.pos.y + dy)) {

                this.dir = dir;
                return true;
            }
        }
        return false;
    }


    protected checkMovement(stage : Stage, event : CoreEvent) : boolean {

        const EPS = 0.25;

        if (this.checkTileInteraction(stage, event)) {

            this.spr.setFrame(4, ANIMATION_ROW[this.dir]);
            return this.moveTo(Direction.None, stage);
        }

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
        return this.moveTo(dir, stage);
    }


    protected updateAnimation(event : CoreEvent) : void {

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

        if (this.moving) {

            frame = shift*2 + Math.round(this.moveTimer);
        }
        this.spr.setFrame(frame, row);
    }


    protected tileEffectEvent(stage : Stage, eff : TileEffect) : void {

        switch (eff) {

        case TileEffect.Key:

            this.inventory.addKey();
            break;

        case TileEffect.Torch:

            this.inventory.addTorch();
            break;

        default:
            break;
        }
    }


    public draw(canvas : Canvas, stage : Stage) : void {
        
        let bmp = canvas.getBitmap("player");
        if (bmp == undefined)
            return;

        this.spr.draw(canvas, bmp, stage.tileWidth, stage.tileHeight,
            Math.round(this.renderPos.x * stage.tileWidth) | 0,
            Math.round(this.renderPos.y * stage.tileHeight) | 0,
            this.flip);
    }
}
