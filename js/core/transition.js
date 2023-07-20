import { RGBA } from "../vector/rgba.js";
;
export class Transition {
    constructor() {
        this.timer = 1.0;
        this.fadeOut = false;
        this.effectType = 0 /* TransitionType.None */;
        this.active = false;
        this.speed = 1.0;
        this.param = 0.0;
        this.callback = (() => { });
        this.isActive = () => this.active;
        this.isFadingOut = () => this.active && this.fadeOut;
        // ...
    }
    activate(fadeOut, type, speed, callback, param = 0) {
        this.fadeOut = fadeOut;
        this.speed = speed;
        this.timer = 1.0;
        this.callback = callback;
        this.effectType = type;
        this.param = param;
        this.active = true;
    }
    update(event, step) {
        if (!this.active)
            return;
        if ((this.timer -= this.speed * step) <= 0) {
            this.fadeOut = !this.fadeOut;
            if (!this.fadeOut) {
                this.timer += 1.0;
                this.callback(event);
            }
            else {
                this.active = false;
                this.timer = 0;
            }
        }
    }
    draw(canvas) {
        if (!this.active || this.effectType == 0 /* TransitionType.None */)
            return;
        let t = this.timer;
        if (this.fadeOut)
            t = 1.0 - t;
        let maxRadius;
        let radius;
        let color = RGBA.black;
        switch (this.effectType) {
            case 1 /* TransitionType.Fade */:
                if (typeof (this.param) != "number") {
                    color = this.param;
                }
                canvas.setColor(color.r, color.g, color.b, t);
                canvas.fillRect(0, 0, canvas.width, canvas.height);
                break;
            case 2 /* TransitionType.Circle */:
                maxRadius = Math.max(Math.hypot(canvas.width / 2, canvas.height / 2), Math.hypot(canvas.width - canvas.width / 2, canvas.height / 2), Math.hypot(canvas.width - canvas.width / 2, canvas.height - canvas.height / 2), Math.hypot(canvas.width / 2, canvas.height - canvas.height / 2));
                radius = (1 - t) * maxRadius;
                canvas.setColor(0);
                canvas.fillCircleOutside(radius);
                break;
            default:
                break;
        }
    }
    deactivate() {
        this.active = false;
    }
}
