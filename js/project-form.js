// ===== project-form.js =====

// ── KPI 메타데이터 ──
const KPI_META = [
  { v:'불량률',       t:'망소' },
  { v:'유저이탈율',   t:'망소' },
  { v:'제조시간',     t:'망소' },
  { v:'배출가스',     t:'망소' },
  { v:'불량 발생율',  t:'망소' },
  { v:'재작업률',     t:'망소' },
  { v:'에너지소비량', t:'망소' },
  { v:'생산량',       t:'망대' },
  { v:'매출액',       t:'망대' },
  { v:'고객만족도',   t:'망대' },
  { v:'생산성',       t:'망대' },
  { v:'설비가동률',   t:'망대' },
  { v:'수율',         t:'망대' },
  { v:'길이',         t:'망목' },
  { v:'중량',         t:'망목' },
  { v:'전압',         t:'망목' },
  { v:'특허 달성 건수', t:'망목' },
];

const KPI_TYPE_COLOR = { '망소':'#4a7abd', '망대':'#2a7a2a', '망목':'#7a5a00' };

function buildKpiOptions() {
  return KPI_META.map(k =>
    `<option value="${k.v}" data-type="${k.t}">[${k.t}] ${k.v}</option>`
  ).join('');
}

// ── 개선율 계산 ──
function calcRate(kpiType, current, target) {
  const c = parseFloat(current), t = parseFloat(target);
  if (isNaN(c) || isNaN(t) || c === 0) return null;
  if (kpiType === '망대') return ((t - c) / Math.abs(c)) * 100;
  if (kpiType === '망소') return ((c - t) / Math.abs(c)) * 100;
  if (kpiType === '망목') return (Math.abs(c - t) / Math.abs(c)) * 100;
  return null;
}

// ── ID 카운터 ──
let _id = 0;
const uid = () => ++_id;

// ── KPI 추가 ──
function addKpi(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  const id = uid();
  const div = document.createElement('div');
  div.className = 'kpi-item';
  div.dataset.kpiId = id;
  div.innerHTML = `
    <label class="main-kpi-label">
      <input type="radio" name="mainKpi" value="${id}"> 주&nbsp;KPI
    </label>
    <select class="select" data-role="kpiSel" onchange="onKpiChange(${id})">
      <option value="">KPI 선택</option>
      ${buildKpiOptions()}
    </select>
    <input class="input" type="number" data-role="cur" placeholder="개선전 수치"
           step="any" oninput="onKpiChange(${id})" />
    <input class="input" type="number" data-role="tgt" placeholder="목표값"
           step="any" oninput="onKpiChange(${id})" />
    <div class="kpi-rate" id="kpiRate-${id}">개선율<br>—</div>
    <button class="btn btn-outline text-sm" onclick="removeKpi(${id},'${listId}')">삭제</button>
  `;
  list.appendChild(div);
  syncKpiEmpty(listId);
}

function onKpiChange(id) {
  const item = document.querySelector(`.kpi-item[data-kpi-id="${id}"]`);
  if (!item) return;
  const sel = item.querySelector('[data-role="kpiSel"]');
  const opt = sel.options[sel.selectedIndex];
  const kpiType = opt?.dataset?.type || '';
  const cur = item.querySelector('[data-role="cur"]').value;
  const tgt = item.querySelector('[data-role="tgt"]').value;
  const badge = document.getElementById(`kpiRate-${id}`);
  const rate = calcRate(kpiType, cur, tgt);
  const label = kpiType === '망목' ? '목표편차' : '개선율';
  if (rate === null) {
    badge.className = 'kpi-rate';
    badge.innerHTML = `${label}<br>—`;
    return;
  }
  const pct = rate.toFixed(1);
  const isGood = kpiType === '망목' ? rate <= 5 : rate > 0;
  badge.className = `kpi-rate ${isGood ? 'positive' : 'negative'}`;
  badge.innerHTML = `${label}<br>${pct}%`;
}

function removeKpi(id, listId) {
  document.querySelector(`.kpi-item[data-kpi-id="${id}"]`)?.remove();
  syncKpiEmpty(listId);
}

function syncKpiEmpty(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  const emptyId = listId.replace('KpiList', 'KpiEmpty').replace('kpiList', 'kpiEmpty');
  const empty = document.getElementById(emptyId);
  if (!empty) return;
  empty.style.display = list.querySelector('.kpi-item') ? 'none' : '';
}

// ── 직접지원 체크박스 잠금 ──
function initSupportCheckboxes() {
  const chkDirect = document.getElementById('chkDirect');
  const chkConsulting = document.getElementById('chkConsulting');
  const alert = document.getElementById('directAlert');
  let alertTimer;

  // 직접지원: 클릭해도 항상 checked 유지
  chkDirect.addEventListener('click', e => {
    e.preventDefault();
    chkDirect.checked = true;
    alert.style.display = 'inline';
    clearTimeout(alertTimer);
    alertTimer = setTimeout(() => { alert.style.display = 'none'; }, 3000);
    showToast('직접지원은 항상 포함됩니다.');
  });

  chkConsulting.addEventListener('change', updateSubProjectArea);
  updateSubProjectArea();
}

// ── 세부과제 영역 ──
function updateSubProjectArea() {
  const consulting = document.getElementById('chkConsulting')?.checked;
  const area = document.getElementById('subProjectArea');
  area.innerHTML = '';

  // 직접지원 세부과제는 항상
  area.appendChild(buildDirectSection());
  if (consulting) area.appendChild(buildConsultingSection());
}

// ─────────────────────────────────────────────
// 직접지원 세부과제
// ─────────────────────────────────────────────
function buildDirectSection() {
  const wrap = document.createElement('div');
  wrap.className = 'card mb-16';
  wrap.id = 'directSubProject';
  wrap.innerHTML = `
    <span class="section-title">직접지원 세부과제</span>

    <!-- KPI -->
    <div class="inner-section mb-16">
      <div class="inner-section-head">
        <span class="inner-section-title">KPI</span>
        <button class="btn btn-outline text-sm" onclick="addKpi('directKpiList')">+ KPI 추가</button>
      </div>
      <div id="directKpiList"></div>
      <div class="placeholder" style="height:40px;" id="directKpiEmpty">KPI를 추가하세요</div>
    </div>

    <!-- 직접지원 품목 -->
    <div class="inner-section">
      <div class="inner-section-head">
        <span class="inner-section-title">직접지원 품목</span>
        <button class="btn btn-outline text-sm" onclick="addDirectItem()">+ 품목 추가</button>
      </div>
      <div id="directItemList">
        <div class="placeholder" style="height:40px;" id="directItemEmpty">품목을 추가하세요</div>
      </div>
    </div>
  `;
  return wrap;
}

let _itemId = 0;

function addDirectItem() {
  const list = document.getElementById('directItemList');
  document.getElementById('directItemEmpty')?.remove();
  const id = ++_itemId;
  const div = document.createElement('div');
  div.className = 'item-card';
  div.dataset.itemId = id;
  div.innerHTML = `
    <div class="item-card-head">
      <span class="text-sm font-bold text-sub">품목 ${id}</span>
      <button class="btn btn-outline text-sm" onclick="removeDirectItem(${id})">삭제</button>
    </div>
    <div class="grid-3 mb-16">
      <div>
        <label class="label">품목명 *</label>
        <input class="input" type="text" placeholder="품목명 입력" />
      </div>
      <div>
        <label class="label">취득일자</label>
        <input class="input" type="date" />
      </div>
      <div>
        <label class="label">금액 (원)</label>
        <input class="input" type="number" placeholder="0" min="0" step="1000"
               oninput="fmtAmount(this)" />
      </div>
    </div>
    <div>
      <label class="label">파일 첨부 (견적서 등)</label>
      <div class="row" style="gap:8px; margin-bottom:6px;">
        <input type="file" id="fi-${id}" multiple accept="*/*" style="display:none;"
               onchange="handleFiles(${id}, this)" />
        <button class="btn btn-outline text-sm" onclick="document.getElementById('fi-${id}').click()">
          📎 파일 선택
        </button>
        <span class="text-sm text-sub" id="fcnt-${id}">첨부 없음</span>
      </div>
      <div class="file-list" id="flist-${id}"></div>
    </div>
  `;
  list.appendChild(div);
}

function removeDirectItem(id) {
  document.querySelector(`.item-card[data-item-id="${id}"]`)?.remove();
  const list = document.getElementById('directItemList');
  if (list && !list.querySelector('.item-card')) {
    const e = document.createElement('div');
    e.className = 'placeholder'; e.id = 'directItemEmpty';
    e.style.height = '40px'; e.textContent = '품목을 추가하세요';
    list.appendChild(e);
  }
}

function fmtAmount(input) {
  // 음수 방지
  if (parseFloat(input.value) < 0) input.value = 0;
}

function handleFiles(id, input) {
  const flist = document.getElementById(`flist-${id}`);
  const fcnt = document.getElementById(`fcnt-${id}`);
  Array.from(input.files).forEach(file => {
    const row = document.createElement('div');
    row.className = 'file-item';
    const kb = (file.size / 1024).toFixed(1);
    row.innerHTML = `
      <span>📄 ${file.name} <span class="text-sub">(${kb} KB)</span></span>
      <button onclick="this.closest('.file-item').remove(); syncFileCnt(${id})">✕</button>
    `;
    flist.appendChild(row);
  });
  syncFileCnt(id);
  input.value = '';
}

function syncFileCnt(id) {
  const cnt = document.getElementById(`flist-${id}`)?.children.length || 0;
  const el = document.getElementById(`fcnt-${id}`);
  if (el) el.textContent = cnt > 0 ? `${cnt}개 첨부됨` : '첨부 없음';
}

// ─────────────────────────────────────────────
// 컨설팅 세부과제
// ─────────────────────────────────────────────
function buildConsultingSection() {
  const wrap = document.createElement('div');
  wrap.className = 'card mb-16';
  wrap.id = 'consultingSubProject';
  wrap.innerHTML = `
    <span class="section-title">컨설팅 세부과제</span>

    <!-- KPI -->
    <div class="inner-section mb-16">
      <div class="inner-section-head">
        <span class="inner-section-title">KPI</span>
        <button class="btn btn-outline text-sm" onclick="addKpi('consultKpiList')">+ KPI 추가</button>
      </div>
      <div id="consultKpiList"></div>
      <div class="placeholder" style="height:40px;" id="consultKpiEmpty">KPI를 추가하세요</div>
    </div>

    <!-- 컨설턴트 배정 -->
    <div class="inner-section">
      <div class="inner-section-head">
        <span class="inner-section-title">컨설턴트 배정</span>
        <button class="btn btn-outline text-sm" onclick="addConsultant()">+ 컨설턴트 추가</button>
      </div>
      <div id="consultantList">
        <div class="placeholder" style="height:40px;" id="consultantEmpty">컨설턴트를 추가하세요</div>
      </div>
    </div>
  `;
  return wrap;
}

let _cid = 0;

function addConsultant() {
  const list = document.getElementById('consultantList');
  document.getElementById('consultantEmpty')?.remove();
  const id = ++_cid;
  const div = document.createElement('div');
  div.className = 'item-card';
  div.dataset.cid = id;
  div.innerHTML = `
    <div class="item-card-head">
      <span class="text-sm font-bold text-sub">컨설턴트 ${id}</span>
      <button class="btn btn-outline text-sm" onclick="removeConsultant(${id})">삭제</button>
    </div>
    <div class="grid-3 mb-16">
      <div>
        <label class="label">컨설턴트명</label>
        <input class="input" type="text" placeholder="이름 입력" />
      </div>
      <div>
        <label class="label">배정 MD <span class="text-sub">(0.5 단위)</span></label>
        <input class="input" type="number" id="md-${id}" min="0" max="99" step="0.5"
               placeholder="0.0" oninput="onMdInput(${id})" onblur="onMdBlur(${id})" />
      </div>
      <div>
        <label class="label">수행일지 수 <span class="text-sub">(자동)</span></label>
        <div class="input" id="journal-${id}"
             style="background:var(--accent-bg); color:var(--text-sub); user-select:none;">—</div>
      </div>
    </div>
    <div>
      <label class="label">예정 컨설팅 일자</label>
      <div class="row" style="gap:8px; margin-bottom:4px;">
        <input class="input" type="date" id="dateIn-${id}" style="width:160px;" />
        <button class="btn btn-outline text-sm" onclick="addDate(${id})">+ 날짜 추가</button>
        <span class="text-sm text-sub" id="dateCnt-${id}"></span>
      </div>
      <div class="date-tags" id="dateTags-${id}"></div>
    </div>
  `;
  list.appendChild(div);
}

function removeConsultant(id) {
  document.querySelector(`.item-card[data-cid="${id}"]`)?.remove();
  const list = document.getElementById('consultantList');
  if (list && !list.querySelector('.item-card')) {
    const e = document.createElement('div');
    e.className = 'placeholder'; e.id = 'consultantEmpty';
    e.style.height = '40px'; e.textContent = '컨설턴트를 추가하세요';
    list.appendChild(e);
  }
}

function onMdInput(id) {
  const el = document.getElementById(`md-${id}`);
  const v = parseFloat(el.value);
  const journal = document.getElementById(`journal-${id}`);
  if (isNaN(v) || v < 0) { journal.textContent = '—'; return; }
  const journals = Math.round(v);
  journal.textContent = `${journals}개`;
  journal.style.color = 'var(--text)';
}

function onMdBlur(id) {
  const el = document.getElementById(`md-${id}`);
  let v = parseFloat(el.value);
  if (isNaN(v) || v < 0) { el.value = ''; return; }
  // 0.5 단위로 반올림
  v = Math.round(v * 2) / 2;
  el.value = v;
  onMdInput(id);
}

function addDate(id) {
  const input = document.getElementById(`dateIn-${id}`);
  const tags = document.getElementById(`dateTags-${id}`);
  const cnt = document.getElementById(`dateCnt-${id}`);
  const val = input.value;
  if (!val) { showToast('날짜를 선택하세요.'); return; }
  const exists = [...tags.querySelectorAll('span[data-date]')].some(s => s.dataset.date === val);
  if (exists) { showToast('이미 추가된 날짜입니다.'); return; }
  const tag = document.createElement('div');
  tag.className = 'date-tag';
  tag.innerHTML = `
    <span data-date="${val}">${val}</span>
    <button onclick="this.closest('.date-tag').remove(); syncDateCnt(${id})">✕</button>
  `;
  tags.appendChild(tag);
  input.value = '';
  syncDateCnt(id);
}

function syncDateCnt(id) {
  const n = document.getElementById(`dateTags-${id}`)?.children.length || 0;
  const el = document.getElementById(`dateCnt-${id}`);
  if (el) el.textContent = n > 0 ? `${n}일 지정됨` : '';

  // MD와 일자 수 불일치 경고
  const md = parseFloat(document.getElementById(`md-${id}`)?.value || '');
  if (!isNaN(md) && n > 0) {
    const expected = Math.round(md);
    if (n !== expected) {
      if (el) el.style.color = '#a02020';
      if (n > expected) showToast(`⚠ 수행일지 기준(${expected}일)보다 날짜가 많습니다.`);
    } else {
      if (el) el.style.color = '#2a6a2a';
    }
  }
}

// ── 저장 ──
function handleSave() {
  const supportType = document.getElementById('supportType').value;
  if (!supportType) {
    showToast('지원유형을 선택해 주세요.');
    document.getElementById('supportType').focus();
    return;
  }
  showToast('과제가 등록되었습니다.');
  setTimeout(() => { window.location.href = 'projects.html'; }, 900);
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  initSupportCheckboxes();
  syncKpiEmpty('mainKpiList');
});
