const TAPE_SIZE     = 30000;
const VISIBLE_CELLS = 21; // must be odd
let STEP_INTERVAL   = 100;
const BF_OPS = new Set(['+', '-', '>', '<', '[', ']', '.', ',']);
const BF_OPT_OPS = new Set(['+', '-', '>', '<']);

let tape;
let tapePtr;
let program;
let programPtr;
let loopMap;
let intervalHandle;
let steps;

const programInput = document.getElementById('ProgramTextbox');
const inputBox     = document.getElementById('InputTextbox');
const outputBox    = document.getElementById('OutputTextbox');
const highlightEl  = document.getElementById('BfHighlight');
const tapeTrack    = document.getElementById('BfTape');
const btnStart     = document.getElementById('BtnStart');
const btnStep      = document.getElementById('BtnStep');
const btnOptimise  = document.getElementById('BtnOptimise');
const elSteps      = document.getElementById('BfSteps');
const speedSlider  = document.getElementById('SpeedSlider');
const speedLabel   = document.getElementById('SpeedLabel');

speedSlider.addEventListener('input', () => {
  STEP_INTERVAL = parseInt(speedSlider.value, 10);
  speedLabel.textContent = STEP_INTERVAL + 'ms';

  if (btnStart.classList.contains("running")) {
    clearInterval(intervalHandle);
    intervalHandle = setInterval(() => {
      if (!stepOnce())
        clearInterval(intervalHandle);
    }, STEP_INTERVAL);
  }
});

// Copy styles of program textbox into highlight box so they align
function syncHighlightStyles() {
  const cs = window.getComputedStyle(programInput);
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
    highlightEl.style[prop] = cs[prop];
  }
  highlightEl.style.borderStyle = 'solid';
  highlightEl.style.borderColor = 'transparent';
  highlightEl.style.background  = 'transparent';
  highlightEl.style.color       = 'transparent';
  highlightEl.style.whiteSpace  = 'pre-wrap';
  highlightEl.style.overflow    = 'hidden';
  highlightEl.style.position    = 'absolute';
  highlightEl.style.top         = '0';
  highlightEl.style.left        = '0';
  highlightEl.style.height      = '100%';
  highlightEl.style.pointerEvents = 'none';
  highlightEl.style.zIndex      = '2';
}

syncHighlightStyles();
new ResizeObserver(syncHighlightStyles).observe(programInput);

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

  tapeTrack.appendChild(wrapper);
  cellEls.push({ el, idx, wrapper });
}

btnOptimise.addEventListener('click', () => {
  if (btnOptimise.classList.contains('disabled')) return;
  btnOptimise.classList.toggle('on');
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
      } while (btnOptimise.classList.contains('on') && i < prog.length && (prog[i] === ch));

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
  btnStart.textContent = 'Reset';
}

function resetState() {
  clearInterval(intervalHandle);

  tape = new Uint8Array(TAPE_SIZE);
  tapePtr = 0;
  steps = 0;
  program = compile(programInput.value);
  programPtr = 0; 


  loopMap = buildLoopMap(program);
  inputBox.classList.remove('input-exhausted');
  renderTape();
  clearHighlight();
  outputBox.value     = '';
  elSteps.textContent = '0';
  btnStart.textContent = 'Start';
  btnStart.classList.remove('running');
  btnOptimise.classList.remove('disabled');
  programInput.disabled = false;
  inputBox.disabled = false;
}

// ---- Highlight overlay ----
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function clearHighlight() {
  highlightEl.innerHTML = '';
}

function applyHighlight() {
  if (programPtr >= program.length) return null;
  const instr = program[programPtr];
  var ranges = [{ start: instr.srcStart, end: instr.srcEnd, cls: 'hl-current' }];
  if (instr.type === '[' || instr.type === ']') {
    const mi = loopMap[programPtr];
    if (mi !== undefined) {
      const m = program[mi];
      ranges.push({ start: m.srcStart, end: m.srcEnd, cls: 'hl-bracket' });
    }
  }

  console.log(ranges);
  if (!ranges || !ranges.length) { clearHighlight(); return; }
  const prog = programInput.value;
  ranges = [...ranges].sort((a, b) => a.start - b.start);
  let html = '', cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) html += escHtml(prog.slice(cursor, r.start));
    html += `<span class="${r.cls}">${escHtml(prog.slice(r.start, r.end + 1))}</span>`;
    cursor = r.end + 1;
  }
  if (cursor < prog.length) html += escHtml(prog.slice(cursor));
  highlightEl.innerHTML = html;
  highlightEl.scrollTop = programInput.scrollTop;
}

// ---- Tape rendering ----
function renderTape(flashDp = false) {
  const half = Math.floor(VISIBLE_CELLS / 2);
  for (let i = 0; i < VISIBLE_CELLS; i++) {
    const ti = tapePtr - half + i;
    const { el, idx } = cellEls[i];
    if (ti < 0 || ti >= TAPE_SIZE) {
      el.textContent = '';
      idx.textContent = '';
      el.style.opacity = '0';
      idx.style.opacity = '0';
    } else {
      el.style.opacity = '1';
      idx.style.opacity = '1';
      idx.textContent = ti;
      const val = tape[ti];
      el.textContent = val;
      el.classList.toggle('nonzero', val !== 0);
      if (flashDp && i === half) {
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
      }
    }
  }
}

function readInputChar() {
  const val = inputBox.value;
  if (val.length === 0) {
    inputBox.classList.add('input-exhausted');
    clearInterval(intervalHandle);
    return null;
  }
  const ch = val.charCodeAt(0);
  inputBox.value = val.slice(1);
  return ch;
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
  }
  programPtr++;
  steps++;
  elSteps.textContent = steps;
  return true;
}

// ---- Playback controls ----
function startRunning() {
  btnStart.textContent = 'Stop';
  btnStart.classList.add('running');
  btnOptimise.classList.add('disabled');
  programInput.disabled = true;
  inputBox.disabled = true;
  intervalHandle = setInterval(() => { 
    if (!stepOnce()) 
      clearInterval(intervalHandle);
    }, STEP_INTERVAL);
}

function pause() {
  clearInterval(intervalHandle);
  btnStart.textContent = 'Resume';
  btnStart.classList.remove('running');
  programInput.disabled = true;
  inputBox.disabled = false;
}
btnStart.addEventListener('click', () => {
  if (btnStart.classList.contains("running")) {
    resetState();
    return;
  }
  else if (steps === 0) {
    resetState();
    startRunning();
  }
  else startRunning();
});

btnStep.addEventListener('click', () => {
  if (btnStart.classList.contains("running")) {
    pause();
    return;
  }
  if (steps === 0)
    resetState();
  stepOnce();
  btnStart.textContent = 'Resume';
  btnStart.classList.remove('running');
  btnOptimise.classList.add('disabled');
  programInput.disabled = true;
  inputBox.disabled = false;
});

programInput.addEventListener('scroll', () => {
  highlightEl.scrollTop = programInput.scrollTop;
});

resetState();
