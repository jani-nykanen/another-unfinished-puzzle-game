import { clamp } from "../math/utility.js";


export class RGBA {

	
	public r : number;
	public g : number;
	public b : number;
	public a : number;


	constructor(r = 1, g = r, b = g, a = 1) {

		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}


    public clone = () : RGBA => new RGBA(this.r, this.g, this.b, this.a);


	static scalarMultiply = (color : RGBA, scalar : number) : RGBA => 
		new RGBA(
			clamp(color.r * scalar, 0.0, 1.0), 
			clamp(color.g * scalar, 0.0, 1.0),  
			clamp(color.b * scalar, 0.0, 1.0),  
			color.a);


	static add = (color1 : RGBA, color2 : RGBA) : RGBA => 
		new RGBA(
			clamp(color1.r + color2.g, 0.0, 1.0), 
			clamp(color1.g + color2.g, 0.0, 1.0),  
			clamp(color1.b + color2.b, 0.0, 1.0),  
			clamp(color1.a + color2.a, 0.0, 1.0));


	static addConstantRGB = (color : RGBA, value : number) : RGBA => 
		new RGBA(
			clamp(color.r + value, 0.0, 1.0), 
			clamp(color.g + value, 0.0, 1.0),  
			clamp(color.b + value, 0.0, 1.0),  
			clamp(color.a, 0.0, 1.0));


	static get white() : RGBA { 
		
		return new RGBA(1.0, 1.0, 1.0, 1.0);
	}

    static get black() : RGBA {
		
		return new RGBA(0.0, 0.0, 0.0, 1.0);
	}

}
