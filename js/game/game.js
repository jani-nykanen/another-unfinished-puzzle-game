import { Stage } from "./stage.js";
import { Menu } from "./menu.js";
import { MenuButton } from "./menubutton.js";
const INITIAL_CLEAR_TIME = 40;
const CLEAR_TIME_WAIT = 80;
export class Game {
    constructor() {
        this.stageIndex = 1;
    }
    drawFrame(canvas) {
        const SHADOW_ALPHA = 0.67;
        let bmpHUD = canvas.getBitmap("hud");
        if (bmpHUD == undefined)
            return;
        let w = (this.stage.getWidth() * this.stage.tileWidth) / 8;
        let h = (this.stage.getHeight() * this.stage.tileHeight) / 8;
        canvas.setColor(0, 0, 0, SHADOW_ALPHA);
        for (let i = 0; i < Math.max(w + 2, h + 1); ++i) {
            if (i < w + 2) {
                canvas.drawBitmapRegion(bmpHUD, 8, 8, 8, 8, i * 8, (h + 1) * 8);
            }
            if (i < h + 1) {
                canvas.drawBitmapRegion(bmpHUD, 8, 8, 8, 8, (w + 1) * 8, i * 8);
            }
        }
        canvas.setColor();
        for (let x = 0; x < w + 2; ++x) {
            if (x < w) {
                canvas.drawBitmapRegion(bmpHUD, 8, 0, 8, 8, x * 8, -8);
                canvas.drawBitmapRegion(bmpHUD, 8, 16, 8, 8, x * 8, h * 8);
            }
        }
        for (let y = 0; y < h + 1; ++y) {
            if (y < h) {
                canvas.drawBitmapRegion(bmpHUD, 0, 8, 8, 8, -8, y * 8);
                canvas.drawBitmapRegion(bmpHUD, 16, 8, 8, 8, w * 8, y * 8);
            }
        }
        canvas.drawBitmapRegion(bmpHUD, 0, 0, 8, 8, -8, -8);
        canvas.drawBitmapRegion(bmpHUD, 16, 0, 8, 8, w * 8, -8);
        canvas.drawBitmapRegion(bmpHUD, 0, 16, 8, 8, -8, h * 8);
        canvas.drawBitmapRegion(bmpHUD, 16, 16, 8, 8, w * 8, h * 8);
    }
    drawHUD(canvas) {
        const COG_HEIGHT = 4.0;
        let font = canvas.getBitmap("font");
        let cogs = canvas.getBitmap("cogs");
        if (font == undefined || cogs == undefined)
            return;
        canvas.drawText(font, "Floor " + String(this.stageIndex), canvas.width / 2, 8, 0, 0, 1 /* TextAlign.Center */);
        canvas.drawText(font, "Password: 123456", canvas.width / 2, canvas.height - 12, 0, 0, 1 /* TextAlign.Center */);
        this.stage.drawHUD(canvas);
        canvas.setColor(0.34, 0.34, 0.34);
        for (let y = COG_HEIGHT - 1; y >= 0; --y) {
            if (y == 0) {
                canvas.setColor(0.67, 0.67, 0.67);
            }
            // Bottom left
            canvas.transform.push()
                .translate(0, canvas.height + y)
                .rotate(this.stage.getSpecialMoveTimer() * Math.PI / 2.0)
                .use();
            canvas.drawBitmapRegion(cogs, 0, 0, 80, 80, -40, -40);
            canvas.transform.pop();
            // Bottom right
            canvas.transform.push()
                .translate(canvas.width, canvas.height + y)
                .rotate(-this.stage.getSpecialMoveTimer() * Math.PI / 2.0)
                .use();
            canvas.drawBitmapRegion(cogs, 80, 0, 80, 80, -40, -40);
            canvas.transform.pop();
            // Top right
            canvas.transform.push()
                .translate(canvas.width, y)
                .rotate(this.stage.getSpecialMoveTimer() * Math.PI / 2.0)
                .use();
            canvas.drawBitmapRegion(cogs, 0, 0, 80, 80, -40, -40);
            canvas.transform.pop();
            // Top left
            canvas.transform.push()
                .translate(0, y)
                .rotate(-this.stage.getSpecialMoveTimer() * Math.PI / 2.0)
                .use();
            canvas.drawBitmapRegion(cogs, 80, 0, 80, 80, -40, -40);
            canvas.transform.pop();
        }
        canvas.transform.use();
        canvas.setColor();
    }
    createPauseMenu() {
        this.pauseMenu = new Menu([
            // Resume
            new MenuButton("Resume", (event) => {
                this.pauseMenu.deactivate();
            }),
            // Undo
            new MenuButton("Undo move", (event) => {
                this.stage.undo();
                this.pauseMenu.deactivate();
            }),
            // Restart
            new MenuButton("Restart", (event) => {
                this.stage.reset();
                this.pauseMenu.deactivate();
            }),
            // Settings
            new MenuButton("Settings", (event) => {
                // ...
            }),
            // Main menu
            new MenuButton("Main menu", (event) => {
                // ...
            })
        ], false);
    }
    updateStageClearTimer(event) {
        this.stageClearTimer += event.step;
        if (this.stageClearTimer >= INITIAL_CLEAR_TIME + CLEAR_TIME_WAIT) {
            event.transition.activate(true, 1 /* TransitionType.Fade */, 1.0 / 30.0, (event) => {
                ++this.stageIndex;
                this.stage.nextStage(this.stageIndex);
            });
        }
    }
    drawStageClear(canvas) {
        const DARKEN_ALPHA = 0.33;
        const MAX_OFFSET = 4;
        const AMPLITUDE = 48;
        canvas.setColor(0, 0, 0, DARKEN_ALPHA);
        canvas.fillRect();
        canvas.setColor();
        let bmp = canvas.getBitmap("stageClear");
        if (bmp == undefined)
            return;
        let dx = this.stage.tileWidth * this.stage.getWidth() / 2.0 - bmp.width / 2;
        let dy = this.stage.tileHeight * this.stage.getHeight() / 2.0 - bmp.height / 2;
        let xoff;
        let yoff;
        let t;
        let offset;
        if (this.stageClearTimer < INITIAL_CLEAR_TIME) {
            t = 1.0 - this.stageClearTimer / INITIAL_CLEAR_TIME;
            offset = 1 + MAX_OFFSET * t;
            for (let y = 0; y < bmp.height; ++y) {
                xoff = Math.round(Math.sin((Math.PI * 4) / bmp.height * y + t * Math.PI * 2) * AMPLITUDE * t);
                yoff = Math.round((y - bmp.height / 2) * offset);
                canvas.drawBitmapRegion(bmp, 0, y, bmp.width, 1, dx + xoff, dy + yoff + bmp.height / 2);
            }
        }
        else {
            canvas.drawBitmap(bmp, dx, dy);
        }
    }
    init(param, event) {
        let levels = event.assets.getLevelPack("pack1");
        if (levels == undefined) {
            throw "Missing level pack!";
        }
        this.stageIndex = 1;
        this.stage = new Stage(this.stageIndex, levels);
        this.createPauseMenu();
    }
    update(event) {
        if (event.transition.isActive())
            return;
        if (this.pauseMenu.isActive()) {
            this.pauseMenu.update(event);
            return;
        }
        if (this.stage.isCleared()) {
            this.updateStageClearTimer(event);
        }
        else {
            if (event.input.getAction("pause") == 3 /* InputState.Pressed */) {
                this.pauseMenu.activate(0);
                return;
            }
            if (event.input.getAction("undo") == 3 /* InputState.Pressed */) {
                this.stage.undo();
            }
            else if (event.input.getAction("restart") == 3 /* InputState.Pressed */) {
                this.stage.reset();
            }
        }
        let wasCleared = this.stage.isCleared();
        this.stage.update(event);
        if (!wasCleared && this.stage.isCleared()) {
            this.stageClearTimer = 0.0;
        }
    }
    redraw(canvas, interpolationStep) {
        const PAUSE_DARKEN_ALPHA = 0.34;
        canvas.clear(0.0, 0.34, 0.67);
        canvas.transform
            .setView(canvas.width, canvas.height)
            .loadIdentity()
            .use();
        this.stage.centerCamera(canvas);
        this.stage.draw(canvas);
        if (this.stage.isCleared()) {
            this.drawStageClear(canvas);
        }
        canvas.setViewport();
        this.drawFrame(canvas);
        canvas.transform
            .loadIdentity()
            .use();
        this.drawHUD(canvas);
        if (this.pauseMenu.isActive()) {
            canvas.setColor(0, 0, 0, PAUSE_DARKEN_ALPHA);
            canvas.fillRect();
            this.pauseMenu.draw(canvas);
        }
    }
}
