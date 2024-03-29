//set minutes
var mins = 3;

//calculate the seconds
var secs = mins * 60;

//countdown function is evoked when page is loaded
function countdown() {
    mins = 3;
    secs = mins * 60;
    document.getElementById("minutes").innerHTML = mins;
    document.getElementById("seconds").innerHTML = 0;
    setTimeout('Decrement()', 60);
}

//Decrement function decrement the value
function Decrement() {
    if (document.getElementById) {
        minutes = document.getElementById("minutes");
        seconds = document.getElementById("seconds");

        //if less than a minute remaining display only seconds value
        if (seconds < 59) {
            seconds.value = secs;
        }

        //Display both minutes and seconds
        //getminutes and getseconds is used to get minutes and seconds
        else {
            minutes.value = getminutes();
            seconds.value = getseconds();
        }
        //when less than a minute remaining colour of the minutes and seconds changes to red
        if (mins < 1) {
            minutes.style.color = "red";
            seconds.style.color = "red";
        }
        //if seconds becomes zero, then page alert time up
        if (mins < 0) {
            if (game.p1.points > game.p2.points){
                if(playing)p1Win.play();
                if(!alert('Game Over!\n\nP1 Wins! 🏅🏆')){game.reset(); resetHTMLPoints();}
            }
            else if (game.p1.points < game.p2.points){
                if(playing)p2Win.play();
                if(!alert('Game Over!\n\nP2 Wins! 🏅🏆')){game.reset(); resetHTMLPoints();}
            }
            else {
                if(playing)tie.play();
                if(!alert('Game Over!\n\n🏅 Tie! 🏅')){game.reset(); resetHTMLPoints();}
            }
            minutes.value = 0;
            seconds.value = 0;
        }
        //if seconds > 0 then seconds is decremented
        else {
            secs--;
            setTimeout('Decrement()', 1000);
        }
    }
}

function getminutes() {
    //minutes is seconds divided by 60, rounded down
    mins = Math.floor(secs / 60);
    return mins;
}

function getseconds() {
    //take minutes remaining (as seconds) away from total seconds remaining
    return secs - Math.round(mins * 60);
}

function resetHTMLPoints(){
    document.getElementById("p1").innerHTML = 0;
    document.getElementById("p2").innerHTML = 0;
}