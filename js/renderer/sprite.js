export class Sprite {
    constructor() {
        this.column = 0;
        this.row = 0;
        this.oldRow = -1;
        this.timer = 0.0;
        this.getFrame = () => this.column;
        this.getRow = () => this.row;
        // ...
    }
    nextFrame(dir, startColumn, endColumn) {
        this.column += dir;
        let min = Math.min(startColumn, endColumn);
        let max = Math.max(startColumn, endColumn);
        if (this.column < min)
            this.column = max;
        else if (this.column > max)
            this.column = min;
    }
    animate(row, startColumn, endColumn, frameTime, step) {
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
    setFrame(column, row) {
        this.column = column;
        this.row = row;
    }
    draw(canvas, bmp, spriteWidth, spriteHeight, dx, dy, flip = 0 /* Flip.None */) {
        canvas.drawBitmapRegion(bmp, this.column * spriteWidth, this.row * spriteHeight, spriteWidth, spriteHeight, dx, dy, flip);
    }
}
