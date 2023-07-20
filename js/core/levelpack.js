import { Tilemap } from "./tilemap.js";
export class LevelPack {
    constructor(content) {
        let jsonData = JSON.parse(content);
        this.tilemaps = new Map();
        let tmap;
        for (let level of jsonData["levels"]) {
            tmap = new Tilemap(Number(level["width"]), Number(level["height"]));
            for (let k in level["layers"]) {
                tmap.addLayer(k, level["layers"][k]);
            }
            this.tilemaps.set(level["name"], tmap);
        }
    }
    getTilemap(name) {
        return this.tilemaps.get(name);
    }
}
