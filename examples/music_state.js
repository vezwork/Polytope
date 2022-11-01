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
                            return new Promise(resolve => setTimeout(resolve, notes.length * 1000 / 4))
                        }
                        
                        class StateMachine {constructor({ nodes, edges }) {    this.nodes = nodes;    this.edges = edges;    this.stateIndex = 0;}    next() {        const currentEdges = this.edges[this.stateIndex];        const randomEdge = Math.floor(          Math.random() * currentEdges.length        );        this.stateIndex = currentEdges[randomEdge];        return this.nodes[this.stateIndex];    }}const stateMachine =   new StateMachine(({      "nodes": ["([{"note":"e4","length":1},{"note":"f4","length":1},{"note":"g4","length":1}])","([{"note":"f4","length":1},{"note":"d5","length":1},{"note":"f4","length":1},{"note":"d5","length":1}])","([{"note":" ","length":1},{"note":"e4","length":1}])","([{"note":"e5","length":1},{"note":"d5","length":1},{"note":"c5","length":1},{"note":"b4","length":1}])"],      "edges": [[1],[2,3],[0],[2,0]],      "positions": [[5, 7],[194, 53],[18, 235],[193, 251]]  }));const looper = () => play(stateMachine.next()).then(looper)looper()