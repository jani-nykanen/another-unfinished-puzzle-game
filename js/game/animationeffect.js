import { Sprite } from "../renderer/sprite.js";
import { Vector2 } from "../vector/vector.js";
import { ExistingObject } from "./existingobject.js";
// AnimationEffect was taken...
export class AnimationSpecialEffect extends ExistingObject {
    constructor() {
        super();
        this.doesExist = () => this.exist;
        this.pos = new Vector2();
        this.spr = new Sprite();
        this.speed = 1;
    }
    spawn(x, y, row, speed) {
        this.pos.x = x;
        this.pos.y = y;
        this.spr.setFrame(0, row);
        this.speed = speed;
        this.exist = true;
    }
    update(event) {
        if (!this.exist)
            return;
        this.spr.animate(this.spr.getRow(), 0, 4, this.speed, event.step);
        if (this.spr.getFrame() == 4) {
            this.exist = false;
        }
    }
    draw(canvas, bmp, width, height) {
        if (!this.exist)
            return;
        let dx = this.pos.x * width;
        let dy = this.pos.y * height;
        this.spr.draw(canvas, bmp, width, height, dx, dy);
    }
    kill() {
        this.exist = false;
    }
}
