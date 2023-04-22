import { CoreEvent } from "../core/event.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { Vector2 } from "../vector/vector.js";
import { MovingObject } from "./movingobject.js";
import { Stage } from "./stage.js";
import { Direction } from "./direction.js";


export class Player extends MovingObject {


    private spr : Sprite;
    private flip : Flip = Flip.None;

    private automatedMovement : boolean = false;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.spr = new Sprite();

        this.dir = Direction.None;
    }


    private checkMovement(stage : Stage, event : CoreEvent, autoDir = Direction.None) : boolean {

        const EPS = 0.25;

        let stick : Vector2;
        let dir = autoDir;

        this.automatedMovement = dir != Direction.None;
    
        if (dir == Direction.None) {

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
        }
        return this.moveTo(dir, stage);
    }


    private animate(event : CoreEvent) : void {

        const ANIM_SPEED = 6;
        const ROW = [0, 2, 1, 2, 0];

        let row = ROW[this.dir];
        if (this.dir != Direction.None) {

            this.flip = this.dir == Direction.Left ? Flip.Horizontal : Flip.None;
        }

        if (this.moving && !this.automatedMovement) {

            this.spr.animate(row, 0, 3, ANIM_SPEED, event.step);
        }
        else {

            this.spr.setFrame(0, row);
        }
    }


    public update(moveSpeed : number, stage : Stage, event : CoreEvent) : boolean {

        this.animate(event);

        if (this.moving) {

            this.updateMovement(moveSpeed, event, false);
            if (!this.moving) {

                if (!this.checkMovement(stage, event,
                    stage.checkUnderlyingTile(this.pos.x, this.pos.y))) {

                    this.moveTimer = 0;
                    this.moving = false;

                    this.automatedMovement = false;

                    return false;
                }       
            }
            return true;
        }
        return this.checkMovement(stage, event);
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
