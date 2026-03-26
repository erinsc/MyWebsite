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
    let meOrUs = document.getElementById("meOrUs")

    const ukDate = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
    const currentHour = new Date().getHours()
    const ukHour = parseInt(ukDate.split(":")[0])
    let hourOffset = (currentHour -ukHour) || 0

    let stringPadding = ""
    let grammar1 = "hours"
    let grammar2 = "ahead of"

    if (Math.abs(hourOffset)===1) grammar1 = "hour";
    if (hourOffset <= 0) {grammar2 = "behind"; hourOffset*=-1};
    if (hourOffset !== 0) stringPadding = `${hourOffset} ${grammar1} ${grammar2}`;
    else {stringPadding = "in the same timezone as"; meOrUs.textContent = "both of us"};

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
