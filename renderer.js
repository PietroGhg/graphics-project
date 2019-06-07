"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader
// it will receive data from a buffer
in vec3 a_position;

in vec3 a_normal;
out vec3 normal;

out vec4 cameraCoord;

in vec2 a_texCoord;
out vec2 v_texCoord;

uniform mat4 mat; // world-view-projection-matrix
uniform mat4 matWV; // world-view-matrix
uniform mat4 mat_n; // normal arrays

// all shaders have a main function
void main() {

// gl_Position is a special variable a vertex shader
// is responsible for setting

v_texCoord = a_texCoord;

normal = normalize(mat3(mat_n)*a_normal); // to turn normal arrays in the right position

gl_Position = mat * vec4(a_position.xyz, 1); // exact position of the vertex on the screen in the canvas

cameraCoord = matWV * vec4(a_position.xyz, 1); // camera coordinates

}
`;

var fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// we need to declare an output for the fragment shader
out vec4 outColor;
in vec2 v_texCoord;
in vec4 cameraCoord;

uniform sampler2D u_image;

in vec3 normal;
vec3 Ldir = normalize(vec3(0.1,0.7,1.0)); // coordinates of the light

vec4 Lcol = vec4(1.0,1.0,1.0,1.0);
void main() {

vec4 f_diffuse = texture(u_image, v_texCoord)*Lcol*clamp(dot(Ldir,normal),0.0,1.0); // calculates the f_diffuse

float cross_prod = dot(Ldir, normal);
vec3 n_prime = normal*cross_prod;
vec3 r = 2.0*n_prime - Ldir;
vec4 f_specular = texture(u_image, v_texCoord)*Lcol*clamp(dot(Ldir,r),0.0,1.0); // calculates the f_specular

outColor = vec4(f_diffuse.xyz + f_specular.xyz, 1.0);

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

//function that initializes the vertex array object given an image for texture
//returns the number of elements to be drawn for the object
function setVaoFromImage(gl, vectors, program, image, tex_id, vao){ // vao is the container of buffers for a single object
    var vertices = vectors[0];
    var indices = vectors[1];
    var normals = vectors[3];
    var texCoord = vectors[4];

    // turn on vao
    gl.bindVertexArray(vao);


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

    var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(
        texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();


    //activates and binds the right texture 
    gl.activeTexture(gl.TEXTURE0 + tex_id);
    gl.bindTexture(gl.TEXTURE_2D, texture);


    // Fill the texture with a 1x1 blue pixel until the image is loaded
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));

    //when the image is loaded, put its data inside the texture
    image.addEventListener('load', function() { setStuff(gl, vao, texture, image,tex_id); });


    // Set the parameters so we don't need mips and so we're not filtering
    // and we don't repeat
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    return indices.length;
}

//function that initializes the vertex array object given a color for texture
//returns the number of elements to be drawn for the object
function setVaoFromColor(gl, vectors, program, color, tex_id, vao){ // vao is the container of buffers for a single object
    var vertices = vectors[0];
    var indices = vectors[1];
    var colors = vectors[2];
    var normals = vectors[3];
    var texCoord = vectors[4];

    // turn on vao
    gl.bindVertexArray(vao);


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

    var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(
        texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();


    //activates and binds the right tex
    gl.activeTexture(gl.TEXTURE0 + tex_id);
    gl.bindTexture(gl.TEXTURE_2D, texture);


    // Fill the texture with the given color
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));


    // Set the parameters so we don't need mips and so we're not filtering
    // and we don't repeat
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    return indices.length;
}

//function called when an image is loaded, inserts the image's data in the proper texture
function setStuff(gl, vao, texture, image, tex_id){
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0 + tex_id);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D); 
}

class Drawable{

    constructor(gl, vao, program, proj, world, count, obj, tex_id){
        this.gl = gl;
        this.vao = vao;
        this.program = program;
        this.proj = proj;
        this.world = world;
        this.count = count;
        this.obj = obj;
        this.tex_id = tex_id;
    }

    draw(view){
        var temp_world = utils.multiplyMatrices(utils.MakeTranslateMatrix(this.obj.x, 0, this.obj.y), this.world);
        var gl = this.gl;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        var mat = utils.multiplyMatrices(this.proj, utils.multiplyMatrices(view, temp_world));
        var matWV = utils.multiplyMatrices(view, temp_world);
        var mat_n = utils.transposeMatrix( utils.invertMatrix(temp_world));

        // associates world-view-projection matrix with shader
        var matLocation = gl.getUniformLocation(this.program, "mat");
        gl.uniformMatrix4fv(matLocation, true, mat);

        // associates world-view matrix with shader
        var matVMlocation = gl.getUniformLocation(this.program, "matWV");
        gl.uniformMatrix4fv(matVMlocation, true, matWV);

        var imageLocation = gl.getUniformLocation(this.program, "u_image");
        gl.uniform1i(imageLocation, this.tex_id);

        // associates normal arrays with shader
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

//initializes the VAOs for the objects to be drawn and the views and projections
//returns the webgl context and an array of drawable objects
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
    var count = setVaoFromColor(gl, paddle(), program, [255,0,0,255], 0, vao_p1);
    var world_p1 = utils.multiplyMatrices(utils.MakeTranslateMatrix(155,0,10), utils.MakeScaleMatrix(220));

    var vao_p2 = gl.createVertexArray();
    var count2 = setVaoFromColor(gl, paddle(), program, [0,255,0,255], 1, vao_p2);
    var world_p2 = utils.multiplyMatrices(utils.MakeTranslateMatrix(155,0,5), utils.MakeScaleMatrix(220));

    var vao_p3 = gl.createVertexArray();
    var count3 = setVaoFromColor(gl, createCil(5,game.disk.radius,[0.0,0.0,0.0,1.0]), program, [0,0,0,255], 2, vao_p3);

    var vao_t = gl.createVertexArray();
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "table.png";
    var count_t = setVaoFromImage(gl, table(), program, img, 3, vao_t);
    var world_t = utils.multiplyMatrices(utils.MakeRotateYMatrix(90), utils.MakeScaleNuMatrix(180, 200, 240));

    var proj = utils.MakePerspective(90, (canvas.width/2)/canvas.height, 0.1, 1000);
    var view1 = utils.MakeLookAt([0,300,200],[0,0,0],[0,1,0]);
    var view2 = utils.MakeLookAt([0,300,-200],[0,0,0],[0,1,0]);

    clear(gl);
    var d1 = new Drawable(gl, vao_p1, program, proj, world_p1, count, game.p1,0);
    var d2 = new Drawable(gl, vao_p2, program, proj, world_p2, count2, game.p2,1);
    var d3 = new Drawable(gl, vao_p3, program, proj, utils.identityMatrix(), count3, game.disk,2);
    var d4 = new Drawable(gl, vao_t, program, proj, world_t, count_t, game.table,3);
    var todraw = [d1,d2,d3,d4];
    drawScene(gl, todraw, 0, view1);
    drawScene(gl, todraw, gl.canvas.width/2, view2);
    var views = [view1, view2];

    return [gl, todraw, views];
}

//renders the scene for one player, setting the viewport
//and drawing the objects with the given view matrix
function drawScene(gl, todraw, x, view){
    gl.viewport(x, 0, gl.canvas.width/2, gl.canvas.height);

    todraw.forEach(
        function(td){
            td.draw(view);
        });
}

//animates the scene by making every object of the game step
//and calling drawScene() twice, once for each player
function animate(gl, todraw, views){
    var view1 = views[0];
    var view2 = views[1];

    game.checkAndStep();

    clear(gl);
    drawScene(gl, todraw, 0, view1);
    drawScene(gl, todraw, gl.canvas.width/2, view2);

    window.requestAnimationFrame(function(){ animate(gl, todraw, views);});
}


//main
var game = new Game();
var gl; //webgl context
var todraw; //array of objects to be drawn
var views; //view matricies for the two players

[gl, todraw, views] = initGraphics(game); //initializes the buffers ecc
animate(gl, todraw, views); //animates the game and draws the scenes