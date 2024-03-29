var maxV = 10; //cap to maximum velocity of the disk

class Disk{

    constructor(radius){
        this.radius = radius;
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.vis = true;
    }

    reset(){
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.vis = true;
    }

    step(){
        this.x = this.x + this.dx;
        this.y = this.y + this.dy;
        this.dx = this.dx - 0.005*this.dx;
        this.dy = this.dy - 0.005*this.dy;
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

        //flags to tell if one of the players has just scored
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
                if (Math.abs(disk.x) + disk.radius <= this.goal){
                    if(this.goal2 == false){
                        this.goal2 = true;
                        p2.points++;
                        document.getElementById("p2").innerHTML = p2.points;
                        setTimeout(() => {disk.vis = false;}, 100);
                        setTimeout(() => {game.resetPositions();                                
                                          this.goal2 = false;
                                         }, 1500);
                        if(playing)goal.play();
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
                if (Math.abs(disk.x) + disk.radius <= this.goal){
                    if(this.goal1 == false){
                        this.goal1 = true;
                        p1.points++;
                        document.getElementById("p1").innerHTML = p1.points;
                        setTimeout(() => {disk.vis = false;}, 100);
                        setTimeout(() => {game.resetPositions();                                
                                          this.goal1 = false;
                                         }, 1500);
                        if(playing)goal.play();
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
            disk.y = this.limit < 0 ? this.limit + disk.radius + 0.5 : this.limit - disk.radius - 0.5; //to avoid sticking out of the border
        }
        else{
            disk.dx = -disk.dx;
            disk.x = this.limit < 0 ? this.limit + disk.radius + 0.5 : this.limit - disk.radius - 0.5;
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
        this.speed = 5;
        this.points = 0;
        this.vis = true;
    }

    resetPosition(){
        this.x = 0;
        this.dx = 0;
        this.dy = 0;
    }

    reset(){
        this.x = 0;
        this.dx = 0;
        this.dy = 0;
        this.points = 0;
        this.vis = true;
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
        //rotate velocity of the paddle
        var w = [this.dx, this.dy];

        //to model the collision, simply invert the sign of the y coordinate of the rotated vector
        v1[1] = -v1[1];
        //bring back to the xy coordinates
        m = rotation2(-a);
        w = multiply2mv(m,w); //rotate the velocity of the paddle in order to properly sum the two velocities
        v = multiply2mv(m,v1);

        //prevent sticking
        //positions the disk on the radial vector that connects the centers, and a distance sligthly greater than the radiuses
        var posD = [disk.x, disk.y];
        var posP = [this.x, this.y];
        var newD = multiply2vc(norm2(n), (disk.radius + this.radius + 4)); 
        disk.x = this.x + newD[0];
        disk.y = this.y + newD[1];
        //update the disk

        if(Math.sqrt(Math.pow(v[0] + w[0],2) + Math.pow(v[1] + w[1], 2)) < maxV){
            disk.dx = v[0] + w[0];
            disk.dy = v[1] + w[1];
        }
        disk.bump();
        sound.play();
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
        this.vis = true;
    }

}

// paddle radius: 4inches
// disk radius: 3.25inches
// table dimensions: 90x50inches
// goals width: 13inches
class Game{

    constructor(){
        this.p1 = new Paddle(14.5);
        this.p1.y = 150;
        this.p1.dx = 0;
        this.p1.dy = 0;

        this.p2 = new Paddle(14.5);
        this.p2.y = -150;
        this.p2.dx = 0;
        this.p2.dy = 0.0;

        this.disk = new Disk(11.78);

        this.right = new Border(100, "v", 0);
        this.left = new Border(-100, "v", 0);
        this.top = new Border(180, "h", 42.58);
        this.bottom = new Border(-180, "h", 42.58);

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

    resetPositions(){
        this.disk.reset();
        this.p1.resetPosition();
        this.p1.y = 150;
        this.p2.resetPosition();
        this.p2.y = -150;
    }

    reset(){
        this.disk.reset();
        this.p1.reset();
        this.p1.y = 150;
        this.p2.reset();
        this.p2.y = -150;
        countdown();
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

function multiply2vc(v,c){
    return [c*v[0], c*v[1]];
}

function norm2(v){
    var l = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
    return [v[0]/l, v[1]/l];
}

//returns true when paddle and disk collide
function checkDist(disk, paddle){
    var dist = Math.sqrt(Math.pow((disk.x + disk.dx) - (paddle.x + paddle.dx), 2) + Math.pow((disk.y + disk.dy) - (paddle.y + paddle.dy), 2));
    return dist <= (disk.radius + paddle.radius);
}