"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec3 a_position;
in vec4 inColor;
in vec3 a_normal;
out vec3 normal;
out vec4 varColor;
uniform mat4 mat; //world-view-projection-matrix
uniform mat4 mat_n; //normal arrays

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  
  varColor = inColor;

  normal = mat3(mat_n)*a_normal; //to turn normal arrays in the right position

  gl_Position = mat * vec4(a_position.xyz, 1); //exact position of the vertex on the screen in the canvas

}
`;

var fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// we need to declare an output for the fragment shader
out vec4 outColor;
in vec4 varColor;

in vec3 normal;
vec3 Ldir = normalize(vec3(0.1,0.3,1.0)); //coordinates of the light
void main() {
  vec4 temp = varColor*clamp(dot(Ldir,normal),0.0,1.0); //calculates the amount of light of the pixel
  outColor = vec4(temp.xyz, 1.0);

}
`;


function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
    gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  
  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}

function setVao(gl, vectors, program, vao){ //vao is the container of buffers for a single object
    var vertices = vectors[0];
    var indices = vectors[1];
    var colors = vectors[2];
    var normals = vectors[3];

    //turn on vao
    gl.bindVertexArray(vao);

     var colorLocation = gl.getAttribLocation(program, "inColor");
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0,0);
    
    var vertexBuffer = gl.createBuffer();
    var vertexLocation = gl.getAttribLocation(program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(vertexLocation);
    gl.vertexAttribPointer(vertexLocation, 3, gl.FLOAT, false, 0,0);


    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    indices = new Uint16Array(indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


    var normalsBuffer = gl.createBuffer();
    var normalLocation = gl.getAttribLocation(program, "a_normal");
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0,0);

    return indices.length;
}

function drawVao(gl, vao, program, mat, mat_n, count){
    	// Bind the attribute/buffer set we want.
	gl.useProgram(program);
	gl.bindVertexArray(vao);

	var matLocation = gl.getUniformLocation(program, "mat"); 
    gl.uniformMatrix4fv(matLocation, true, mat);

    var mat_nLocation = gl.getUniformLocation(program, "mat_n");
    gl.uniformMatrix4fv(mat_nLocation, true, mat_n);
    

        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
}

class Drawable{
    constructor(gl, vao, program, proj, view, world, count, obj){
	this.gl = gl;
	this.vao = vao;
	this.program = program;
	this.proj = proj;
	this.view = view;
	this.world = world;
	this.count = count;
	this.obj = obj;
    }

    draw(){
	this.world = utils.multiplyMatrices(utils.MakeTranslateMatrix(this.obj.x, 0, this.obj.y), utils.identityMatrix()); 
	var gl = this.gl;
	gl.useProgram(this.program);
	gl.bindVertexArray(this.vao);
	
	var mat = utils.multiplyMatrices(this.proj, utils.multiplyMatrices(this.view, this.world));
	var mat_n = utils.transposeMatrix( utils.invertMatrix(this.world));
	
	var matLocation = gl.getUniformLocation(this.program, "mat");
	gl.uniformMatrix4fv(matLocation, true, mat);
	
	var mat_nLocation = gl.getUniformLocation(this.program, "mat_n");
	gl.uniformMatrix4fv(mat_nLocation, true, mat_n);
	console.log(this.world); 

	gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
	
}

function clear(gl){
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
	gl.clearDepth(1.0);                 // Clear everything
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);           // Enable depth testing
	gl.depthFunc(gl.LEQUAL); // Near things obscure far things
}

function initGraphics(game){
      // Get A WebGL context

    var canvas = document.getElementById("c");

    var gl = canvas.getContext("webgl2");

    if (!gl) {
	return;
    }


    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl, vertexShader, fragmentShader);

    var vao_p1 = gl.createVertexArray();
    var count = setVao(gl, createCil(1,game.p1.radius,[1.0,0.0,0.0,1.0]), program, vao_p1);

    var vao_p2 = gl.createVertexArray();
    var count2 = setVao(gl, createCil(1,game.p2.radius,[0.0,1.0,0.0,1.0]), program, vao_p2);

    var vao_p3 = gl.createVertexArray();
    var count3 = setVao(gl, createCil(0.5, game.disk.radius, [0.0,0.0,0.0,1.0]), program, vao_p3);

    var world = utils.identityMatrix();
    var proj = utils.MakePerspective(90, canvas.width/canvas.height, 0.1, 1000);
    var view = utils.MakeLookAt([0,30,20],[0,0,0],[0,1,0]);

    clear(gl);
    var d1 = new Drawable(gl, vao_p1, program, proj, view, world, count, game.p1);
    var d2 = new Drawable(gl, vao_p2, program, proj, view, world, count2, game.p2);
    var d3 = new Drawable(gl, vao_p3, program, proj, view, world, count3, game.disk);
    d1.draw();
    d2.draw();
    d3.draw();

    return [gl, [d1,d2,d3]];

    
}

var game = new Game();
var gl;
var todraw;
[gl, todraw] = initGraphics(game);

window.addEventListener("keydown", action, false);

function action(e){
    if(e.keyCode == 32){
	game.disk.x = game.disk.x + game.disk.dx;
	game.disk.y = game.disk.y + game.disk.dy;
	console.log("disk " + game.disk.x + " " + game.disk.y);
	console.log("p1 " + game.p1.x + " " + game.p1.y);
	console.log("p2 " + game.p2.x + " " + game.p2.y);

	game.obstacles.forEach(
	    function(b){
		b.check(game.disk);
	    });

	clear(gl);
	todraw.forEach(
	    function(td){
		td.draw();
	    });
    }
} 

