//wrapper for several audio files, allows playing bounce sound multiple times
class Bumps{
    constructor(n, file){
        this.files = new Array();
        this.index = 0;
        for(var i = 0; i < n; i++){
            this.files.push(new Audio(file));
        }
    }

    play(){
        if(playing){
            this.files[this.index].play();
            this.files[this.index].volume = 0.1;
            this.index = (this.index + 1) % this.files.length;
        }
    }
}

var sound = new Bumps(20, "res/bump.mp3"); //sound is played after a collision, check collision_test.js -> Paddle -> handleCollision()
var prova = new Audio("res/back.mp3");
var p1Win = new Audio("res/p1_win.mp3");
p1Win.volume = 0.1;
var p2Win = new Audio("res/p2_win.mp3");
p2Win.volume = 0.1;
var tie = new Audio("res/tie.mp3");
tie.volume = 0.1;
var goal = new Audio("res/goal.mp3");
goal.volume = 0.1;
prova.volume = 0.06;
var button = document.createElement("button");
var playing = false;
button.innerHTML = "Sound on";
button.style.position = "absolute";
button.style.left = "570";
button.style.top = "90";
// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

// 3. Add event handler
button.addEventListener ("click", function() {
    if(!playing){
        prova.loop = true;
        prova.play();
        playing = true;
        button.innerHTML = "Sound off";
    }
    else{
        playing = false;
        prova.loop = false;
        prova.pause();
        prova.currentTime = 0;
        button.innerHTML = "Sound on";
    }
});