

export class Tilemap {


    private tileLayers : Map<string | null, number[]>;
    private properties : Map<string | null, string | null>;

    public readonly width : number;
    public readonly height : number;


    constructor(xmlString : string) {

        let doc = (new DOMParser()).parseFromString(xmlString, "text/xml");
        let root = doc.getElementsByTagName("map")[0];

        this.width = Number(root.getAttribute("width"));
        this.height = Number(root.getAttribute("height"));

        this.parseLayerData(root);
        this.parseProperties(root);
    }


    private parseLayerData(root : HTMLMapElement) : void {

        this.tileLayers = new Map<string | null, number[]> ();

        let data = root.getElementsByTagName("layer");
        if (data == null) {

            return;
        }

        let content : Array<string> | undefined;
        for (let i = 0; i < data.length; ++ i) {

            content = data[i].getElementsByTagName("data")[0]?.
                childNodes[0]?.
                nodeValue?.
                replace(/(\r\n|\n|\r)/gm, "")?.
                split(",");
            if (content == undefined)
                continue;

            this.tileLayers.set(
                data[i].getAttribute("name"), 
                content.map((v : string) => Number(v)));
        }
    }   


    private parseProperties(root : HTMLMapElement) : void {

        this.properties = new Map<string | null, string | null> ();

        let prop = root.getElementsByTagName("properties")[0];
        let elements : HTMLCollectionOf<Element>;;
        let p : Element;

        if (prop != undefined) {

            elements = prop.getElementsByTagName("property");
            for (let i = 0; i < elements.length; ++ i) {

                p = elements[i];
                if (p.getAttribute("name") != undefined) {

                    this.properties.set(p.getAttribute("name"), p.getAttribute("value"));
                }
            }
        } 
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
