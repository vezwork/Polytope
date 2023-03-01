export class Sounds {
  audioContext: AudioContext;
  gainNode: GainNode;
  ready: boolean;
  constructor(el: HTMLElement | Document = document.body) {
    this.audioContext = new AudioContext();

    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    this.ready = false;

    const eventListenerFunction = () => {
      if (!this.ready) {
        this.audioContext.resume().then(() => (this.ready = true));
      } else {
        el.removeEventListener("click", eventListenerFunction);
        el.removeEventListener("keydown", eventListenerFunction);
      }
    };
    el.addEventListener("click", eventListenerFunction);
    el.addEventListener("keydown", eventListenerFunction);
  }

  set volume(value) {
    if (value < 0) value = 0;
    this.gainNode.gain.value = value;
  }
  get volume() {
    return this.gainNode.gain.value;
  }

  async load(url: string) {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((res) => this.audioContext.decodeAudioData(res))
      .then((res) => new Sound(this.audioContext, res, this.gainNode));
  }
}

export class Sound {
  audioContext: AudioContext;
  parentNode: AudioNode;
  buffer: AudioBuffer;
  detune: number;
  loop: boolean;
  loopEnd: number;
  loopStart: number;
  playbackRate: number;
  constructor(
    audioContext: AudioContext,
    buffer: AudioBuffer,
    parentNode: AudioNode
  ) {
    this.audioContext = audioContext;
    this.parentNode = parentNode;

    this.buffer = buffer;
    this.detune = 0;
    this.loop = false;
    this.loopEnd = 0;
    this.loopStart = 0;
    this.playbackRate = 1;
  }

  play() {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.parentNode);

    source.detune.value = this.detune;
    source.loop = this.loop;
    source.loopEnd = this.loopEnd;
    source.loopStart = this.loopStart;
    source.playbackRate.value = this.playbackRate;

    source.start(0);
    return source;
  }
}
