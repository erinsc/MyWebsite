const impact = new Howl({
  src: ['/assets/audio/impact.wav'],
    onloaderror: function(id, err) {
    console.error('Error loading sound:', err);
  }
});


const text = ["I","Have","No","Fucking","Clue","How","To Make","Websites",":)"]
async function revealSecret(){
  document.getElementById("revealButton").remove();

  const impact = new Audio("/assets/audio/impact.wav");
  let title = document.getElementById("secret")

  const explanation = document.getElementById("explanation")

  await new Promise(r => setTimeout(r, 1000));
  for(let i = 0;i<text.length;i++){
      title.textContent =` ${text[i]}`
      impact.play()
      await new Promise(r => setTimeout(r, 1400));
  }

  await new Promise(r => setTimeout(r, 1000));

    title.textContent ="Sorry!"

  for(let i =1;i<=100;i++){
    explanation.style.opacity = i/100
    await new Promise(r => setTimeout(r, 10));
  }
}