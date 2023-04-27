


export class ExistingObject {


    protected exist : boolean;


    public doesExist = () : boolean => this.exist;


    public kill() : void {

        this.exist = false;
    }


    public makeExist(): void {

        this.exist = true;
    }
}


export function nextObject<T extends ExistingObject>(arr : Array<T>, type : Function) : T {

    for (let o of arr) {

        if (!o.doesExist()) {

            return o;
        }
    }

    let o = new type.prototype.constructor;
    arr.push(o);

    return o;
}
