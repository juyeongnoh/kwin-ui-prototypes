// ===== company-detail.js =====

// ── 컨설턴트 목록 (드롭다운용) ──
const CONSULTANT_LIST = [
  { name: '김전문',         type: '내부', grade: '특급' },
  { name: '이컨설턴트',     type: '외부', grade: '중급' },
  { name: '박전문가',       type: '외부', grade: '특급' },
  { name: '최자문위원',     type: '내부', grade: '특급' },
  { name: '정컨설팅',       type: '외부', grade: '중급' },
  { name: '한전문위원',     type: '내부', grade: '중급' },
  { name: '윤수석컨설턴트', type: '외부', grade: '특급' },
  { name: '임선임위원',     type: '외부', grade: '중급' },
];

function getConsultantType(name) {
  return CONSULTANT_LIST.find(c => c.name === name)?.type || '외부';
}

function getConsultantGrade(name) {
  return CONSULTANT_LIST.find(c => c.name === name)?.grade || '중급';
}

const GRADE_RATES = { '특급': 500000, '중급': 300000 };

function calcTotalLaborCost(p) {
  return [
    ...(p.consultants || []),
    ...(p.directSubs || []).flatMap(s => s.consultants || []),
    ...(p.consultingSubs || []).flatMap(s => s.consultants || []),
  ].reduce((sum, c) => sum + (GRADE_RATES[c.grade || getConsultantGrade(c.name)] || 0) * (c.md || 0), 0);
}

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

// ── 기본(초기화용) 샘플 데이터 ──
const DEFAULT_PROJECTS = [
  {
    id: 1,
    name: '생산공정 불량률 개선',
    supportType: '생산혁신',
    subTypes: ['p','q1'],
    hasConsulting: true,
    problem: '현재 불량률이 높아 생산성이 저하되고 있음',
    summary: '스마트 센서 도입을 통한 실시간 불량 감지 시스템 구축',
    goal: '불량률 50% 감소 달성',
    kpis: [{v:'불량률', t:'망소', before:200, target:100, isMain:true}],
    consultants: [{ id:5, name:'최자문위원', type:'내부', md:3, dates:['2026-06-05','2026-06-12','2026-06-19'] }],
    directSubs: [{
      id: 1, name: '스마트 센서 직접지원',
      kpis: [{v:'생산성', t:'망대', before:80, target:120, isMain:false}],
      consultants: [{id:10, name:'김전문', type:'내부', md:2, dates:['2026-06-10','2026-06-17']}],
      items: [{id:11, name:'스마트 비전 센서', date:'2026-06-01', amount:5000000, files:[]}]
    }],
    consultingSubs: [{ id:2, name:'공정 컨설팅', kpis:[], consultants:[{id:12, name:'이컨설턴트', type:'외부', md:4, dates:[]}], items:[] }],
    budget: { directSupport: 15000000, printCost: 500000, meetingCost: 300000, indirectCost: 200000 },
  }
];

// ── localStorage 연동 ──
const STORAGE_KEY = 'kwin-projects';

function saveToStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch(e) {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
}

function resetData() {
  if (!confirm('데이터를 기본값으로 초기화하시겠습니까?\n현재 작성된 내용이 모두 삭제됩니다.')) return;
  projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
  nextPid  = Math.max(0, ...projects.map(p => p.id)) + 1;
  saveToStorage();
  renderTable();
  showToast('데이터가 초기화되었습니다.');
}

// ── 런타임 데이터 ──
let projects = loadFromStorage();
let nextPid  = Math.max(0, ...projects.map(p => p.id)) + 1;

// ── 편집 상태 ──
let currentProject = null;
let currentSubType = null;
let currentSubId   = null;

// ── 날짜 모달 상태 ──
let currentDateRowId = null;

// ── ID 카운터 ──
let _seq = 0;
const numId    = () => ++_seq;
let _kpiRowSeq = 0;
const kpiRowId = () => `kr${++_kpiRowSeq}`;

// ── 헬퍼 ──
const getCurrentSub = () => {
  if (!currentProject || currentSubId == null) return null;
  const subs = currentSubType === 'direct'
    ? currentProject.directSubs
    : currentProject.consultingSubs;
  return subs.find(s => s.id === currentSubId) || null;
};

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function calcRate(k) {
  const cur = parseFloat(k.before), tgt = parseFloat(k.target);
  if (isNaN(cur) || isNaN(tgt) || cur === 0) return null;
  if (k.t === '망대') return ((tgt - cur) / Math.abs(cur)) * 100;
  if (k.t === '망소') return ((cur - tgt) / Math.abs(cur)) * 100;
  if (k.t === '망목') return (Math.abs(cur - tgt) / Math.abs(cur)) * 100;
  return null;
}

function rateHtml(k) {
  const rate = calcRate(k);
  if (rate === null) return '<span class="text-sub" style="font-size:12px;">—</span>';
  const isPos = k.t === '망목' ? Math.abs(rate) <= 5 : rate > 0;
  return `<span style="color:${isPos ? '#2a6a2a' : '#7a1a1a'}; font-weight:600; font-size:12px;">${rate > 0 ? '+' : ''}${rate.toFixed(1)}%</span>`;
}

// ════════════════════════════════════════════════════════
// 과제 테이블 (메인 페이지)
// ════════════════════════════════════════════════════════

/* 대표과제명 셀: 이름 + 문제점/요약/목표 */
function buildNameCell(p) {
  const name = `<div class="font-bold" style="font-size:14px;">${escHtml(p.name || '—')}</div>`;
  const details = [
    p.problem ? `<div><span style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.4px;">문제점</span>&nbsp;<span class="text-sub" style="font-size:11px;">${escHtml(p.problem)}</span></div>` : '',
    p.summary ? `<div><span style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.4px;">요약</span>&nbsp;<span class="text-sub" style="font-size:11px;">${escHtml(p.summary)}</span></div>` : '',
    p.goal    ? `<div><span style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.4px;">목표</span>&nbsp;<span class="text-sub" style="font-size:11px;">${escHtml(p.goal)}</span></div>` : '',
  ].filter(Boolean).join('');
  return name + (details ? `<div style="margin-top:5px;display:flex;flex-direction:column;gap:2px;">${details}</div>` : '');
}

/* KPI 셀: 전체 KPI + 출처 표시 */
function buildKpiCell(p) {
  const tagged = [
    ...(p.kpis || []).map(k => ({ ...k, src: '대표과제' })),
    ...(p.directSubs || []).flatMap(s => (s.kpis || []).map(k => ({ ...k, src: s.name || '직접지원' }))),
    ...(p.consultingSubs || []).flatMap(s => (s.kpis || []).map(k => ({ ...k, src: s.name || '컨설팅' }))),
  ];
  if (!tagged.length) return '<span class="text-sub" style="font-size:12px;">—</span>';
  return tagged.map(k => {
    const star   = k.isMain ? '<span style="color:#e09000;font-size:13px;">★</span> ' : '';
    const weight = k.isMain ? 'font-weight:700;' : 'color:var(--text-sub);';
    const srcBadge = `<span style="display:inline-block;font-size:9px;background:var(--accent-bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px;margin-right:3px;vertical-align:middle;">${escHtml(k.src)}</span>`;
    const before = k.before !== '' && k.before != null ? k.before : '?';
    const target = k.target !== '' && k.target != null ? k.target : '?';
    return `<div style="font-size:11px;line-height:1.9;${weight}">${star}${srcBadge}[${k.t}] ${escHtml(k.v||'—')} <span style="font-weight:400;color:var(--text-sub);font-size:10px;">${before}→${target}</span></div>`;
  }).join('');
}

/* 예산 셀 */
function buildBudgetCell(p) {
  const b      = p.budget || {};
  const labor  = calcTotalLaborCost(p);
  const direct = b.directSupport || 0;
  const op     = (b.printCost || 0) + (b.meetingCost || 0);
  const ind    = b.indirectCost || 0;
  const total  = labor + direct + op + ind;
  if (total === 0) return '<span class="text-sub" style="font-size:12px;">—</span>';
  const fmt = v => v > 0 ? v.toLocaleString() + '원' : null;
  const lines = [
    `<div style="font-size:12px;font-weight:700;">합계 ${fmt(total)}</div>`,
    labor  > 0 ? `<div style="font-size:11px;color:var(--text-sub);">인건비 ${fmt(labor)}</div>` : '',
    direct > 0 ? `<div style="font-size:11px;color:var(--text-sub);">직접지원비 ${fmt(direct)}</div>` : '',
    op     > 0 ? `<div style="font-size:11px;color:var(--text-sub);">사업운영비 ${fmt(op)}</div>` : '',
    ind    > 0 ? `<div style="font-size:11px;color:var(--text-sub);">간접비 ${fmt(ind)}</div>` : '',
  ].filter(Boolean).join('');
  return lines;
}

/* 세부과제 셀: 유형·이름·품목·컨설턴트 */
function buildSubCell(p) {
  let html = '';

  // 대표과제 컨설턴트
  if (p.consultants?.length) {
    const lines = p.consultants.map(c => {
      const type      = c.type || getConsultantType(c.name);
      const typeBadge = `<span class="badge ${type === '내부' ? 'badge-active' : 'badge-default'}" style="font-size:9px;margin-right:3px;">${type}</span>`;
      const internalTag = type === '내부'
        ? `<span style="font-size:9px;background:#dbeafe;border:1px solid #93c5fd;border-radius:3px;padding:1px 5px;color:#1d4ed8;font-weight:600;margin-left:4px;">연계사업 관리</span>`
        : '';
      return `<div style="font-size:11px;line-height:1.8;">${typeBadge}<strong>${escHtml(c.name||'?')}</strong> <span class="text-sub">${c.md||0}MD</span>${internalTag}</div>`;
    }).join('');
    html += `<div style="margin-bottom:8px;">
      <div style="font-size:9px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;">대표과제 컨설턴트</div>
      ${lines}
    </div>`;
  }

  // 세부과제
  const all = [
    ...(p.directSubs || []).map(s => ({ ...s, subKind: 'direct' })),
    ...(p.consultingSubs || []).map(s => ({ ...s, subKind: 'consulting' })),
  ];
  if (!all.length && !html) return '<span class="text-sub" style="font-size:12px;">—</span>';

  html += all.map(sub => {
    const typeLabel = sub.subKind === 'direct' ? '직접지원' : '컨설팅';
    const typeBadge = `<span style="font-size:9px;background:var(--accent-bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px;margin-right:4px;">${typeLabel}</span>`;
    const nameLine  = `<div style="font-size:12px;font-weight:600;line-height:1.8;">${typeBadge}${escHtml(sub.name || '—')}</div>`;
    const itemLine  = (sub.subKind === 'direct' && sub.items?.length)
      ? `<div style="font-size:11px;color:var(--text-sub);padding-left:4px;">품목: ${sub.items.map(it => escHtml(it.name)).join(', ')}</div>`
      : '';
    const consultLine = sub.consultants?.length
      ? `<div style="font-size:11px;color:var(--text-sub);padding-left:4px;">컨설턴트: ${sub.consultants.map(c => {
          const type = c.type || getConsultantType(c.name);
          const internalTag = type === '내부'
            ? `<span style="font-size:9px;background:#dbeafe;border:1px solid #93c5fd;border-radius:3px;padding:1px 4px;color:#1d4ed8;font-weight:600;margin-left:3px;">연계사업 관리</span>`
            : '';
          return `${escHtml(c.name)} [${type}] (${c.md}MD)${internalTag}`;
        }).join(', ')}</div>`
      : '';
    return `<div style="margin-bottom:6px;">${nameLine}${itemLine}${consultLine}</div>`;
  }).join('');

  return html || '<span class="text-sub" style="font-size:12px;">—</span>';
}

function renderTable() {
  const el = document.getElementById('projectTable');
  const head = `<table class="table">
    <thead><tr>
      <th style="width:28px;">#</th>
      <th style="min-width:180px;">대표과제명</th>
      <th style="width:80px;">지원유형</th>
      <th style="width:90px;">세부유형</th>
      <th style="width:100px;">지원구분</th>
      <th style="min-width:160px;">KPI</th>
      <th style="min-width:200px;">세부과제</th>
      <th style="min-width:140px;">예산</th>
      <th style="width:90px;"></th>
    </tr></thead>`;
  if (!projects.length) {
    el.innerHTML = head + `<tbody><tr><td colspan="9" style="text-align:center;padding:24px;" class="text-sub text-sm">항목이 없습니다</td></tr></tbody></table>`;
    return;
  }
  const rows = projects.map((p, i) => {
    const subBadge = p.hasConsulting
      ? '<span class="badge badge-default">컨설팅+직접지원</span>'
      : '<span class="badge badge-default">컨설팅</span>';
    const subTypePills = p.subTypes.map(t =>
      `<span class="badge badge-default" style="font-size:10px;padding:1px 5px;">${t.toUpperCase()}</span>`
    ).join(' ');
    return `<tr style="vertical-align:top;">
      <td class="text-sub text-sm" style="padding-top:12px;">${i + 1}</td>
      <td style="padding-top:10px;">${buildNameCell(p)}</td>
      <td style="padding-top:12px;"><span class="badge badge-active">${escHtml(p.supportType)}</span></td>
      <td style="padding-top:12px;">${subTypePills || '—'}</td>
      <td style="padding-top:12px;">${subBadge}</td>
      <td style="padding-top:10px;">${buildKpiCell(p)}</td>
      <td style="padding-top:10px;">${buildSubCell(p)}</td>
      <td style="padding-top:10px;">${buildBudgetCell(p)}</td>
      <td style="padding-top:10px;"><div class="row" style="gap:4px;">
        <button class="btn btn-outline text-sm" onclick="openProjectModal(${p.id})">수정</button>
        <button class="btn btn-outline text-sm" onclick="deleteProject(${p.id})">삭제</button>
      </div></td>
    </tr>`;
  }).join('');
  el.innerHTML = head + `<tbody>${rows}</tbody></table>`;
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
  saveToStorage();
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
      id: null, name: '', supportType: '', subTypes: [], hasConsulting: false, /* hasConsulting = hasDirect */
      problem: '', summary: '', goal: '', kpis: [], consultants: [],
      directSubs: [], consultingSubs: [],
      budget: { directSupport: 0, printCost: 0, meetingCost: 0, indirectCost: 0 },
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
  const cp     = currentProject;
  const budget = cp.budget || { directSupport: 0, printCost: 0, meetingCost: 0, indirectCost: 0 };
  const supportOpts = ['생산혁신','기술혁신','일터혁신','시장혁신'].map(t =>
    `<option${cp.supportType === t ? ' selected' : ''}>${t}</option>`).join('');
  const subTypePills = ['p','q1','q2','c','d','m1','m2','ma1','ma2'].map(t =>
    `<label class="cb-pill">
      <input type="checkbox" name="pmSubType" value="${t}"
             ${cp.subTypes.includes(t) ? 'checked' : ''}
             onchange="validateProjectForm()">${t.toUpperCase()}
    </label>`
  ).join('');

  document.getElementById('pmBody').innerHTML = `
    <div class="form-row mb-16">
      <label class="label">대표과제명 *</label>
      <input class="input" id="pmName" type="text" value="${escHtml(cp.name)}"
             placeholder="대표과제명을 입력하세요"
             oninput="validateProjectForm()" />
    </div>

    <div class="grid-2 mb-16" style="align-items:start;">
      <div>
        <label class="label">지원유형 *</label>
        <select class="select" id="pmSupportType" onchange="validateProjectForm()">
          <option value="">선택하세요</option>${supportOpts}
        </select>
      </div>
      <div>
        <label class="label">지원구분</label>
        <div class="row" style="gap:8px; flex-wrap:wrap; align-items:center;">
          <label class="cb-pill disabled" title="컨설팅은 항상 포함됩니다">
            <input type="checkbox" id="pmChkConsulting" checked
                   onclick="onPmConsultingClick(event)"> 컨설팅
          </label>
          <label class="cb-pill">
            <input type="checkbox" id="pmChkDirect" ${cp.hasConsulting ? 'checked' : ''}
                   onchange="onPmDirect()"> 직접지원
          </label>
        </div>
      </div>
    </div>

    <div class="form-row mb-16">
      <label class="label">세부유형 * <span class="text-sub" style="font-weight:400;">(하나 이상 선택)</span></label>
      <div class="row" style="flex-wrap:wrap; gap:6px;">${subTypePills}</div>
    </div>

    <div class="form-row mb-8">
      <label class="label">문제점 및 현황</label>
      <input class="input" id="pmProblem" type="text" value="${escHtml(cp.problem)}"
             placeholder="현재 문제점 및 현황" />
    </div>
    <div class="form-row mb-8">
      <label class="label">과제 내용 (1줄 요약)</label>
      <input class="input" id="pmSummary" type="text" value="${escHtml(cp.summary)}"
             placeholder="핵심 과제를 한 줄로 요약" />
    </div>
    <div class="form-row mb-16">
      <label class="label">목표 (추진목적, CSF 등)</label>
      <input class="input" id="pmGoal" type="text" value="${escHtml(cp.goal)}"
             placeholder="과제의 목표와 추진 방향" />
    </div>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">예산</span>
    </div>
    <table class="table inline-table" style="margin-top:4px;margin-bottom:20px;table-layout:fixed;width:100%;">
      <thead>
        <tr>
          <th rowspan="2" style="vertical-align:middle;text-align:center;width:17%;">인건비 <span style="font-weight:400;font-size:10px;color:var(--text-sub);">(자동)</span></th>
          <th rowspan="2" style="vertical-align:middle;text-align:center;width:17%;">직접지원비</th>
          <th colspan="2" style="text-align:center;border-bottom:1px solid var(--border);">사업운영비</th>
          <th style="text-align:center;width:14%;">간접비</th>
          <th rowspan="2" style="vertical-align:middle;text-align:center;width:15%;">합계</th>
        </tr>
        <tr>
          <th style="text-align:center;width:14%;font-weight:500;color:var(--text-sub);">인쇄비</th>
          <th style="text-align:center;width:14%;font-weight:500;color:var(--text-sub);">회의비</th>
          <th style="text-align:center;font-weight:500;color:var(--text-sub);">기술임치</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:6px 10px;text-align:right;font-size:12px;background:var(--accent-bg);"
              id="bdLaborCost" data-value="0">—</td>
          <td style="padding:6px 8px;">
            <input class="input" type="number" id="bdDirect" min="0" step="1"
                   value="${budget.directSupport || ''}" placeholder="0"
                   style="font-size:12px;padding:6px 8px;text-align:right;"
                   oninput="updateBudgetTotal()">
          </td>
          <td style="padding:6px 8px;">
            <input class="input" type="number" id="bdPrint" min="0" step="1"
                   value="${budget.printCost || ''}" placeholder="0"
                   style="font-size:12px;padding:6px 8px;text-align:right;"
                   oninput="updateBudgetTotal()">
          </td>
          <td style="padding:6px 8px;">
            <input class="input" type="number" id="bdMeeting" min="0" step="1"
                   value="${budget.meetingCost || ''}" placeholder="0"
                   style="font-size:12px;padding:6px 8px;text-align:right;"
                   oninput="updateBudgetTotal()">
          </td>
          <td style="padding:6px 8px;">
            <input class="input" type="number" id="bdIndirect" min="0" step="1"
                   value="${budget.indirectCost || ''}" placeholder="0"
                   style="font-size:12px;padding:6px 8px;text-align:right;"
                   oninput="updateBudgetTotal()">
          </td>
          <td style="padding:6px 10px;text-align:right;font-weight:700;font-size:13px;" id="bdGrandTotal">—</td>
        </tr>
      </tbody>
    </table>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">
        KPI <span class="text-sub" style="font-weight:400;">(대표과제)</span>
      </span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;"
              onclick="addKpiInlineRow('project')">+ KPI 추가</button>
    </div>
    <div id="pmKpiTable" class="mb-16"></div>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">컨설턴트 배정 <span class="text-sub" style="font-weight:400;">(대표과제)</span></span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;"
              onclick="addPmConsultantRow()">+ 컨설턴트 추가</button>
    </div>
    <div id="pmConsultantTable" class="mb-16"></div>

    <span class="section-title">세부과제</span>
    <div id="pmSubTable"></div>
  `;

  renderKpiTable('project');
  renderPmConsultantTable();
  renderSubTable();
  updateLaborCost();
  validateProjectForm();
}

function onPmDirect() {
  currentProject.hasConsulting = document.getElementById('pmChkDirect').checked;
  renderSubTable();
  validateProjectForm();
}
function onPmConsultingClick(e) {
  e.preventDefault();
  document.getElementById('pmChkConsulting').checked = true;
  showToast('컨설팅은 항상 포함됩니다.');
}

// ── 인건비 자동 계산 ──
function updateLaborCost() {
  let labor = 0;
  const pmBody = document.getElementById('pmConsultantTable-body');
  if (pmBody) {
    [...pmBody.querySelectorAll('tr[data-cid]')].forEach(row => {
      const name = row.querySelector('[data-role="cname"]')?.value;
      const md   = parseFloat(row.querySelector('[data-role="md"]')?.value) || 0;
      if (name) labor += (GRADE_RATES[getConsultantGrade(name)] || 0) * md;
    });
  }
  if (currentProject) {
    [...(currentProject.directSubs || []), ...(currentProject.consultingSubs || [])].forEach(s => {
      (s.consultants || []).forEach(c => {
        labor += (GRADE_RATES[c.grade || getConsultantGrade(c.name)] || 0) * (c.md || 0);
      });
    });
  }
  const el = document.getElementById('bdLaborCost');
  if (el) {
    el.dataset.value = labor;
    el.textContent   = labor > 0 ? labor.toLocaleString() + '원' : '—';
    el.style.color   = labor > 0 ? 'var(--text)' : 'var(--text-sub)';
  }
  updateBudgetTotal();
}

// ── 예산 합계 자동 계산 ──
function updateBudgetTotal() {
  const labor    = parseFloat(document.getElementById('bdLaborCost')?.dataset.value) || 0;
  const direct   = parseFloat(document.getElementById('bdDirect')?.value)   || 0;
  const print    = parseFloat(document.getElementById('bdPrint')?.value)    || 0;
  const meeting  = parseFloat(document.getElementById('bdMeeting')?.value)  || 0;
  const indirect = parseFloat(document.getElementById('bdIndirect')?.value) || 0;

  const grand = labor + direct + print + meeting + indirect;
  const fmt   = v => v > 0 ? v.toLocaleString() + '원' : '—';

  const grandEl = document.getElementById('bdGrandTotal');
  if (grandEl) {
    grandEl.textContent = fmt(grand);
    grandEl.style.color = grand > 0 ? 'var(--text)' : 'var(--text-sub)';
  }
}

// ── 과제 모달 유효성 검사 ──
function validateProjectForm() {
  const btn = document.getElementById('pmSaveBtn');
  if (!btn) return;

  const hasName        = !!(document.getElementById('pmName')?.value?.trim());
  const hasSupportType = !!(document.getElementById('pmSupportType')?.value);
  const hasSubType     = [...document.querySelectorAll('[name="pmSubType"]:checked')].length > 0;

  // 주 KPI: 프로젝트 인라인 행에 체크된 라디오 or 저장된 세부과제 kpis
  const hasProjectMain = !!document.querySelector('#pmKpiTable-body input[type="radio"]:checked');
  const hasSubMain     = currentProject
    ? [...currentProject.directSubs, ...currentProject.consultingSubs]
        .some(s => s.kpis.some(k => k.isMain))
    : false;

  const valid = hasName && hasSupportType && hasSubType && (hasProjectMain || hasSubMain);
  btn.disabled = !valid;
}

// ── 세부과제 테이블 (프로젝트 모달 내) ──
function renderSubTable() {
  const el = document.getElementById('pmSubTable');
  if (!el) return;
  const cp = currentProject;
  el.innerHTML =
    buildSubSection('consulting', cp.consultingSubs, '컨설팅 세부과제') +
    (cp.hasConsulting ? buildSubSection('direct', cp.directSubs, '직접지원 세부과제') : '');
}

// ── 세부과제 셀 포맷 ──
function fmtKpiCell(kpis) {
  if (!kpis?.length) return '<span class="text-sub" style="font-size:12px;">—</span>';
  return kpis.map(k => {
    const star   = k.isMain ? '<span style="color:#e09000;">★</span> ' : '';
    const before = k.before !== '' && k.before != null ? k.before : '?';
    const target = k.target !== '' && k.target != null ? k.target : '?';
    return `<div style="font-size:11px;line-height:1.7;">${star}<strong>${escHtml(k.v||'—')}</strong> <span class="text-sub">[${k.t}] ${before}→${target}</span></div>`;
  }).join('');
}
function fmtItemCell(items) {
  if (!items?.length) return '<span class="text-sub" style="font-size:12px;">—</span>';
  return items.map(it => {
    const amt  = it.amount ? ' · ' + Number(it.amount).toLocaleString() + '원' : '';
    const date = it.date   ? ' · ' + it.date : '';
    return `<div style="font-size:11px;line-height:1.7;">${escHtml(it.name||'—')}<span class="text-sub">${date}${amt}</span></div>`;
  }).join('');
}
function fmtConsultantCell(consultants) {
  if (!consultants?.length) return '<span class="text-sub" style="font-size:12px;">—</span>';
  return consultants.map(c => {
    const jCnt = Math.round(c.md || 0);
    const type = c.type || getConsultantType(c.name);
    const typeBadge = `<span class="badge ${type === '내부' ? 'badge-active' : 'badge-default'}" style="font-size:9px;margin-right:3px;">${type}</span>`;
    return `<div style="font-size:11px;line-height:1.7;">${typeBadge}<strong>${escHtml(c.name||'?')}</strong> <span class="text-sub">${c.md||0}MD · ${jCnt}일지</span></div>`;
  }).join('');
}

function buildSubSection(type, subs, label) {
  const isDirect = type === 'direct';
  const cols     = isDirect ? 6 : 5;
  const head = `<table class="table sub-table" style="margin-top:8px;">
    <thead><tr>
      <th style="width:32px;">#</th>
      <th style="min-width:100px;">과제명</th>
      <th>KPI</th>
      ${isDirect ? '<th>품목</th>' : ''}
      <th>컨설턴트</th>
      <th style="width:110px;"></th>
    </tr></thead>`;

  const rows = subs.map((sub, i) =>
    `<tr data-type="${type}" onclick="openSubModal('${type}',${sub.id})">
      <td class="text-sub text-sm">${i + 1}</td>
      <td>${escHtml(sub.name) || '<span class="text-sub">—</span>'}</td>
      <td style="vertical-align:top;padding-top:10px;">${fmtKpiCell(sub.kpis)}</td>
      ${isDirect ? `<td style="vertical-align:top;padding-top:10px;">${fmtItemCell(sub.items)}</td>` : ''}
      <td style="vertical-align:top;padding-top:10px;">${fmtConsultantCell(sub.consultants)}</td>
      <td><div class="row" style="gap:4px;">
        <button class="btn btn-outline text-sm"
                onclick="event.stopPropagation();openSubModal('${type}',${sub.id})">수정</button>
        <button class="btn btn-outline text-sm"
                onclick="event.stopPropagation();deleteSub('${type}',${sub.id})">삭제</button>
      </div></td>
    </tr>`
  ).join('');

  const body = subs.length
    ? `<tbody>${rows}</tbody></table>`
    : `<tbody><tr><td colspan="${cols}" style="text-align:center;padding:18px;" class="text-sub text-sm">항목이 없습니다</td></tr></tbody></table>`;

  return `<div style="margin-top:14px;">
    <div class="row">
      <span style="font-size:11px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:.6px;">${label}</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addSub('${type}')">+ 추가</button>
    </div>
    ${head + body}
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
  validateProjectForm();
}

// ── 과제 저장 ──
function saveProject() {
  const cp = currentProject;
  cp.name          = document.getElementById('pmName')?.value?.trim() || '';
  cp.supportType   = document.getElementById('pmSupportType')?.value || '';
  cp.hasConsulting = document.getElementById('pmChkDirect')?.checked || false;
  cp.problem       = document.getElementById('pmProblem')?.value || '';
  cp.summary       = document.getElementById('pmSummary')?.value || '';
  cp.goal          = document.getElementById('pmGoal')?.value || '';
  cp.subTypes      = [...document.querySelectorAll('[name="pmSubType"]:checked')].map(e => e.value);
  cp.kpis          = collectInlineKpis('project');
  cp.consultants   = collectPmConsultants();
  cp.budget        = {
    directSupport: parseFloat(document.getElementById('bdDirect')?.value)   || 0,
    printCost:     parseFloat(document.getElementById('bdPrint')?.value)    || 0,
    meetingCost:   parseFloat(document.getElementById('bdMeeting')?.value)  || 0,
    indirectCost:  parseFloat(document.getElementById('bdIndirect')?.value) || 0,
  };

  // 주 KPI 정규화
  const hasProjectMain = cp.kpis.some(k => k.isMain);
  if (hasProjectMain) {
    [...cp.directSubs, ...cp.consultingSubs]
      .forEach(s => s.kpis.forEach(k => { k.isMain = false; }));
  }

  if (cp.id) {
    const idx = projects.findIndex(p => p.id === cp.id);
    projects[idx] = { ...cp };
  } else {
    cp.id = nextPid++;
    projects.push({ ...cp });
  }
  saveToStorage();
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

  document.getElementById('smBody').innerHTML = `
    <div class="form-row mb-16">
      <label class="label">세부과제명</label>
      <input class="input" id="smName" type="text"
             value="${escHtml(sub.name||'')}" placeholder="세부과제명 입력" />
    </div>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">KPI *</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;"
              onclick="addKpiInlineRow('sub')">+ KPI 추가</button>
    </div>
    <div id="smKpiTable" class="mb-16"></div>

    ${isDirect ? `
    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">직접지원 품목 *</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;"
              onclick="addItemInlineRow()">+ 품목 추가</button>
    </div>
    <div id="smItemTable" class="mb-16"></div>` : ''}

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">컨설턴트 배정 *</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;"
              onclick="addConsultantInlineRow()">+ 컨설턴트 추가</button>
    </div>
    <div id="smConsultantTable"></div>
  `;

  renderKpiTable('sub');
  if (isDirect) renderItemTable();
  renderConsultantTable();
  validateSubForm();
}

// ── 세부과제 유효성 검사 ──
function validateSubForm() {
  const btn = document.getElementById('smSaveBtn');
  if (!btn) return;

  const hasKpi        = !!document.querySelector('#smKpiTable-body tr[data-kid]');
  const isDirect      = currentSubType === 'direct';
  const hasItem       = !isDirect || !!document.querySelector('#smItemTable-body tr[data-iid]');
  const hasConsultant = !!document.querySelector('#smConsultantTable-body tr[data-cid]');

  btn.disabled = !(hasKpi && hasItem && hasConsultant);
}

// ── 세부과제 저장 ──
function saveSubModal() {
  const subs = currentSubType === 'direct' ? currentProject.directSubs : currentProject.consultingSubs;
  const sub  = subs.find(s => s.id === currentSubId);
  if (!sub) return;

  sub.name        = document.getElementById('smName')?.value?.trim() || '';
  sub.kpis        = collectInlineKpis('sub');
  sub.consultants = collectInlineConsultants();
  if (currentSubType === 'direct') sub.items = collectInlineItems();

  // 주 KPI 정규화
  const hasSubMain = sub.kpis.some(k => k.isMain);
  if (hasSubMain) {
    [...currentProject.directSubs, ...currentProject.consultingSubs].forEach(s => {
      if (s.id !== currentSubId) s.kpis.forEach(k => { k.isMain = false; });
    });
    currentProject.kpis.forEach(k => { k.isMain = false; });
    // 프로젝트 모달 KPI 라디오도 DOM에서 해제
    document.querySelectorAll('#pmKpiTable-body input[type="radio"]')
      .forEach(r => { r.checked = false; });
  }

  closeSubModal();
  renderSubTable();
  updateLaborCost();
  validateProjectForm();
  showToast('세부과제가 저장되었습니다.');
}

// ════════════════════════════════════════════════════════
// KPI 인라인 테이블
// ════════════════════════════════════════════════════════
function renderKpiTable(context) {
  const kpis  = context === 'project' ? currentProject.kpis : (getCurrentSub()?.kpis || []);
  const elId  = context === 'project' ? 'pmKpiTable' : 'smKpiTable';
  const el    = document.getElementById(elId);
  if (!el) return;

  const bodyId  = `${elId}-body`;
  const rows    = kpis.map(k => buildKpiInlineRowHtml(k, kpiRowId(), context)).join('');
  const emptyTr = kpis.length ? '' : emptyRow(6, elId + '-empty');

  el.innerHTML = `<table class="table inline-table" style="margin-top:4px;">
    <thead><tr>
      <th style="width:48px;text-align:center;">주KPI</th>
      <th>KPI명</th>
      <th style="width:92px;">개선전</th>
      <th style="width:92px;">목표</th>
      <th style="width:78px;">개선율</th>
      <th style="width:52px;"></th>
    </tr></thead>
    <tbody id="${bodyId}">${rows}${emptyTr}</tbody>
  </table>`;
}

function buildKpiInlineRowHtml(k, rid, context) {
  const opts = KPI_META.map(m =>
    `<option value="${m.v}" data-type="${m.t}"${k?.v === m.v ? ' selected' : ''}>[${m.t}] ${m.v}</option>`
  ).join('');
  const vc = context === 'project' ? 'validateProjectForm()' : 'validateSubForm()';
  const initRate = k ? rateHtml(k) : '<span class="text-sub" style="font-size:12px;">—</span>';

  return `<tr data-kid="${rid}">
    <td style="text-align:center;padding:6px 4px;">
      <input type="radio" name="mainKpi-${context}" ${k?.isMain ? 'checked' : ''}
             style="width:14px;height:14px;cursor:pointer;"
             onchange="${vc}">
    </td>
    <td style="padding:4px 6px;">
      <select class="select" data-role="sel"
              style="font-size:12px;padding:5px 24px 5px 8px;"
              onchange="recalcKpiRate('${rid}');${vc}">
        <option value="">KPI 선택</option>${opts}
      </select>
    </td>
    <td style="padding:4px 5px;">
      <input class="input" type="number" data-role="before"
             value="${k?.before !== '' && k?.before != null ? k.before : ''}"
             placeholder="개선전" step="any"
             style="font-size:12px;padding:5px 7px;"
             oninput="recalcKpiRate('${rid}')">
    </td>
    <td style="padding:4px 5px;">
      <input class="input" type="number" data-role="target"
             value="${k?.target !== '' && k?.target != null ? k.target : ''}"
             placeholder="목표" step="any"
             style="font-size:12px;padding:5px 7px;"
             oninput="recalcKpiRate('${rid}')">
    </td>
    <td style="padding:4px 8px;" id="krate-${rid}">${initRate}</td>
    <td style="padding:4px 5px;text-align:center;">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;"
              onclick="removeKpiInlineRow('${rid}','${context}')">삭제</button>
    </td>
  </tr>`;
}

function addKpiInlineRow(context) {
  const elId   = context === 'project' ? 'pmKpiTable' : 'smKpiTable';
  const body   = document.getElementById(`${elId}-body`);
  if (!body) return;
  document.getElementById(`${elId}-empty`)?.remove();
  const rid = kpiRowId();
  body.insertAdjacentHTML('beforeend', buildKpiInlineRowHtml(null, rid, context));
  context === 'project' ? validateProjectForm() : validateSubForm();
}

function removeKpiInlineRow(rid, context) {
  document.querySelector(`tr[data-kid="${rid}"]`)?.remove();
  const elId = context === 'project' ? 'pmKpiTable' : 'smKpiTable';
  const body = document.getElementById(`${elId}-body`);
  if (body && !body.querySelector('tr[data-kid]'))
    body.insertAdjacentHTML('beforeend', emptyRow(6, `${elId}-empty`));
  context === 'project' ? validateProjectForm() : validateSubForm();
}

function recalcKpiRate(rid) {
  const row  = document.querySelector(`tr[data-kid="${rid}"]`);
  if (!row) return;
  const sel  = row.querySelector('[data-role="sel"]');
  const type = sel?.options[sel.selectedIndex]?.dataset?.type || '';
  const el   = document.getElementById(`krate-${rid}`);
  if (!el) return;
  const k = { t: type, before: row.querySelector('[data-role="before"]')?.value, target: row.querySelector('[data-role="target"]')?.value };
  el.innerHTML = rateHtml(k);
}

function collectInlineKpis(context) {
  const elId = context === 'project' ? 'pmKpiTable' : 'smKpiTable';
  const body = document.getElementById(`${elId}-body`);
  if (!body) return [];
  return [...body.querySelectorAll('tr[data-kid]')].map(row => {
    const sel = row.querySelector('[data-role="sel"]');
    const opt = sel?.options[sel?.selectedIndex];
    const bv  = row.querySelector('[data-role="before"]')?.value;
    const tv  = row.querySelector('[data-role="target"]')?.value;
    return {
      v:      sel?.value || '',
      t:      opt?.dataset?.type || '',
      before: bv !== '' ? parseFloat(bv) : '',
      target: tv !== '' ? parseFloat(tv) : '',
      isMain: row.querySelector('input[type="radio"]')?.checked || false,
    };
  }).filter(k => k.v);
}

// ════════════════════════════════════════════════════════
// 직접지원 품목 인라인 테이블
// ════════════════════════════════════════════════════════
function renderItemTable() {
  const sub   = getCurrentSub();
  if (!sub) return;
  const items = sub.items || [];
  const el    = document.getElementById('smItemTable');
  if (!el) return;

  const rows   = items.map(it => buildItemInlineRowHtml(it, numId())).join('');
  const emptyTr = items.length ? '' : emptyRow(5, 'smItemTable-empty');

  el.innerHTML = `<table class="table inline-table" style="margin-top:4px;">
    <thead><tr>
      <th>품목명</th>
      <th style="width:120px;">취득일자</th>
      <th style="width:130px;">금액 (원)</th>
      <th style="width:160px;">파일</th>
      <th style="width:52px;"></th>
    </tr></thead>
    <tbody id="smItemTable-body">${rows}${emptyTr}</tbody>
  </table>`;
}

function buildItemInlineRowHtml(it, iid) {
  const fileHtml = (it?.files || []).map(f =>
    `<div class="file-item" style="margin-top:3px;">
       <span>📄 ${escHtml(f.name)}</span>
       <button onclick="this.closest('.file-item').remove()">✕</button>
     </div>`
  ).join('');

  return `<tr data-iid="${iid}">
    <td style="padding:4px 6px;">
      <input class="input" type="text" data-role="name"
             value="${escHtml(it?.name||'')}" placeholder="품목명 *"
             style="font-size:12px;padding:5px 8px;"
             oninput="validateSubForm()">
    </td>
    <td style="padding:4px 5px;">
      <input class="input" type="date" data-role="date"
             value="${it?.date||''}"
             style="font-size:12px;padding:5px 7px;">
    </td>
    <td style="padding:4px 5px;">
      <input class="input" type="number" data-role="amount"
             value="${it?.amount||''}" placeholder="0" min="0"
             style="font-size:12px;padding:5px 7px;">
    </td>
    <td style="padding:4px 6px;">
      <input type="file" id="ifile-${iid}" multiple style="display:none;"
             onchange="handleInlineFiles('${iid}',this)">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;width:100%;"
              onclick="document.getElementById('ifile-${iid}').click()">📎 파일 추가</button>
      <div id="iflist-${iid}" class="file-list">${fileHtml}</div>
    </td>
    <td style="padding:4px 5px;text-align:center;">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;"
              onclick="removeItemInlineRow('${iid}')">삭제</button>
    </td>
  </tr>`;
}

function addItemInlineRow() {
  const body = document.getElementById('smItemTable-body');
  if (!body) return;
  document.getElementById('smItemTable-empty')?.remove();
  const iid = numId();
  body.insertAdjacentHTML('beforeend', buildItemInlineRowHtml(null, iid));
  validateSubForm();
}

function removeItemInlineRow(iid) {
  document.querySelector(`tr[data-iid="${iid}"]`)?.remove();
  const body = document.getElementById('smItemTable-body');
  if (body && !body.querySelector('tr[data-iid]'))
    body.insertAdjacentHTML('beforeend', emptyRow(5, 'smItemTable-empty'));
  validateSubForm();
}

function handleInlineFiles(iid, input) {
  const list = document.getElementById(`iflist-${iid}`);
  if (!list) return;
  Array.from(input.files).forEach(f => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.style.marginTop = '3px';
    div.innerHTML = `<span>📄 ${escHtml(f.name)} <span class="text-sub">(${(f.size/1024).toFixed(1)}KB)</span></span>
      <button onclick="this.closest('.file-item').remove()">✕</button>`;
    list.appendChild(div);
  });
  input.value = '';
}

function collectInlineItems() {
  const body = document.getElementById('smItemTable-body');
  if (!body) return [];
  return [...body.querySelectorAll('tr[data-iid]')].map(row => {
    const iid  = row.dataset.iid;
    const fels = [...(document.getElementById(`iflist-${iid}`)?.querySelectorAll('.file-item') || [])];
    return {
      id:     parseInt(iid),
      name:   row.querySelector('[data-role="name"]')?.value?.trim() || '',
      date:   row.querySelector('[data-role="date"]')?.value || '',
      amount: parseFloat(row.querySelector('[data-role="amount"]')?.value) || 0,
      files:  fels.map(el => ({ name: el.querySelector('span')?.textContent?.replace(/^📄 /, '').replace(/\s*\(.*\)$/, '') || '' })),
    };
  }).filter(it => it.name);
}

// ════════════════════════════════════════════════════════
// 컨설턴트 배정 인라인 테이블
// ════════════════════════════════════════════════════════
function renderConsultantTable() {
  const sub         = getCurrentSub();
  if (!sub) return;
  const consultants = sub.consultants || [];
  const el          = document.getElementById('smConsultantTable');
  if (!el) return;

  const rows   = consultants.map(c => buildConsultantInlineRowHtml(c, numId())).join('');
  const emptyTr = consultants.length ? '' : emptyRow(5, 'smConsultantTable-empty');

  el.innerHTML = `<table class="table inline-table" style="margin-top:4px;">
    <thead><tr>
      <th>컨설턴트명</th>
      <th style="width:100px;">MD</th>
      <th style="width:80px;">수행일지</th>
      <th style="width:170px;">예정일자</th>
      <th style="width:52px;"></th>
    </tr></thead>
    <tbody id="smConsultantTable-body">${rows}${emptyTr}</tbody>
  </table>`;
}

function buildConsultantInlineRowHtml(c, cid) {
  const md    = c?.md || 0;
  const jCnt  = Math.round(md);
  const dates = c?.dates || [];
  const datesJson = escHtml(JSON.stringify(dates));

  const datePreviewHtml = dates.filter(d => d).map((d, i) =>
    `<div class="date-preview-item">${i + 1}회차: ${d}</div>`
  ).join('');

  const datesLabel = jCnt > 0
    ? (dates.filter(d => d).length + '/' + jCnt + '회 등록')
    : '—';

  const consultantOpts = CONSULTANT_LIST.map(n =>
    `<option value="${escHtml(n.name)}"${c?.name === n.name ? ' selected' : ''}>${escHtml(n.name)} [${n.type}] [${n.grade}]</option>`
  ).join('');

  const selectedType = c?.type || (c?.name ? getConsultantType(c.name) : '');
  const typeBadgeHtml = selectedType
    ? `<span class="badge ${selectedType === '내부' ? 'badge-active' : 'badge-default'}" style="font-size:10px;">${selectedType}</span>`
    : '<span class="text-sub" style="font-size:12px;">—</span>';

  return `<tr data-cid="${cid}" data-dates="${datesJson}">
    <td style="padding:4px 6px;">
      <select class="select" data-role="cname"
              style="font-size:12px;padding:5px 24px 5px 8px;"
              onchange="onConsultantChange('${cid}')">
        <option value="">선택하세요</option>${consultantOpts}
      </select>
    </td>
    <td style="padding:4px 5px;">
      <input class="input" type="number" data-role="md"
             id="cmd-${cid}" value="${md||''}" placeholder="0.0"
             min="0" step="0.5"
             style="font-size:12px;padding:5px 7px;"
             oninput="onCMdInput('${cid}')"
             onblur="onCMdBlur('${cid}')">
    </td>
    <td style="padding:4px 8px;text-align:center;" id="cjournal-${cid}">
      <span class="text-sm text-sub">${jCnt > 0 ? jCnt + '개' : '—'}</span>
    </td>
    <td style="padding:4px 6px;">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;width:100%;"
              onclick="openDateModal('${cid}')">📅 일자 지정 · ${escHtml(datesLabel)}</button>
      <div id="cdate-preview-${cid}" class="file-list">${datePreviewHtml}</div>
    </td>
    <td style="padding:4px 5px;text-align:center;">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;"
              onclick="removeConsultantInlineRow('${cid}')">삭제</button>
    </td>
  </tr>`;
}

function onConsultantChange(cid) {
  updateLaborCost();
}

function addConsultantInlineRow() {
  const body = document.getElementById('smConsultantTable-body');
  if (!body) return;
  document.getElementById('smConsultantTable-empty')?.remove();
  const cid = numId();
  body.insertAdjacentHTML('beforeend', buildConsultantInlineRowHtml(null, cid));
  validateSubForm();
}

function removeConsultantInlineRow(cid) {
  const tr = document.querySelector(`tr[data-cid="${cid}"]`);
  if (!tr) return;
  const body = tr.closest('tbody');
  tr.remove();
  if (body && !body.querySelector('tr[data-cid]')) {
    body.insertAdjacentHTML('beforeend', emptyRow(5, body.id + '-empty'));
  }
  if (body?.id === 'smConsultantTable-body') validateSubForm();
}

function addPmConsultantRow() {
  const body = document.getElementById('pmConsultantTable-body');
  if (!body) return;
  document.getElementById('pmConsultantTable-body-empty')?.remove();
  const cid = numId();
  body.insertAdjacentHTML('beforeend', buildConsultantInlineRowHtml(null, cid));
}

function renderPmConsultantTable() {
  const el = document.getElementById('pmConsultantTable');
  if (!el) return;
  const consultants = currentProject.consultants || [];
  const rows   = consultants.map(c => buildConsultantInlineRowHtml(c, numId())).join('');
  const emptyTr = consultants.length ? '' : emptyRow(5, 'pmConsultantTable-body-empty');
  el.innerHTML = `<table class="table inline-table" style="margin-top:4px;">
    <thead><tr>
      <th>컨설턴트명</th>
      <th style="width:100px;">MD</th>
      <th style="width:80px;">수행일지</th>
      <th style="width:170px;">예정일자</th>
      <th style="width:52px;"></th>
    </tr></thead>
    <tbody id="pmConsultantTable-body">${rows}${emptyTr}</tbody>
  </table>`;
}

function collectPmConsultants() {
  const body = document.getElementById('pmConsultantTable-body');
  if (!body) return [];
  return [...body.querySelectorAll('tr[data-cid]')].map(row => {
    const cid   = row.dataset.cid;
    const md    = Math.round((parseFloat(row.querySelector('[data-role="md"]')?.value) || 0) * 2) / 2;
    const dates = JSON.parse(row.dataset.dates || '[]');
    const name  = row.querySelector('[data-role="cname"]')?.value?.trim() || '';
    return { id: parseInt(cid), name, type: name ? getConsultantType(name) : '외부', md, dates };
  });
}

function onCMdInput(cid) {
  const v   = parseFloat(document.getElementById(`cmd-${cid}`)?.value) || 0;
  const cnt = Math.round(v);
  const jEl = document.getElementById(`cjournal-${cid}`);
  if (jEl) jEl.innerHTML = `<span class="text-sm text-sub">${cnt > 0 ? cnt + '개' : '—'}</span>`;
  updateLaborCost();
}

function onCMdBlur(cid) {
  const el = document.getElementById(`cmd-${cid}`);
  if (!el) return;
  let v = parseFloat(el.value);
  if (isNaN(v) || v < 0) { el.value = ''; onCMdInput(cid); return; }
  v = Math.round(v * 2) / 2;
  el.value = v;
  onCMdInput(cid);
}

function collectInlineConsultants() {
  const body = document.getElementById('smConsultantTable-body');
  if (!body) return [];
  return [...body.querySelectorAll('tr[data-cid]')].map(row => {
    const cid  = row.dataset.cid;
    const md   = Math.round((parseFloat(row.querySelector('[data-role="md"]')?.value) || 0) * 2) / 2;
    const dates = JSON.parse(row.dataset.dates || '[]');
    const name = row.querySelector('[data-role="cname"]')?.value?.trim() || '';
    return { id: parseInt(cid), name, type: name ? getConsultantType(name) : '외부', md, dates };
  });
}

// ════════════════════════════════════════════════════════
// 예정 컨설팅 일자 모달
// ════════════════════════════════════════════════════════
function openDateModal(cid) {
  currentDateRowId = cid;
  const row   = document.querySelector(`tr[data-cid="${cid}"]`);
  if (!row) return;
  const md    = parseFloat(document.getElementById(`cmd-${cid}`)?.value) || 0;
  const dates = JSON.parse(row.dataset.dates || '[]');
  const jCnt  = Math.round(md);

  document.getElementById('dmBody').innerHTML = `
    <div class="grid-2 mb-12">
      <div>
        <label class="label">배정 MD <span class="text-sub">(0.5 단위)</span></label>
        <input class="input" type="number" id="dmMd" min="0" step="0.5"
               value="${md||''}" placeholder="0.0"
               oninput="onDmMdInput()" onblur="onDmMdBlur()">
      </div>
      <div>
        <label class="label">수행일지 수 <span class="text-sub">(자동)</span></label>
        <div class="input" id="dmJournal"
             style="background:var(--accent-bg);color:${jCnt>0?'var(--text)':'var(--text-sub)'};user-select:none;">
          ${jCnt > 0 ? jCnt + '개' : '—'}
        </div>
      </div>
    </div>
    <div>
      <label class="label">예정 컨설팅 일자</label>
      <div id="dmDates" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;"></div>
    </div>
  `;

  renderDmDateInputs(md, dates);
  document.getElementById('dateModal').classList.add('open');
}

function closeDateModal() {
  document.getElementById('dateModal').classList.remove('open');
  currentDateRowId = null;
}

function onDmMdInput() {
  const v   = parseFloat(document.getElementById('dmMd')?.value) || 0;
  const cnt = Math.round(v);
  const jEl = document.getElementById('dmJournal');
  if (jEl) {
    jEl.textContent = cnt > 0 ? cnt + '개' : '—';
    jEl.style.color = cnt > 0 ? 'var(--text)' : 'var(--text-sub)';
  }
}

function onDmMdBlur() {
  const el = document.getElementById('dmMd');
  if (!el) return;
  let v = parseFloat(el.value);
  if (isNaN(v) || v < 0) { el.value = ''; renderDmDateInputs(0, []); return; }
  v = Math.round(v * 2) / 2;
  el.value = v;
  onDmMdInput();
  const existing = [...document.querySelectorAll('#dmDates input[type="date"]')].map(i => i.value);
  renderDmDateInputs(v, existing);
}

function renderDmDateInputs(md, existingDates) {
  const count = Math.round(md);
  const el    = document.getElementById('dmDates');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.cssText = 'align-items:center;gap:10px;';
    row.innerHTML = `
      <span class="text-sm text-sub" style="width:44px;flex-shrink:0;text-align:right;">${i + 1}회차</span>
      <input class="input" type="date" data-session="${i + 1}"
             value="${existingDates[i] || ''}" style="max-width:180px;">`;
    el.appendChild(row);
  }
}

function saveDateModal() {
  const md    = Math.round((parseFloat(document.getElementById('dmMd')?.value) || 0) * 2) / 2;
  const dates = [...document.querySelectorAll('#dmDates input[type="date"]')].map(i => i.value);
  const cid   = currentDateRowId;

  const row = document.querySelector(`tr[data-cid="${cid}"]`);
  if (row) {
    // MD를 행의 인풋에 동기화
    const mdInput = document.getElementById(`cmd-${cid}`);
    if (mdInput) { mdInput.value = md; onCMdInput(cid); }

    // 날짜 데이터 저장
    row.dataset.dates = JSON.stringify(dates);

    // 날짜 미리보기 갱신
    const previewEl = document.getElementById(`cdate-preview-${cid}`);
    if (previewEl) {
      previewEl.innerHTML = dates.filter(d => d).map((d, i) =>
        `<div class="date-preview-item">${i + 1}회차: ${d}</div>`
      ).join('');
    }

    // 버튼 라벨 갱신
    const btn = row.querySelector('td:nth-child(4) button');
    const filled = dates.filter(d => d).length;
    const jCnt  = Math.round(md);
    if (btn) btn.textContent = `📅 일자 지정 · ${jCnt > 0 ? filled + '/' + jCnt + '회 등록' : '—'}`;
  }

  closeDateModal();
  showToast('일자가 저장되었습니다.');
}

// ════════════════════════════════════════════════════════
// 공통 유틸
// ════════════════════════════════════════════════════════
function emptyRow(colspan, id) {
  return `<tr${id ? ` id="${id}"` : ''}><td colspan="${colspan}" style="text-align:center;padding:16px;" class="text-sub text-sm">항목이 없습니다</td></tr>`;
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
});
