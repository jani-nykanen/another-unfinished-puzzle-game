export class Inventory {
    get keyCount() {
        return this.keys;
    }
    get torchCount() {
        return this.torches;
    }
    constructor() {
        this.keys = 0;
        this.torches = 0;
    }
    addKey() {
        ++this.keys;
    }
    addTorch() {
        ++this.torches;
    }
    useKey() {
        this.keys = Math.max(0, this.keys - 1);
    }
    useTorch() {
        this.torches = Math.max(0, this.torches - 1);
    }
    clear() {
        this.keys = 0;
        this.torches = 0;
    }
    copyDataFrom(inv) {
        this.keys = inv.keyCount;
        this.torches = inv.torchCount;
    }
}
