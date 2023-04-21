import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { MovingObject } from "./movingobject.js";
import { Stage } from "./stage.js";


export class Crate extends MovingObject {


    constructor(x : number, y : number) {

        super(x, y, true);
    }


    public update(stage : Stage, event : CoreEvent) : void {

    }


    public draw(canvas : Canvas, stage : Stage) : void {
        
        let bmp = canvas.getBitmap("tileset1");
        if (bmp == undefined)
            return;

        canvas.drawBitmapRegion(bmp, 16, 0, 16, 16,
            Math.round(this.renderPos.x * stage.tileWidth) | 0,
            Math.round(this.renderPos.y * stage.tileHeight) | 0);
    }
}
