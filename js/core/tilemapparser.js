import { Tilemap } from "./tilemap.js";
const parseLayerData = (tmap, root) => {
    let data = root.getElementsByTagName("layer");
    if (data == null) {
        return;
    }
    let name;
    let content;
    for (let i = 0; i < data.length; ++i) {
        content = data[i].getElementsByTagName("data")[0]?.
            childNodes[0]?.
            nodeValue?.
            replace(/(\r\n|\n|\r)/gm, "")?.
            split(",");
        if (content == undefined)
            continue;
        name = data[i].getAttribute("name") ?? "null";
        tmap.addLayer(name, content.map((v) => Number(v)));
    }
};
const parseProperties = (tmap, root) => {
    let prop = root.getElementsByTagName("properties")[0];
    let elements;
    ;
    let p;
    let name;
    let property;
    if (prop != undefined) {
        elements = prop.getElementsByTagName("property");
        for (let i = 0; i < elements.length; ++i) {
            p = elements[i];
            name = p.getAttribute("name") ?? "null";
            property = p.getAttribute("value") ?? "null;";
            tmap.addProperty(name, property);
        }
    }
};
export const parseTilemap = (content) => {
    let doc = (new DOMParser()).parseFromString(content, "text/xml");
    let root = doc.getElementsByTagName("map")[0];
    let width = Number(root.getAttribute("width"));
    let height = Number(root.getAttribute("height"));
    let tmap = new Tilemap(width, height);
    parseLayerData(tmap, root);
    parseProperties(tmap, root);
    return tmap;
};
