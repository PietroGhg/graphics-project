class Key{
    constructor(code){
        this.code = code;
        this.pressed = false;
    }
}

var keys = new Array();
keys.push(new Key(65));
keys.push(new Key(68));
keys.push(new Key(87));
keys.push(new Key(83));
keys.push(new Key(74));
keys.push(new Key(76));
keys.push(new Key(73));
keys.push(new Key(75));

var p1up = 0;
var p1down = 0;
var p1left = 0;
var p1right = 0;
var p2up = 0;
var p2down = 0;
var p2left = 0;
var p2right = 0;

function action(e){
    // Pressing 'A' on the keybord p1 moves left
    if(e.keyCode == 65 && twoPview)
        p1left = 1;
    else if(e.keyCode == 65 && !twoPview)
        p1down = 1;

    // Pressing 'D' on the keybord p1 moves right
    if(e.keyCode == 68 && twoPview)
        p1right = 1;
    else if(e.keyCode == 68 && !twoPview)
        p1up = 1;

    // Pressing 'W' on the keybord p1 moves up
    if(e.keyCode == 87 && twoPview)
        p1up = 1;
    else if(e.keyCode == 87 && !twoPview)
        p1left = 1;

    // Pressing 'S' on the keybord p1 moves down
    if(e.keyCode == 83 && twoPview)
        p1down = 1;
    else if(e.keyCode == 83 && !twoPview)
        p1right = 1;

    // Pressing 'J' on the keybord p2 moves left
    if(e.keyCode == 74 && twoPview)
        p2left = 1;
    else if(e.keyCode == 74 && !twoPview)
        p2up = 1;

    // Pressing 'L' on the keybord p2 moves right
    if(e.keyCode == 76 && twoPview)
        p2right = 1;
    else if(e.keyCode == 76 && !twoPview)
        p2down = 1;

    // Pressing 'I' on the keybord p2 moves up
    if(e.keyCode == 73 && twoPview)
        p2up = 1;
    else if(e.keyCode == 73 && !twoPview)
        p2right = 1;

    // Pressing 'K' on the keybord p2 moves down
    if(e.keyCode == 75 && twoPview)
        p2down = 1;
    else if(e.keyCode == 75 && !twoPview)
        p2left = 1;

    calculateSpeed();
}

function release(e){
    // Pressing 'A' on the keybord p1 moves right
    if(e.keyCode == 65 && twoPview)
        p1left = 0;
    else if(e.keyCode == 65 && !twoPview)
        p1down = 0;

    // Pressing 'D' on the keybord p1 moves right
    if(e.keyCode == 68 && twoPview)
        p1right = 0;
    else if(e.keyCode == 68 && !twoPview)
        p1up = 0;

    // Pressing 'W' on the keybord p1 moves up
    if(e.keyCode == 87 && twoPview)
        p1up = 0;
    else if(e.keyCode == 87 && !twoPview)
        p1left = 0;

    // Pressing 'S' on the keybord p1 moves down
    if(e.keyCode == 83 && twoPview)
        p1down = 0;
    else if(e.keyCode == 83 && !twoPview)
        p1right = 0;

    // Pressing 'J' on the keybord p2 moves left
    if(e.keyCode == 74 && twoPview)
        p2left = 0;
    else if(e.keyCode == 74 && !twoPview)
        p2up = 0;

    // Pressing 'L' on the keybord p2 moves right
    if(e.keyCode == 76 && twoPview)
        p2right = 0;
    else if(e.keyCode == 76 && !twoPview)
        p2down = 0;

    // Pressing 'I' on the keybord p2 moves up
    if(e.keyCode == 73 && twoPview)
        p2up = 0;
    else if(e.keyCode == 73 && !twoPview)
        p2right = 0;

    // Pressing 'K' on the keybord p2 moves down
    if(e.keyCode == 75 && twoPview)
        p2down = 0;
    else if(e.keyCode == 75 && !twoPview)
        p2left = 0;

    calculateSpeed();
}

function checkPress(e){
    keys.forEach(
        function(k){
            if(k.code == e.keyCode && e.type == "keydown" && k.pressed == false){
                action(e);
                k.pressed = true;
            }
            else if(k.code == e.keyCode && e.type == "keyup"){
                release(e);
                k.pressed = false;
            }
        });
}

function changeView(){
    twoPview = !twoPview;
}

function calculateSpeed(){
    game.p1.dx = game.p1.speed*p1right - game.p1.speed*p1left;
    game.p1.dy = -game.p1.speed*p1up + game.p1.speed*p1down;
    game.p1.normalizeSpeed();

    game.p2.dx = -game.p2.speed*p2right + game.p2.speed*p2left;
    game.p2.dy = game.p2.speed*p2up - game.p2.speed*p2down;
    game.p2.normalizeSpeed();
}