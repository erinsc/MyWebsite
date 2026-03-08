const TAPE_SIZE     = 30000;
var VISIBLE_CELLS = 19; // must be odd
let visibleOffset = 0;
let STEP_INTERVAL   = 100;
const BF_OPS = new Set(['+', '-', '>', '<', '[', ']', '.', ',', '!']);
const BF_OPT_OPS = new Set(['+', '-', '>', '<']);

let tape;
let tapePtr;
let program;
let programPtr;

let inputPtr;
let loopMap;
let intervalHandle;
let steps;

const programBox   = document.getElementById('ProgramBox');
const inputBox     = document.getElementById('InputBox');
const outputBox    = document.getElementById('OutputBox');
const programHL    = document.getElementById('ProgramHighlight');
const inputHL      = document.getElementById('InputHighlight');
const tapeBox      = document.getElementById('BfTape');
const startButton  = document.getElementById('BtnStart');
const stepButton   = document.getElementById('BtnStep');
const OptimButton  = document.getElementById('BtnOptimise');
const stepsLabel   = document.getElementById('StepsLabel');
const speedSlider  = document.getElementById('SpeedSlider');
const speedLabel   = document.getElementById('SpeedLabel');

speedSlider.addEventListener('input', () => {
  STEP_INTERVAL = parseInt(speedSlider.value, 10);
  speedLabel.textContent = STEP_INTERVAL + 'ms';

  if (startButton.classList.contains("running")) {
    clearInterval(intervalHandle);
    intervalHandle = setInterval(() => {
      if (!stepOnce())
        clearInterval(intervalHandle);
    }, STEP_INTERVAL);
  }
});
// Copy styles of program textbox into highlight box so they align
function syncHighlightStyles() {
  const cs = window.getComputedStyle(programBox);
  const is = window.getComputedStyle(inputBox);
  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
    'lineHeight', 'letterSpacing', 'wordSpacing',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing', 'width',
    'textTransform', 'textIndent',
    'whiteSpace', 'wordWrap', 'overflowWrap',
    'tabSize',
  ];
  for (const prop of props) {
    programHL.style[prop] = cs[prop];
    inputHL.style[prop] = is[prop];
  }
  programHL.style.borderStyle = 'solid';
  programHL.style.borderColor = 'transparent';
  programHL.style.background  = 'transparent';
  programHL.style.color       = 'transparent';
  programHL.style.whiteSpace  = 'pre-wrap';
  programHL.style.overflow    = 'hidden';
  programHL.style.position    = 'absolute';
  programHL.style.top         = '0';
  programHL.style.left        = '0';
  programHL.style.height      = '100%';
  programHL.style.pointerEvents = 'none';
  programHL.style.zIndex      = '2';
  
  inputHL.style.borderStyle = 'solid';
  inputHL.style.borderColor = 'transparent';
  inputHL.style.background  = 'transparent';
  inputHL.style.color       = 'transparent';
  inputHL.style.whiteSpace  = 'pre-wrap';
  inputHL.style.overflow    = 'hidden';
  inputHL.style.position    = 'absolute';
  inputHL.style.top         = '0';
  inputHL.style.left        = '0';
  inputHL.style.height      = '100%';
  inputHL.style.pointerEvents = 'none';
  inputHL.style.zIndex      = '2';
}

syncHighlightStyles();
new ResizeObserver(syncHighlightStyles).observe(programBox);

const cellEls = [];
for (let i = 0; i < VISIBLE_CELLS; i++) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bf-cell-wrapper';

  const idx = document.createElement('div');
  idx.className = 'bf-cell-index';
  idx.textContent = '0'; // updated in renderTape

  const el = document.createElement('div');
  el.className = 'bf-cell';
  el.textContent = '0';

  wrapper.appendChild(idx);
  wrapper.appendChild(el);

  tapeBox.appendChild(wrapper);
  cellEls.push({ el, idx, wrapper });
}

OptimButton.addEventListener('click', () => {
  if (OptimButton.classList.contains('disabled')) return;
  OptimButton.classList.toggle('on');
});

function buildLoopMap(instrs) {
  const map = {};
  const stack = [];
  for (let i = 0; i < instrs.length; i++) {
    if (instrs[i].type === '[')
      stack.push(i);
    else if (instrs[i].type === ']') {
      if (!stack.length) continue;
      const j = stack.pop();
      map[j] = i; map[i] = j;
    }
  }
  return map;
}

// ---- Compiler: collapse runs of +/-/>/< into single instructions ----
function compile(prog) {
  const instrs = [];
  let i = 0;
  while (i < prog.length) {
    const ch = prog[i];
    if (BF_OPT_OPS.has(ch)) {
      const start = i;
      let delta = 0;
      do {
        delta += 1;
        i++;
      } while (OptimButton.classList.contains('on') && i < prog.length && (prog[i] === ch));

      instrs.push({ type: ch, delta, srcStart: start, srcEnd: i - 1 });
    } 
    else if (BF_OPS.has(ch)) {
      instrs.push({ type: ch, delta: 1, srcStart: i, srcEnd: i });
      i++;
    }
    else {
      i++;
    } 
  }
  return instrs;
}

// --------------------------------------------------------------

function endState() {
  clearInterval(intervalHandle);
  startButton.textContent = 'Reset';
}

function resetState() {
  clearInterval(intervalHandle);

  tape = new Uint8Array(TAPE_SIZE);
  tapePtr = 0;
  steps = 0;
  program = compile(programBox.value);
  programPtr = 0; 
  inputPtr = 0
  visibleOffset = 0;

  loopMap = buildLoopMap(program);
  inputBox.classList.remove('input-exhausted');
  renderTape();
  clearHighlight();
  outputBox.value     = '';
  stepsLabel.textContent = '0';
  startButton.textContent = 'Start';
  startButton.classList.remove('running');
  OptimButton.classList.remove('disabled');
  programBox.disabled = false;
}

// ---- Highlight overlay ----
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function clearHighlight() {
  programHL.innerHTML = '';
  inputHL.innerHTML = '';
}

function applyHighlight() {
  if (programPtr >= program.length) 
    return null;
  const instr = program[programPtr];
  var ranges = [{ start: instr.srcStart, end: instr.srcEnd, cls: 'hl-current' }];

  if (instr.type === '[') {
    const mi = loopMap[programPtr];
    const m = program[mi];
    ranges.push({ start: m.srcStart, end: m.srcEnd, cls: 'hl-bracket' });
  }
  else if (instr.type === ']') {
    const mi = loopMap[programPtr];
    const m = program[mi];
    ranges.unshift({ start: m.srcStart, end: m.srcEnd, cls: 'hl-bracket' });
  }

  const prog = programBox.value;
  let html = '', cursor = 0;
  for (const r of ranges) {
    html += escHtml(prog.slice(cursor, r.start));
    html += `<span class="${r.cls}">${escHtml(prog.slice(r.start, r.end + 1))}</span>`;
    cursor = r.end + 1;
  }
  html += escHtml(prog.slice(cursor));
  programHL.innerHTML = html;
  programHL.scrollTop = programBox.scrollTop;
}

// ---- Tape rendering ----
function renderTape(flashDp = false) {
  visibleOffset = Math.min(tapePtr, Math.max(visibleOffset, tapePtr - VISIBLE_CELLS + 1));

  for (let i = 0; i < VISIBLE_CELLS; i++) {
    const ti = visibleOffset + i;
    const { el, idx } = cellEls[i];
      idx.textContent = ti;
      el.textContent = tape[ti];


      if (ti === tapePtr) {
        el.classList.add('pointer');
        if (flashDp) {
          el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
        }
      } else {
        el.classList.remove('pointer');
      }
  }
}

function readInputChar() {
  const text = inputBox.value + ' ';
  let html = '';
  html += escHtml(text.slice(0, inputPtr));
  html += `<span class="hl-current">${escHtml(text.slice(inputPtr, inputPtr + 1))}</span>`;
  html += escHtml(text.slice(inputPtr + 1));

  inputHL.innerHTML = html;
  inputHL.scrollTop = programBox.scrollTop;

  if (inputPtr >= inputBox.value.length) {
    inputBox.classList.add('input-exhausted');
    return 0;
  } else {
    inputBox.classList.remove('input-exhausted');
    const ch = inputBox.value.charCodeAt(inputPtr);
    inputPtr++;
    return ch;
  }
}
function stepOnce() {
  if (programPtr >= program.length) {
    endState();
    return false;
  }

  applyHighlight();

  const instr = program[programPtr];

  switch (instr.type) {
    case '>':
      tapePtr += instr.delta;
      renderTape();
      break;
    case '<':
      tapePtr -= instr.delta;
      renderTape();
      break;
    case '+':
      tape[tapePtr] += instr.delta;
      renderTape(true);
      break;
    case '-':
      tape[tapePtr] -= instr.delta;
      renderTape(true);
      break;
    case '.':
      outputBox.value += String.fromCharCode(tape[tapePtr]);
      break;
    case ',': {
      const c = readInputChar();
      if (c === null) return false;
      tape[tapePtr] = c & 0xFF;
      renderTape(true);
      break;
    }
    case '[': {
      if (tape[tapePtr] === 0)
      programPtr = loopMap[programPtr];
      break;
    }   
    case ']': {
      if (tape[tapePtr] !== 0)
      programPtr = loopMap[programPtr];
      break;
    }
    case '!': {
      pause();
      break;
    }
  }
  programPtr += 1;
  steps += instr.delta;
  stepsLabel.textContent = steps;
  return true;
}

// ---- Playback controls ----
function startRunning() {
  startButton.textContent = 'Stop';
  startButton.classList.add('running');
  OptimButton.classList.add('disabled');
  programBox.disabled = true;
  intervalHandle = setInterval(() => { 
    if (!stepOnce()) 
      clearInterval(intervalHandle);
    }, STEP_INTERVAL);
}

function pause() {
  clearInterval(intervalHandle);
  startButton.textContent = 'Resume';
  startButton.classList.remove('running');
  programBox.disabled = true;
}
startButton.addEventListener('click', () => {
  if (startButton.classList.contains("running")) {
    resetState();
    return;
  }
  else if (steps === 0) {
    resetState();
    startRunning();
  }
  else startRunning();
});

stepButton.addEventListener('click', () => {
  if (startButton.classList.contains("running")) {
    pause();
    return;
  }
  if (steps === 0)
    resetState();
  stepOnce();
  startButton.textContent = 'Resume';
  startButton.classList.remove('running');
  OptimButton.classList.add('disabled');
  programBox.disabled = true;
});

programBox.addEventListener('scroll', () => {
  programHL.scrollTop = programBox.scrollTop;
});

resetState();
