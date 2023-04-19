import { Matrix3 } from "../vector/matrix.js";


const UNIFORM_NAMES = [

    "transform",
    "pos",
    "scale",
    "texPos",
    "texScale",
    "color",
    "texSampler"
];


export class Shader {


    private uniforms : Map<string, WebGLUniformLocation | null>;
    private program : WebGLShader;

    private readonly gl : WebGLRenderingContext;


    constructor(gl : WebGLRenderingContext, vertexSource : string, fragmentSource : string) {

        this.gl = gl;

        this.uniforms = new  Map<string, WebGLUniformLocation | null> ();
        this.program = this.buildShader(vertexSource, fragmentSource);

        this.getUniformLocations();
    }
    

    private createShader(src : string, type : number) : WebGLShader {

        let gl = this.gl
    
        let shader = gl.createShader(type) as WebGLShader;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
    
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    
            throw "Shader error:\n" + 
                gl.getShaderInfoLog(shader);
                
        }
        return shader;
    }


    private buildShader(vertexSource : string, fragmentSource : string) : WebGLShader {

        let gl = this.gl;
    
        let vertex = this.createShader(vertexSource, gl.VERTEX_SHADER);
        let frag = this.createShader(fragmentSource, gl.FRAGMENT_SHADER);
    
        let program = gl.createProgram() as WebGLProgram;
        gl.attachShader(program, vertex);
        gl.attachShader(program, frag);
    
        this.bindLocations(program);

        gl.linkProgram(program);
    
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    
            throw "Shader error: " + gl.getProgramInfoLog(program);
        }
        return program;
    }

    
    private bindLocations(program : WebGLShader) : void {

        let gl = this.gl;

        gl.bindAttribLocation(program, 0, "vertexPos");
        gl.bindAttribLocation(program, 1, "vertexUV");
        gl.bindAttribLocation(program, 2, "vertexColor");
    }


    private getUniformLocations() : void {

        for (let s of UNIFORM_NAMES) {  

            this.uniforms[s] = this.gl.getUniformLocation(this.program, s);
        }
    }


    public use() : void {

        let gl = this.gl;
    
        gl.useProgram(this.program);
        this.getUniformLocations();

        gl.uniform1i(this.uniforms["texSampler"], 0);

        this.setVertexTransform(0, 0, 1, 1);
        this.setFragTransform(0, 0, 1, 1);
        this.setTransformMatrix(Matrix3.identity());
        this.setColor(1, 1, 1, 1);
    }


    public setVertexTransform(x : number, y : number, w : number, h : number) : void {

        let gl = this.gl;

        gl.uniform2f(this.uniforms["pos"], x, y);
        gl.uniform2f(this.uniforms["scale"], w, h);
    }


    public setFragTransform(x : number, y : number, w : number, h : number) : void {

        let gl = this.gl;

        gl.uniform2f(this.uniforms["texPos"], x, y);
        gl.uniform2f(this.uniforms["texScale"], w, h);
    }


    public setColor(r = 1, g = 1, b = 1, a = 1) : void {

        let gl = this.gl;
        gl.uniform4f(this.uniforms["color"], r, g, b, a);
    }


    public setTransformMatrix(matrix : Matrix3) : void {

        matrix.passToShader(this.gl, this.uniforms["transform"]);
    }

}
