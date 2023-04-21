import { Bitmap } from "./bitmap";
import { Canvas, Flip } from "./canvas";


export class Sprite {


    private column : number = 0;
    private row : number = 0;
    private oldRow : number = -1;

    private timer : number = 0.0;


    constructor() {

        // ...
    }


    private nextFrame(dir : number, startColumn : number, endColumn : number) : void {

        this.column += dir;

        let min = Math.min(startColumn, endColumn);
        let max = Math.max(startColumn, endColumn);

        if (this.column < min)
            this.column = max;
        else if (this.column > max)
            this.column = min;
    } 


    public animate(row : number, 
        startColumn : number, endColumn : number, 
        frameTime : number, step : number) : void {

        if (row != this.oldRow) {

            this.column = startColumn;
            this.timer = 0.0;

            this.row = row;
            this.oldRow = row;
        }

        let dir = Math.sign(endColumn - startColumn);

        if (frameTime <= 0) {

            this.nextFrame(dir, startColumn, endColumn);
            return;
        }

        this.timer += step;
        while (this.timer >= frameTime) {

            this.timer -= frameTime;
            this.nextFrame(dir, startColumn, endColumn);
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap,
        spriteWidth : number, spriteHeight : number,
        dx : number, dy : number, flip : Flip) : void {

        canvas.drawBitmapRegion(bmp,
            this.column * spriteWidth, this.row * spriteHeight,
            spriteWidth, spriteHeight, dx, dy, flip);
    }
}
