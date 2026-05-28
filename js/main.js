// ===== Prototype utilities =====

// Simple bar chart drawn on <canvas>
// usage: drawBarChart(canvasEl, [{ label, value }], { max })
function drawBarChart(canvas, data, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
  const max = opts.max ?? Math.max(...data.map(d => d.value)) * 1.15;
  const barW = (W - pad.left - pad.right) / data.length * 0.6;
  const gap  = (W - pad.left - pad.right) / data.length;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);

  // grid lines
  [0.25, 0.5, 0.75, 1].forEach(r => {
    const y = pad.top + (1 - r) * (H - pad.top - pad.bottom);
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(max * r), pad.left - 4, y + 3);
  });

  // bars
  data.forEach((d, i) => {
    const x = pad.left + i * gap + (gap - barW) / 2;
    const bH = (d.value / max) * (H - pad.top - pad.bottom);
    const y = H - pad.bottom - bH;
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barW, bH);

    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, H - pad.bottom + 14);
  });
}

// Simple line chart
function drawLineChart(canvas, data, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const max = opts.max ?? Math.max(...data.map(d => d.value)) * 1.2;
  const min = opts.min ?? 0;
  const range = max - min;
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);

  const xOf = i => pad.left + (i / (data.length - 1)) * innerW;
  const yOf = v => pad.top + (1 - (v - min) / range) * innerH;

  // grid
  [0, 0.25, 0.5, 0.75, 1].forEach(r => {
    const y = pad.top + r * innerH;
    const val = max - r * range;
    ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#999'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(val), pad.left - 4, y + 3);
  });

  // area fill
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(data[0].value));
  data.forEach((d, i) => ctx.lineTo(xOf(i), yOf(d.value)));
  ctx.lineTo(xOf(data.length - 1), H - pad.bottom);
  ctx.lineTo(xOf(0), H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fill();

  // line
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(data[0].value));
  data.forEach((d, i) => ctx.lineTo(xOf(i), yOf(d.value)));
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.setLineDash([]);
  ctx.stroke();

  // dots + labels
  data.forEach((d, i) => {
    ctx.beginPath();
    ctx.arc(xOf(i), yOf(d.value), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#222'; ctx.fill();

    if (data.length <= 12) {
      ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.label, xOf(i), H - pad.bottom + 14);
    }
  });
}

// Toast notification
function showToast(msg, duration = 2000) {
  let toast = document.getElementById('_toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: '#111', color: '#fff', padding: '10px 18px', borderRadius: '4px',
      fontSize: '13px', zIndex: 9999, transition: 'opacity 0.2s', opacity: '0',
      whiteSpace: 'nowrap'
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, duration);
}

// Modal helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.style.display = 'none';
  }
});
