var game = new Game();

var twoPview = true; //true if split screen enabled
var playstartup = true; //true if startup animation is playing 

var graphics = initGraphics(game); //initializes the buffers ecc
startup(graphics, 0);
window.addEventListener("keypress", function(e){ if(e.keyCode == 32) playstartup = false; }); //when spacebar is pressed, stop startup animation
