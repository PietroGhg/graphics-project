var maxV = 15; //cap to maximum velocity of the disk

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
        this.dx = this.dx - 0.01*this.dx;
        this.dy = this.dy - 0.01*this.dy;
    }

    bump(){
        this.dx = this.dx - 0.01*(this.dx > 0 ? 1 : -1);
        this.dy = this.dy - 0.01*(this.dy > 0 ? 1 : -1);
    }

}

class Border{

    constructor(limit, direction, goal){
        this.limit = limit;
        this.direction = direction;
        this.goal = goal;

        this.goal1 = false;
        this.goal2 = false;
    }

    check(disk, p1, p2){
        if(this.limit >= 0){
            if(this.direction == "v" && disk.x + disk.dx + disk.radius >= this.limit){
                this.handleCollision(disk);
            }
            else if(this.direction == "h" && disk.y + disk.dy + disk.radius >= this.limit){
                //goal
                if (disk.x + disk.dx + disk.radius >= -this.goal && disk.x + disk.dx + disk.radius <= this.goal){
                    if(this.goal2 == false){
                        this.goal2 = true;
                        setTimeout(() => { disk.x = 0;
                                          disk.y = 0;
                                          disk.dx = 0;
                                          disk.dy = 0;
                                          p1.x = 0;
                                          p1.y = 120;
                                          p2.x = 0;
                                          p2.y = -120;
                                          p2.points++;
                                          document.getElementById("p2").innerHTML = p2.points;
                                          console.log(p2.points);
                                          this.goal2 = false;
                                         }, 3000);
                    }
                }
                //collision
                else{
                    this.handleCollision(disk);
                }
            }
        }
        else{
            if(this.direction == "v" && disk.x + disk.dx - disk.radius <= this.limit){
                this.handleCollision(disk);
            }
            else if(this.direction == "h" && disk.y + disk.dy - disk.radius <= this.limit){
                //goal
                if (disk.x + disk.dx + disk.radius >= -this.goal && disk.x + disk.dx + disk.radius <= this.goal){
                    if(this.goal1 == false){
                        this.goal1 = true;
                        setTimeout(() => { disk.x = 0;
                                          disk.y = 0;
                                          disk.dx = 0;
                                          disk.dy = 0;
                                          p1.x = 0;
                                          p1.y = 120;
                                          p2.x = 0;
                                          p2.y = -120;
                                          p1.points++;
                                          document.getElementById("p1").innerHTML = p1.points;
                                          console.log(p1.points);
                                          this.goal1 = false;}, 3000);
                    }
                }
                //collision
                else{
                    this.handleCollision(disk);
                }
            }
        }
    }

    handleCollision(disk){
        if(this.direction == "h"){
            disk.dy = -disk.dy;
        }
        else{
            disk.dx = -disk.dx;
        }
        disk.bump();
    }

}

class Paddle{

    constructor(radius){
        this.radius = radius;
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.speed = 4;
        this.points = 0;
    }

    step(){
        this.x = this.x + this.dx;
        this.y = this.y + this.dy;
    }

    check(disk){
        //check if the distance between the centers is <= of the sum of the radiuses
        var dist = Math.sqrt(Math.pow((disk.x + disk.dx) - (this.x + this.dx), 2) + Math.pow((disk.y + disk.dy) - (this.y + this.dy), 2));
        if(dist <= this.radius + disk.radius){
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

        //disk.bump();
        //update the disk
        if(Math.sqrt(Math.pow(v[0] + this.dx,2) + Math.pow(v[1] + this.dy, 2)) < maxV){
            disk.dx = v[0] + this.dx;
            disk.dy = v[1] + this.dy;
        }
    }

    normalizeSpeed(){
        var len = Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
        if(len != 0){
            this.dx = this.speed*(this.dx/len);
            this.dy = this.speed*(this.dy/len);
        }
    }

}

class Table{

    constructor(){
        this.x = 0;
        this.y = 0;
    }

}

class Game{

    constructor(){
        this.p1 = new Paddle(15);
        this.p1.y = 120;
        this.p1.dx = 0;
        this.p1.dy = 0;

        this.p2 = new Paddle(15);
        this.p2.y = -120;
        this.p2.dx = 0.0;
        this.p2.dy = 0.0;

        this.disk = new Disk(10);

        this.right = new Border(100, "v", 0);
        this.left = new Border(-100, "v", 0);
        this.top = new Border(150, "h", 20);
        this.bottom = new Border(-150, "h", 20);

        this.obstacles = [];
        this.obstacles.push(this.p1);
        this.obstacles.push(this.p2);
        this.obstacles.push(this.right);
        this.obstacles.push(this.left);
        this.obstacles.push(this.top);
        this.obstacles.push(this.bottom);

        this.borders = [];
        this.borders.push(this.right);
        this.borders.push(this.left);
        this.borders.push(this.top);
        this.borders.push(this.bottom);

        this.table = new Table();
    }

    checkColl(paddle){
        if(!(paddle.x - paddle.radius + paddle.dx <= this.borders[1].limit ||
             checkDist(this.disk, paddle) ||
             paddle.x + paddle.radius + paddle.dx >= this.borders[0].limit)){

            paddle.x = paddle.x + paddle.dx;
        }

        if(paddle.y <= 0){
	    if(paddle.y + paddle.radius + paddle.dy >= 0){ //to avoid having speed != 0 when the paddle is still at half field
		paddle.dy = 0;
	    }
            if(!(paddle.y - paddle.radius + paddle.dy <= this.borders[3].limit ||
                 checkDist(this.disk, paddle) ||
                 paddle.y + paddle.radius + paddle.dy >= 0)){

                paddle.y = paddle.y + paddle.dy;
            }
        }
        else if(paddle.y >= 0){
	    if(paddle.y - paddle.radius + paddle.dy <= 0){ //to avoid having speed != 0 when the paddle is still at half field
		paddle.dy = 0;
	    }
            if(!(paddle.y - paddle.radius + paddle.dy <= 0 ||
                 checkDist(this.disk, paddle) ||
                 paddle.y + paddle.radius + paddle.dy >= this.borders[2].limit)){

                paddle.y = paddle.y + paddle.dy;
            }
        }

        paddle.normalizeSpeed();
    }

    checkAndStep(){
        this.disk.step();
        this.checkColl(this.p1);
        this.checkColl(this.p2);
        this.obstacles.forEach(
            function(b){
                b.check(this.disk, this.p1, this.p2);
            }, this);
    }

}

function rotation2(a){
    return [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)];
}

function multiply2mv(m,v){
    return [m[0]*v[0] + m[1]*v[1], m[2]*v[0] + m[3]*v[1]];
}

//returns true when paddle and disk collide
function checkDist(disk, paddle){
    var dist = Math.sqrt(Math.pow((disk.x + disk.dx) - (paddle.x + paddle.dx), 2) + Math.pow((disk.y + disk.dy) - (paddle.y + paddle.dy), 2));
    return dist <= (disk.radius + paddle.radius);
}
