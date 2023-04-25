


export class Inventory {


    private keys : number = 0;
    private torches : number = 0;


    public get keyCount() : number {

        return this.keys;
    }


    public get torchCount() : number {

        return this.torches;
    }


    constructor() {}


    public addKey() : void {

        ++ this.keys;
    }


    public addTorch() : void {

        ++ this.torches;
    }


    public clear() : void {

        this.keys = 0;
        this.torches = 0;
    }


    public copyDataFrom(inv : Inventory) : void {

        this.keys = inv.keyCount;
        this.torches = inv.torchCount;
    }
}
