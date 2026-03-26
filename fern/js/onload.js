{
    let welcome = document.getElementById("welcomeMessage")
    const welcomeMessages = [
        "Welcome to my website!!",
        "Mewcome to my website!!",
        "Meowcome!",
        "Welcome!!",
        "Welcome to Fern's nook!",
        "Meowcome to Fern's nook!",
    ]
    welcome.textContent = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
}

{
    let myTimeSpan = document.getElementById("myTime")
    let timeOffsetSpan = document.getElementById("hoursChange")
    let stringPadding = ""
    const ukDate = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
    const currentHour = new Date().getHours()
    const ukHour = parseInt(ukDate.split(":")[0])
    const hourOffset = (currentHour -ukHour) || 0
    if (hourOffset >= 0) { stringPadding = `${hourOffset} hour(s) ahead of me` } else { stringPadding = `${-hourOffset} hour(s) behind me` }
    myTimeSpan.textContent = ukDate
    timeOffsetSpan.textContent = stringPadding
}

{
    fetch('/html/navbar.html')
    .then(r => r.text())
    .then(html => {
        document.getElementById('navbar-placeholder').innerHTML = html;
    });
}
function updateTime(){
    let myTimeSpan = document.getElementById("myTime")
    const ukDate = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
    myTimeSpan.textContent = ukDate
}

document.querySelectorAll('a').forEach(link => { link.target = "_blank"; }); // im lazy

setInterval(updateTime,1000)