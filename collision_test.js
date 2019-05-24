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
	    if(this.direction == "h" && disk.x + disk.radius >= this.limit){
		console.log("collision");
		this.handleCollision(disk);
	    }
	    else if(this.direction == "o" && disk.y + disk.radius >= this.limit){
		console.log("collision");
		this.handleCollision(disk);
	    }
	}
	else{
	    if(this.direction == "h" && disk.x - disk.radius <= this.limit){
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

var borders = [];
borders.push( new Border(3, "h"));
borders.push( new Border(-3, "h"));
borders.push( new Border(5, "o"));
borders.push( new Border(-5, "o"));

var d = new Disk(1);
d.dx = 0.25;
d.dy = 0.25;

window.addEventListener("keydown", action, false);

function action(e){
    if(e.keyCode == 32){
	d.step();
	borders.forEach(
	    function(b){
		b.check(d);
	    });
    }
}
