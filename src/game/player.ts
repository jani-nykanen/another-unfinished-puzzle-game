import { CoreEvent } from "../core/event.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { Vector2 } from "../vector/vector.js";
import { MovingObject } from "./movingobject.js";
import { Stage } from "./stage.js";


export class Player extends MovingObject {


    private spr : Sprite;
    private flip : Flip = Flip.None;

    private dir : Vector2;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.spr = new Sprite();

        this.dir = new Vector2();
    }


    private checkMovement(stage : Stage, event : CoreEvent) : boolean {

        const EPS = 0.25;

        let stick = event.input.stick;
        if (stick.length < EPS) {

            return false;
        }

        let dirx = 0;
        let diry = 0;

        if (Math.abs(stick.x) >= Math.abs(stick.y)) {

            dirx = Math.sign(stick.x);
        }
        else {

            diry = Math.sign(stick.y);
        }

        if (dirx != 0 || diry != 0) {

            this.target = Vector2.add(this.pos, new Vector2(dirx, diry));
            this.moving = true;
            this.moveTimer += 1.0;

            this.dir.x = dirx;
            this.dir.y = diry;

            return true;
        }
        return false;
    }


    private animate(event : CoreEvent) : void {

        const ANIM_SPEED = 6;
        const EPS = 0.25;

        let row = 0;
        if (Math.abs(this.dir.x) > EPS) {

            row = 2;
            this.flip = this.dir.x < 0 ? Flip.Horizontal : Flip.None;
        }
        else if (Math.abs(this.dir.y) > EPS) {

            row = this.dir.y > 0 ? 0 : 1;
            this.flip = Flip.None;
        }

        if (this.moving) {

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

                if (!this.checkMovement(stage, event)) {

                    this.moveTimer = 0;
                    this.moving = false;

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
