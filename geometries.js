function createCube(){
    var vertexes = [
        // Front face
        -1.0, -1.0,  1.0, 
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0];

    var normals = [];
    normals = spush(normals, [0.0,0.0,1.0]);
    normals = spush(normals, [0.0,0.0,-1.0]);
    normals = spush(normals, [0.0,1.0,0.0]);
    normals = spush(normals, [0.0,-1.0,0.0]);
    normals = spush(normals, [1.0,0.0,0.0]);
    normals = spush(normals, [-1.0,0.0,0.0]);

    function spush(vec1, vec2){
        vec1 = vec1.concat(vec2,vec2,vec2,vec2);
        return vec1;
    }

    var indexes = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
    ];

    const faceColors = [
        [0.0,  1.0,  1.0,  1.0],    // Front face: 
        [1.0,  0.0,  0.0,  1.0],    // Back face: red
        [0.0,  1.0,  1.0,  1.0],    // Top face: cyan
        [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
        [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
        [1.0,  0.0,  1.0,  1.0],    // Left face: purple
    ];

    // Convert the array of colors into a table for all the vertices.
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c);
    }

    return [vertexes, indexes, colors, normals];
}


function createCil(h, r, color){
    var i = 0;
    var vert2 = [[0.0, 0.0, 0.0]];
    var norm2 = [[0.0, 0.0, 1.0]];
    var ind2 = [];
    var color2 = [1.0, 0.0, 1.0];
    var slices2 = 64;

    //bottom
    for(i = 0; i < slices2; i++){
        vert2.push([r*Math.cos(2*Math.PI / slices2 * i), 0.0,r*Math.sin(2*Math.PI / slices2 * i)]);
        norm2.push([0.0,-1.0,0.0]);
        ind2.push(0);
        ind2.push(i+1);
        ind2.push((i < slices2-1) ? i+2 : 1) ;
    }

    //top
    var off = vert2.length;
    vert2.push([0.0,h,0.0]);
    norm2.push([0.0,1.0,0.0]);
    for(i = 0; i < slices2; i++){
        vert2.push([r*Math.cos(2*Math.PI / slices2 * i), h,-r*Math.sin(2*Math.PI / slices2 * i)]);
        norm2.push([0.0,1.0,0.0]);
        ind2.push(off);
        ind2.push(off+i+1);
        ind2.push((i < slices2-1) ? off+i+2 : off+1) ;
    }

    //sides
    off = vert2.length;

    //first corner
    vert2.push([1, 0.0,0.0]);
    norm2.push([1,0.0,0.0]);
    vert2.push([1, h,0.0]);
    norm2.push([1, 0.0,0.0]);

    //at each iteration, one corner than connects two corners for a side 
    for(i = 1; i < slices2; i++){
        vert2.push([r*Math.cos(2*Math.PI / slices2 * i), 0.0,-r*Math.sin(2*Math.PI / slices2 * i)]);
        norm2.push([Math.cos(2*Math.PI / slices2 * i), 0.0,-Math.sin(2*Math.PI / slices2 * i)]);
        vert2.push([r*Math.cos(2*Math.PI / slices2 * i), h,-r*Math.sin(2*Math.PI / slices2 * i)]);
        norm2.push([Math.cos(2*Math.PI / slices2 * i), 0.0,-Math.sin(2*Math.PI / slices2 * i)]);

        var bl = off + 2*(i-1); //10 12 14 16
        var br = bl + 2; 
        var tr = bl + 3; 
        var tl = bl + 1; 
        ind2.push(bl);
        ind2.push(br);
        ind2.push(tr);

        ind2.push(bl);
        ind2.push(tr);
        ind2.push(tl);
    }

    //last side
    ind2.push(off+2*(i-1));
    ind2.push(off);
    ind2.push(off+1);
    ind2.push(off+2*(i-1));
    ind2.push(off+1);
    ind2.push(off+2*(i-1)+1);

    var finalv = [];
    var finaln = [];
    var finalc = [];
    var finalt = [];

    for(i = 0; i< vert2.length; i++){
        finalv = finalv.concat(vert2[i]);
        finaln = finaln.concat(norm2[i]);
        finalc = finalc.concat(color);
        finalt.push(0.5,0.5);
    }

    return [finalv, ind2, finalc, finaln,finalt];
}

function paddle(){
    var vertices = models.meshes[0].vertices;
    var indices = [].concat.apply([], models.meshes[0].faces);
    var normals = models.meshes[0].normals;
    var texCoord = [];
    var colors = [];
    for(var i = 0; i < vertices.length/3; i++){
        texCoord.push(0.5,0.5);
    }
    return [vertices, indices, colors, normals, texCoord];
}

function table(){       
    var vertices = models.meshes[3].vertices;
    var indices = [].concat.apply([], models.meshes[3].faces);
    var normals = models.meshes[3].normals;
    var texCoord = models.meshes[3].texturecoords[0];
    var colors = [];
    for(var i = 0; i < vertices.length/3; i++){
        colors.push(0.0,1.0,1.0,1.0);
    }
    return [vertices, indices, colors, normals, texCoord];
}