// static/script.js
document.addEventListener('DOMContentLoaded', () => {
  const gridEl = document.getElementById('grid');
  const gridSizeRange = document.getElementById('gridSize');
  const gridSizeVal = document.getElementById('gridSizeVal');
  const speedRange = document.getElementById('speed');
  const speedVal = document.getElementById('speedVal');
  const modeStart = document.getElementById('modeStart');
  const modeEnd = document.getElementById('modeEnd');
  const modeWall = document.getElementById('modeWall');
  const clearBtn = document.getElementById('clearBtn');
  const randWallBtn = document.getElementById('randWallBtn');
  const findBtn = document.getElementById('findBtn');
  const diagonalBox = document.getElementById('diagonal');

  let rows = parseInt(gridSizeRange.value);
  let cols = rows;
  let grid = [];
  let start = [Math.floor(rows/2), Math.floor(cols/4)];
  let end = [Math.floor(rows/2), Math.floor(cols*3/4)];
  let mode = 'start'; // 'start' | 'end' | 'wall'
  let mouseDown = false;

  gridSizeVal.textContent = rows;
  speedVal.textContent = speedRange.value;

  function buildGrid(r, c) {
    rows = r; cols = c;
    grid = Array.from({length:rows}, ()=> Array(cols).fill(0));
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    for (let i=0;i<rows;i++){
      for (let j=0;j<cols;j++){
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.r = i;
        cell.dataset.c = j;
        cell.addEventListener('mousedown', onCellDown);
        cell.addEventListener('mouseenter', onCellEnter);
        cell.addEventListener('mouseup', ()=> mouseDown=false);
        gridEl.appendChild(cell);
      }
    }
    placeStartEnd();
  }

  function placeStartEnd(){
    // ensure start/end inside grid
    start[0] = Math.min(Math.max(0, start[0]), rows-1);
    start[1] = Math.min(Math.max(0, start[1]), cols-1);
    end[0] = Math.min(Math.max(0, end[0]), rows-1);
    end[1] = Math.min(Math.max(0, end[1]), cols-1);
    renderGrid();
  }

  function renderGrid(){
    // Update DOM cells classes from grid + start/end
    const cells = gridEl.querySelectorAll('.cell');
    cells.forEach(div => {
      div.className = 'cell';
      const r = parseInt(div.dataset.r), c = parseInt(div.dataset.c);
      if (r===start[0] && c===start[1]) div.classList.add('start');
      else if (r===end[0] && c===end[1]) div.classList.add('end');
      else if (grid[r][c] === 1) div.classList.add('wall');
    });
  }

  function onCellDown(e){
    mouseDown = true;
    const r = parseInt(this.dataset.r);
    const c = parseInt(this.dataset.c);
    if (mode === 'start'){
      start = [r,c];
    } else if (mode === 'end'){
      end = [r,c];
    } else if (mode === 'wall'){
      grid[r][c] = grid[r][c] ? 0 : 1;
    }
    renderGrid();
  }

  function onCellEnter(e){
    if (!mouseDown) return;
    const r = parseInt(this.dataset.r);
    const c = parseInt(this.dataset.c);
    if (mode === 'wall'){
      grid[r][c] = 1;
      renderGrid();
    }
  }

  // controls
  gridSizeRange.addEventListener('input', () => {
    gridSizeVal.textContent = gridSizeRange.value;
  });
  gridSizeRange.addEventListener('change', () => {
    const n = parseInt(gridSizeRange.value);
    rows = cols = n;
    start = [Math.floor(n/2), Math.floor(n/4)];
    end = [Math.floor(n/2), Math.floor(n*3/4)];
    buildGrid(n, n);
  });

  speedRange.addEventListener('input', ()=> speedVal.textContent = speedRange.value);

  modeStart.addEventListener('click', ()=> setMode('start'));
  modeEnd.addEventListener('click', ()=> setMode('end'));
  modeWall.addEventListener('click', ()=> setMode('wall'));

  clearBtn.addEventListener('click', ()=>{
    grid = Array.from({length:rows}, ()=> Array(cols).fill(0));
    buildGrid(rows, cols);
  });

  randWallBtn.addEventListener('click', ()=>{
    for (let i=0;i<rows;i++){
      for (let j=0;j<cols;j++){
        if ((i===start[0] && j===start[1])||(i===end[0]&&j===end[1])) continue;
        grid[i][j] = (Math.random() < 0.2) ? 1 : 0; // 20% walls
      }
    }
    renderGrid();
  });

  findBtn.addEventListener('click', async ()=>{
    // send grid to backend
    findBtn.disabled = true;
    const payload = {
      grid: grid,
      start: start,
      end: end,
      rows: rows,
      cols: cols,
      speed: parseInt(speedRange.value),
      diagonal: diagonal.checked
    };
    try {
      const res = await fetch('/api/find_path', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      await animateResult(data.visited, data.path, parseInt(speedRange.value));
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      findBtn.disabled = false;
    }
  });

  function setMode(m){
    mode = m;
    modeStart.classList.toggle('active', m==='start');
    modeEnd.classList.toggle('active', m==='end');
    modeWall.classList.toggle('active', m==='wall');
  }

  async function animateResult(visited, path, speed){
    // first mark visited
    renderGrid();
    for (let i=0;i<visited.length;i++){
      const [r,c] = visited[i];
      // don't override start/end
      if ((r===start[0] && c===start[1]) || (r===end[0] && c===end[1])) continue;
      const sel = `.cell[data-r="${r}"][data-c="${c}"]`;
      const el = document.querySelector(sel);
      if (el) el.classList.add('visited');
      await sleep(speed);
    }
    // then mark path
    if (path.length === 0){
      alert('No path found!');
      return;
    }
    for (let k=0;k<path.length;k++){
      const [r,c] = path[k];
      if ((r===start[0] && c===start[1]) || (r===end[0] && c===end[1])) continue;
      const sel = `.cell[data-r="${r}"][data-c="${c}"]`;
      const el = document.querySelector(sel);
      if (el){
        el.classList.remove('visited');
        el.classList.add('path');
      }
      await sleep(Math.max(20, speed/1.3));
    }
  }

  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

  // init
  buildGrid(rows, cols);
  setMode('start');
});
