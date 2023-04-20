import { Canvas } from "../renderer/canvas.js";
import { Bitmap } from "../renderer/bitmap.js";


export class WallMap {


    private tiles : Array<number>;
    private width : number;
    private height : number;


    constructor(baseMap : Array<number>, width : number, height : number) {

        this.width = width*2;
        this.height = height*2;

        this.tiles = (new Array<number> (this.width*this.height)).fill(0);
        this.constructTileArray(baseMap, width, height); 
    }


    private getTile(x : number, y : number,
        baseMap : Array<number>, width : number, height : number, def = 0) : number {

        if (x < 0 || y < 0 || x >= width || y >= height)
            return def;

        return baseMap[y*width + x];
    }


    private computeTile(x : number, y : number,
        baseMap : Array<number>, width : number, height : number) : void {

        // TODO: Get the "column count" (10) from a constant?

        let neighborhood = new Array<boolean> (9);
        for (let j = -1; j <= 1; ++ j) {

            for (let i = -1; i <= 1; ++ i) {

                neighborhood[(j+1) * 3 + (i+1)] = this.getTile(x+i, y+j, baseMap, width, height, 2) == 2;
            }
        }

        // Top-left tile
        let index = (y*2) * this.width + x*2;
        this.tiles[index] = 1;
        if (!neighborhood[1] || !neighborhood[3]) {

            this.tiles[index] = 7;
            if (neighborhood[1]) {

                this.tiles[index] = 5;
            }
            else if (neighborhood[3]) {

                this.tiles[index] = 3;   
            }
        }
        else if (!neighborhood[0]) {
    
            this.tiles[index] = 9;
        }

        // Top-right tile
        ++ index;
        this.tiles[index] = 2;
        if (!neighborhood[1] || !neighborhood[5]) {

            this.tiles[index] = 8;
            if (neighborhood[1]) {

                this.tiles[index] = 6;
            }
            else if (neighborhood[5]) {

                this.tiles[index] = 4;   
            }
        }
        else if (!neighborhood[2]) {
    
            this.tiles[index] = 10;
        }

        // Bottom-left tile
        index += this.width - 1;
        this.tiles[index] = 11;
        if (!neighborhood[7] || !neighborhood[3]) {

            this.tiles[index] = 17;
            if (neighborhood[7]) {

                this.tiles[index] = 15;
            }
            else if (neighborhood[3]) {

                this.tiles[index] = 13;   
            }
        }
        else if (!neighborhood[6]) {
    
            this.tiles[index] = 19;
        }

        // Bottom-right tile
        ++ index;
        this.tiles[index] = 12;
        if (!neighborhood[7] || !neighborhood[5]) {

            this.tiles[index] = 18;
            if (neighborhood[7]) {

                this.tiles[index] = 16;
            }
            else if (neighborhood[5]) {

                this.tiles[index] = 14;   
            }
        }
        else if (!neighborhood[8]) {
    
            this.tiles[index] = 20;
        }
    }


    private constructTileArray(baseMap : Array<number>, 
        width : number, height : number) : void {

        for (let y = 0; y < height; ++ y) {

            for (let x = 0; x < width; ++ x) {

                if (this.getTile(x, y, baseMap, width, height) != 2)
                    continue;

                this.computeTile(x, y, baseMap, width, height);
            }
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap,
        tileWidth : number, tileHeight : number) : void {

        let sx : number;
        let sy : number;
        let tid : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) { 

                tid = this.tiles[y*this.width + x];
                if (tid == 0)
                    continue;

                -- tid;

                sx = tid % 10;
                sy = (tid / 10) | 0;

                sx *= tileWidth/2;
                sy *= tileHeight/2;

                canvas.drawBitmapRegion(bmp,
                    sx, sy, tileWidth/2, tileHeight/2,
                    x*tileWidth/2, y*tileWidth/2);
            }
        }
    }
}
