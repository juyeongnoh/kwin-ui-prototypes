// ===== subproject-ui.js =====
// 구조: 대표과제에 컨설턴트 MD 배정 + 세부과제(하나 이상, 유형 선택, KPI 1개)

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
// KPI 마스터테이블 (관리자가 관리, 런타임 추가 가능)
let kpiMaster = [
  {v:'불량률',t:'망소'},{v:'유저이탈율',t:'망소'},{v:'제조시간',t:'망소'},{v:'배출가스',t:'망소'},
  {v:'재작업률',t:'망소'},{v:'에너지소비량',t:'망소'},{v:'생산량',t:'망대'},{v:'매출액',t:'망대'},
  {v:'고객만족도',t:'망대'},{v:'생산성',t:'망대'},{v:'설비가동률',t:'망대'},{v:'수율',t:'망대'},
  {v:'길이',t:'망목'},{v:'중량',t:'망목'},{v:'전압',t:'망목'},{v:'특허 달성 건수',t:'망목'},
];
const GRADE_RATES = { '특급': 500000, '중급': 300000 };

function getConsultantType(name)  { return CONSULTANT_LIST.find(c => c.name === name)?.type  || '외부'; }
function getConsultantGrade(name) { return CONSULTANT_LIST.find(c => c.name === name)?.grade || '중급'; }

// ── 샘플 데이터 ──
const DEFAULT_PROJECTS = [{
  id: 1,
  name: '제조 공정 스마트화',
  supportType: '생산혁신',
  subTypes: ['p', 'q1'],
  hasConsulting: true,
  problem: '공정 불량률 과다 및 설비 노후화로 원가 경쟁력 저하',
  summary: '스마트 센서·AI 도입으로 불량 감지 및 공정 혁신',
  goal: '불량률 50% 감소, 설비가동률 20% 향상',
  consultants: [
    { id: 5, name: '최자문위원', type: '내부', grade: '특급', md: 4, dates: [] }
  ],
  subprojects: [
    {
      id: 1, name: '스마트 공정 컨설팅', type: 'consulting',
      kpi: { v: '불량률', t: '망소', before: 200, target: 100 },
      isMainKpi: true, items: []
    },
    {
      id: 2, name: '스마트 설비 도입', type: 'direct_support',
      kpi: { v: '설비가동률', t: '망대', before: 75, target: 92 },
      isMainKpi: false,
      items: [{ id: 1, name: '스마트 비전 센서', date: '2026-07-01', amount: 8000000, files: [] }]
    }
  ],
  budget: { directSupport: 8000000, printCost: 200000, meetingCost: 300000, indirectCost: 150000 }
}];

let projects   = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
let nextPid    = 10;
let currentProject    = null;
let currentSubproject = null;
let currentDateRowId  = null;

let _seq = 0;
const numId = () => ++_seq;

function resetData() {
  if (!confirm('데이터를 기본값으로 초기화하시겠습니까?')) return;
  projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
  nextPid  = 10;
  renderTable();
  showToast('데이터가 초기화되었습니다.');
}

// ── 유틸 ──
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function calcRate(k) {
  const c = parseFloat(k.before), t = parseFloat(k.target);
  if (isNaN(c) || isNaN(t) || c === 0) return null;
  if (k.t === '망대') return ((t - c) / Math.abs(c)) * 100;
  if (k.t === '망소') return ((c - t) / Math.abs(c)) * 100;
  if (k.t === '망목') return (Math.abs(c - t) / Math.abs(c)) * 100;
  return null;
}
function rateHtml(k) {
  const r = calcRate(k);
  if (r === null) return '<span class="text-sub" style="font-size:12px;">—</span>';
  const pos = k.t === '망목' ? Math.abs(r) <= 5 : r > 0;
  return `<span style="color:${pos?'#2a6a2a':'#7a1a1a'};font-weight:600;font-size:12px;">${r>0?'+':''}${r.toFixed(1)}%</span>`;
}
function emptyRow(cols, id) {
  return `<tr${id?` id="${id}"`:''}><td colspan="${cols}" style="text-align:center;padding:16px;" class="text-sub text-sm">항목이 없습니다</td></tr>`;
}

// ════════════════════════════════════════════════════════
// 메인 테이블
// ════════════════════════════════════════════════════════
function buildNameCell(p) {
  const nm = `<div class="font-bold" style="font-size:14px;">${escHtml(p.name||'—')}</div>`;
  const d  = [
    p.problem ? `<div><span style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.4px;">문제점</span>&nbsp;<span class="text-sub" style="font-size:11px;">${escHtml(p.problem)}</span></div>` : '',
    p.summary ? `<div><span style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.4px;">요약</span>&nbsp;<span class="text-sub" style="font-size:11px;">${escHtml(p.summary)}</span></div>` : '',
    p.goal    ? `<div><span style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.4px;">목표</span>&nbsp;<span class="text-sub" style="font-size:11px;">${escHtml(p.goal)}</span></div>` : '',
  ].filter(Boolean).join('');
  return nm + (d ? `<div style="margin-top:5px;display:flex;flex-direction:column;gap:2px;">${d}</div>` : '');
}

function buildKpiCell(p) {
  const kpis = (p.subprojects || [])
    .filter(sp => sp.kpi?.v)
    .map(sp => ({ ...sp.kpi, src: sp.name, isMain: sp.isMainKpi }));
  if (!kpis.length) return '<span class="text-sub" style="font-size:12px;">—</span>';
  return kpis.map(k => {
    const star   = k.isMain ? '<span style="color:#e09000;font-size:13px;">★</span> ' : '';
    const weight = k.isMain ? 'font-weight:700;' : 'color:var(--text-sub);';
    const src    = `<span style="display:inline-block;font-size:9px;background:var(--accent-bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px;margin-right:3px;vertical-align:middle;">${escHtml(k.src)}</span>`;
    const bef    = k.before != null && k.before !== '' ? k.before : '?';
    const tgt    = k.target != null && k.target !== '' ? k.target : '?';
    return `<div style="font-size:11px;line-height:1.9;${weight}">${star}${src}[${k.t}] ${escHtml(k.v||'—')} <span style="font-weight:400;color:var(--text-sub);font-size:10px;">${bef}→${tgt}</span></div>`;
  }).join('');
}

function buildConsultantCell(p) {
  const cons = p.consultants || [];
  if (!cons.length) return '<span class="text-sub" style="font-size:12px;">—</span>';
  return cons.map(c => {
    const t   = c.type || getConsultantType(c.name);
    const bdg = `<span class="badge ${t==='내부'?'badge-active':'badge-default'}" style="font-size:9px;margin-right:3px;">${t}</span>`;
    const tag = t === '내부' ? `<span style="font-size:9px;background:#dbeafe;border:1px solid #93c5fd;border-radius:3px;padding:1px 5px;color:#1d4ed8;font-weight:600;margin-left:4px;">연계사업 관리</span>` : '';
    return `<div style="font-size:11px;line-height:1.8;">${bdg}<strong>${escHtml(c.name||'?')}</strong> <span class="text-sub">${c.md||0}MD</span>${tag}</div>`;
  }).join('');
}

function buildSubCell(p) {
  const sps = p.subprojects || [];
  if (!sps.length) return '<span class="text-sub" style="font-size:12px;">—</span>';
  return sps.map(sp => {
    const lbl  = sp.type === 'direct_support' ? '직접지원' : '컨설팅';
    const bdg  = `<span style="font-size:9px;background:var(--accent-bg);border:1px solid var(--border);border-radius:3px;padding:1px 4px;margin-right:4px;">${lbl}</span>`;
    const name = `<div style="font-size:12px;font-weight:600;line-height:1.8;">${bdg}${escHtml(sp.name||'—')}</div>`;
    let kpiLine = '';
    if (sp.kpi?.v) {
      const star = sp.isMainKpi ? '<span style="color:#e09000;">★</span> ' : '';
      const bef  = sp.kpi.before != null && sp.kpi.before !== '' ? sp.kpi.before : '?';
      const tgt  = sp.kpi.target != null && sp.kpi.target !== '' ? sp.kpi.target : '?';
      kpiLine = `<div style="font-size:11px;color:var(--text-sub);padding-left:4px;">${star}${escHtml(sp.kpi.v)} [${sp.kpi.t}] ${bef}→${tgt} ${rateHtml(sp.kpi)}</div>`;
    }
    const itemLine = (sp.type === 'direct_support' && sp.items?.length)
      ? `<div style="font-size:11px;color:var(--text-sub);padding-left:4px;">품목: ${sp.items.map(i=>escHtml(i.name)).join(', ')}</div>` : '';
    return `<div style="margin-bottom:6px;">${name}${kpiLine}${itemLine}</div>`;
  }).join('');
}

function buildBudgetCell(p) {
  const labor  = (p.consultants||[]).reduce((s,c)=>s+(GRADE_RATES[c.grade||getConsultantGrade(c.name)]||0)*(c.md||0), 0);
  const b      = p.budget || {};
  const direct = b.directSupport || 0;
  const op     = (b.printCost||0) + (b.meetingCost||0);
  const ind    = b.indirectCost || 0;
  const total  = labor + direct + op + ind;
  if (total === 0) return '<span class="text-sub" style="font-size:12px;">—</span>';
  const fmt = n => n > 0 ? n.toLocaleString()+'원' : null;
  return [
    `<div style="font-size:12px;font-weight:700;">합계 ${fmt(total)}</div>`,
    labor  > 0 ? `<div style="font-size:11px;color:var(--text-sub);">인건비 ${fmt(labor)}</div>` : '',
    direct > 0 ? `<div style="font-size:11px;color:var(--text-sub);">직접지원비 ${fmt(direct)}</div>` : '',
    op     > 0 ? `<div style="font-size:11px;color:var(--text-sub);">사업운영비 ${fmt(op)}</div>` : '',
    ind    > 0 ? `<div style="font-size:11px;color:var(--text-sub);">간접비 ${fmt(ind)}</div>` : '',
  ].filter(Boolean).join('');
}

function renderTable() {
  const el   = document.getElementById('projectTable');
  const head = `<table class="table"><thead><tr>
    <th style="width:28px;">#</th>
    <th style="min-width:180px;">대표과제명</th>
    <th style="width:80px;">지원유형</th>
    <th style="width:90px;">세부유형</th>
    <th style="min-width:120px;">컨설턴트</th>
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
    const pills = (p.subTypes||[]).map(t => `<span class="badge badge-default" style="font-size:10px;padding:1px 5px;">${t.toUpperCase()}</span>`).join(' ');
    return `<tr style="vertical-align:top;">
      <td class="text-sub text-sm" style="padding-top:12px;">${i+1}</td>
      <td style="padding-top:10px;">${buildNameCell(p)}</td>
      <td style="padding-top:12px;"><span class="badge badge-active">${escHtml(p.supportType)}</span></td>
      <td style="padding-top:12px;">${pills||'—'}</td>
      <td style="padding-top:10px;">${buildConsultantCell(p)}</td>
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
      id: null, name: '', supportType: '', subTypes: [],
      hasConsulting: false,
      problem: '', summary: '', goal: '',
      consultants: [], subprojects: [],
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
  const cp  = currentProject;
  const bud = cp.budget || {};
  const supportOpts = ['생산혁신','기술혁신','일터혁신','시장혁신'].map(t =>
    `<option${cp.supportType===t?' selected':''}>${t}</option>`).join('');
  const subTypePills = ['p','q1','q2','c','d','m1','m2','ma1','ma2'].map(t =>
    `<label class="cb-pill"><input type="checkbox" name="pmSubType" value="${t}"
       ${(cp.subTypes||[]).includes(t)?'checked':''} onchange="validateProjectForm()">${t.toUpperCase()}</label>`
  ).join('');

  document.getElementById('pmBody').innerHTML = `
    <div class="form-row mb-16">
      <label class="label">대표과제명 *</label>
      <input class="input" id="pmName" type="text" value="${escHtml(cp.name)}"
             placeholder="대표과제명을 입력하세요" oninput="validateProjectForm()" />
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
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;">
          <label class="cb-pill disabled" title="컨설팅은 항상 포함됩니다">
            <input type="checkbox" id="pmChkConsulting" checked onclick="onPmConsultingClick(event)"> 컨설팅
          </label>
          <label class="cb-pill">
            <input type="checkbox" id="pmChkDirect" ${cp.hasConsulting?'checked':''}
                   onchange="onPmDirect()"> 직접지원
          </label>
        </div>
      </div>
    </div>

    <div class="form-row mb-16">
      <label class="label">세부유형 * <span class="text-sub" style="font-weight:400;">(하나 이상 선택)</span></label>
      <div class="row" style="flex-wrap:wrap;gap:6px;">${subTypePills}</div>
    </div>

    <div class="form-row mb-8">
      <label class="label">문제점 및 현황</label>
      <input class="input" id="pmProblem" type="text" value="${escHtml(cp.problem)}" placeholder="현재 문제점 및 현황" />
    </div>
    <div class="form-row mb-8">
      <label class="label">과제 내용 (1줄 요약)</label>
      <input class="input" id="pmSummary" type="text" value="${escHtml(cp.summary)}" placeholder="핵심 과제를 한 줄로 요약" />
    </div>
    <div class="form-row mb-16">
      <label class="label">목표 (추진목적, CSF 등)</label>
      <input class="input" id="pmGoal" type="text" value="${escHtml(cp.goal)}" placeholder="과제의 목표와 추진 방향" />
    </div>

    <div class="row mb-8"><span class="section-title" style="margin-bottom:0;">예산</span></div>
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
      <tbody><tr>
        <td style="padding:6px 10px;text-align:right;font-size:12px;background:var(--accent-bg);"
            id="bdLaborCost" data-value="0">—</td>
        <td style="padding:6px 8px;"><input class="input" type="number" id="bdDirect" min="0" step="1"
            value="${bud.directSupport||''}" placeholder="0" style="font-size:12px;padding:6px 8px;text-align:right;" oninput="updateBudgetTotal()"></td>
        <td style="padding:6px 8px;"><input class="input" type="number" id="bdPrint" min="0" step="1"
            value="${bud.printCost||''}" placeholder="0" style="font-size:12px;padding:6px 8px;text-align:right;" oninput="updateBudgetTotal()"></td>
        <td style="padding:6px 8px;"><input class="input" type="number" id="bdMeeting" min="0" step="1"
            value="${bud.meetingCost||''}" placeholder="0" style="font-size:12px;padding:6px 8px;text-align:right;" oninput="updateBudgetTotal()"></td>
        <td style="padding:6px 8px;"><input class="input" type="number" id="bdIndirect" min="0" step="1"
            value="${bud.indirectCost||''}" placeholder="0" style="font-size:12px;padding:6px 8px;text-align:right;" oninput="updateBudgetTotal()"></td>
        <td style="padding:6px 10px;text-align:right;font-weight:700;font-size:13px;" id="bdGrandTotal">—</td>
      </tr></tbody>
    </table>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">컨설턴트 배정</span>
      <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addConsultantRow()">+ 컨설턴트 추가</button>
    </div>
    <div id="pmConsultantTable" class="mb-16"></div>

    <div class="row mb-8">
      <span class="section-title" style="margin-bottom:0;">세부과제</span>
      <span class="text-sub text-sm" style="margin-left:6px;">하나 이상 필수 · 주 KPI 하나 설정</span>
      <button class="btn btn-primary text-sm" style="margin-left:auto;" onclick="openSpModal()">+ 세부과제 추가</button>
    </div>
    <div id="pmSpTable"></div>
  `;

  renderPmConsultantTable();
  renderPmSpTable();
  updateLaborCost();
  validateProjectForm();
}

function onPmDirect() {
  const checked = document.getElementById('pmChkDirect').checked;
  if (!checked) {
    const hasDirectSp = currentProject.subprojects.some(sp => sp.type === 'direct_support');
    if (hasDirectSp) {
      if (!confirm('직접지원 세부과제가 존재합니다. 직접지원을 해제하면 해당 세부과제가 모두 삭제됩니다. 계속하시겠습니까?')) {
        document.getElementById('pmChkDirect').checked = true;
        return;
      }
      currentProject.subprojects = currentProject.subprojects.filter(sp => sp.type !== 'direct_support');
      renderPmSpTable();
    }
  }
  currentProject.hasConsulting = checked;
  validateProjectForm();
}
function onPmConsultingClick(e) {
  e.preventDefault();
  document.getElementById('pmChkConsulting').checked = true;
  showToast('컨설팅은 항상 포함됩니다.');
}

function validateProjectForm() {
  const btn = document.getElementById('pmSaveBtn');
  if (!btn) return;
  const hasName    = !!(document.getElementById('pmName')?.value?.trim());
  const hasSupport = !!(document.getElementById('pmSupportType')?.value);
  const hasSub     = [...document.querySelectorAll('[name="pmSubType"]:checked')].length > 0;
  const hasSps     = (currentProject?.subprojects?.length || 0) > 0;
  const hasMain    = (currentProject?.subprojects || []).some(sp => sp.isMainKpi && sp.kpi?.v);
  btn.disabled = !(hasName && hasSupport && hasSub && hasSps && hasMain);
}

function saveProject() {
  const cp = currentProject;
  cp.name          = document.getElementById('pmName')?.value?.trim() || '';
  cp.supportType   = document.getElementById('pmSupportType')?.value || '';
  cp.hasConsulting = document.getElementById('pmChkDirect')?.checked || false;
  cp.problem       = document.getElementById('pmProblem')?.value || '';
  cp.summary     = document.getElementById('pmSummary')?.value || '';
  cp.goal        = document.getElementById('pmGoal')?.value || '';
  cp.subTypes    = [...document.querySelectorAll('[name="pmSubType"]:checked')].map(e => e.value);
  cp.consultants = collectConsultants();
  cp.budget      = {
    directSupport: parseFloat(document.getElementById('bdDirect')?.value)   || 0,
    printCost:     parseFloat(document.getElementById('bdPrint')?.value)    || 0,
    meetingCost:   parseFloat(document.getElementById('bdMeeting')?.value)  || 0,
    indirectCost:  parseFloat(document.getElementById('bdIndirect')?.value) || 0,
  };
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

// ── 예산 ──
function updateLaborCost() {
  let labor = 0;
  const body = document.getElementById('pmConsultantTable-body');
  if (body) {
    [...body.querySelectorAll('tr[data-cid]')].forEach(row => {
      const name = row.querySelector('[data-role="cname"]')?.value;
      const md   = parseFloat(row.querySelector('[data-role="md"]')?.value) || 0;
      if (name) labor += (GRADE_RATES[getConsultantGrade(name)] || 0) * md;
    });
  }
  const el = document.getElementById('bdLaborCost');
  if (el) { el.dataset.value = labor; el.textContent = labor > 0 ? labor.toLocaleString()+'원' : '—'; el.style.color = labor > 0 ? 'var(--text)' : 'var(--text-sub)'; }
  updateBudgetTotal();
}

function updateBudgetTotal() {
  const labor    = parseFloat(document.getElementById('bdLaborCost')?.dataset.value) || 0;
  const direct   = parseFloat(document.getElementById('bdDirect')?.value)   || 0;
  const print    = parseFloat(document.getElementById('bdPrint')?.value)    || 0;
  const meeting  = parseFloat(document.getElementById('bdMeeting')?.value)  || 0;
  const indirect = parseFloat(document.getElementById('bdIndirect')?.value) || 0;
  const grand    = labor + direct + print + meeting + indirect;
  const el = document.getElementById('bdGrandTotal');
  if (el) { el.textContent = grand > 0 ? grand.toLocaleString()+'원' : '—'; el.style.color = grand > 0 ? 'var(--text)' : 'var(--text-sub)'; }
}

// ════════════════════════════════════════════════════════
// 컨설턴트 테이블 (대표과제)
// ════════════════════════════════════════════════════════
function renderPmConsultantTable() {
  const el   = document.getElementById('pmConsultantTable');
  if (!el) return;
  const cons  = currentProject.consultants || [];
  const rows  = cons.map(c => buildConsultantRowHtml(c, numId())).join('');
  const empty = cons.length ? '' : emptyRow(5, 'pmConsultantTable-empty');
  el.innerHTML = `<table class="table inline-table" style="margin-top:4px;">
    <thead><tr>
      <th>컨설턴트명</th>
      <th style="width:100px;">MD</th>
      <th style="width:80px;">수행일지</th>
      <th style="width:170px;">예정일자</th>
      <th style="width:52px;"></th>
    </tr></thead>
    <tbody id="pmConsultantTable-body">${rows}${empty}</tbody>
  </table>`;
}

function buildConsultantRowHtml(c, cid) {
  const md    = c?.md || 0;
  const jCnt  = Math.round(md);
  const dates = c?.dates || [];
  const datesJson  = escHtml(JSON.stringify(dates));
  const datePrev   = dates.filter(d=>d).map((d,i)=>`<div class="date-preview-item">${i+1}회차: ${d}</div>`).join('');
  const datesLabel = jCnt > 0 ? (dates.filter(d=>d).length+'/'+jCnt+'회 등록') : '—';
  const opts = CONSULTANT_LIST.map(n =>
    `<option value="${escHtml(n.name)}"${c?.name===n.name?' selected':''}>${escHtml(n.name)} [${n.type}] [${n.grade}]</option>`
  ).join('');
  return `<tr data-cid="${cid}" data-dates="${datesJson}">
    <td style="padding:4px 6px;">
      <select class="select" data-role="cname" style="font-size:12px;padding:5px 24px 5px 8px;"
              onchange="onConsultantChange('${cid}')">
        <option value="">선택하세요</option>${opts}
      </select>
    </td>
    <td style="padding:4px 5px;">
      <input class="input" type="number" data-role="md" id="cmd-${cid}" value="${md||''}" placeholder="0.0"
             min="0" step="0.5" style="font-size:12px;padding:5px 7px;"
             oninput="onCMdInput('${cid}')" onblur="onCMdBlur('${cid}')">
    </td>
    <td style="padding:4px 8px;text-align:center;" id="cjournal-${cid}">
      <span class="text-sm text-sub">${jCnt>0?jCnt+'개':'—'}</span>
    </td>
    <td style="padding:4px 6px;">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;width:100%;"
              onclick="openDateModal('${cid}')">📅 일자 지정 · ${escHtml(datesLabel)}</button>
      <div id="cdate-preview-${cid}" class="file-list">${datePrev}</div>
    </td>
    <td style="padding:4px 5px;text-align:center;">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;"
              onclick="removeConsultantRow('${cid}')">삭제</button>
    </td>
  </tr>`;
}

function addConsultantRow() {
  const body = document.getElementById('pmConsultantTable-body');
  if (!body) return;
  document.getElementById('pmConsultantTable-empty')?.remove();
  body.insertAdjacentHTML('beforeend', buildConsultantRowHtml(null, numId()));
  updateLaborCost();
}

function removeConsultantRow(cid) {
  const tr = document.querySelector(`tr[data-cid="${cid}"]`);
  if (!tr) return;
  const body = tr.closest('tbody');
  tr.remove();
  if (body && !body.querySelector('tr[data-cid]')) body.insertAdjacentHTML('beforeend', emptyRow(5, 'pmConsultantTable-empty'));
  updateLaborCost();
}

function onConsultantChange(cid) { updateLaborCost(); }

function onCMdInput(cid) {
  const v   = parseFloat(document.getElementById(`cmd-${cid}`)?.value) || 0;
  const cnt = Math.round(v);
  const jEl = document.getElementById(`cjournal-${cid}`);
  if (jEl) jEl.innerHTML = `<span class="text-sm text-sub">${cnt>0?cnt+'개':'—'}</span>`;
  updateLaborCost();
}
function onCMdBlur(cid) {
  const el = document.getElementById(`cmd-${cid}`);
  if (!el) return;
  let v = parseFloat(el.value);
  if (isNaN(v)||v<0) { el.value=''; onCMdInput(cid); return; }
  v = Math.round(v*2)/2; el.value=v; onCMdInput(cid);
}

function collectConsultants() {
  const body = document.getElementById('pmConsultantTable-body');
  if (!body) return [];
  return [...body.querySelectorAll('tr[data-cid]')].map(row => {
    const cid   = row.dataset.cid;
    const md    = Math.round((parseFloat(row.querySelector('[data-role="md"]')?.value)||0)*2)/2;
    const dates = JSON.parse(row.dataset.dates||'[]');
    const name  = row.querySelector('[data-role="cname"]')?.value?.trim()||'';
    return { id:parseInt(cid), name, type:name?getConsultantType(name):'외부', grade:name?getConsultantGrade(name):'중급', md, dates };
  });
}

// ════════════════════════════════════════════════════════
// 세부과제 목록 (프로젝트 모달 내)
// ════════════════════════════════════════════════════════
function renderPmSpTable() {
  const el  = document.getElementById('pmSpTable');
  if (!el) return;
  const sps = currentProject.subprojects || [];

  const head = `<table class="table" style="margin-top:8px;">
    <thead><tr>
      <th style="width:32px;">#</th>
      <th style="width:80px;">유형</th>
      <th style="min-width:140px;">세부과제명</th>
      <th style="min-width:200px;">KPI</th>
      <th style="min-width:120px;">품목</th>
      <th style="width:100px;"></th>
    </tr></thead>`;

  if (!sps.length) {
    el.innerHTML = head + `<tbody><tr><td colspan="6" style="text-align:center;padding:18px;" class="text-sub text-sm">세부과제를 추가해주세요 (1개 이상 필수)</td></tr></tbody></table>`;
    return;
  }

  const rows = sps.map((sp, i) => {
    const typeLbl = sp.type === 'direct_support' ? '직접지원' : '컨설팅';
    const typeBdg = `<span class="badge badge-default">${typeLbl}</span>`;
    let kpiHtml = '<span class="text-sub text-sm">—</span>';
    if (sp.kpi?.v) {
      const star = sp.isMainKpi ? '<span style="color:#e09000;margin-right:2px;">★</span>' : '';
      const bef  = sp.kpi.before != null && sp.kpi.before !== '' ? sp.kpi.before : '?';
      const tgt  = sp.kpi.target != null && sp.kpi.target !== '' ? sp.kpi.target : '?';
      kpiHtml = `<div style="font-size:12px;">${star}<strong>${escHtml(sp.kpi.v)}</strong> <span class="text-sub">[${sp.kpi.t}] ${bef}→${tgt}</span> ${rateHtml(sp.kpi)}</div>`;
    }
    const itemHtml = (sp.type==='direct_support' && sp.items?.length)
      ? `<span class="text-sub text-sm">${sp.items.length}개 품목</span>`
      : '<span class="text-sub text-sm">—</span>';
    return `<tr>
      <td class="text-sub text-sm">${i+1}</td>
      <td>${typeBdg}</td>
      <td style="font-size:13px;font-weight:600;">${escHtml(sp.name||'(미입력)')}</td>
      <td>${kpiHtml}</td>
      <td>${itemHtml}</td>
      <td><div class="row" style="gap:4px;">
        <button class="btn btn-outline text-sm" onclick="openSpModal(${sp.id})">수정</button>
        <button class="btn btn-outline text-sm" onclick="deleteSp(${sp.id})">삭제</button>
      </div></td>
    </tr>`;
  }).join('');

  el.innerHTML = head + `<tbody>${rows}</tbody></table>`;
}

function deleteSp(spId) {
  currentProject.subprojects = currentProject.subprojects.filter(sp => sp.id !== spId);
  renderPmSpTable();
  validateProjectForm();
}

// ════════════════════════════════════════════════════════
// 세부과제 모달
// ════════════════════════════════════════════════════════
function openSpModal(spId = null) {
  if (spId != null) {
    currentSubproject = JSON.parse(JSON.stringify(currentProject.subprojects.find(sp => sp.id === spId)));
    document.getElementById('spTitle').textContent = '세부과제 수정';
  } else {
    currentSubproject = {
      id: numId(), name: '', type: 'consulting',
      kpi: null, isMainKpi: false, items: []
    };
    document.getElementById('spTitle').textContent = '세부과제 추가';
  }
  renderSpForm();
  document.getElementById('spModal').classList.add('open');
}

function closeSpModal() {
  document.getElementById('spModal').classList.remove('open');
  currentSubproject = null;
}

function renderSpForm() {
  const sp           = currentSubproject;
  const isDirect     = sp.type === 'direct_support';
  const directAllowed = !!(currentProject?.hasConsulting);
  const kpi          = sp.kpi;

  const initRate = kpi?.v ? rateHtml(kpi) : '<span class="text-sub" style="font-size:12px;">—</span>';
  const kpiDisplayText = kpi?.v ? `[${kpi.t}] ${kpi.v}` : '';

  document.getElementById('spBody').innerHTML = `
    <div class="form-row mb-16">
      <label class="label">세부과제명</label>
      <input class="input" id="spName" type="text" value="${escHtml(sp.name||'')}" placeholder="세부과제명 입력" />
    </div>

    <div class="form-row mb-16">
      <label class="label">유형 *</label>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:start;">
        <div class="type-radio-group">
          <label>
            <input type="radio" name="spType" value="consulting" ${!isDirect?'checked':''} onchange="onSpTypeChange()">
            <span>컨설팅</span>
          </label>
          <label style="${!directAllowed?'opacity:.4;cursor:not-allowed;':''}" title="${!directAllowed?'대표과제에서 직접지원을 먼저 선택해주세요':''}">
            <input type="radio" name="spType" value="direct_support" ${isDirect?'checked':''} ${!directAllowed?'disabled':''} onchange="onSpTypeChange()">
            <span>직접지원</span>
          </label>
        </div>
        ${!directAllowed?'<span class="text-sub" style="font-size:11px;">직접지원 세부과제를 추가하려면 대표과제에서 직접지원을 먼저 선택해주세요.</span>':''}
      </div>
    </div>

    <div class="mb-16">
      <div class="row mb-8" style="align-items:center;">
        <span class="section-title" style="margin-bottom:0;">KPI *</span>
        <label class="main-kpi-toggle" style="margin-left:auto;">
          <input type="checkbox" id="spIsMain" ${sp.isMainKpi?'checked':''}>
          ★ 주 KPI로 설정
        </label>
      </div>
      <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;">

        <!-- 콤보박스 -->
        <div class="kpi-combo" id="kpiCombo" onclick="event.stopPropagation()">
          <input type="hidden" id="spKpiSelV" value="${escHtml(kpi?.v||'')}">
          <input type="hidden" id="spKpiSelT" value="${escHtml(kpi?.t||'')}">
          <div class="kpi-combo-trigger" id="kpiComboTrigger" onclick="openKpiDropdown()">
            <span id="kpiComboDisplay" ${!kpi?.v?'class="placeholder"':''}>${kpiDisplayText||'KPI 선택 *'}</span>
            <span style="font-size:10px;color:var(--text-sub);flex-shrink:0;">▾</span>
          </div>
          <!-- 패널: JS로 position:fixed + 좌표 설정 -->
          <div class="kpi-combo-panel" id="kpiComboPanel" style="display:none;position:fixed;"
               onclick="event.stopPropagation()">
            <!-- 리스트 모드 -->
            <div id="kpiModeList">
              <div style="padding:8px;border-bottom:1px solid var(--border);">
                <input type="text" id="kpiComboSearch" class="input"
                       placeholder="KPI 검색..." style="font-size:12px;padding:5px 8px;width:100%;"
                       oninput="renderKpiList(this.value)">
              </div>
              <div id="kpiComboList" class="kpi-combo-list"></div>
              <div id="kpiComboAddTrigger" class="kpi-combo-add-trigger" style="display:none;"></div>
            </div>
            <!-- 추가 모드 -->
            <div id="kpiModeAdd" style="display:none;padding:16px;">
              <div style="font-size:11px;color:var(--text-sub);margin-bottom:6px;">마스터에 새 KPI 추가</div>
              <div style="font-size:14px;font-weight:700;margin-bottom:14px;" id="kpiAddingLabel"></div>
              <div style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">유형 선택 *</div>
              <div style="display:flex;gap:6px;margin-bottom:14px;">
                <button class="kpi-type-btn active" data-type="망대" onclick="selectKpiType('망대')">망대 ↑</button>
                <button class="kpi-type-btn"        data-type="망소" onclick="selectKpiType('망소')">망소 ↓</button>
                <button class="kpi-type-btn"        data-type="망목" onclick="selectKpiType('망목')">망목 ◎</button>
              </div>
              <div class="row" style="gap:6px;">
                <button class="btn btn-primary text-sm" style="flex:1;" onclick="confirmKpiAdd()">확인</button>
                <button class="btn btn-outline text-sm" onclick="switchKpiMode('list')">← 돌아가기</button>
              </div>
            </div>
          </div>
        </div>

        <input class="input" type="number" id="spKpiBefore" value="${kpi?.before??''}"
               placeholder="개선전" step="any" style="width:90px;" oninput="onSpKpiChange()">
        <span class="text-sub text-sm">→</span>
        <input class="input" type="number" id="spKpiTarget" value="${kpi?.target??''}"
               placeholder="목표" step="any" style="width:90px;" oninput="onSpKpiChange()">
        <div id="spKpiRate" style="width:72px;text-align:right;">${initRate}</div>
      </div>
    </div>

    <div id="spItemsSection" ${isDirect?'':'style="display:none;"'}>
      <div class="row mb-8">
        <span class="section-title" style="margin-bottom:0;">직접지원 품목 *</span>
        <button class="btn btn-outline text-sm" style="margin-left:auto;" onclick="addSpItem()">+ 품목 추가</button>
      </div>
      <div id="spItemTable"></div>
    </div>
  `;

  renderSpItemTable();
  validateSpForm();
}

// ════════════════════════════════════════════════════════
// KPI 콤보박스
// ════════════════════════════════════════════════════════
let _kpiOutsideHandler = null;
let _kpiPendingName    = '';
let _kpiPendingType    = '망대';

function openKpiDropdown() {
  const panel   = document.getElementById('kpiComboPanel');
  const trigger = document.getElementById('kpiComboTrigger');
  if (!panel || !trigger) return;
  if (panel.style.display !== 'none') { closeKpiDropdown(); return; }

  // position:fixed로 trigger 아래에 배치
  const rect = trigger.getBoundingClientRect();
  panel.style.top    = (rect.bottom + 4) + 'px';
  panel.style.left   = rect.left + 'px';
  panel.style.width  = Math.max(rect.width, 280) + 'px';
  panel.style.display = '';
  trigger.classList.add('open');

  switchKpiMode('list');
  renderKpiList('');
  setTimeout(() => document.getElementById('kpiComboSearch')?.focus(), 50);

  if (_kpiOutsideHandler) document.removeEventListener('click', _kpiOutsideHandler);
  _kpiOutsideHandler = (e) => {
    if (!document.getElementById('kpiCombo')?.contains(e.target) &&
        !document.getElementById('kpiComboPanel')?.contains(e.target)) {
      closeKpiDropdown();
    }
  };
  setTimeout(() => document.addEventListener('click', _kpiOutsideHandler), 0);
}

function closeKpiDropdown() {
  const panel = document.getElementById('kpiComboPanel');
  if (panel) panel.style.display = 'none';
  document.getElementById('kpiComboTrigger')?.classList.remove('open');
  if (_kpiOutsideHandler) { document.removeEventListener('click', _kpiOutsideHandler); _kpiOutsideHandler = null; }
}

function renderKpiList(query) {
  const list       = document.getElementById('kpiComboList');
  const addTrigger = document.getElementById('kpiComboAddTrigger');
  if (!list) return;
  const q          = query.trim().toLowerCase();
  const filtered   = q ? kpiMaster.filter(k => k.v.toLowerCase().includes(q)) : [...kpiMaster];
  const selectedV  = document.getElementById('spKpiSelV')?.value;

  list.innerHTML = filtered.map(k =>
    `<div class="kpi-combo-item${selectedV===k.v?' selected':''}"
          onclick="selectKpiCombo('${escHtml(k.v)}','${k.t}')">
      <span class="badge badge-default" style="font-size:9px;flex-shrink:0;">${k.t}</span>
      ${escHtml(k.v)}
    </div>`
  ).join('') || `<div class="kpi-combo-empty">${q ? '검색 결과 없음' : '등록된 KPI가 없습니다'}</div>`;

  if (addTrigger) {
    const exact = kpiMaster.find(k => k.v.toLowerCase() === q.toLowerCase());
    if (q && !exact) {
      addTrigger.style.display = '';
      addTrigger.innerHTML = `<span style="font-size:13px;margin-right:2px;">+</span> "${escHtml(query.trim())}"으로 새 KPI 추가하기`;
      addTrigger.onclick = () => switchKpiMode('add', query.trim());
    } else {
      addTrigger.style.display = 'none';
    }
  }
}

function selectKpiCombo(v, t) {
  const hidV = document.getElementById('spKpiSelV');
  const hidT = document.getElementById('spKpiSelT');
  if (hidV) hidV.value = v;
  if (hidT) hidT.value = t;
  const display = document.getElementById('kpiComboDisplay');
  if (display) { display.textContent = `[${t}] ${v}`; display.className = ''; }
  closeKpiDropdown();
  onSpKpiChange();
}

function switchKpiMode(mode, query = '') {
  const listEl = document.getElementById('kpiModeList');
  const addEl  = document.getElementById('kpiModeAdd');
  if (listEl) listEl.style.display = mode === 'list' ? '' : 'none';
  if (addEl)  addEl.style.display  = mode === 'add'  ? '' : 'none';
  if (mode === 'add') {
    _kpiPendingName = query;
    _kpiPendingType = '망대';
    const label = document.getElementById('kpiAddingLabel');
    if (label) label.innerHTML = `<span style="color:#3730a3;">"${escHtml(query)}"</span>`;
    document.querySelectorAll('.kpi-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === '망대');
    });
    if (listEl) listEl.style.display = 'none';
    if (addEl)  addEl.style.display  = '';
  }
}

function selectKpiType(type) {
  _kpiPendingType = type;
  document.querySelectorAll('.kpi-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

function confirmKpiAdd() {
  const name = _kpiPendingName?.trim();
  const type = _kpiPendingType || '망대';
  if (!name) return;
  if (kpiMaster.find(k => k.v === name)) { showToast(`'${name}'은(는) 이미 마스터에 존재합니다.`); return; }
  kpiMaster.push({ v: name, t: type });
  selectKpiCombo(name, type);
  showToast(`'${name}' [${type}] KPI가 마스터에 추가되었습니다.`);
}

function onSpTypeChange() {
  const isDirect = document.querySelector('[name="spType"]:checked')?.value === 'direct_support';
  document.getElementById('spItemsSection').style.display = isDirect ? '' : 'none';
  validateSpForm();
}

function onSpKpiChange() {
  const v  = document.getElementById('spKpiSelV')?.value;
  const t  = document.getElementById('spKpiSelT')?.value;
  const bv = document.getElementById('spKpiBefore')?.value;
  const tv = document.getElementById('spKpiTarget')?.value;
  const el = document.getElementById('spKpiRate');
  if (el) el.innerHTML = v ? rateHtml({ t, before: bv, target: tv }) : '<span class="text-sub" style="font-size:12px;">—</span>';
  validateSpForm();
}

function validateSpForm() {
  const btn = document.getElementById('spSaveBtn');
  if (!btn) return;
  const hasKpi   = !!(document.getElementById('spKpiSelV')?.value);
  const isDirect = document.querySelector('[name="spType"]:checked')?.value === 'direct_support';
  const hasItems = !isDirect || !!document.querySelector('#spItemTable-body tr[data-iid]');
  btn.disabled = !(hasKpi && hasItems);
}

function saveSubproject() {
  const sp = currentSubproject;
  sp.name = document.getElementById('spName')?.value?.trim() || '';
  sp.type = document.querySelector('[name="spType"]:checked')?.value || 'consulting';
  sp.isMainKpi = document.getElementById('spIsMain')?.checked || false;

  const v  = document.getElementById('spKpiSelV')?.value;
  const t  = document.getElementById('spKpiSelT')?.value;
  const bv = document.getElementById('spKpiBefore')?.value;
  const tv = document.getElementById('spKpiTarget')?.value;
  sp.kpi = v
    ? { v, t, before: bv!==''?parseFloat(bv):'', target: tv!==''?parseFloat(tv):'' }
    : null;

  if (sp.type !== 'direct_support') sp.items = [];
  else sp.items = collectSpItems();

  // 주 KPI는 하나만
  if (sp.isMainKpi) {
    currentProject.subprojects.forEach(s => { if (s.id !== sp.id) s.isMainKpi = false; });
  }

  const idx = currentProject.subprojects.findIndex(s => s.id === sp.id);
  if (idx >= 0) currentProject.subprojects[idx] = { ...sp };
  else          currentProject.subprojects.push({ ...sp });

  closeSpModal();
  renderPmSpTable();
  validateProjectForm();
  showToast('세부과제가 저장되었습니다.');
}

// ── 세부과제 품목 ──
function renderSpItemTable() {
  const el    = document.getElementById('spItemTable');
  if (!el) return;
  const items = currentSubproject?.items || [];
  const rows  = items.map(it => buildSpItemRowHtml(it, numId())).join('');
  const empty = items.length ? '' : emptyRow(5, 'spItemTable-empty');
  el.innerHTML = `<table class="table inline-table" style="margin-top:4px;">
    <thead><tr>
      <th>품목명</th><th style="width:120px;">취득일자</th>
      <th style="width:130px;">금액 (원)</th><th style="width:160px;">파일</th>
      <th style="width:52px;"></th>
    </tr></thead>
    <tbody id="spItemTable-body">${rows}${empty}</tbody>
  </table>`;
}

function buildSpItemRowHtml(it, iid) {
  const fHtml = (it?.files||[]).map(f =>
    `<div class="file-item" style="margin-top:3px;"><span>📄 ${escHtml(f.name)}</span><button onclick="this.closest('.file-item').remove()">✕</button></div>`
  ).join('');
  return `<tr data-iid="${iid}">
    <td style="padding:4px 6px;"><input class="input" type="text" data-role="name" value="${escHtml(it?.name||'')}" placeholder="품목명 *" style="font-size:12px;padding:5px 8px;" oninput="validateSpForm()"></td>
    <td style="padding:4px 5px;"><input class="input" type="date" data-role="date" value="${it?.date||''}" style="font-size:12px;padding:5px 7px;"></td>
    <td style="padding:4px 5px;"><input class="input" type="number" data-role="amount" value="${it?.amount||''}" placeholder="0" min="0" style="font-size:12px;padding:5px 7px;"></td>
    <td style="padding:4px 6px;">
      <input type="file" id="ifile-${iid}" multiple style="display:none;" onchange="handleSpFiles('${iid}',this)">
      <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;width:100%;" onclick="document.getElementById('ifile-${iid}').click()">📎 파일 추가</button>
      <div id="iflist-${iid}" class="file-list">${fHtml}</div>
    </td>
    <td style="padding:4px 5px;text-align:center;"><button class="btn btn-outline" style="padding:4px 8px;font-size:11px;" onclick="removeSpItem('${iid}')">삭제</button></td>
  </tr>`;
}

function addSpItem() {
  const body = document.getElementById('spItemTable-body');
  if (!body) return;
  document.getElementById('spItemTable-empty')?.remove();
  body.insertAdjacentHTML('beforeend', buildSpItemRowHtml(null, numId()));
  validateSpForm();
}
function removeSpItem(iid) {
  document.querySelector(`tr[data-iid="${iid}"]`)?.remove();
  const body = document.getElementById('spItemTable-body');
  if (body && !body.querySelector('tr[data-iid]')) body.insertAdjacentHTML('beforeend', emptyRow(5, 'spItemTable-empty'));
  validateSpForm();
}
function handleSpFiles(iid, input) {
  const list = document.getElementById(`iflist-${iid}`);
  if (!list) return;
  Array.from(input.files).forEach(f => {
    const div = document.createElement('div');
    div.className = 'file-item'; div.style.marginTop = '3px';
    div.innerHTML = `<span>📄 ${escHtml(f.name)} <span class="text-sub">(${(f.size/1024).toFixed(1)}KB)</span></span><button onclick="this.closest('.file-item').remove()">✕</button>`;
    list.appendChild(div);
  });
  input.value = '';
}
function collectSpItems() {
  const body = document.getElementById('spItemTable-body');
  if (!body) return [];
  return [...body.querySelectorAll('tr[data-iid]')].map(row => {
    const iid  = row.dataset.iid;
    const fels = [...(document.getElementById(`iflist-${iid}`)?.querySelectorAll('.file-item')||[])];
    return {
      id: parseInt(iid),
      name: row.querySelector('[data-role="name"]')?.value?.trim()||'',
      date: row.querySelector('[data-role="date"]')?.value||'',
      amount: parseFloat(row.querySelector('[data-role="amount"]')?.value)||0,
      files: fels.map(el=>({ name: el.querySelector('span')?.textContent?.replace(/^📄 /,'').replace(/\s*\(.*\)$/,'')||'' })),
    };
  }).filter(it => it.name);
}

// ════════════════════════════════════════════════════════
// 일자 모달
// ════════════════════════════════════════════════════════
function openDateModal(cid) {
  currentDateRowId = cid;
  const row  = document.querySelector(`tr[data-cid="${cid}"]`);
  if (!row) return;
  const md   = parseFloat(document.getElementById(`cmd-${cid}`)?.value) || 0;
  const dates = JSON.parse(row.dataset.dates || '[]');
  const jCnt  = Math.round(md);
  document.getElementById('dmBody').innerHTML = `
    <div class="grid-2 mb-12">
      <div>
        <label class="label">배정 MD <span class="text-sub">(0.5 단위)</span></label>
        <input class="input" type="number" id="dmMd" min="0" step="0.5" value="${md||''}" placeholder="0.0"
               oninput="onDmMdInput()" onblur="onDmMdBlur()">
      </div>
      <div>
        <label class="label">수행일지 수 <span class="text-sub">(자동)</span></label>
        <div class="input" id="dmJournal"
             style="background:var(--accent-bg);color:${jCnt>0?'var(--text)':'var(--text-sub)'};user-select:none;">
          ${jCnt>0?jCnt+'개':'—'}
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
  if (jEl) { jEl.textContent = cnt>0?cnt+'개':'—'; jEl.style.color = cnt>0?'var(--text)':'var(--text-sub)'; }
}
function onDmMdBlur() {
  const el = document.getElementById('dmMd');
  if (!el) return;
  let v = parseFloat(el.value);
  if (isNaN(v)||v<0) { el.value=''; renderDmDateInputs(0,[]); return; }
  v = Math.round(v*2)/2; el.value=v; onDmMdInput();
  const existing = [...document.querySelectorAll('#dmDates input[type="date"]')].map(i=>i.value);
  renderDmDateInputs(v, existing);
}
function renderDmDateInputs(md, existing) {
  const count = Math.round(md);
  const el    = document.getElementById('dmDates');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'row'; row.style.cssText = 'align-items:center;gap:10px;';
    row.innerHTML = `<span class="text-sm text-sub" style="width:44px;flex-shrink:0;text-align:right;">${i+1}회차</span>
      <input class="input" type="date" data-session="${i+1}" value="${existing[i]||''}" style="max-width:180px;">`;
    el.appendChild(row);
  }
}
function saveDateModal() {
  const md    = Math.round((parseFloat(document.getElementById('dmMd')?.value)||0)*2)/2;
  const dates = [...document.querySelectorAll('#dmDates input[type="date"]')].map(i=>i.value);
  const cid   = currentDateRowId;
  const row   = document.querySelector(`tr[data-cid="${cid}"]`);
  if (row) {
    const mdInput = document.getElementById(`cmd-${cid}`);
    if (mdInput) { mdInput.value = md; onCMdInput(cid); }
    row.dataset.dates = JSON.stringify(dates);
    const prev = document.getElementById(`cdate-preview-${cid}`);
    if (prev) prev.innerHTML = dates.filter(d=>d).map((d,i)=>`<div class="date-preview-item">${i+1}회차: ${d}</div>`).join('');
    const btn = row.querySelector('td:nth-child(4) button');
    const filled = dates.filter(d=>d).length;
    if (btn) btn.textContent = `📅 일자 지정 · ${Math.round(md)>0?filled+'/'+Math.round(md)+'회 등록':'—'}`;
  }
  closeDateModal();
  showToast('일자가 저장되었습니다.');
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
});
