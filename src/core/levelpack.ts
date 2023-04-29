import { Tilemap } from "./tilemap.js";


export class LevelPack {


    private tilemaps : Map<string, Tilemap>;


    constructor(content : string) {

        let jsonData = JSON.parse(content);

        this.tilemaps = new Map<string, Tilemap> ();
        let tmap : Tilemap;

        for (let level of jsonData["levels"]) {

            tmap = new Tilemap(Number(level["width"]), Number(level["height"]));
            for (let k in level["layers"]) {

                tmap.addLayer(k, level["layers"][k]);
            }

            this.tilemaps.set(level["name"], tmap);
        }
    }


    public getTilemap(name : string) : Tilemap | undefined {

        return this.tilemaps.get(name);
    }
}
