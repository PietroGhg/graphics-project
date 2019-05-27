class Disk{
    constructor(radius){
	this.radius = radius;
	this.x = 0;
	this.y = 0;
	this.dx = 0;
	this.dy = 0;
    }

    step(){
	this.x = this.x + this.dx;
	this.y = this.y + this.dy;
	console.log("x:" + this.x + ", y:" +this.y);
    }
}

class Border{
    constructor(limit, direction){
	this.limit = limit;
	this.direction = direction;
    }

    check(disk){
	if(this.limit >= 0){
	    if(this.direction == "v" && disk.x + disk.radius >= this.limit){
		console.log("collision");
		this.handleCollision(disk);
	    }
	    else if(this.direction == "o" && disk.y + disk.radius >= this.limit){
		console.log("collision");
		this.handleCollision(disk);
	    }
	}
	else{
	    if(this.direction == "v" && disk.x - disk.radius <= this.limit){
		console.log("collision");
		this.handleCollision(disk);
	    }
	    else if(this.direction == "o" && disk.y - disk.radius <= this.limit){
		console.log("collision");
		this.handleCollision(disk);
	    }
	}
    }

    handleCollision(disk){
	if(this.direction == "o"){
	    disk.dy = -disk.dy;
	}
	else{
	    disk.dx = -disk.dx;
	}
    }
    
}

class Paddle{
    constructor(radius){
	this.x = 0;
	this.y = 0;
	this.radius = radius;
    }

    check(disk){
	//check if the distance between the centers is <= of the sum of the radiuses
	var dist = Math.sqrt(Math.pow(disk.x - this.x, 2) + Math.pow(disk.y - this.y, 2));
	if(dist <= this.radius + disk.radius){
	    console.log("collision with paddle");
	    this.handleCollision(disk);
	}
    }

    handleCollision(disk){
	//compute the vector between center of disk and center of paddle
	var n = [disk.x - this.x, disk.y - this.y];
	//compute the angle of the vector wrt the xy coordinates and the corresponding rotation matrix
	var a = Math.atan(n[0] / n[1]);
	var m = rotation2(a);
	//rotate the velocity vector of the disk 
	var v = [disk.dx, disk.dy];
	var v1 = multiply2mv(m,v);
	//to model the collision, simply invert the sign of the y coordinate of the rotated vector
	v1[1] = -v1[1];
	//bring back to the xy coordinates
	m = rotation2(-a);
	v = multiply2mv(m,v1);
	//update the disk
	disk.dx = v[0];
	disk.dy = v[1];
    }
}

class Game{
    constructor(){
	this.p1 = new Paddle(1.5);
	this.p1.x = 7;
	this.p2 = new Paddle(1.5);
	this.p2.x = -7;

	this.disk = new Disk(1);
	this.disk.dx = 1.0;
	
	this.right =  new Border(10, "v");
	this.left = new Border(-10, "v");
	this.top = new Border(15, "o");
	this.bottom = new Border(-15, "o");

	this.obstacles = [];
	this.obstacles.push(this.p1);
	this.obstacles.push(this.p2);
	this.obstacles.push(this.right);
	this.obstacles.push(this.left);
	this.obstacles.push(this.top);
	this.obstacles.push(this.bottom);
    }

}

function rotation2(a){
    return [Math.cos(a), -Math.sin(a),
	    Math.sin(a), Math.cos(a)];
}

function multiply2mv(m,v){
    return [m[0]*v[0] + m[1]*v[1], m[2]*v[0] + m[3]*v[1]];
}




