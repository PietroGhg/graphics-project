"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader
// it will receive data from a buffer
in vec3 a_position;

in vec3 a_normal;

out vec3 cameraCoord;
out vec3 cameraNormal;

in vec2 a_texCoord;
out vec2 v_texCoord;

uniform mat4 mat; // world-view-projection matrix
uniform mat4 matWV; // world-view matrix
uniform mat4 mat_n; // normal arrays
uniform mat4 mat_nWV; // world-view normal arrays


// all shaders have a main function
void main() {

// gl_Position is a special variable a vertex shader
// is responsible for setting

v_texCoord = a_texCoord;

gl_Position = mat * vec4(a_position.xyz, 1); // exact position of the vertex on the screen in the canvas

cameraCoord = (matWV * vec4(a_position.xyz, 1)).xyz; // camera coordinates of object

cameraNormal = mat3(mat_nWV) * a_normal; // camera coordinates of normal arrays

}
`;

var fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// we need to declare an output for the fragment shader
out vec4 outColor;
in vec2 v_texCoord;

in vec3 cameraCoord;

in vec3 cameraNormal;

uniform sampler2D u_image;
uniform mat4 view;

void main() {
vec3 cm = normalize(cameraNormal);
vec4 color = texture(u_image, v_texCoord);


// point lights
vec4 Lps = vec4(0.7,0.7,0.7,1.0); //specular light color
vec3 eyeDir = normalize(0.0 - cameraCoord);
float g = 70.0; //target distance for decay
float beta = 0.6; //decay factor

vec3 Lpoint = (view*vec4(0.0,300.0,100.0,1.0)).xyz; // position of point light
vec3 Lpoint_dir = normalize(Lpoint - cameraCoord); // computes light direction
float decay = pow(g / length(Lpoint - cameraCoord), beta);
vec4 point_diff = color*clamp(dot(Lpoint_dir, cm),0.0,1.0);
vec3 h_point = normalize(Lpoint_dir + eyeDir);
vec4 point_spec = Lps*pow(clamp(dot(cm,h_point),0.0,1.0),128.0);
vec4 l1 = vec4(decay*(point_diff.xyz + point_spec.xyz),1.0);

Lpoint = (view*vec4(0.0,300.0,-100.0,1.0)).xyz;
Lpoint_dir = normalize(Lpoint - cameraCoord);
decay = pow(g / length(Lpoint - cameraCoord), beta);
point_diff = color*clamp(dot(Lpoint_dir, cm),0.0,1.0);
h_point = normalize(Lpoint_dir + eyeDir);
point_spec = Lps*pow(clamp(dot(cm,h_point),0.0,1.0),128.0);
vec4 l2 = vec4(decay*(point_diff.xyz + point_spec.xyz),1.0);

//directional light
vec3 Ldir = normalize(mat3(view)*normalize(vec3(0.0,1.0,0.0)));
float n = 0.1;
vec4 Lcol = vec4(n,n,n,1.0);
vec4 f_diff = color*Lcol*clamp(dot(Ldir,cm),0.0,1.0);
vec4 l3 = vec4(f_diff.xyz, 1);


outColor =  l1 + l2 + l3;


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
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();

    // activates and binds the right texture 
    gl.activeTexture(gl.TEXTURE0 + tex_id);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Fill the texture with a 1x1 blue pixel until the image is loaded
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

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
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();

    //activates and binds the right tex
    gl.activeTexture(gl.TEXTURE0 + tex_id);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Fill the texture with the given color
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));

    // Set the parameters so we don't need mips and so we're not filtering and we don't repeat
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
        if(this.obj.vis){
            var temp_world = utils.multiplyMatrices(utils.MakeTranslateMatrix(this.obj.x, 0, this.obj.y), this.world);
            var gl = this.gl;
            gl.useProgram(this.program);
            gl.bindVertexArray(this.vao);

            var mat = utils.multiplyMatrices(this.proj, utils.multiplyMatrices(view, temp_world));
            var matWV = utils.multiplyMatrices(view, temp_world);
            var mat_n = utils.transposeMatrix(utils.invertMatrix(temp_world));
            var mat_nWV = utils.transposeMatrix(utils.invertMatrix(matWV));

            // associates world-view-projection matrix with shader
            var matLocation = gl.getUniformLocation(this.program, "mat");
            gl.uniformMatrix4fv(matLocation, true, mat);

            // associates world-view matrix with shader
            var matWVlocation = gl.getUniformLocation(this.program, "matWV");
            gl.uniformMatrix4fv(matWVlocation, true, matWV);

            var imageLocation = gl.getUniformLocation(this.program, "u_image");
            gl.uniform1i(imageLocation, this.tex_id);

            // associates normal arrays with shader
            var mat_nLocation = gl.getUniformLocation(this.program, "mat_n");
            gl.uniformMatrix4fv(mat_nLocation, true, mat_n);

            // associates normal arrays with shader
            var mat_nWVLocation = gl.getUniformLocation(this.program, "mat_nWV");
            gl.uniformMatrix4fv(mat_nWVLocation, true, mat_nWV);

            var viewLocation = gl.getUniformLocation(this.program, "view");
            gl.uniformMatrix4fv(viewLocation, true, view);

            gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        }
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
    img.src = "table.png";
    img.crossOrigin = "anonymous";
    var count_t = setVaoFromImage(gl, table(), program, img, 3, vao_t);
    var world_t = utils.multiplyMatrices(utils.MakeRotateYMatrix(90), utils.MakeScaleNuMatrix(210, 200, 225));

    var proj = utils.MakePerspective(90, (canvas.width/2)/canvas.height, 0.1, 1000);
    var view1 = utils.MakeLookAt([0,250,200],[0,0,0],[0,1,0]);
    var view2 = utils.MakeLookAt([0,250,-200],[0,0,0],[0,1,0]);

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
