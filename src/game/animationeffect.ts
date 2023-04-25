import { Sprite } from "../renderer/sprite.js";
import { Vector2 } from "../vector/vector.js";
import { CoreEvent } from "../core/event.js";
import { Canvas } from "../renderer/canvas.js";
import { Bitmap } from "../renderer/bitmap.js";



// AnimationEffect was taken...
export class AnimationSpecialEffect {


    private pos : Vector2;

    private spr : Sprite;
    private speed : number;
    private exist : boolean = false;


    constructor() {

        this.pos = new Vector2();

        this.spr = new Sprite();
        this.speed = 1;
    }


    public spawn(x : number, y : number, row : number, speed : number) : void {

        this.pos.x = x;
        this.pos.y = y;

        this.spr.setFrame(0, row);
        this.speed = speed;


        this.exist = true;
    }


    public update(event : CoreEvent) : void {

        if (!this.exist)
            return;

        this.spr.animate(this.spr.getRow(), 0, 4, this.speed, event.step);
        if (this.spr.getFrame() == 4) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap, width : number, height : number) : void {

        if (!this.exist)
            return;
    
        let dx = this.pos.x * width;
        let dy = this.pos.y * height;

        this.spr.draw(canvas, bmp, width, height, dx, dy);
    }


    public kill() : void {

        this.exist = false;
    }


    public doesExist = () : boolean => this.exist;
}
