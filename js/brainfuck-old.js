const TAPE_SIZE     = 30000;
const VISIBLE_CELLS = 21; // must be odd
let STEP_INTERVAL   = 100;
const BF_OPS = new Set(['+', '-', '>', '<', '[', ']', '.', ',']);

let tape, dp, ip, instrPtr, outputStr, rawProgram, loopMap, compiledInstructions;
let intervalId, running, steps, optimized;

optimized = false;

const programInput = document.getElementById('ProgramTextbox');
const inputBox     = document.getElementById('InputTextbox');
const outputBox    = document.getElementById('OutputTextbox');
const highlightEl  = document.getElementById('BfHighlight');
const tapeTrack    = document.getElementById('BfTape');
const btnStart     = document.getElementById('BtnStart');
const btnStep      = document.getElementById('BtnStep');
const btnReset     = document.getElementById('BtnReset');
const btnOptimise  = document.getElementById('BtnOptimise');
const elSteps      = document.getElementById('BfSteps');
const speedSlider  = document.getElementById('SpeedSlider');
const speedLabel   = document.getElementById('SpeedLabel');

// ---- Speed slider ----
speedSlider.addEventListener('input', () => {
  STEP_INTERVAL = parseInt(speedSlider.value, 10);
  speedLabel.textContent = STEP_INTERVAL + 'ms';
  // If currently running, restart interval with new speed
  if (running) {
    clearInterval(intervalId);
    intervalId = setInterval(() => { if (!stepOnce()) clearInterval(intervalId); }, STEP_INTERVAL);
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

// ---- Build tape cells (with index labels) ----
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
  optimized = !optimized;
  btnOptimise.classList.toggle('on', optimized);
});

function buildLoopMap(prog) {
  const map = {};
  const stack = [];
  for (let i = 0; i < prog.length; i++) {
    if (prog[i] === '[') stack.push(i);
    else if (prog[i] === ']') {
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
    if (!BF_OPS.has(ch)) { i++; continue; }
    if (ch === '+' || ch === '-') {
      const start = i;
      let delta = 0;
      while (i < prog.length && (prog[i] === '+' || prog[i] === '-')) {
        delta += prog[i] === '+' ? 1 : -1;
        i++;
      }
      instrs.push({ type: 'data', delta, srcStart: start, srcEnd: i - 1 });
    } else if (ch === '>' || ch === '<') {
      const start = i;
      let delta = 0;
      while (i < prog.length && (prog[i] === '>' || prog[i] === '<')) {
        delta += prog[i] === '>' ? 1 : -1;
        i++;
      }
      instrs.push({ type: 'ptr', delta, srcStart: start, srcEnd: i - 1 });
    } else {
      instrs.push({ type: ch, delta: 1, srcStart: i, srcEnd: i });
      i++;
    }
  }
  const lm = {};
  const stk = [];
  for (let j = 0; j < instrs.length; j++) {
    if (instrs[j].type === '[') stk.push(j);
    else if (instrs[j].type === ']') {
      if (!stk.length) continue;
      const k = stk.pop();
      lm[k] = j; lm[j] = k;
    }
  }
  instrs._loopMap = lm;
  return instrs;
}

function initState() {
  tape = new Uint8Array(TAPE_SIZE);
  dp = 0; ip = 0; instrPtr = 0; outputStr = ''; steps = 0; running = false;
  rawProgram = programInput.value;
  loopMap = buildLoopMap(rawProgram);
  compiledInstructions = compile(rawProgram);
  inputBox.classList.remove('input-exhausted');
  renderTape();
  clearHighlight();
  outputBox.value     = '';
  elSteps.textContent = '0';
  setStatus('idle');
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

function applyHighlight(ranges) {
  if (!ranges || !ranges.length) { clearHighlight(); return; }
  const prog = rawProgram;
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

function computeHighlightRanges() {
  if (optimized) {
    const instrs = compiledInstructions;
    if (instrPtr >= instrs.length) return null;
    const instr = instrs[instrPtr];
    const ranges = [{ start: instr.srcStart, end: instr.srcEnd, cls: 'hl-current' }];
    if (instr.type === '[' || instr.type === ']') {
      const mi = instrs._loopMap[instrPtr];
      if (mi !== undefined) {
        const m = instrs[mi];
        ranges.push({ start: m.srcStart, end: m.srcEnd, cls: 'hl-bracket' });
      }
    }
    return ranges;
  } else {
    let cur = ip;
    while (cur < rawProgram.length && !BF_OPS.has(rawProgram[cur])) cur++;
    if (cur >= rawProgram.length) return null;
    const ranges = [{ start: cur, end: cur, cls: 'hl-current' }];
    const ch = rawProgram[cur];
    if ((ch === '[' || ch === ']') && loopMap[cur] !== undefined) {
      ranges.push({ start: loopMap[cur], end: loopMap[cur], cls: 'hl-bracket' });
    }
    return ranges;
  }
}

// ---- Tape rendering ----
function renderTape(flashDp = false) {
  const half = Math.floor(VISIBLE_CELLS / 2);
  for (let i = 0; i < VISIBLE_CELLS; i++) {
    const ti = dp - half + i;
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

// ---- Read input character ----
function readInputChar() {
  const val = inputBox.value;
  if (val.length === 0) {
    // No input available — stop program and highlight box
    inputBox.classList.add('input-exhausted');
    stop(false);
    return null;
  }
  const ch = val.charCodeAt(0);
  inputBox.value = val.slice(1);
  return ch;
}

// ---- Step: unoptimised ----
function stepRaw() {
  while (ip < rawProgram.length && !BF_OPS.has(rawProgram[ip])) ip++;
  if (ip >= rawProgram.length) { stop(true); return false; }

  applyHighlight(computeHighlightRanges());

  const ch = rawProgram[ip];
  let flash = false;

  switch (ch) {
    case '>': dp = Math.min(dp + 1, TAPE_SIZE - 1); renderTape(); break;
    case '<': dp = Math.max(dp - 1, 0);              renderTape(); break;
    case '+': tape[dp] = (tape[dp] + 1) & 0xFF; flash = true; break;
    case '-': tape[dp] = (tape[dp] - 1) & 0xFF; flash = true; break;
    case '.':
      outputStr += String.fromCharCode(tape[dp]);
      outputBox.value = outputStr;
      break;
    case ',': {
      const c = readInputChar();
      if (c === null) return false;
      tape[dp] = c & 0xFF;
      flash = true;
      break;
    }
    case '[': if (tape[dp] === 0) ip = loopMap[ip] ?? ip; break;
    case ']': if (tape[dp] !== 0) ip = loopMap[ip] ?? ip; break;
  }

  if (flash) renderTape(true);

  ip++;
  steps++;
  elSteps.textContent = steps;
  return true;
}

// ---- Step: optimised ----
function stepOptimized() {
  const instrs = compiledInstructions;
  if (instrPtr >= instrs.length) { stop(true); return false; }

  applyHighlight(computeHighlightRanges());

  const instr = instrs[instrPtr];
  let flash = false;

  switch (instr.type) {
    case 'ptr':
      dp = Math.max(0, Math.min(TAPE_SIZE - 1, dp + instr.delta));
      renderTape();
      break;
    case 'data':
      tape[dp] = ((tape[dp] + instr.delta) % 256 + 256) & 0xFF;
      flash = true;
      break;
    case '.':
      outputStr += String.fromCharCode(tape[dp]);
      outputBox.value = outputStr;
      break;
    case ',': {
      const c = readInputChar();
      if (c === null) return false;
      tape[dp] = c & 0xFF;
      flash = true;
      break;
    }
    case '[': if (tape[dp] === 0) instrPtr = instrs._loopMap[instrPtr] ?? instrPtr; break;
    case ']': if (tape[dp] !== 0) instrPtr = instrs._loopMap[instrPtr] ?? instrPtr; break;
  }

  if (flash) renderTape(true);

  instrPtr++;
  steps++;
  elSteps.textContent = steps;
  return true;
}

function stepOnce() {
  return optimized ? stepOptimized() : stepRaw();
}

// ---- Playback controls ----
function startRunning() {
  running = true;
  setStatus('running');
  btnStart.textContent = 'Stop';
  btnStart.classList.add('running');
  btnOptimise.classList.add('disabled');
  programInput.disabled = true;
  inputBox.disabled = true;
  intervalId = setInterval(() => { if (!stepOnce()) clearInterval(intervalId); }, STEP_INTERVAL);
}

function pause() {
  running = false;
  clearInterval(intervalId);
  setStatus('paused');
  btnStart.textContent = 'Resume';
  btnStart.classList.remove('running');
  programInput.disabled = true; // keep disabled while paused mid-execution
  inputBox.disabled = false;
}

function stop(done) {
  running = false;
  clearInterval(intervalId);
  btnStart.textContent = 'Start';
  btnStart.classList.remove('running');
  btnOptimise.classList.remove('disabled');
  programInput.disabled = false;
  inputBox.disabled = false;
  if (done) clearHighlight();
  setStatus(done ? 'done' : 'idle');
}

function setStatus(state) {
  // No visible status element currently — placeholder for future use
}

// ---- Button listeners ----
btnStart.addEventListener('click', () => {
  if (running) { stop(false); return; } // Stop when running
  if (steps === 0) { initState(); startRunning(); }
  else startRunning();
});

btnStep.addEventListener('click', () => {
  if (running) { pause(); return; }
  if (steps === 0) initState();
  stepOnce();
  setStatus('paused');
  btnStart.textContent = 'Resume';
  btnStart.classList.remove('running');
  btnOptimise.classList.add('disabled');
  programInput.disabled = true;
  inputBox.disabled = false;
});

btnReset.addEventListener('click', () => {
  stop(false);
  initState();
});

// Keep highlight overlay scrolled in sync with textarea
programInput.addEventListener('scroll', () => {
  highlightEl.scrollTop = programInput.scrollTop;
});

// ---- Boot ----
initState();
