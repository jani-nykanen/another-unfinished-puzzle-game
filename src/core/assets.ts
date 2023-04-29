import { Bitmap } from "../renderer/bitmap.js";
import { AudioSample } from "../audio/sample.js";
import { Tilemap } from "./tilemap.js";
import { AudioSystem } from "../audio/audiosystem.js";
import { RenderContext } from "../renderer/rendercontext.js";
import { Mesh } from "../renderer/mesh.js";
import { parseTilemap } from "./tilemapparser.js";
import { LevelPack } from "./levelpack.js";


export class Assets {


    private bitmaps : Map<string, Bitmap>;
    private samples : Map<string, AudioSample>;
    private tilemaps : Map<string, Tilemap>;
    private levelPacks : Map<string, LevelPack>;
    private meshes : Map<string, Mesh>;

    private loaded : number = 0;
    private totalAssets : number = 0;

    private readonly audio : AudioSystem;
    private readonly renderer : RenderContext;


    constructor(audio : AudioSystem, renderer : RenderContext) {

        this.bitmaps = new Map<string, Bitmap> ();
        this.samples = new Map<string, AudioSample> ();
        this.tilemaps = new Map<string, Tilemap> ();
        this.levelPacks = new Map<string, LevelPack> ();
        this.meshes = new Map<string, Mesh> ();

        this.audio = audio;
        this.renderer = renderer;
    }


    private loadTextFile(path : string, type : string, func : (s : string) => void) : void {
        
        ++ this.totalAssets;

        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("text/" + type);
        xobj.open("GET", path, true);

        xobj.onreadystatechange = () => {

            if (xobj.readyState == 4 ) {

                if(String(xobj.status) == "200") {
                    
                    func(xobj.responseText);
                }
                ++ this.loaded;
            }
                
        };
        xobj.send(null);  
    }


    private loadItems(jsonData : any,
        func : (name : string, path : string, extraParam? : string) => void, 
        basePathName : string, arrayName : string,
        extraParam? : string) : void {
        
        let path : string | undefined = jsonData[basePathName];
        let objects : any | undefined = jsonData[arrayName];
        if (path != undefined && objects != undefined) {
                    
            path = jsonData[basePathName];
            for (let o of objects) {

                func(o["name"], 
                    path + o["path"], 
                    extraParam == undefined ? null : o[extraParam]);
            }
        }
    }


    public loadBitmap(name : string, path : string, linearFilter = true) : void {

        ++ this.totalAssets;

        let image = new Image();
        image.onload = (_ : Event) => {

            ++ this.loaded;
            this.bitmaps.set(name, this.renderer.createBitmap(image, linearFilter));
        }
        image.src = path;
    }


    public loadTilemap(name : string, path : string) : void {

        ++ this.totalAssets;
        
        this.loadTextFile(path, "xml", (str : string) => {

            this.tilemaps.set(name, parseTilemap(str));
            ++ this.loaded;
        });
    }


    public loadSample(name : string, path : string) : void {

        ++ this.totalAssets;

        let xobj = new XMLHttpRequest();
        xobj.open("GET", path, true);
        xobj.responseType = "arraybuffer";

        xobj.onload = () => {

            if (xobj.readyState == 4 ) {
                this.audio.decodeSample(xobj.response, (sample : AudioSample) => {
                    
                    ++ this.loaded;
                    this.samples.set(name, sample);
                });
            }
        }
        xobj.send(null);
    }


    public loadLevelPack(name : string, path : string) : void {

        ++ this.totalAssets;
        
        this.loadTextFile(path, "json", (str : string) => {

            this.levelPacks.set(name, new LevelPack(str));
            ++ this.loaded;
        });
    }


    public addMesh(name : string, mesh : Mesh) : void {

        this.meshes.set(name, mesh);
    }


    public parseIndexFile(path : string) : void {

        this.loadTextFile(path, "json", (s : string) => {

            let data = JSON.parse(s);

            this.loadItems(data, (name : string, path : string, linearFilter : string) => {
                this.loadBitmap(name, path, linearFilter === "true");
            }, "bitmapPath", "bitmaps", "linearFilter");

            this.loadItems(data, (name : string, path : string) => {
                this.loadTilemap(name, path);
            }, "tilemapPath", "tilemaps");

            this.loadItems(data, (name : string, path : string) => {
                this.loadSample(name, path);
            }, "samplePath", "samples");

            this.loadItems(data, (name : string, path : string) => {
                this.loadLevelPack(name, path);
            }, "levelPackPath", "levelPacks");
        });
    }


    public hasLoaded = () : boolean => this.loaded >= this.totalAssets;


    public getBitmap(name : string) : Bitmap | undefined {

        return this.bitmaps.get(name);
    }


    public getSample(name : string) : AudioSample | undefined {

        return this.samples.get(name);
    }


    public getTilemap(name : string) : Tilemap | undefined {

        return this.tilemaps.get(name);
    }


    public getLevelPack(name : string) : LevelPack | undefined {

        return this.levelPacks.get(name);
    }


    public getMesh(name : string) : Mesh | undefined {

        return this.meshes.get(name);
    }


    // In range [0,1], actually...
    public getLoadingPercentage = () : number => this.totalAssets == 0 ? 1.0 : this.loaded / this.totalAssets;

}
