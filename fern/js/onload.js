let welcome = document.getElementById("welcomeMessage")

const welcomeMessages = [
    "Welcome to my website!!",
    "Mewcome to my website!!",
    "Meowcome!",
    "Welcome!!",
    "Welcome to Fern's nook!",
    "Meowcome to Fern's nook!",
]

welcome.textContent = welcomeMessages[Math.floor(Math.random()*welcomeMessages.length)]

document.querySelectorAll('a').forEach(link => {link.target = "_blank";}); // im lazy