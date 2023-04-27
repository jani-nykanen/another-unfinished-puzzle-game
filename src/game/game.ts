import { CoreEvent } from "../core/event.js";
import { Scene, SceneParam } from "../core/scene.js";
import { InputState } from "../input/inputstate.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { Stage } from "./stage.js";
import { Menu } from "./menu.js";
import { MenuButton } from "./menubutton.js";


export class Game implements Scene {


    private stage : Stage;
    private pauseMenu : Menu;


    private drawFrame(canvas : Canvas) : void {

        const SHADOW_ALPHA = 0.67;

        let bmpHUD = canvas.getBitmap("hud");
        if (bmpHUD == undefined)
            return;

        let w = (this.stage.getWidth() * this.stage.tileWidth) / 8;
        let h = (this.stage.getHeight() * this.stage.tileHeight) / 8;

        canvas.setColor(0, 0, 0, SHADOW_ALPHA);
        for (let i = 0; i < Math.max(w + 2, h + 1); ++ i) {

            if (i < w + 2) {

                canvas.drawBitmapRegion(bmpHUD, 8, 8, 8, 8, i*8, (h+1)*8);     
            }

            if (i < h + 1) {

                canvas.drawBitmapRegion(bmpHUD, 8, 8, 8, 8, (w+1)*8, i*8);   
            }
        }
        canvas.setColor();

        for (let x = 0; x < w + 2; ++ x) {

            if (x < w) {

                canvas.drawBitmapRegion(bmpHUD, 8, 0, 8, 8,
                    x*8, -8);
                canvas.drawBitmapRegion(bmpHUD, 8, 16, 8, 8,
                    x*8, h*8);
            }  
        }

        for (let y = 0; y < h + 1; ++ y) {

            if (y < h) {

                canvas.drawBitmapRegion(bmpHUD, 0, 8, 8, 8,
                    -8, y*8);
                canvas.drawBitmapRegion(bmpHUD, 16, 8, 8, 8,
                    w*8, y*8);
            }
        }

        canvas.drawBitmapRegion(bmpHUD, 0, 0, 8, 8, -8, -8);
        canvas.drawBitmapRegion(bmpHUD, 16, 0, 8, 8, w*8, -8);
        canvas.drawBitmapRegion(bmpHUD, 0, 16, 8, 8, -8, h*8);
        canvas.drawBitmapRegion(bmpHUD, 16, 16, 8, 8, w*8, h*8);
    }


    private drawHUD(canvas : Canvas) : void {

        canvas.drawText(
            canvas.getBitmap("font"), 
            "Floor 1", canvas.width/2, 8, 
            0, 0, TextAlign.Center);

        canvas.drawText(
            canvas.getBitmap("font"), 
            "Password: 123456", canvas.width/2, canvas.height-12, 
            0, 0, TextAlign.Center);

        this.stage.drawHUD(canvas);
    }


    private createPauseMenu() : void {

        this.pauseMenu = new Menu(
        [
        // Resume
        new MenuButton("Resume", (event : CoreEvent) => {

            this.pauseMenu.deactivate();
        }),

        // Undo
        new MenuButton("Undo move", (event : CoreEvent) => {

            this.stage.undo();
            this.pauseMenu.deactivate();
        }),

        // Restart
        new MenuButton("Restart", (event : CoreEvent) => {

            this.stage.reset();
            this.pauseMenu.deactivate();
        }),

        // Settings
        new MenuButton("Settings", (event : CoreEvent) => {

            // ...
        }),

        // Main menu
        new MenuButton("Main menu", (event : CoreEvent) => {

            // ...
        })
        ],
        false);
    }


    public init(param: SceneParam, event: CoreEvent): void {
        
        this.stage = new Stage(event);
        this.createPauseMenu();
    }


    public update(event: CoreEvent): void {
        
        if (this.pauseMenu.isActive()) {

            this.pauseMenu.update(event);
            return;
        }

        if (event.input.getAction("pause") == InputState.Pressed) {

            this.pauseMenu.activate(0);
            return;
        }

        if (event.input.getAction("undo") == InputState.Pressed) {

            this.stage.undo();
        }
        else if (event.input.getAction("restart") == InputState.Pressed) {

            this.stage.reset();
        }

        this.stage.update(event);
    }



    public redraw(canvas: Canvas, interpolationStep : number): void {

        const PAUSE_DARKEN_ALPHA = 0.33;

        canvas.clear(0.0, 0.33, 0.67);
        canvas.transform
            .setView(canvas.width, canvas.height)
            .loadIdentity()
            .use();

        this.stage.centerCamera(canvas);
        this.stage.draw(canvas);

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
