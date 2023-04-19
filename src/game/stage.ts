import { CoreEvent } from "../core/event.js";
import { Assets } from "../core/assets.js";
import { Canvas } from "../renderer/canvas.js";
import { Tilemap } from "../core/tilemap.js";
import { Bitmap } from "../renderer/bitmap.js";


export class Stage {


    private baseMap : Tilemap;
    private activeStaticLayer : Array<number> | undefined;

    private width : number;
    private height : number;

    
    public readonly tileWidth : number;
    public readonly tileHeight : number;


    constructor(event : CoreEvent) {

        let baseMap = event.assets.getTilemap("1");
        if (baseMap == undefined) {

            throw "Missing tilemap!";
        }

        this.baseMap = baseMap;
        this.width = baseMap.width;
        this.height = baseMap.height;

        this.activeStaticLayer = baseMap.cloneLayer("base");

        // TODO: Obtain these from the tilemap
        this.tileWidth = 16;
        this.tileHeight = 16;
    }


    private drawStaticTiles(canvas : Canvas, bmp : Bitmap) : void {

        if (this.activeStaticLayer == undefined)
            return;

        let tid : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.activeStaticLayer[y * this.width + x];
                switch (tid) {

                case 2:

                    canvas.drawBitmapRegion(bmp, 
                        0, 0, this.tileWidth, this.tileHeight,
                        x*this.tileWidth, y*this.tileHeight);
                    break;

                case 6:
                case 7:

                    canvas.drawBitmapRegion(bmp, 
                        (tid-6 + 2) * this.tileWidth, 0, this.tileWidth, this.tileHeight,
                        x*this.tileWidth, y*this.tileHeight);
                    break;

                default:
                    break;
                }
            }
        }
    }


    public update(event : CoreEvent) : void {

        // ...
    }


    public draw(canvas : Canvas) : void {

        canvas.setColor(0.0);
        canvas.fillRect(0, 0, this.width*this.tileWidth, this.height*this.tileHeight);
        canvas.setColor();

        let bmpTileset = canvas.getBitmap("tileset1");
        if (bmpTileset != undefined) {

            this.drawStaticTiles(canvas, bmpTileset);
        }
    }


    public centerCamera(canvas : Canvas) : void {

        let dx = this.width * this.tileWidth / 2;
        let dy = this.height * this.tileHeight / 2;

        canvas.transform
            .translate(canvas.width/2 - dx, canvas.height/2 - dy)
            .use();
    }

    public getWidth = () : number => this.width;
    public getHeight = () : number => this.height;
}
