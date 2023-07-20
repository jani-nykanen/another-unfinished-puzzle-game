export class Tilemap {
    constructor(width, height) {
        this.getIndexedTile = (layerName, i, def = -1) => this.getTile(layerName, i % this.width, (i / this.width) | 0, def);
        this.width = width;
        this.height = height;
        this.tileLayers = new Map();
        this.properties = new Map();
    }
    addLayer(name, tileData) {
        this.tileLayers.set(name, Array.from(tileData));
    }
    addProperty(name, property) {
        this.properties.set(name, property);
    }
    getTile(layerName, x, y, def = -1) {
        let layer = this.tileLayers.get(layerName);
        if (layer == undefined ||
            x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;
        return layer[y * this.width + x];
    }
    cloneLayer(layerName) {
        let layer = this.tileLayers.get(layerName);
        if (layer == undefined)
            return undefined;
        return Array.from(layer);
    }
    getProperty(name) {
        for (let [key, value] of this.properties) {
            if (key == name)
                return value;
        }
        return null;
    }
}
