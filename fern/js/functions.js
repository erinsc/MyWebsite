function copyToKeyboard(){
    navigator.clipboard.writeText('<a href="https://fern.erinsc.net"><img src="https://fern.erinsc.net/assets/stamps/stamp.png" alt="stamp to ferns website :3"></a>');
    alert("Stamp html copied to keyboard!")
}

function sure(){
    if (window.confirm("Are you sure?")){
        if (window.confirm("are you sure you're sure?")){
            document.getElementById("page").innerHTML="<h1>I have no fucking clue how to do webdev<h1/>"
        }
    }
}