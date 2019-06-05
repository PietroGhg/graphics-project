"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader
// it will receive data from a buffer
in vec3 a_position;
in vec4 inColor;
in vec3 a_normal;
out vec3 normal;
out vec4 varColor;
uniform mat4 mat; // world-view-projection-matrix
uniform mat4 mat_n; // normal arrays

// all shaders have a main function
void main() {

// gl_Position is a special variable a vertex shader
// is responsible for setting

varColor = inColor;

normal = normalize(mat3(mat_n)*a_normal); // to turn normal arrays in the right position

gl_Position = mat * vec4(a_position.xyz, 1); // exact position of the vertex on the screen in the canvas

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
vec3 Ldir = normalize(vec3(0.1,0.7,1.0)); // coordinates of the light
vec4 Lcol = vec4(1.0,1.0,1.0,1.0);
void main() {
vec4 temp = varColor*Lcol*clamp(dot(Ldir,normal),0.0,1.0); // calculates the amount of light of the pixel
outColor = vec4(temp.xyz, 1.0);

}
`;


function createShader(gl, type, source){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success){
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
    gl.deleteShader(shader);
    return undefined;
}

function createProgram(gl, vertexShader, fragmentShader){
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success){
        return program;
    }

    console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
    gl.deleteProgram(program);
    return undefined;
}

function setVao(gl, vectors, program, vao){ // vao is the container of buffers for a single object
    var vertices = vectors[0];
    var indices = vectors[1];
    var colors = vectors[2];
    var normals = vectors[3];

    // turn on vao
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
    // Bind the attribute/buffer set we want
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    var matLocation = gl.getUniformLocation(program, "mat");
    gl.uniformMatrix4fv(matLocation, true, mat);

    var mat_nLocation = gl.getUniformLocation(program, "mat_n");
    gl.uniformMatrix4fv(mat_nLocation, true, mat_n);

    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
}

class Drawable{

    constructor(gl, vao, program, proj, world, count, obj){
        this.gl = gl;
        this.vao = vao;
        this.program = program;
        this.proj = proj;
        this.world = world;
        this.count = count;
        this.obj = obj;
    }

    draw(view){
        var temp_world = utils.multiplyMatrices(utils.MakeTranslateMatrix(this.obj.x, 0, this.obj.y), this.world);
        var gl = this.gl;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        var mat = utils.multiplyMatrices(this.proj, utils.multiplyMatrices(view, temp_world));
        var mat_n = utils.transposeMatrix( utils.invertMatrix(temp_world));

        var matLocation = gl.getUniformLocation(this.program, "mat");
        gl.uniformMatrix4fv(matLocation, true, mat);

        var mat_nLocation = gl.getUniformLocation(this.program, "mat_n");
        gl.uniformMatrix4fv(mat_nLocation, true, mat_n);

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

}

function clear(gl){
    gl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
}

function initGraphics(game){
    var canvas = document.getElementById("c");

    // Get A WebGL context
    var gl = canvas.getContext("webgl2");

    if (!gl) {
        return;
    }

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl, vertexShader, fragmentShader);

    var vao_p1 = gl.createVertexArray();
    var count = setVao(gl, paddle([1.0,0.0,0.0,1.0]), program, vao_p1);
    var world_xwing = utils.multiplyMatrices(utils.MakeRotateYMatrix(90),utils.MakeScaleMatrix(10));
    var world_p1 = utils.multiplyMatrices(utils.MakeTranslateMatrix(155,0,10), utils.MakeScaleMatrix(220));

    var vao_p2 = gl.createVertexArray();
    var count2 = setVao(gl, paddle([0.0,1.0,0.0,1.0]), program, vao_p2);
    var world_p2 = utils.multiplyMatrices(utils.MakeTranslateMatrix(155,0,5), utils.MakeScaleMatrix(220));

    var vao_p3 = gl.createVertexArray();
    var count3 = setVao(gl, createCil(5,game.disk.radius,[0.0,0.0,0.0,1.0]), program, vao_p3);

    var vao_t = gl.createVertexArray();
    var count_t = setVao(gl, table(), program, vao_t);
    var scaleY = 150;
    var scaleX = 100;
    var scaleZ = 10;
    //var world_t = utils.MakeScaleNuMatrix(scaleX, scaleY, 1);
    //var world_t = utils.multiplyMatrices(utils.MakeTranslateMatrix(0,-20,0), utils.MakeScaleNuMatrix(scaleX,10,scaleY));
    var world_t = utils.multiplyMatrices(utils.MakeRotateYMatrix(90), utils.MakeScaleNuMatrix(180, 200, 240));

    var proj = utils.MakePerspective(90, (canvas.width/2)/canvas.height, 0.1, 1000);
    var view1 = utils.MakeLookAt([0,300,200],[0,0,0],[0,1,0]);
    var view2 = utils.MakeLookAt([0,300,-200],[0,0,0],[0,1,0]);

    clear(gl);
    var d1 = new Drawable(gl, vao_p1, program, proj, world_p1, count, game.p1);
    var d2 = new Drawable(gl, vao_p2, program, proj, world_p2, count2, game.p2);
    var d3 = new Drawable(gl, vao_p3, program, proj, utils.identityMatrix(), count3, game.disk);
    var d4 = new Drawable(gl, vao_t, program, proj, world_t, count_t, game.table);
    var todraw = [d1,d2,d3,d4];
    drawScene(gl, todraw, 0, view1);
    drawScene(gl, todraw, gl.canvas.width/2, view2);
    var views = [view1, view2];

    return [gl, todraw, views];
}

function drawScene(gl, todraw, x, view){
    gl.viewport(x, 0, gl.canvas.width/2, gl.canvas.height);

    todraw.forEach(
        function(td){
            td.draw(view);
        });
}

function animate(gl, todraw, views){
    var view1 = views[0];
    var view2 = views[1];

    game.checkAndStep();

    clear(gl);
    drawScene(gl, todraw, 0, view1);
    drawScene(gl, todraw, gl.canvas.width/2, view2);

    window.requestAnimationFrame(function(){ animate(gl, todraw, views);});
}



var game = new Game();
var gl;
var todraw;
var views;

[gl, todraw, views] = initGraphics(game);
animate(gl, todraw, views);



