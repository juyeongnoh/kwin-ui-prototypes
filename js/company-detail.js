// ===== company-detail.js =====

const KPI_META = [
  {v:'불량률',        t:'망소'}, {v:'유저이탈율',    t:'망소'},
  {v:'제조시간',      t:'망소'}, {v:'배출가스',       t:'망소'},
  {v:'재작업률',      t:'망소'}, {v:'에너지소비량',   t:'망소'},
  {v:'생산량',        t:'망대'}, {v:'매출액',         t:'망대'},
  {v:'고객만족도',    t:'망대'}, {v:'생산성',         t:'망대'},
  {v:'설비가동률',    t:'망대'}, {v:'수율',           t:'망대'},
  {v:'길이',          t:'망목'}, {v:'중량',           t:'망목'},
  {v:'전압',          t:'망목'}, {v:'특허 달성 건수', t:'망목'},
];

// ── 샘플 데이터 ──
let projects = [
  {
    id: 1,
    name: '생산공정 불량률 개선',
    supportType: '생산혁신',
    subTypes: ['p','q1'],
    hasConsulting: false,
    problem: '현재 불량률이 높아 생산성이 저하되고 있음',
    summary: '스마트 센서 도입을 통한 실시간 불량 감지 시스템 구축',
    goal: '불량률 50% 감소 달성',
    kpis: [{v:'불량률', t:'망소', before:200, target:100, isMain:true}],
    directSubs: [{
      id: 1, name: '스마트 센서 직접지원', kpis: [], consultants: [],
      items: [{id:1, name:'스마트 비전 센서', date:'2026-06-01', amount:5000000, files:[]}]
    }],
    consultingSubs: [],
  }
];
let nextPid = 2;

// ── 편집 상태 ──
let currentProject = null;
let currentSubType = null;   // 'direct' | 'consulting'
let currentSubId   = null;

// ── ID 카운터 ──
let _seq = 0;
const uid     = () => `k${++_seq}`;   // KPI DOM id
const numId   = () => ++_seq;          // 숫자 ID (sub, item, consultant)

// ════════════════════════════════════════════════════════
// 과제 테이블
// ════════════════════════════════════════════════════════
function renderTable() {
  const el = document.getElementById('projectTable');
  if (!projects.length) {
    el.innerHTML = '<div class="placeholder" style="height:60px;">과제를 추가하세요</div>';
    return;
  }
  const rows = projects.map((p, i) => {
    const mainKpi = findMainKpi(p);
    const kpiStr  = mainKpi ? `[${mainKpi.t}] ${mainKpi.v}` : '—';
    const subBadge = p.hasConsulting
      ? '<span class="badge badge-default">컨설팅+직접지원</span>'
      : '<span class="badge badge-default">직접지원</span>';
    const subTypePills = p.subTypes.map(t =>
      `<span class="badge badge-default" style="font-size:10px;padding:1px 6px;">${t.toUpperCase()}</span>`
    ).join(' ');
    const subStatus = [
      p.directSubs.length    ? `직접지원 ${p.directSubs.length}건` : '',
      p.consultingSubs.length ? `컨설팅 ${p.consultingSubs.length}건` : '',
    ].filter(Boolean).join(' / ') || '—';
    return `<tr>
      <td class="text-sub text-sm">${i + 1}</td>
      <td class="font-bold">${p.name || '—'}</td>
      <td><span class="badge badge-active">${p.supportType}</span></td>
      <td>${subTypePills || '—'}</td>
      <td>${subBadge}</td>
      <td class="text-sm">${kpiStr}</td>
      <td class="text-sm text-sub">${subStatus}</td>
      <td><div class="row" style="gap:4px;">
        <button class="btn btn-outline text-sm" onclick="openProjectModal(${p.id})">수정</button>
        <button class="btn btn-outline text-sm" onclick="deleteProject(${p.id})">삭제</button>
      </div></td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="table">
    <thead><tr>
      <th>#</th><th>대표과제명</th><th>지원유형</th><th>세부유형</th>
      <th>지원구분</th><th>주 KPI</th><th>세부과제</th><th></th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function findMainKpi(p) {
  const all = [
    ...(p.kpis || []),
    ...(p.directSubs || []).flatMap(s => s.kpis || []),
    ...(p.consultingSubs || []).flatMap(s => s.kpis || []),
  ];
  return all.find(k => k.isMain) || all[0] || null;
}

function deleteProject(id) {
  if (!confirm('과제를 삭제하시겠습니까?')) return;
  projects = projects.filter(p => p.id !== id);
  renderTable();
  showToast('과제가 삭제되었습니다.');
}

// ════════════════════════════════════════════════════════
// 과제 모달
// ════════════════════════════════════════════════════════
function openProjectModal(id = null) {
  if (id) {
    currentProject = JSON.parse(JSON.stringify(projects.find(p => p.id === id)));
    document.getElementById('pmTitle').textContent = '과제 수정';
  } else {
    currentProject = {
      id: null, name: '', supportType: '', subTypes: [], hasConsulting: false,
      problem: '', summary: '', goal: '', kpis: [],
      directSubs: [], consultingSubs: [],
    };
    document.getElementById('pmTitle').textContent = '과제 등록';
  }
  renderProjectForm();
  document.getElementById('projectModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('open');
  document.body.style.overflow = '';
  currentProject = null;
}

function renderProjectForm() {
  const cp = currentProject;
  const supportOpts = ['생산혁신','기술혁신','일터혁신','시장혁신'].map(t =>
    `<option${cp.supportType===t?' selected':''}>${t}</option>`).join('');
  const subTypePills = ['p','q1','q2','c','d','m1','m2','ma1','ma2'].map(t =>
    `<label class="cb-pill"><input type="checkbox" name="pmSubType" value="${t}"${cp.subTypes.includes(t)?' checked':''}>${t.toUpperCase()}</label>`
  ).join('');
  const kpiRows = cp.kpis.map(k => buildKpiRowHtml(k)).join('');

  document.getElementById('pmBody').innerHTML = `
    <div class="form-row mb-16">
      <label class="label">대표과제명</label>
      <input class="input" id="pmName" type="text" value="${escHtml(cp.name)}" placeholder="대표과제명을 입력하세요" />
    </div>

    <div class="grid-2 mb-16" style="align-items:start;">
      <div>
        <label class="label">지원유형 *</label>
        <select class="select" id="pmSupportType">
          <option value="">선택하세요</option>${supportOpts}
        </select>
      </div>
      <div>
        <label class="label">지원구분</label>
        <div class="row" style="gap:8px; flex-wrap:wrap; align-items:center;">
          <label class="cb-pill">
            <input type="checkbox" id="pmChkConsulting" ${cp.hasConsulting?'checked':''} onchange="onPmConsulting()"> 컨설팅
          </label>
          <label class="cb-pill disabled" title="직접지원은 항상 포함됩니다">
            <input type="checkbox" id="pmChkDirect" checked onclick="onPmDirectClick(event)"> 직접지원
          </label>
        </div>
      </div>
    </div>

    <div class="form-row mb-8">
      <label class="label">세부유형</label>
      <div class="row" style="flex-wrap:wrap; gap:6px;">${subTypePills}</div>
    </div>

    <div class="form-row mb-8">
      <label class="label">문제점 및 현황</label>
      <textarea class="textarea" id="pmProblem" rows="2" placeholder="현재 문제점 및 현황">${escHtml(cp.problem)}</textarea>
    </div>
    <div class="form-row mb-8">
      <label class="label">과제 내용 (1줄 요약)</label>
      <input class="input" id="pmSummary" type="text" value="${escHtml(cp.summary)}" placeholder="핵심 과제를 한 줄로 요약" />
    </div>
    <div class="form-row mb-16">
      <label class="label">목표 (추진목적, CSF 등)</label>
      <textarea class="textarea" id="pmGoal" rows="2" placeholder="과제의 목표와 추진 방향">${escHtml(cp.goal)}</textarea>
    </div>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">KPI <span class="text-sub" style="font-weight:400;">(대표과제)</span></span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addKpiRow('pmKpiList')">+ KPI 추가</button>
    </div>
    <div id="pmKpiList" class="mb-4">${kpiRows}</div>
    <div class="placeholder mb-16${kpiRows?' hidden':''}" id="pmKpiEmpty" style="height:36px;">KPI를 추가하세요</div>

    <span class="section-title">세부과제</span>
    <div id="pmSubTable"></div>
  `;

  renderSubTable();
}

function onPmConsulting() {
  currentProject.hasConsulting = document.getElementById('pmChkConsulting').checked;
  renderSubTable();
}
function onPmDirectClick(e) {
  e.preventDefault();
  document.getElementById('pmChkDirect').checked = true;
  showToast('직접지원은 항상 포함됩니다.');
}

// ── 세부과제 테이블 ──
function renderSubTable() {
  const el = document.getElementById('pmSubTable');
  if (!el) return;
  const cp = currentProject;

  const directSection = buildSubSection('direct', cp.directSubs, '직접지원 세부과제');
  const consultingSection = cp.hasConsulting
    ? buildSubSection('consulting', cp.consultingSubs, '컨설팅 세부과제')
    : '';

  el.innerHTML = directSection + consultingSection;
}

function buildSubSection(type, subs, label) {
  const isDirect = type === 'direct';
  const rows = subs.map((sub, i) => {
    const cCnt = sub.consultants?.length ? `${sub.consultants.length}명` : '—';
    const itCnt = isDirect ? (sub.items?.length ? `${sub.items.length}품목` : '—') : null;
    return `<tr style="cursor:pointer;" onclick="openSubModal('${type}',${sub.id})">
      <td class="text-sub text-sm">${i+1}</td>
      <td>${sub.name || '<span class="text-sub">—</span>'}</td>
      <td class="text-sub text-sm">${sub.kpis.length ? sub.kpis.length+'개' : '—'}</td>
      ${isDirect ? `<td class="text-sub text-sm">${itCnt}</td>` : ''}
      <td class="text-sub text-sm">${cCnt}</td>
      <td><div class="row" style="gap:4px;">
        <button class="btn btn-outline text-sm" onclick="event.stopPropagation();openSubModal('${type}',${sub.id})">수정</button>
        <button class="btn btn-outline text-sm" onclick="event.stopPropagation();deleteSub('${type}',${sub.id})">삭제</button>
      </div></td>
    </tr>`;
  }).join('');

  const table = subs.length
    ? `<table class="table" style="margin-top:8px;">
        <thead><tr>
          <th style="width:40px;">#</th>
          <th>과제명</th>
          <th style="width:60px;">KPI</th>
          ${isDirect ? '<th style="width:70px;">품목</th>' : ''}
          <th style="width:80px;">컨설턴트</th>
          <th style="width:110px;"></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`
    : '<div class="placeholder" style="height:36px; margin-top:8px;">세부과제를 추가하세요</div>';

  return `<div style="margin-top:14px;">
    <div class="row">
      <span class="inner-title" style="font-size:11px; font-weight:700; color:var(--text-sub); text-transform:uppercase; letter-spacing:.6px;">${label}</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addSub('${type}')">+ 추가</button>
    </div>
    ${table}
  </div>`;
}

function addSub(type) {
  const newSub = { id: numId(), name:'', kpis:[], items:[], consultants:[] };
  if (type === 'direct') currentProject.directSubs.push(newSub);
  else                   currentProject.consultingSubs.push(newSub);
  renderSubTable();
  openSubModal(type, newSub.id);
}

function deleteSub(type, subId) {
  if (type === 'direct')
    currentProject.directSubs    = currentProject.directSubs.filter(s => s.id !== subId);
  else
    currentProject.consultingSubs = currentProject.consultingSubs.filter(s => s.id !== subId);
  renderSubTable();
}

// ── 과제 저장 ──
function saveProject() {
  const cp = currentProject;
  const supportType = document.getElementById('pmSupportType')?.value;
  if (!supportType) { showToast('지원유형을 선택하세요.'); return; }

  cp.name         = document.getElementById('pmName')?.value?.trim() || '';
  cp.supportType  = supportType;
  cp.hasConsulting= document.getElementById('pmChkConsulting')?.checked || false;
  cp.problem      = document.getElementById('pmProblem')?.value || '';
  cp.summary      = document.getElementById('pmSummary')?.value || '';
  cp.goal         = document.getElementById('pmGoal')?.value || '';
  cp.subTypes     = [...document.querySelectorAll('[name="pmSubType"]:checked')].map(e => e.value);
  cp.kpis         = collectKpis('pmKpiList');

  // 주 KPI 정규화: 프로젝트 레벨 KPI가 isMain → 세부과제 KPI isMain 해제
  const hasProjectMain = cp.kpis.some(k => k.isMain);
  if (hasProjectMain) {
    [...cp.directSubs, ...cp.consultingSubs].forEach(s =>
      s.kpis.forEach(k => { k.isMain = false; }));
  }

  if (cp.id) {
    const idx = projects.findIndex(p => p.id === cp.id);
    projects[idx] = { ...cp };
  } else {
    cp.id = nextPid++;
    projects.push({ ...cp });
  }
  renderTable();
  closeProjectModal();
  showToast('과제가 저장되었습니다.');
}

// ════════════════════════════════════════════════════════
// 세부과제 모달
// ════════════════════════════════════════════════════════
function openSubModal(type, subId) {
  currentSubType = type;
  currentSubId   = subId;
  const subs = type === 'direct' ? currentProject.directSubs : currentProject.consultingSubs;
  const sub  = subs.find(s => s.id === subId);
  document.getElementById('smTitle').textContent =
    type === 'direct' ? '직접지원 세부과제' : '컨설팅 세부과제';
  renderSubForm(type, sub);
  document.getElementById('subModal').classList.add('open');
}

function closeSubModal() {
  document.getElementById('subModal').classList.remove('open');
  currentSubType = null;
  currentSubId   = null;
}

function renderSubForm(type, sub) {
  const isDirect = type === 'direct';
  const kpiRows  = sub.kpis.map(k => buildKpiRowHtml(k)).join('');

  document.getElementById('smBody').innerHTML = `
    <div class="form-row mb-16">
      <label class="label">세부과제명</label>
      <input class="input" id="smName" type="text" value="${escHtml(sub.name||'')}" placeholder="세부과제명 입력" />
    </div>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">KPI</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addKpiRow('smKpiList')">+ KPI 추가</button>
    </div>
    <div id="smKpiList" class="mb-4">${kpiRows}</div>
    <div class="placeholder mb-16${kpiRows?' hidden':''}" id="smKpiEmpty" style="height:36px;">KPI를 추가하세요</div>

    ${isDirect ? `
    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">직접지원 품목</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addItem()">+ 품목 추가</button>
    </div>
    <div id="smItemList" class="mb-16">
      ${sub.items?.map(it => buildItemHtml(it)).join('') ||
        '<div class="placeholder" style="height:36px;" id="smItemEmpty">품목을 추가하세요</div>'}
    </div>` : ''}

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">컨설턴트 배정</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addConsultant()">+ 컨설턴트 추가</button>
    </div>
    <div id="smConsultantList">
      ${sub.consultants?.length
        ? sub.consultants.map(c => buildConsultantHtml(c)).join('')
        : '<div class="placeholder" style="height:36px;" id="smConsultantEmpty">컨설턴트를 추가하세요</div>'}
    </div>
  `;

  // 기존 컨설턴트 날짜 인풋 복원
  sub.consultants?.forEach(c => renderDateInputs(c.id, c.md, c.dates || []));
}

// ── 세부과제 저장 ──
function saveSubModal() {
  const subs = currentSubType === 'direct' ? currentProject.directSubs : currentProject.consultingSubs;
  const sub  = subs.find(s => s.id === currentSubId);
  if (!sub) return;

  sub.name = document.getElementById('smName')?.value?.trim() || '';
  sub.kpis = collectKpis('smKpiList');
  if (currentSubType === 'direct') sub.items = collectItems();
  sub.consultants = collectConsultants();

  // 세부과제 KPI에 isMain이 있으면 다른 세부과제의 isMain 해제
  const hasSubMain = sub.kpis.some(k => k.isMain);
  if (hasSubMain) {
    const allSubs = [...currentProject.directSubs, ...currentProject.consultingSubs];
    allSubs.forEach(s => {
      if (s.id !== currentSubId) s.kpis.forEach(k => { k.isMain = false; });
    });
    currentProject.kpis.forEach(k => { k.isMain = false; });
  }

  closeSubModal();
  renderSubTable();
  showToast('세부과제가 저장되었습니다.');
}

// ════════════════════════════════════════════════════════
// KPI 공통
// ════════════════════════════════════════════════════════
function buildKpiRowHtml(k) {
  const id   = uid();
  const opts = KPI_META.map(m =>
    `<option value="${m.v}" data-type="${m.t}"${k.v===m.v?' selected':''}>[${m.t}] ${m.v}</option>`
  ).join('');
  return `<div class="kpi-item" data-kid="${id}">
    <label class="main-kpi-label">
      <input type="radio" name="mainKpi" ${k.isMain?'checked':''}> 주&nbsp;KPI
    </label>
    <select class="select" data-role="sel" onchange="onKpiChange('${id}')">
      <option value="">KPI 선택</option>${opts}
    </select>
    <input class="input" type="number" data-role="cur" value="${k.before||''}"
           placeholder="개선전 수치" step="any" oninput="onKpiChange('${id}')" />
    <input class="input" type="number" data-role="tgt" value="${k.target||''}"
           placeholder="목표값" step="any" oninput="onKpiChange('${id}')" />
    <div class="kpi-rate" id="kr-${id}">개선율<br>—</div>
    <button class="btn btn-outline text-sm" onclick="removeKpiRow('${id}')">삭제</button>
  </div>`;
}

function addKpiRow(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  const emptyId = listId === 'pmKpiList' ? 'pmKpiEmpty' : 'smKpiEmpty';
  document.getElementById(emptyId)?.classList.add('hidden');
  const id = uid();
  const opts = KPI_META.map(m =>
    `<option value="${m.v}" data-type="${m.t}">[${m.t}] ${m.v}</option>`).join('');
  const div = document.createElement('div');
  div.className = 'kpi-item';
  div.dataset.kid = id;
  div.innerHTML = `
    <label class="main-kpi-label">
      <input type="radio" name="mainKpi"> 주&nbsp;KPI
    </label>
    <select class="select" data-role="sel" onchange="onKpiChange('${id}')">
      <option value="">KPI 선택</option>${opts}
    </select>
    <input class="input" type="number" data-role="cur" placeholder="개선전 수치"
           step="any" oninput="onKpiChange('${id}')" />
    <input class="input" type="number" data-role="tgt" placeholder="목표값"
           step="any" oninput="onKpiChange('${id}')" />
    <div class="kpi-rate" id="kr-${id}">개선율<br>—</div>
    <button class="btn btn-outline text-sm" onclick="removeKpiRow('${id}')">삭제</button>`;
  list.appendChild(div);
}

function onKpiChange(id) {
  const item  = document.querySelector(`.kpi-item[data-kid="${id}"]`);
  if (!item) return;
  const sel   = item.querySelector('[data-role="sel"]');
  const type  = sel.options[sel.selectedIndex]?.dataset?.type || '';
  const cur   = parseFloat(item.querySelector('[data-role="cur"]').value);
  const tgt   = parseFloat(item.querySelector('[data-role="tgt"]').value);
  const badge = document.getElementById(`kr-${id}`);
  const label = type === '망목' ? '목표편차' : '개선율';
  let rate = null;
  if (!isNaN(cur) && !isNaN(tgt) && cur !== 0) {
    if      (type === '망대') rate = ((tgt-cur)/Math.abs(cur))*100;
    else if (type === '망소') rate = ((cur-tgt)/Math.abs(cur))*100;
    else if (type === '망목') rate = (Math.abs(cur-tgt)/Math.abs(cur))*100;
  }
  if (rate === null) { badge.className='kpi-rate'; badge.innerHTML=`${label}<br>—`; return; }
  badge.className = `kpi-rate ${(type==='망목' ? rate<=5 : rate>0) ? 'positive':'negative'}`;
  badge.innerHTML = `${label}<br>${rate.toFixed(1)}%`;
}

function removeKpiRow(id) {
  const item = document.querySelector(`.kpi-item[data-kid="${id}"]`);
  if (!item) return;
  const list = item.parentElement;
  item.remove();
  const emptyMap = { pmKpiList:'pmKpiEmpty', smKpiList:'smKpiEmpty' };
  const emptyId  = emptyMap[list.id];
  if (emptyId && !list.querySelector('.kpi-item'))
    document.getElementById(emptyId)?.classList.remove('hidden');
}

function collectKpis(listId) {
  const list = document.getElementById(listId);
  if (!list) return [];
  return [...list.querySelectorAll('.kpi-item')].map(item => {
    const sel = item.querySelector('[data-role="sel"]');
    const opt = sel.options[sel.selectedIndex];
    return {
      v:      sel.value,
      t:      opt?.dataset?.type || '',
      before: parseFloat(item.querySelector('[data-role="cur"]').value) || 0,
      target: parseFloat(item.querySelector('[data-role="tgt"]').value) || 0,
      isMain: item.querySelector('input[name="mainKpi"]')?.checked || false,
    };
  }).filter(k => k.v);
}

// ════════════════════════════════════════════════════════
// 직접지원 품목
// ════════════════════════════════════════════════════════
function buildItemHtml(it) {
  const id = numId();
  return `<div class="item-card" data-sid="${id}">
    <div class="item-card-head">
      <span class="text-sm font-bold text-sub">품목 ${id}</span>
      <button class="btn btn-outline text-sm" onclick="removeItem(${id})">삭제</button>
    </div>
    <div class="grid-3 mb-8">
      <div><label class="label">품목명 *</label>
        <input class="input" type="text" data-role="name" value="${escHtml(it.name||'')}" placeholder="품목명 입력" /></div>
      <div><label class="label">취득일자</label>
        <input class="input" type="date" data-role="date" value="${it.date||''}" /></div>
      <div><label class="label">금액 (원)</label>
        <input class="input" type="number" data-role="amount" value="${it.amount||''}" placeholder="0" min="0" /></div>
    </div>
    <div>
      <label class="label">파일 첨부</label>
      <div class="row" style="gap:8px; margin-bottom:4px;">
        <input type="file" id="fi-${id}" multiple style="display:none;" onchange="handleFiles(${id},this)" />
        <button class="btn btn-outline text-sm" onclick="document.getElementById('fi-${id}').click()">📎 파일 선택</button>
        <span class="text-sm text-sub" id="fcnt-${id}">${it.files?.length ? it.files.length+'개 첨부됨':'첨부 없음'}</span>
      </div>
      <div id="flist-${id}" class="file-list"></div>
    </div>
  </div>`;
}

function addItem() {
  document.getElementById('smItemEmpty')?.remove();
  document.getElementById('smItemList')
    .insertAdjacentHTML('beforeend', buildItemHtml({id:numId(), name:'', date:'', amount:0, files:[]}));
}
function removeItem(id) {
  document.querySelector(`.item-card[data-sid="${id}"]`)?.remove();
  const list = document.getElementById('smItemList');
  if (list && !list.querySelector('.item-card'))
    list.innerHTML = '<div class="placeholder" style="height:36px;" id="smItemEmpty">품목을 추가하세요</div>';
}
function handleFiles(id, input) {
  const flist = document.getElementById(`flist-${id}`);
  Array.from(input.files).forEach(f => {
    const row = document.createElement('div');
    row.className = 'file-item';
    row.innerHTML = `<span>📄 ${escHtml(f.name)} <span class="text-sub">(${(f.size/1024).toFixed(1)} KB)</span></span>
      <button onclick="this.closest('.file-item').remove(); syncCnt(${id})">✕</button>`;
    flist.appendChild(row);
  });
  syncCnt(id); input.value='';
}
function syncCnt(id) {
  const n  = document.getElementById(`flist-${id}`)?.children.length || 0;
  const el = document.getElementById(`fcnt-${id}`);
  if (el) el.textContent = n > 0 ? `${n}개 첨부됨` : '첨부 없음';
}
function collectItems() {
  return [...(document.getElementById('smItemList')?.querySelectorAll('.item-card') || [])]
    .map(card => ({
      id:     parseInt(card.dataset.sid),
      name:   card.querySelector('[data-role="name"]')?.value || '',
      date:   card.querySelector('[data-role="date"]')?.value || '',
      amount: parseFloat(card.querySelector('[data-role="amount"]')?.value) || 0,
      files:  [],
    })).filter(it => it.name);
}

// ════════════════════════════════════════════════════════
// 컨설턴트 배정
// ════════════════════════════════════════════════════════
function buildConsultantHtml(c) {
  const md = c.md || 0;
  const journalCnt = Math.round(md);
  return `<div class="item-card" data-cid="${c.id}">
    <div class="item-card-head">
      <span class="text-sm font-bold text-sub">컨설턴트</span>
      <button class="btn btn-outline text-sm" onclick="removeConsultant(${c.id})">삭제</button>
    </div>
    <div class="grid-3 mb-12">
      <div>
        <label class="label">컨설턴트명</label>
        <input class="input" type="text" data-role="cname" value="${escHtml(c.name||'')}" placeholder="이름 입력" />
      </div>
      <div>
        <label class="label">배정 MD <span class="text-sub">(0.5 단위)</span></label>
        <input class="input" type="number" id="md-${c.id}" min="0" step="0.5"
               value="${md||''}" placeholder="0.0"
               oninput="onMdInput(${c.id})" onblur="onMdBlur(${c.id})" />
      </div>
      <div>
        <label class="label">수행일지 수 <span class="text-sub">(자동)</span></label>
        <div class="input" id="journal-${c.id}"
             style="background:var(--accent-bg); color:var(--text-sub); user-select:none;">
          ${journalCnt > 0 ? journalCnt+'개' : '—'}
        </div>
      </div>
    </div>
    <div>
      <label class="label">예정 컨설팅 일자</label>
      <div id="dates-${c.id}" style="margin-top:8px; display:flex; flex-direction:column; gap:6px;"></div>
    </div>
  </div>`;
}

function addConsultant() {
  document.getElementById('smConsultantEmpty')?.remove();
  const id = numId();
  const div = document.createElement('div');
  div.className = 'item-card';
  div.dataset.cid = id;
  div.innerHTML = buildConsultantHtml({id, name:'', md:0, dates:[]}).replace(/<div class="item-card"[^>]*>/, '').replace(/<\/div>\s*$/, '');
  // Rebuild cleanly
  const c = {id, name:'', md:0, dates:[]};
  div.innerHTML = `<div class="item-card-head">
      <span class="text-sm font-bold text-sub">컨설턴트</span>
      <button class="btn btn-outline text-sm" onclick="removeConsultant(${id})">삭제</button>
    </div>
    <div class="grid-3 mb-12">
      <div>
        <label class="label">컨설턴트명</label>
        <input class="input" type="text" data-role="cname" placeholder="이름 입력" />
      </div>
      <div>
        <label class="label">배정 MD <span class="text-sub">(0.5 단위)</span></label>
        <input class="input" type="number" id="md-${id}" min="0" step="0.5"
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
      <div id="dates-${id}" style="margin-top:8px; display:flex; flex-direction:column; gap:6px;"></div>
    </div>`;
  document.getElementById('smConsultantList').appendChild(div);
}

function removeConsultant(cid) {
  document.querySelector(`.item-card[data-cid="${cid}"]`)?.remove();
  const list = document.getElementById('smConsultantList');
  if (list && !list.querySelector('.item-card'))
    list.innerHTML = '<div class="placeholder" style="height:36px;" id="smConsultantEmpty">컨설턴트를 추가하세요</div>';
}

function onMdInput(cid) {
  const v = parseFloat(document.getElementById(`md-${cid}`)?.value) || 0;
  const cnt = Math.round(v);
  const jEl = document.getElementById(`journal-${cid}`);
  if (jEl) { jEl.textContent = cnt > 0 ? cnt+'개' : '—'; jEl.style.color = cnt > 0 ? 'var(--text)' : 'var(--text-sub)'; }
}

function onMdBlur(cid) {
  const el = document.getElementById(`md-${cid}`);
  let v = parseFloat(el.value);
  if (isNaN(v) || v < 0) { el.value = ''; renderDateInputs(cid, 0, []); return; }
  v = Math.round(v * 2) / 2;
  el.value = v;
  onMdInput(cid);
  // 기존 날짜 값 유지
  const existing = [...(document.querySelectorAll(`#dates-${cid} input[type="date"]`))].map(i => i.value);
  renderDateInputs(cid, v, existing);
}

function renderDateInputs(cid, md, existingDates) {
  const count = Math.round(md);
  const el = document.getElementById(`dates-${cid}`);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.cssText = 'align-items:center; gap:10px;';
    row.innerHTML = `
      <span class="text-sm text-sub" style="width:44px; flex-shrink:0; text-align:right;">${i+1}회차</span>
      <input class="input" type="date" data-session="${i+1}"
             value="${existingDates[i] || ''}" style="max-width:180px;" />`;
    el.appendChild(row);
  }
}

function collectConsultants() {
  return [...(document.getElementById('smConsultantList')?.querySelectorAll('.item-card') || [])]
    .map(card => {
      const cid = card.dataset.cid;
      const md  = Math.round((parseFloat(document.getElementById(`md-${cid}`)?.value) || 0) * 2) / 2;
      const dates = [...card.querySelectorAll('input[type="date"]')].map(i => i.value);
      return { id: parseInt(cid), name: card.querySelector('[data-role="cname"]')?.value || '', md, dates };
    });
}

// ── 유틸 ──
function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
});
