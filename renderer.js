"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader
// it will receive data from a buffer
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

out vec3 cameraCoord; // position in camera space
out vec3 cameraNormal; // normals in camera space
out vec2 v_texCoord; // texture coordinates

uniform mat4 mat; // world-view-projection matrix
uniform mat4 matWV; // world-view matrix
uniform mat4 mat_nWV; // world-view normal vectors


// all shaders have a main function
void main() {

// gl_Position is a special variable a vertex shader
// is responsible for setting

v_texCoord = a_texCoord;

gl_Position = mat * vec4(a_position.xyz, 1); // exact position of the vertex on the screen in the canvas

cameraCoord = (matWV * vec4(a_position.xyz, 1)).xyz; // camera coordinates of object

cameraNormal = mat3(mat_nWV) * a_normal; // camera coordinates of normal vectors

}
`;

var fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// we need to declare an output for the fragment shader
out vec4 outColor;

in vec3 cameraCoord;
in vec3 cameraNormal;
in vec2 v_texCoord;

uniform sampler2D u_image;
uniform mat4 view;


void main() {
vec3 cm = normalize(cameraNormal);
vec4 color = texture(u_image, v_texCoord); // color is relative to the u_image texture ID and should be in texCoord

// point lights
vec4 Lps = vec4(0.7,0.7,0.7,1.0); // specular light color
vec3 eyeDir = normalize(0.0 - cameraCoord);
float g = 70.0; // target distance for decay
float beta = 0.6; // decay factor

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

// directional light
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

    // fill the texture with a 1x1 blue pixel until the image is loaded
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    // when the image is loaded, put its data inside the texture
    image.addEventListener('load', function() { setStuff(gl, vao, texture, image,tex_id); });

    // set the parameters so we don't need mips and so we're not filtering and we don't repeat
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

    // fills the buffers with positions, indices, normals, and texture coordinates
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

    // activates and binds the right tex
    gl.activeTexture(gl.TEXTURE0 + tex_id);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // fill the texture with the given color
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));

    // set the parameters so we don't need mips and so we're not filtering and we don't repeat
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

/*class for a object to be drawn
receives: 
-the gl context
-the vertex array referring to all the necessary buffers
-the shaders
-the initial world matrix, used to perform initial scaling/translation to adapt to world space
-the number of elements to be drawn
-the game object to be drawn (paddle, disk or table), which contains a reference to the position of the object in the game
-the texture ID that identifies the proper texture to be used to color the object
*/
class Drawable{

    constructor(gl, vao, program, world, count, obj, tex_id){
        this.gl = gl;
        this.vao = vao;
        this.program = program;
        this.world = world;
        this.count = count;
        this.obj = obj;
        this.tex_id = tex_id;
    }

    //draws the object, receives the projection and the view matrix in order to allow difference persepectives of the game
    draw(proj, view){
        if(this.obj.vis){
            //computes the world matrix starting from the initial world matrix and translating by the position of the object in the game
            var temp_world = utils.multiplyMatrices(utils.MakeTranslateMatrix(this.obj.x, 0, this.obj.y), this.world);
            var gl = this.gl;
            //activates the shaders and the vertex array object
            gl.useProgram(this.program);
            gl.bindVertexArray(this.vao);

            var mat = utils.multiplyMatrices(proj, utils.multiplyMatrices(view, temp_world)); //world-view-projection matrix
            var matWV = utils.multiplyMatrices(view, temp_world); //world-view, used to compute the positions in camera space
            var mat_nWV = utils.transposeMatrix(utils.invertMatrix(matWV)); //normal matrix in camera space

            //associates world-view-projection matrix with shader
            var matLocation = gl.getUniformLocation(this.program, "mat");
            gl.uniformMatrix4fv(matLocation, true, mat);

            //associates world-view matrix with shader
            var matWVlocation = gl.getUniformLocation(this.program, "matWV");
            gl.uniformMatrix4fv(matWVlocation, true, matWV);

            //sets the proper texture 
            var imageLocation = gl.getUniformLocation(this.program, "u_image");
            gl.uniform1i(imageLocation, this.tex_id);

            //associates normal vectors matrix with shader
            var mat_nWVLocation = gl.getUniformLocation(this.program, "mat_nWV");
            gl.uniformMatrix4fv(mat_nWVLocation, true, mat_nWV);

            //associates view matrix with shader
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
        return null;
    }

    //compiles shaders and creates a program
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl, vertexShader, fragmentShader);

    //vao contains buffers of objects and defines how many numbers take at a time for each buffer
    //vertex array object for the paddle of the first player
    var vao_p1 = gl.createVertexArray();
    var count = setVaoFromColor(gl, paddle(), program, [255,0,0,255], 0, vao_p1); //receives a paddle model, colors in with a red texture
    var world_p1 = utils.multiplyMatrices(utils.MakeTranslateMatrix(155,0,10), utils.MakeScaleMatrix(220)); //scales and translates initial model of the table

    //vao for the paddle of the second player
    var vao_p2 = gl.createVertexArray();
    var count2 = setVaoFromColor(gl, paddle(), program, [0,255,0,255], 1, vao_p2); //green texture
    var world_p2 = utils.multiplyMatrices(utils.MakeTranslateMatrix(155,0,3), utils.MakeScaleMatrix(220));

    //vao for the disk
    var vao_p3 = gl.createVertexArray();
    var count3 = setVaoFromColor(gl, createCil(5,game.disk.radius,[0.0,0.0,0.0,1.0]), program, [0,0,0,255], 2, vao_p3); //cilinder with black texture

    //vao for the table
    var vao_t = gl.createVertexArray();
    var img = new Image();
    img.src = "table.png";
    img.crossOrigin = "anonymous";
    var count_t = setVaoFromImage(gl, table(), program, img, 3, vao_t); //table model with texture loaded from file
    var world_t = utils.multiplyMatrices(utils.MakeRotateYMatrix(90), utils.MakeScaleNuMatrix(210, 200, 225));

    var proj1 = utils.MakePerspective(90, (canvas.width/2)/canvas.height, 0.1, 1000); //projection matrix for split screen (half of the canvas width)
    var proj2 = utils.MakePerspective(90, canvas.width/canvas.height, 0.1, 1000); //projection matrix for full screen
    var view1 = utils.MakeLookAt([0,250,200],[0,0,0],[0,1,0]); //view for player1
    var view2 = utils.MakeLookAt([0,250,-200],[0,0,0],[0,1,0]); //view for player2
    var view3 = utils.MakeLookAt([0,250,0],[0,0,0],[-1,0,0]); //view for full screen

    //creates one drawable object for each element to be drawn
    //program is the shader to be used
    //world matrixes adapt table model (dimensions) to the game
    //count is the number of triangles to be drawn
    //game.obj is the object in game associated to the one to be drawn
    //the last number is the texture ID
    var d1 = new Drawable(gl, vao_p1, program, world_p1, count, game.p1, 0);
    var d2 = new Drawable(gl, vao_p2, program, world_p2, count2, game.p2, 1);
    var d3 = new Drawable(gl, vao_p3, program, utils.identityMatrix(), count3, game.disk, 2);
    var d4 = new Drawable(gl, vao_t, program,  world_t, count_t, game.table, 3);
    var todraw = [d1,d2,d3,d4];
    //1 view per player + 1 view full screen
    var views = {viewp1:view1, viewp2:view2, viewFull: view3};
    //1 split screen + 1 full screen
    var projs = {projSplit:proj1, projFull: proj2};

    return {gl:gl,
            todraw: todraw,
            projs: projs,
            views: views};
}

//renders the scene for one player, setting the viewport and drawing the objects with the given view matrix
//x is the start point of the screen to begin to draw ([0, width/2]; [width/2, width])
function drawScene(gl, todraw, x, width, proj, view){
    gl.viewport(x, 0, width, gl.canvas.height);

    todraw.forEach(
        function(td){
            td.draw(proj, view);
        });
}

//animates the scene by making every object of the game step and calling drawScene() twice, once for each player
function animate(graphics){

    //check collisions and moves paddles
    game.checkAndStep();

    if(twoPview){
        clear(graphics.gl);
        drawScene(graphics.gl, graphics.todraw, 0, graphics.gl.canvas.width/2, graphics.projs.projSplit, graphics.views.viewp1);
        drawScene(graphics.gl, graphics.todraw, graphics.gl.canvas.width/2, graphics.gl.canvas.width/2, graphics.projs.projSplit, graphics.views.viewp2);
    }
    else{
        clear(graphics.gl);
        drawScene(graphics.gl, graphics.todraw, 0, graphics.gl.canvas.width, graphics.projs.projFull, graphics.views.viewFull);
    }

    window.requestAnimationFrame(function(){ animate(graphics);});
}

function startup(graphics, angle){

    var proj = utils.MakePerspective(90, graphics.gl.canvas.width/graphics.gl.canvas.height, 0.1, 1000);
    var d = 250; //distance of the camera from the center of the table
    var view = utils.MakeLookAt([d*Math.cos(angle), 250, d*Math.sin(angle)],[0,0,0],[0,1,0]); //the camera rotates around the center
    clear(graphics.gl);
    drawScene(graphics.gl, graphics.todraw, 0, graphics.gl.canvas.width, proj, view);
    if(playstartup)
        window.requestAnimationFrame(function(){ startup(graphics, angle + 0.01); }); //increases the angle
    else{
        //after the user has pressed spacebar and the startup screen
        //associates the event listeners of the action keys
        window.addEventListener("keydown", checkPress, false);
        window.addEventListener("keyup", checkPress, false);
        animate(graphics); //game begins
        countdown(); //start timer
        document.getElementById("spacebar").innerHTML = "";
    }
}