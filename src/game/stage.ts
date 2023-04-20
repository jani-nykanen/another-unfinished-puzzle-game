import { CoreEvent } from "../core/event.js";
import { Assets } from "../core/assets.js";
import { Canvas } from "../renderer/canvas.js";
import { Tilemap } from "../core/tilemap.js";
import { Bitmap } from "../renderer/bitmap.js";


const NON_ANIMATED_TILES = [
    2, 4, 6, 7, 8, 9, 10, 12
];
const ANIMATED_TILES = [
    11, 13, 17, 18, 19, 20
];
const SOURCE_X = [
    0, 0, 0, 0, 
    0, 2, 3, 0, 
    2, 3, 0, 1, 
    2, 0, 0, 0,
    0, 0, 2, 2
];
const SOURCE_Y = [
    0, 0, 0, 2, 
    0, 0, 0, 1, 
    1, 1, 3, 2, 
    2, 0, 0, 0,
    4, 5, 4, 5
];
const FRAME_COUNT = [
    0, 0, 0, 0, 
    0, 0, 0, 0, 
    0, 0, 4, 0, 
    2, 0, 0, 0,
    2, 2, 2, 2
];
const FRAME_SHIFT = [
    0, 0, 0, 0, 
    0, 0, 0, 0, 
    0, 0, 2, 0, 
    1, 0, 0, 0,
    0, 0, 0, 0
];



export class Stage {


    private baseMap : Tilemap;
    private activeStaticLayer : Array<number> | undefined;

    private width : number;
    private height : number;

    private tileAnimationTimer : number;
    
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

        this.tileAnimationTimer = 0.0;

        // TODO: Obtain these from the tilemap
        this.tileWidth = 16;
        this.tileHeight = 16;
    }


    private drawStaticTiles(canvas : Canvas, bmp : Bitmap) : void {


        if (this.activeStaticLayer == undefined)
            return;

        let sx : number | undefined;
        let sy : number | undefined;

        let frame : number;
        let frameCount : number | undefined;
        let frameShift : number | undefined;

        let tid : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.activeStaticLayer[y * this.width + x];

                sx = SOURCE_X[tid-1];
                sy = SOURCE_Y[tid-1];
                frameCount = FRAME_COUNT[tid-1];
                frameShift = FRAME_SHIFT[tid-1];

                if (NON_ANIMATED_TILES.includes(tid) &&
                    sx != undefined && sy != undefined) {

                    canvas.drawBitmapRegion(bmp, 
                        sx*this.tileWidth, sy*this.tileHeight, 
                        this.tileWidth, this.tileHeight,
                        x*this.tileWidth, y*this.tileHeight);
                }
                else if (ANIMATED_TILES.includes(tid) &&
                    sx != undefined && sy != undefined &&
                    frameCount != undefined) {

                    frame = Math.floor(this.tileAnimationTimer * frameCount);
                    if (frameShift != undefined) {

                        frame += Number(x % 2 == y % 2) * frameShift;
                    }
                    sx += (frame % frameCount);

                    canvas.drawBitmapRegion(bmp, 
                        sx*this.tileWidth, sy*this.tileHeight, 
                        this.tileWidth, this.tileHeight,
                        x*this.tileWidth, y*this.tileHeight);
                }
            }
        }
    }


    public update(event : CoreEvent) : void {

        const ANIMATION_SPEED = 1.0/600.0;

        this.tileAnimationTimer = (this.tileAnimationTimer + ANIMATION_SPEED*event.delta) % 1.0;
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
