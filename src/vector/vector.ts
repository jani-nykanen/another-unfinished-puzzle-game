

export class Vector2 {


    public x : number;
    public y : number


	constructor(x = 0.0, y = 0.0) {
		
		this.x = x;
        this.y = y;
	}

	
	public get length() : number {

		return Math.hypot(this.x, this.y);
	}
	
	
	public normalize(forceUnit = false) : Vector2 {
		
		const EPS = 0.0001;
		
		let l = this.length;
		if (l < EPS) {
			
			this.x = forceUnit ? 1 : 0;
            this.y = 0;

			return this.clone();
		}
		
		this.x /= l;
		this.y /= l;
		
		return this.clone();
	}
	
	
	public clone = () : Vector2 => new Vector2(this.x, this.y);


	public zeros() : void {

        this.x = 0;
        this.y = 0;
	}


	public scalarMultiply(s : number) : void {

		this.x *= s;
		this.y *= s;
	}


	static dot = (u : Vector2, v : Vector2) : number => u.x*v.x + u.y*v.y;
	

	static normalize = (v : Vector2, forceUnit = false) : Vector2 => v.clone().normalize(forceUnit);
	

	static scalarMultiply = (v : Vector2, s : number) : Vector2 => new Vector2(v.x * s, v.y * s);
	

	static distance = (a : Vector2, b : Vector2) : number => Math.hypot(a.x - b.x, a.y - b.y);


	static direction = (a : Vector2, b : Vector2) : Vector2 => (new Vector2(b.x - a.x, b.y - a.y)).normalize(true);
	

	static add = (a : Vector2, b : Vector2) : Vector2 => new Vector2(a.x + b.x, a.y + b.y);


	static subtract = (a : Vector2, b : Vector2) : Vector2 => new Vector2(a.x - b.x, a.y - b.y);


	static cap(v : Vector2, r : number, eps = 0.0001) : Vector2 {

		let out = v.clone();

		if (out.length >= r - eps) {

			out.normalize();

			out.x *= r;
			out.y *= r;
		}
		return out;
	}


	static project = (u : Vector2, v : Vector2) : Vector2 => Vector2.scalarMultiply(v, Vector2.dot(u, v));


	static lerp = (a : Vector2, b : Vector2, t : number) : Vector2 => new Vector2((1-t) * a.x + t * b.x, (1-t) * a.y + t * b.y);


	static max = (v : Vector2) : number => Math.max(v.x, v.y);

    
    public swap = () : Vector2 => new Vector2(this.y, this.x);


	public equals = (v : Vector2, eps = 0.001) : boolean => (Math.abs(v.x - this.x) + Math.abs(v.y - this.y)) < eps*2;
	

	static mean(vectors : Array<Vector2>) : Vector2 {

		let out = new Vector2();

		for (let v of vectors) {

			out.x += v.x;
			out.y += v.y;
		}

		out.x /= vectors.length;
		out.y /= vectors.length;

		return out;
	}


	// Same as normalize, but without side effects
	static unit(v : Vector2, forceUnit = false) : Vector2 {

		const EPS = 0.0001;

		let u = v.clone();

		let l = u.length;
		if (l < EPS) {
			
			u.x = forceUnit ? 1 : 0;
            u.y = 0;

			return u;
		}
		
		u.x /= l;
		u.y /= l;
		
		return u;
	}

}
