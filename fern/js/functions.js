function copyToKeyboard(){
    navigator.clipboard.writeText('<a href="https://fern.erinsc.net"><img src="https://fern.erinsc.net/assets/stamps/stamp.png" alt="stamp to ferns website :3"></a>');
    alert("Stamp html copied to keyboard!");
}

function sure(){
    if (window.confirm("Are you sure?")){
        if (window.confirm("are you sure you're sure?")){
            defSure();
        } else {
            cancelSure();
            return;
        }
    } else{
        cancelSure();
        return;
    }
}

function no(){
    if (window.confirm("Aww. Really?")){
        if (window.confirm("Are you sure you don't want to know?")){
            cancelSure();
        } else {
            window.alert("I knew you'd come around!");
            window.alert("but anyway.");
            window.alert("brace yourself");
            defSure();
            return;
        }
    } else{
        window.alert("Yay! guess you just hit the wrong button.");
        window.alert("but anyway.");
        window.alert("brace yourself");
        defSure();
        return;
    }
}

function defSure(){
    window.location.href = "secret.html";
}

function cancelSure(){
    window.alert("oh :/");
    window.alert("guess you just hate me then huh.");
    window.alert("well if you really feel that way then why are you even on my website?");
    window.alert("So why are you still here?");
    window.alert("okay, guess i'll make you leave myself then");
    window.alert("bye now");
    window.location.replace("http://www.google.com");
}

function updateTime(){
    let myTimeSpan = document.getElementById("myTime")
    const ukDate = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
    myTimeSpan.textContent = ukDate
}
setInterval(updateTime,1000)
