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

window.addEventListener("keydown", checkPress, false);
window.addEventListener("keyup", checkPress, false);

function action(e){
    // Pressing 'A' on the keybord p1 moves left
    if(e.keyCode == 65){
        game.p1.dx = -game.p1.speed;
    }

    // Pressing 'D' on the keybord p1 moves right
    if(e.keyCode == 68){
        game.p1.dx = game.p1.speed;
    }

    // Pressing 'W' on the keybord p1 moves up
    if(e.keyCode == 87){
        game.p1.dy = -game.p1.speed;
    }

    // Pressing 'S' on the keybord p1 moves down
    if(e.keyCode == 83){
        game.p1.dy = game.p1.speed;
    }

    // Pressing 'J' on the keybord p2 moves left
    if(e.keyCode == 74){
        game.p2.dx = game.p2.speed;
    }

    // Pressing 'L' on the keybord p2 moves right
    if(e.keyCode == 76){
        game.p2.dx = -game.p2.speed;
    }

    // Pressing 'I' on the keybord p2 moves up
    if(e.keyCode == 73){
        game.p2.dy = game.p2.speed;
    }

    // Pressing 'K' on the keybord p2 moves down
    if(e.keyCode == 75){
        game.p2.dy = -game.p2.speed;
    }
}

function release(e){
    if (e.keyCode == 65 || e.keyCode == 68){
        game.p1.dx = 0;
    }
    if (e.keyCode == 87 || e.keyCode == 83){
        game.p1.dy = 0;
    }
    if (e.keyCode == 74 || e.keyCode == 76){
        game.p2.dx = 0;
    }
    if (e.keyCode == 73 || e.keyCode == 75){
        game.p2.dy = 0;
    }
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
