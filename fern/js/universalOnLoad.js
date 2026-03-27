{
    fetch('/html/navbar.html')
    .then(r => r.text())
    .then(html => {
        document.getElementById('NAVBAR_PLACEHOLDER').innerHTML = html;
    });
}