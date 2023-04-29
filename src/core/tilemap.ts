

export class Tilemap {


    private tileLayers : Map<string, number[]>;
    private properties : Map<string, string>;

    public readonly width : number;
    public readonly height : number;


    constructor(width : number, height : number) {

        this.width = width;
        this.height = height;

        this.tileLayers = new Map<string, number[]> ();
        this.properties = new Map<string, string> ();
    }


    public addLayer(name : string, tileData : number[]) : void {

        this.tileLayers.set(name, Array.from(tileData));
    }


    public addProperty(name : string, property : string) : void {

        this.properties.set(name, property);
    }


    public getTile(layerName : string, x : number, y : number, def = -1) : number {

        let layer = this.tileLayers.get(layerName);
        if (layer == undefined || 
            x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return layer[y * this.width + x];
    }


    public getIndexedTile = (
        layerName : string, 
        i : number, def = -1) => this.getTile(
            layerName, i % this.width, (i / this.width) | 0, def
        );


    public cloneLayer(layerName : string) : Array<number> | undefined {

        let layer = this.tileLayers.get(layerName);
        if (layer == undefined)
            return undefined;

        return Array.from(layer);
    }


    public getProperty(name : string) : string | null {

        for (let [key, value] of this.properties) {

            if (key == name)
                return value;
        }
        return null;
    }
}
