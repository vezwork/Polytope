// https://pages.mtu.edu/~suits/notefreqs.html
const NOTE_TO_FREQ = { e4: 329.63, f4: 349.23, g4: 392.0,
  a4: 440.0, b4: 493.88, c5: 523.25, d5: 587.33, e5: 659.25,
  f5: 698.46, g5: 783.99, " ": 0,
};
function play(notes) {
  const context = new AudioContext();

  let i = 0;
  for (const { note, length } of notes) {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = NOTE_TO_FREQ[note];
    oscillator.type = "sine";

    oscillator.connect(context.destination);
    oscillator.start(i / 4);
    oscillator.stop((i + 1) / 4);
    i++;
  }
}

play(([{"note":"g4","length":1},{"note":"a4","length":1},{"note":" ","length":1},{"note":"f4","length":1},{"note":"g4","length":1},{"note":" ","length":1},{"note":"d5","length":1},{"note":"e5","length":1},{"note":" ","length":1},{"note":"f5","length":1},{"note":"e5","length":1}]));
