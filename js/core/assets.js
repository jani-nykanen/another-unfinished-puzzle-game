import { parseTilemap } from "./tilemapparser.js";
import { LevelPack } from "./levelpack.js";
export class Assets {
    constructor(audio, renderer) {
        this.loaded = 0;
        this.totalAssets = 0;
        this.hasLoaded = () => this.loaded >= this.totalAssets;
        // In range [0,1], actually...
        this.getLoadingPercentage = () => this.totalAssets == 0 ? 1.0 : this.loaded / this.totalAssets;
        this.bitmaps = new Map();
        this.samples = new Map();
        this.tilemaps = new Map();
        this.levelPacks = new Map();
        this.meshes = new Map();
        this.audio = audio;
        this.renderer = renderer;
    }
    loadTextFile(path, type, func) {
        ++this.totalAssets;
        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("text/" + type);
        xobj.open("GET", path, true);
        xobj.onreadystatechange = () => {
            if (xobj.readyState == 4) {
                if (String(xobj.status) == "200") {
                    func(xobj.responseText);
                }
                ++this.loaded;
            }
        };
        xobj.send(null);
    }
    loadItems(jsonData, func, basePathName, arrayName, extraParam) {
        let path = jsonData[basePathName];
        let objects = jsonData[arrayName];
        if (path != undefined && objects != undefined) {
            path = jsonData[basePathName];
            for (let o of objects) {
                func(o["name"], path + o["path"], extraParam == undefined ? null : o[extraParam]);
            }
        }
    }
    loadBitmap(name, path, linearFilter = true) {
        ++this.totalAssets;
        let image = new Image();
        image.onload = (_) => {
            ++this.loaded;
            this.bitmaps.set(name, this.renderer.createBitmap(image, linearFilter));
        };
        image.src = path;
    }
    loadTilemap(name, path) {
        ++this.totalAssets;
        this.loadTextFile(path, "xml", (str) => {
            this.tilemaps.set(name, parseTilemap(str));
            ++this.loaded;
        });
    }
    loadSample(name, path) {
        ++this.totalAssets;
        let xobj = new XMLHttpRequest();
        xobj.open("GET", path, true);
        xobj.responseType = "arraybuffer";
        xobj.onload = () => {
            if (xobj.readyState == 4) {
                this.audio.decodeSample(xobj.response, (sample) => {
                    ++this.loaded;
                    this.samples.set(name, sample);
                });
            }
        };
        xobj.send(null);
    }
    loadLevelPack(name, path) {
        ++this.totalAssets;
        this.loadTextFile(path, "json", (str) => {
            this.levelPacks.set(name, new LevelPack(str));
            ++this.loaded;
        });
    }
    addMesh(name, mesh) {
        this.meshes.set(name, mesh);
    }
    parseIndexFile(path) {
        this.loadTextFile(path, "json", (s) => {
            let data = JSON.parse(s);
            this.loadItems(data, (name, path, linearFilter) => {
                this.loadBitmap(name, path, linearFilter === "true");
            }, "bitmapPath", "bitmaps", "linearFilter");
            this.loadItems(data, (name, path) => {
                this.loadTilemap(name, path);
            }, "tilemapPath", "tilemaps");
            this.loadItems(data, (name, path) => {
                this.loadSample(name, path);
            }, "samplePath", "samples");
            this.loadItems(data, (name, path) => {
                this.loadLevelPack(name, path);
            }, "levelPackPath", "levelPacks");
        });
    }
    getBitmap(name) {
        return this.bitmaps.get(name);
    }
    getSample(name) {
        return this.samples.get(name);
    }
    getTilemap(name) {
        return this.tilemaps.get(name);
    }
    getLevelPack(name) {
        return this.levelPacks.get(name);
    }
    getMesh(name) {
        return this.meshes.get(name);
    }
}
