import { CoreEvent } from "../core/event.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { Sprite } from "../renderer/sprite.js";
import { MovingObject } from "./movingobject.js";
import { Stage } from "./stage.js";


export class Player extends MovingObject {


    private spr : Sprite;
    private flip : Flip = Flip.None;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.spr = new Sprite();
    }


    public update(stage : Stage, event : CoreEvent) : void {

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
