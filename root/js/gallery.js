const btn = document.getElementById('BtnOrder');
let reversed = false;

btn.addEventListener('click', () => {
  reversed = !reversed;

  const container = document.querySelector(".content");
  const paragraphs = [...container.children];
  const first = paragraphs.shift(); // remove A from the list

  paragraphs.reverse().forEach(p => container.appendChild(p));

  if (reversed) {
    btn.textContent = 'Oldest first';
  } else {
    btn.textContent = 'Newest first';
  }
});