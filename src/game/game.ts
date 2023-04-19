import { Assets } from "../core/assets.js";
import { CoreEvent } from "../core/event.js";
import { Scene, SceneParam } from "../core/scene.js";
import { Canvas } from "../renderer/canvas.js";
import { Stage } from "./stage.js";


export class Game implements Scene {


    private stage : Stage;


    private drawHUD(canvas : Canvas) : void {

        let bmpHUD = canvas.getBitmap("hud");
        if (bmpHUD == undefined)
            return;

        let w = (this.stage.getWidth() * this.stage.tileWidth) / 8;
        let h = (this.stage.getHeight() * this.stage.tileHeight) / 8;

        for (let x = 0; x < w + 2; ++ x) {

            if (x < w) {

                canvas.drawBitmapRegion(bmpHUD, 8, 0, 8, 8,
                    x*8, -8);
                canvas.drawBitmapRegion(bmpHUD, 8, 16, 8, 8,
                    x*8, h*8);
            }

            canvas.drawBitmapRegion(bmpHUD, 8, 8, 8, 8, x*8, (h+1)*8);    
        }

        for (let y = 0; y < h + 1; ++ y) {

            if (y < h) {

                canvas.drawBitmapRegion(bmpHUD, 0, 8, 8, 8,
                    -8, y*8);
                canvas.drawBitmapRegion(bmpHUD, 16, 8, 8, 8,
                    w*8, y*8);
            }

            canvas.drawBitmapRegion(bmpHUD, 8, 8, 8, 8, (w+1)*8, y*8);    
        }

        canvas.drawBitmapRegion(bmpHUD, 0, 0, 8, 8, -8, -8);
        canvas.drawBitmapRegion(bmpHUD, 16, 0, 8, 8, w*8, -8);
        canvas.drawBitmapRegion(bmpHUD, 0, 16, 8, 8, -8, h*8);
        canvas.drawBitmapRegion(bmpHUD, 16, 16, 8, 8, w*8, h*8);
    }


    public init(param: SceneParam, event: CoreEvent, assets : Assets): void {
        
        this.stage = new Stage(event);
    }


    public update(event: CoreEvent, assets: Assets): void {
        
        this.stage.update(event);
    }


    public updatePhysics(event: CoreEvent, assets: Assets): void {

        // ...
    }


    public redraw(canvas: Canvas, assets: Assets, interpolationStep : number): void {

        canvas.clear(0.0, 0.33, 0.67);
        canvas.transform
            .setView(canvas.width, canvas.height)
            .loadIdentity()
            .use();

        this.stage.centerCamera(canvas);

        this.drawHUD(canvas);
        this.stage.draw(canvas);
    }

}
