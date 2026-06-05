// ── 상수 ─────────────────────────────────────────────────────
const GRADE_LABEL = { special: '특급', mid: '중급' };
const GRADE_RATE  = { special: 500000, mid: 400000 };
const SEGMENT_COLORS = ['#6baed6','#74c476','#fd8d3c','#9ecae1','#a1d99b','#fdae6b','#c994c7','#f768a1'];
const YEAR = 2026;

// ── 기본 행 데이터 (mds는 아래에서 주입) ─────────────────────
const ROWS_BASE = [
  { id:1,  round:2, roundDate:'07/11', org:'한국산업진흥원',        company:'(주)테크놀로지아',     consultant:'김민준', grade:'special', phone:'010-1234-5678', email:'minjun@techno.kr' },
  { id:2,  round:2, roundDate:'07/11', org:'한국산업진흥원',        company:'스마트솔루션(주)',      consultant:'이서연', grade:'mid',     phone:'010-2345-6789', email:'seo@smart.co.kr' },
  { id:3,  round:1, roundDate:'03/15', org:'서울창업허브',          company:'그린에너지(주)',        consultant:'박지훈', grade:'special', phone:'010-3456-7890', email:'jihoon@green.kr' },
  { id:4,  round:3, roundDate:'10/05', org:'중소벤처기업진흥공단',  company:'미래식품(주)',          consultant:'최수아', grade:'mid',     phone:'010-4567-8901', email:'sua@mirae.com' },
  { id:5,  round:1, roundDate:'03/15', org:'서울창업허브',          company:'디지털팩토리(주)',      consultant:'정우성', grade:'special', phone:'010-5678-9012', email:'woo@digital.kr' },
  { id:6,  round:2, roundDate:'07/11', org:'경기도경제과학진흥원',  company:'(주)바이오텍',         consultant:'한지민', grade:'mid',     phone:'010-6789-0123', email:'jimin@biotek.kr' },
  { id:7,  round:3, roundDate:'10/05', org:'한국산업진흥원',        company:'클라우드피아(주)',      consultant:'오준호', grade:'special', phone:'010-7890-1234', email:'junho@cloudpia.kr' },
  { id:8,  round:1, roundDate:'03/15', org:'중소벤처기업진흥공단',  company:'이노베이션랩(주)',      consultant:'윤서희', grade:'mid',     phone:'010-8901-2345', email:'seohee@ilab.kr' },
  { id:9,  round:2, roundDate:'07/11', org:'경기도경제과학진흥원',  company:'(주)퓨처모빌리티',     consultant:'강민석', grade:'special', phone:'010-9012-3456', email:'minsuk@futm.kr' },
  { id:10, round:3, roundDate:'10/05', org:'서울창업허브',          company:'소프트웨어하우스(주)',  consultant:'임채원', grade:'mid',     phone:'010-0123-4567', email:'chaewon@swh.kr' },
  { id:11, round:1, roundDate:'03/15', org:'한국산업진흥원',        company:'(주)헬스케어플러스',   consultant:'신예진', grade:'special', phone:'010-1357-2468', email:'yejin@hcplus.kr' },
  { id:12, round:2, roundDate:'07/11', org:'경기도경제과학진흥원',  company:'에코시스템(주)',        consultant:'배준혁', grade:'mid',     phone:'010-2468-3579', email:'junhyuk@eco.kr' },
  { id:13, round:3, roundDate:'10/05', org:'중소벤처기업진흥공단',  company:'스마트팜(주)',          consultant:'조수민', grade:'special', phone:'010-3579-4680', email:'sumin@sfarm.kr' },
  { id:14, round:1, roundDate:'03/15', org:'서울창업허브',          company:'(주)데이터브릿지',     consultant:'유하은', grade:'mid',     phone:'010-4680-5791', email:'haeun@dbridge.kr' },
  { id:15, round:2, roundDate:'07/11', org:'한국산업진흥원',        company:'핀테크코리아(주)',      consultant:'문성훈', grade:'special', phone:'010-5791-6802', email:'sunghoon@fintech.kr' },
  { id:16, round:3, roundDate:'10/05', org:'경기도경제과학진흥원',  company:'(주)에너지솔루션',     consultant:'나지현', grade:'mid',     phone:'010-6802-7913', email:'jihyun@enersol.kr' },
  { id:17, round:1, roundDate:'03/15', org:'중소벤처기업진흥공단',  company:'로봇공학(주)',          consultant:'황정민', grade:'special', phone:'010-7913-8024', email:'jungmin@robotics.kr' },
  { id:18, round:2, roundDate:'07/11', org:'서울창업허브',          company:'(주)콘텐츠팩토리',     consultant:'안소영', grade:'mid',     phone:'010-8024-9135', email:'soyoung@cfactory.kr' },
  { id:19, round:3, roundDate:'10/05', org:'한국산업진흥원',        company:'글로벌트레이드(주)',    consultant:'탁재훈', grade:'special', phone:'010-9135-0246', email:'jaehoon@gtrade.kr' },
  { id:20, round:1, roundDate:'03/15', org:'경기도경제과학진흥원',  company:'(주)스마트시티',        consultant:'이재원', grade:'mid',     phone:'010-0246-1357', email:'jaewon@smartcity.kr' },
];

// ── 수행일지 시드 데이터 [rowId, yymmdd, status, hours, work] ─
const JOURNAL_SEED = [
  // Row 1: 김민준 특급 — 10건
  [1,'260105','approved', 8,'사업 현황 분석 및 초기 자료 수집. 기업 방문 미팅 진행.'],
  [1,'260112','approved', 8,'1차 보고서 초안 작성. 핵심 문제점 정리.'],
  [1,'260119','approved', 4,'중간 점검 미팅. 방향성 수정 논의.'],
  [1,'260202','approved', 8,'세부 전략 수립 미팅 진행.'],
  [1,'260216','approved', 8,'1차 보고서 최종본 작성.'],
  [1,'260303','approved', 8,'2분기 계획 수립 미팅.'],
  [1,'260317','rejected', 4,'현장 방문 보고서 — 자료 미비로 반려.'],
  [1,'260407','reviewing',8,'4월 성과 보고서 작성. 검토 중.'],
  [1,'260505','written',  8,'5월 실행 계획 수립.'],
  [1,'260602','written',  8,'상반기 종합 보고서 작성.'],

  // Row 2: 이서연 중급 — 10건
  [2,'260106','approved', 8,'마케팅 채널 분석 및 경쟁사 비교.'],
  [2,'260113','approved', 8,'SNS 운영 전략 수립.'],
  [2,'260127','approved', 8,'브랜드 아이덴티티 점검 및 제안.'],
  [2,'260203','approved', 4,'고객 인터뷰 및 니즈 분석.'],
  [2,'260217','approved', 8,'2차 마케팅 보고서 작성.'],
  [2,'260310','approved', 8,'3월 캠페인 기획안 제출.'],
  [2,'260324','rejected', 4,'광고 집행 결과 분석 — 목표 미달로 반려.'],
  [2,'260414','reviewing',8,'4월 온라인 마케팅 성과 검토.'],
  [2,'260512','written',  8,'5월 콘텐츠 전략 수립.'],
  [2,'260603','written',  4,'상반기 마케팅 결과 보고서.'],

  // Row 3: 박지훈 특급 — 8건
  [3,'260108','approved', 8,'회계 시스템 점검 및 원가 구조 분석.'],
  [3,'260115','approved', 8,'원가 절감 방안 도출 미팅.'],
  [3,'260205','approved', 8,'재무제표 분석 및 개선 제안.'],
  [3,'260219','approved', 4,'2분기 예산 계획 수립.'],
  [3,'260305','approved', 8,'원가 절감 실행 점검.'],
  [3,'260319','rejected', 8,'세금계산서 검토 — 누락 항목 발견으로 반려.'],
  [3,'260416','reviewing',8,'4월 재무 현황 보고서.'],
  [3,'260507','written',  8,'5월 원가 분석 최종안.'],

  // Row 4: 최수아 중급 — 8건
  [4,'260210','approved', 8,'제조공정 현장 조사 및 품질 분석.'],
  [4,'260224','approved', 8,'품질 개선 프로세스 설계.'],
  [4,'260309','approved', 8,'품질관리 2차 점검.'],
  [4,'260323','approved', 4,'불량률 저감 방안 수립.'],
  [4,'260420','reviewing',8,'4월 품질 보고서 작성.'],
  [4,'260511','reviewing',8,'5월 공정 효율화 보고서.'],
  [4,'260525','written',  8,'상반기 품질 종합 분석.'],
  [4,'260601','written',  4,'6월 품질 점검 일정 조율.'],

  // Row 5: 정우성 특급 — 8건
  [5,'260109','approved', 8,'디지털 전환 전략 초안 수립.'],
  [5,'260123','approved', 8,'IT 인프라 현황 점검.'],
  [5,'260206','approved', 8,'클라우드 마이그레이션 계획 수립.'],
  [5,'260220','approved', 4,'보안 시스템 점검 미팅.'],
  [5,'260306','approved', 8,'디지털 전환 2단계 실행.'],
  [5,'260320','rejected', 4,'시스템 테스트 결과 오류 — 반려.'],
  [5,'260403','approved', 8,'최종 IT 전략 보고서 제출.'],
  [5,'260417','reviewing',8,'4월 디지털화 성과 점검.'],

  // Row 6: 한지민 중급 — 7건
  [6,'260211','approved', 8,'바이오 소재 연구 동향 분석.'],
  [6,'260225','approved', 8,'R&D 로드맵 수립 미팅.'],
  [6,'260311','approved', 4,'특허 현황 검토 및 출원 계획.'],
  [6,'260325','approved', 8,'연구 성과 보고서 작성.'],
  [6,'260408','reviewing',8,'4월 R&D 진척도 점검.'],
  [6,'260506','written',  8,'5월 기술 이전 가능성 검토.'],
  [6,'260520','written',  4,'바이오 소재 사업화 전략.'],

  // Row 7: 오준호 특급 — 7건
  [7,'260302','approved', 8,'클라우드 서비스 현황 분석.'],
  [7,'260316','approved', 8,'인프라 최적화 방안 수립.'],
  [7,'260330','approved', 8,'SaaS 전환 계획 수립.'],
  [7,'260413','approved', 4,'클라우드 비용 최적화 점검.'],
  [7,'260427','reviewing',8,'4월 클라우드 성과 보고.'],
  [7,'260518','written',  8,'5월 확장 계획 수립.'],
  [7,'260601','written',  8,'상반기 클라우드 전환 결과.'],

  // Row 8: 윤서희 중급 — 6건
  [8,'260107','approved', 8,'이노베이션 프로그램 기획.'],
  [8,'260121','approved', 8,'스타트업 지원 방안 수립.'],
  [8,'260204','approved', 4,'멘토링 프로그램 점검.'],
  [8,'260218','approved', 8,'2분기 혁신 전략 보고서.'],
  [8,'260304','approved', 8,'스타트업 성과 중간 점검.'],
  [8,'260318','rejected', 4,'지원 계획 수정 필요 — 반려.'],

  // Row 9: 강민석 특급 — 6건
  [9,'260212','approved', 8,'미래 모빌리티 시장 분석.'],
  [9,'260226','approved', 8,'전기차 전환 로드맵 수립.'],
  [9,'260312','approved', 8,'자율주행 기술 동향 점검.'],
  [9,'260326','approved', 4,'공급망 분석 보고서.'],
  [9,'260409','reviewing',8,'4월 모빌리티 전략 점검.'],
  [9,'260514','written',  8,'5월 친환경 전환 계획.'],

  // Row 10: 임채원 중급 — 6건
  [10,'260303','approved', 8,'소프트웨어 개발 프로세스 진단.'],
  [10,'260317','approved', 8,'Agile 전환 계획 수립.'],
  [10,'260331','approved', 4,'코드 품질 점검 미팅.'],
  [10,'260414','approved', 8,'4월 개발 성과 보고서.'],
  [10,'260428','reviewing',8,'스프린트 성과 분석.'],
  [10,'260519','written',  8,'5월 기술 부채 해소 계획.'],

  // Row 11: 신예진 특급 — 5건
  [11,'260108','approved', 8,'헬스케어 서비스 현황 분석.'],
  [11,'260122','approved', 8,'의료 데이터 활용 방안 수립.'],
  [11,'260205','approved', 4,'디지털 헬스 전략 수립 미팅.'],
  [11,'260219','rejected', 8,'규제 검토 결과 미비 — 반려.'],
  [11,'260305','reviewing',8,'3월 헬스케어 전략 보고서.'],

  // Row 12: 배준혁 중급 — 5건
  [12,'260213','approved', 8,'에코 시스템 환경 분석.'],
  [12,'260227','approved', 8,'탄소 감축 로드맵 수립.'],
  [12,'260313','approved', 4,'ESG 경영 현황 점검.'],
  [12,'260327','reviewing',8,'4월 환경 성과 보고서 준비.'],
  [12,'260410','written',  8,'4월 탄소중립 실행계획.'],

  // Row 13: 조수민 특급 — 5건
  [13,'260304','approved', 8,'스마트팜 현황 분석 및 수요 조사.'],
  [13,'260318','approved', 8,'스마트팜 운영 전략 수립.'],
  [13,'260401','approved', 4,'농업 데이터 활용 방안 검토.'],
  [13,'260415','reviewing',8,'4월 스마트팜 성과 점검.'],
  [13,'260513','written',  8,'5월 확장 운영 계획 수립.'],

  // Row 14: 유하은 중급 — 5건
  [14,'260407','approved', 8,'데이터 파이프라인 현황 진단.'],
  [14,'260421','approved', 8,'데이터 플랫폼 고도화 계획.'],
  [14,'260505','reviewing',8,'5월 데이터 거버넌스 점검.'],
  [14,'260519','written',  8,'데이터 활용 전략 보고서.'],
  [14,'260602','written',  4,'상반기 데이터 현황 보고.'],

  // Row 15: 문성훈 특급 — 6건
  [15,'260109','approved', 8,'핀테크 규제 현황 분석.'],
  [15,'260123','approved', 8,'디지털 금융 서비스 전략 수립.'],
  [15,'260206','approved', 4,'결제 시스템 개선 방안.'],
  [15,'260220','approved', 8,'핀테크 파트너십 전략 수립.'],
  [15,'260306','rejected', 8,'자금 조달 계획 오류 — 반려.'],
  [15,'260320','reviewing',8,'3월 금융 성과 보고서.'],

  // Row 16: 나지현 중급 — 4건
  [16,'260214','approved', 8,'에너지 솔루션 현황 분석.'],
  [16,'260228','approved', 8,'재생에너지 도입 계획 수립.'],
  [16,'260314','reviewing',4,'에너지 절감 방안 점검.'],
  [16,'260328','written',  8,'에너지 전환 로드맵 작성.'],

  // Row 17: 황정민 특급 — 4건
  [17,'260305','approved', 8,'로봇 시스템 현황 진단.'],
  [17,'260319','approved', 8,'자동화 공정 설계 미팅.'],
  [17,'260402','approved', 4,'협동로봇 도입 방안 수립.'],
  [17,'260416','reviewing',8,'4월 자동화 성과 점검.'],

  // Row 18: 안소영 중급 — 4건
  [18,'260408','approved', 8,'콘텐츠 전략 현황 분석.'],
  [18,'260422','approved', 8,'IP 개발 로드맵 수립.'],
  [18,'260506','reviewing',8,'5월 콘텐츠 성과 점검.'],
  [18,'260520','written',  8,'상반기 콘텐츠 성과 보고서.'],

  // Row 19: 탁재훈 특급 — 4건
  [19,'260507','approved', 8,'글로벌 무역 현황 분석.'],
  [19,'260521','reviewing',8,'수출 전략 수립 미팅.'],
  [19,'260603','written',  8,'6월 수출 이행 계획 수립.'],
  [19,'260610','written',  4,'상반기 무역 성과 중간 보고.'],

  // Row 20: 이재원 중급 — 3건
  [20,'260601','written',  8,'스마트시티 현황 분석 보고서 작성.'],
  [20,'260603','written',  4,'도시 디지털화 전략 수립.'],
  [20,'260615','written',  8,'스마트 인프라 도입 로드맵.'],
];

// ── JOURNAL_DB, ROWS 빌드 ─────────────────────────────────────
const JOURNAL_DB = {};
const ROW_MDS    = {};

JOURNAL_SEED.forEach(([rowId, yymmdd, status, hours, work]) => {
  const key = `r${rowId}_${yymmdd}`;
  const yy = yymmdd.slice(0,2), mm = yymmdd.slice(2,4), dd = yymmdd.slice(4,6);
  JOURNAL_DB[key] = { status, date: `20${yy}-${mm}-${dd}`, hours, work };
  if (!ROW_MDS[rowId]) ROW_MDS[rowId] = [];
  ROW_MDS[rowId].push(key);
});

const ROWS = ROWS_BASE.map(r => ({ ...r, mds: ROW_MDS[r.id] || [] }));

// ── 정산 데이터 (초기 비어있음) ───────────────────────────────
let settlements  = [];
let nextSettleId = 1;

// ── 상태 ─────────────────────────────────────────────────────
let activeGrade    = 'all';
let activeRound    = 'all';
let hiddenCols     = new Set();
let searchTarget   = 'all';
let searchQuery    = '';
let sortKey        = 'round_asc';
let editingSettleId = null;

// ── 고정 컬럼 정의 (너비 포함) ───────────────────────────────
const FIXED_COLS = [
  { key: 'round',      label: '신청차수(협약일)', w: 90              },
  { key: 'org',        label: '주관기관명',        w: 95,  clip: true },
  { key: 'company',    label: '참여기업명',        w: 95,  clip: true },
  { key: 'consultant', label: '컨설턴트명',        w: 76              },
  { key: 'totalmd',    label: '총M/D',             w: 50              },
  { key: 'phone',      label: '연락처',            w: 108             },
  { key: 'email',      label: '이메일',            w: 118, clip: true },
];

// ── 초기화 ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initChips();
  initSearch();
  initSort();
  initTodayCheck();
  initSettleDates();
  initEditDates();
  renderAll();
});

function renderAll() {
  renderTimeline('timelineTrack');
  renderTable();
}

// ── 칩 버튼 ─────────────────────────────────────────────────
function initChips() {
  document.querySelectorAll('[data-filter-grade]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-grade]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGrade = btn.dataset.filterGrade;
      renderTable();
    });
  });
  document.querySelectorAll('[data-filter-round]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-round]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRound = btn.dataset.filterRound;
      renderTable();
    });
  });
  document.querySelectorAll('[data-col]').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.col;
      if (hiddenCols.has(col)) { hiddenCols.delete(col); btn.classList.add('active'); }
      else { hiddenCols.add(col); btn.classList.remove('active'); }
      renderTable();
    });
  });
}

function initSearch() {
  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTable();
  });
  document.getElementById('searchTarget').addEventListener('change', e => {
    searchTarget = e.target.value;
    renderTable();
  });
}

function initSort() {
  document.getElementById('sortSelect').addEventListener('change', e => {
    sortKey = e.target.value;
    renderTable();
  });
}

// ── 타임라인 ─────────────────────────────────────────────────
function renderTimeline(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.querySelectorAll('.timeline-segment').forEach(s => s.remove());

  const yearStart = new Date(`${YEAR}-01-01`);
  const yearEnd   = new Date(`${YEAR}-12-31`);
  const totalDays = (yearEnd - yearStart) / 86400000 + 1;

  settlements.forEach(s => {
    const start = new Date(s.start);
    const end   = new Date(s.end);
    if (end < yearStart || start > yearEnd) return;

    const cStart = start < yearStart ? yearStart : start;
    const cEnd   = end   > yearEnd   ? yearEnd   : end;

    const offsetDays = (cStart - yearStart) / 86400000;
    const spanDays   = (cEnd   - cStart)    / 86400000 + 1;
    const left  = (offsetDays / totalDays) * 100;
    const width = (spanDays  / totalDays) * 100;

    const seg = document.createElement('div');
    seg.className = 'timeline-segment';
    seg.style.left       = left + '%';
    seg.style.width      = width + '%';
    seg.style.background = s.color;
    seg.dataset.id       = s.id;
    seg.addEventListener('mouseenter', e => showTimelineTooltip(e, s));
    seg.addEventListener('mousemove',  e => moveTimelineTooltip(e));
    seg.addEventListener('mouseleave', hideTimelineTooltip);
    track.appendChild(seg);
  });
}

function showTimelineTooltip(e, s) {
  const tt = document.getElementById('timelineTooltip');
  if (!tt) return;
  const amt = s.amount ? s.amount.toLocaleString() + '원' : '';
  tt.innerHTML = `${fmtDate(s.start)} ~ ${fmtDate(s.end)}&nbsp;&nbsp;<strong>${s.title}</strong>${amt ? '&nbsp;&nbsp;' + amt : ''}`;
  tt.style.display = 'block';
  moveTimelineTooltip(e);
}
function moveTimelineTooltip(e) {
  const tt = document.getElementById('timelineTooltip');
  if (tt) { tt.style.left = (e.clientX + 14) + 'px'; tt.style.top = (e.clientY - 38) + 'px'; }
}
function hideTimelineTooltip() {
  const tt = document.getElementById('timelineTooltip');
  if (tt) tt.style.display = 'none';
}
function fmtDate(s) {
  const d = new Date(s);
  return `${String(d.getFullYear()).slice(2)}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

// ── 테이블 렌더 ──────────────────────────────────────────────
function fmtMd(v) {
  const n = parseFloat(v);
  return n % 1 === 0 ? String(Math.floor(n)) : n.toFixed(1);
}

function getFilteredSorted() {
  let rows = ROWS.filter(r => {
    if (activeGrade !== 'all' && r.grade !== activeGrade) return false;
    if (activeRound !== 'all' && r.round !== Number(activeRound)) return false;
    if (searchQuery) {
      let hay = '';
      if (searchTarget === 'all')        hay = `${r.org}${r.company}${r.consultant}`;
      else if (searchTarget === 'company')    hay = r.company;
      else if (searchTarget === 'org')        hay = r.org;
      else if (searchTarget === 'consultant') hay = r.consultant;
      if (!hay.toLowerCase().includes(searchQuery)) return false;
    }
    return true;
  });

  const [key, dir] = sortKey.split('_');
  const asc = dir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    let av, bv;
    switch (key) {
      case 'round':      av = a.round;      bv = b.round;      break;
      case 'org':        av = a.org;        bv = b.org;        break;
      case 'company':    av = a.company;    bv = b.company;    break;
      case 'consultant': av = a.consultant; bv = b.consultant; break;
      case 'md':         av = a.mds.length; bv = b.mds.length; break;
      default: return 0;
    }
    return av < bv ? -asc : av > bv ? asc : 0;
  });
  return rows;
}

function renderTable() {
  const rows     = getFilteredSorted();
  const visCols  = FIXED_COLS.filter(c => !hiddenCols.has(c.key));
  const maxMd    = Math.max(...rows.map(r => r.mds.length), 0);

  // 누적 left 계산 (sticky)
  let cumLeft = 0;
  const colLeft = {};
  visCols.forEach(c => { colLeft[c.key] = cumLeft; cumLeft += c.w; });
  const lastKey = visCols.length > 0 ? visCols[visCols.length - 1].key : null;

  // ── 헤더
  const head = document.getElementById('mainHead');
  let ths = visCols.map(c => {
    const isLast = c.key === lastKey;
    const clipStyle = c.clip ? 'overflow:hidden;text-overflow:ellipsis;' : '';
    return `<th class="tbl-th tbl-sticky${isLast ? ' tbl-sticky-last' : ''}" style="left:${colLeft[c.key]}px;width:${c.w}px;max-width:${c.w}px;${clipStyle}">${c.label}</th>`;
  }).join('');
  for (let i = 0; i < maxMd; i++) ths += `<th class="tbl-th">MD${i+1}</th>`;
  if (!maxMd) ths += `<th class="tbl-th" style="color:transparent;">-</th>`;
  head.innerHTML = ths;

  // ── 바디
  const body = document.getElementById('mainBody');
  if (!rows.length) {
    const colCount = visCols.length + Math.max(maxMd, 1);
    body.innerHTML = `<tr class="empty-row"><td colspan="${colCount}">조회된 데이터가 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map(row => {
    let tds = visCols.map(c => {
      const isLast = c.key === lastKey;
      let val = '';
      switch (c.key) {
        case 'round':      val = `${row.round}차 (${row.roundDate})`; break;
        case 'org':        val = row.org; break;
        case 'company':    val = row.company; break;
        case 'consultant': val = `<strong>${row.consultant}</strong><br/><span style="font-size:11px;color:var(--text-sub);">${GRADE_LABEL[row.grade]}</span>`; break;
        case 'totalmd':    val = `<strong>${fmtMd(row.mds.length * 0.5)}</strong>`; break;
        case 'phone':      val = row.phone; break;
        case 'email':      val = `<span style="font-size:12px;">${row.email}</span>`; break;
      }
      const clipStyle = c.clip ? 'overflow:hidden;text-overflow:ellipsis;' : '';
      return `<td class="tbl-td tbl-sticky${isLast ? ' tbl-sticky-last' : ''}" style="left:${colLeft[c.key]}px;width:${c.w}px;max-width:${c.w}px;${clipStyle}">${val}</td>`;
    }).join('');

    for (let i = 0; i < maxMd; i++) {
      const mdKey = row.mds[i];
      if (mdKey) {
        const j  = JOURNAL_DB[mdKey];
        const st = j ? j.status : 'written';
        const icon = { approved: '✓', rejected: '✗', reviewing: '◐', written: '' }[st] || '';
        const label = mdKey.split('_')[1]; // yymmdd
        tds += `<td class="tbl-td"><span class="md-cell ${st}" onclick="openJournal('${mdKey}')">${icon ? icon + ' ' : ''}${label}</span></td>`;
      } else {
        tds += `<td class="tbl-td"></td>`;
      }
    }
    if (!maxMd) tds += `<td class="tbl-td"></td>`;
    return `<tr class="tbl-tr">${tds}</tr>`;
  }).join('');
}

// ── 수행일지 모달 ────────────────────────────────────────────
function openJournal(key) {
  const j = JOURNAL_DB[key];
  if (!j) return;
  const statusText  = { approved: '승인됨', rejected: '반려됨', reviewing: '검토중', written: '작성됨' };
  const statusClass = { approved: 'approved', rejected: 'rejected', reviewing: 'reviewing', written: '' };
  document.getElementById('journalModalTitle').textContent = `수행일지 — ${j.date}`;
  document.getElementById('journalModalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      ${j.status !== 'written' ? `<span class="journal-status ${statusClass[j.status]}">${statusText[j.status]}</span>` : `<span style="font-size:12px;color:var(--text-sub);">${statusText[j.status]}</span>`}
      <span style="font-size:13px;color:var(--text-sub);">${j.consultant || ''}</span>
    </div>
    <div class="form-label">수행 일자</div>
    <div style="font-size:13px;margin-bottom:12px;">${j.date}</div>
    <div class="form-label">수행 시간</div>
    <div style="font-size:13px;margin-bottom:12px;">${j.hours}시간 (${fmtMd(j.hours / 8)} MD)</div>
    <div class="form-label">수행 내용</div>
    <div class="journal-block">${j.work}</div>
  `;
  openModal('journalModal');
}

// ── 정산 기간 겹침 체크 ──────────────────────────────────────
function hasOverlap(start, end, excludeId = null) {
  if (!start || !end) return false;
  return settlements.some(s => {
    if (excludeId !== null && s.id === excludeId) return false;
    return start <= s.end && end >= s.start;
  });
}

// ── 정산 요약 계산 (공통) ─────────────────────────────────────
function calcSummary(start, end) {
  let approved = 0, rejected = 0, reviewing = 0, notSubmitted = 0;
  const consultantMd = {};
  ROWS.forEach(row => {
    row.mds.forEach(key => {
      const j = JOURNAL_DB[key];
      if (!j) return;
      const full = j.date; // 'YYYY-MM-DD'
      if (full < start || full > end) return;
      if (j.status === 'approved')  approved++;
      else if (j.status === 'rejected')  rejected++;
      else if (j.status === 'reviewing') reviewing++;
      else notSubmitted++;
      if (!consultantMd[row.id]) consultantMd[row.id] = { consultant: row.consultant, grade: row.grade, md: 0 };
      consultantMd[row.id].md += 0.5;
    });
  });
  const rows   = Object.values(consultantMd);
  const totalMdVal = rows.reduce((s, r) => s + r.md, 0);
  const totalAmt   = rows.reduce((s, r) => s + GRADE_RATE[r.grade] * r.md, 0);
  return { approved, rejected, reviewing, notSubmitted, rows, totalMdVal, totalAmt };
}

// ── 정산 추가 모달 ───────────────────────────────────────────
function initTodayCheck() {
  const cb = document.getElementById('todayCheck');
  const endInput = document.getElementById('settleEnd');
  cb.addEventListener('change', () => {
    if (cb.checked) { endInput.value = new Date().toISOString().slice(0, 10); endInput.disabled = true; }
    else { endInput.disabled = false; }
    updateAddSummary();
  });
}

function initSettleDates() {
  document.getElementById('settleStart').addEventListener('change', updateAddSummary);
  document.getElementById('settleEnd').addEventListener('change', updateAddSummary);
}

function updateAddSummary() {
  const start = document.getElementById('settleStart').value;
  const end   = document.getElementById('settleEnd').value;
  const summary   = document.getElementById('settleSummary');
  const tableWrap = document.getElementById('settleTableWrap');
  const warnEl    = document.getElementById('addOverlapWarn');
  const saveBtn   = document.getElementById('addSaveBtn');

  if (!start || !end || start > end) {
    summary.style.display   = 'none';
    tableWrap.style.display = 'none';
    warnEl.style.display    = 'none';
    saveBtn.disabled        = false;
    return;
  }

  const overlap = hasOverlap(start, end, null);
  warnEl.style.display = overlap ? 'block' : 'none';
  saveBtn.disabled     = overlap;

  const { approved, rejected, reviewing, notSubmitted, rows, totalMdVal, totalAmt } = calcSummary(start, end);
  document.getElementById('sumOk').textContent   = `승인됨 ${approved}건`;
  document.getElementById('sumRej').textContent  = `반려됨 ${rejected}건`;
  document.getElementById('sumRev').textContent  = `검토중 ${reviewing}건`;
  document.getElementById('sumWait').textContent = `미제출 ${notSubmitted}건`;
  summary.style.display = 'flex';

  const tbody = document.getElementById('settleDetailBody');
  tbody.innerHTML = rows.map(r => {
    const rate = GRADE_RATE[r.grade];
    const amt  = rate * r.md;
    return `<tr><td>${r.consultant}</td><td>${GRADE_LABEL[r.grade]}</td><td>${rate.toLocaleString()}원</td><td>${fmtMd(r.md)} MD</td><td class="text-right">${amt.toLocaleString()}원</td></tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-sub);padding:14px;">해당 기간 수행일지 없음</td></tr>`;
  document.getElementById('settleFootMd').textContent  = fmtMd(totalMdVal) + ' MD';
  document.getElementById('settleFootAmt').textContent = totalAmt.toLocaleString() + '원';
  tableWrap.style.display = 'block';

  window._settleAmt           = totalAmt;
  window._settleHasUnresolved = (rejected + reviewing + notSubmitted) > 0;
}

function handleSaveSettlement() {
  const start = document.getElementById('settleStart').value;
  const end   = document.getElementById('settleEnd').value;
  const title = document.getElementById('settleTitle').value.trim();
  if (!start || !end) { showToast('정산 기간을 입력해주세요.'); return; }
  if (!title)          { showToast('제목을 입력해주세요.'); return; }
  if (window._settleHasUnresolved) openModal('confirmSettleModal');
  else finalSaveSettlement();
}

function finalSaveSettlement() {
  const start = document.getElementById('settleStart').value;
  const end   = document.getElementById('settleEnd').value;
  const title = document.getElementById('settleTitle').value.trim();
  const note  = document.getElementById('settleNote').value.trim();
  const fileEl = document.getElementById('settleFile');
  const file  = fileEl.files[0]?.name || '';
  const color = SEGMENT_COLORS[settlements.length % SEGMENT_COLORS.length];
  const today = new Date().toISOString().slice(0, 10);
  settlements.push({ id: nextSettleId++, title, start, end, note, file, color, createdAt: today, updatedAt: today, amount: window._settleAmt || 0 });
  closeModal('confirmSettleModal');
  closeModal('addSettlementModal');
  resetAddModal();
  renderAll();
  showToast('정산이 저장되었습니다.');
}

function resetAddModal() {
  document.getElementById('settleStart').value      = '';
  document.getElementById('settleEnd').value        = '';
  document.getElementById('settleEnd').disabled     = false;
  document.getElementById('todayCheck').checked     = false;
  document.getElementById('settleTitle').value      = '';
  document.getElementById('settleNote').value       = '';
  document.getElementById('settleFile').value       = '';
  document.getElementById('settleFileName').textContent = '';
  document.getElementById('settleSummary').style.display   = 'none';
  document.getElementById('settleTableWrap').style.display = 'none';
  document.getElementById('addOverlapWarn').style.display  = 'none';
  document.getElementById('addSaveBtn').disabled = false;
  window._settleAmt = 0;
  window._settleHasUnresolved = false;
}

// ── 정산 현황 상세 ───────────────────────────────────────────
function openSettlementList() {
  renderSettlementList();
  renderTimeline('miniTimeline');
  openModal('settlementListModal');
}

function renderSettlementList() {
  renderTimeline('miniTimeline');
  const list = document.getElementById('settlementList');
  if (!settlements.length) {
    list.innerHTML = '<p style="color:var(--text-sub);font-size:13px;text-align:center;padding:20px 0;">등록된 정산이 없습니다.</p>';
    return;
  }
  list.innerHTML = [...settlements].reverse().map(s => `
    <div class="settlement-item" onclick="openEditSettlement(${s.id})">
      <button class="settlement-delete" onclick="deleteSettlement(event,${s.id})">✕</button>
      <div class="settlement-item-head">
        <span class="settlement-item-title">${s.title}</span>
        <span class="settlement-item-date">${fmtDate(s.start)} ~ ${fmtDate(s.end)}</span>
      </div>
      <div class="settlement-item-meta">
        인건비 <strong>${(s.amount||0).toLocaleString()}원</strong>
        ${s.note ? ' · ' + s.note : ''}
        ${s.file ? ' · 📎 ' + s.file : ''}
        <br/>등록 ${s.createdAt} · 수정 ${s.updatedAt}
      </div>
    </div>
  `).join('');
}

function deleteSettlement(e, id) {
  e.stopPropagation();
  settlements = settlements.filter(s => s.id !== id);
  renderSettlementList();
  renderTimeline('timelineTrack');
  renderTimeline('miniTimeline');
  showToast('정산이 삭제되었습니다.');
}

// ── 정산 수정 모달 ───────────────────────────────────────────
function initEditDates() {
  document.getElementById('editStart').addEventListener('change', updateEditSummary);
  document.getElementById('editEnd').addEventListener('change', updateEditSummary);
}

function updateEditSummary() {
  const start  = document.getElementById('editStart').value;
  const end    = document.getElementById('editEnd').value;
  const warnEl = document.getElementById('editOverlapWarn');
  const sumEl  = document.getElementById('editSummary');
  const saveBtn = document.getElementById('editSaveBtn');

  if (!start || !end || start > end) {
    warnEl.style.display = 'none';
    sumEl.style.display  = 'none';
    saveBtn.disabled     = false;
    return;
  }

  const overlap = hasOverlap(start, end, editingSettleId);
  warnEl.style.display = overlap ? 'block' : 'none';
  saveBtn.disabled     = overlap;

  const { approved, rejected, reviewing, notSubmitted } = calcSummary(start, end);
  document.getElementById('editSumOk').textContent   = `승인됨 ${approved}건`;
  document.getElementById('editSumRej').textContent  = `반려됨 ${rejected}건`;
  document.getElementById('editSumRev').textContent  = `검토중 ${reviewing}건`;
  document.getElementById('editSumWait').textContent = `미제출 ${notSubmitted}건`;
  sumEl.style.display = 'flex';
}

function openEditSettlement(id) {
  const s = settlements.find(x => x.id === id);
  if (!s) return;
  editingSettleId = id;
  document.getElementById('editTitle').value    = s.title;
  document.getElementById('editStart').value    = s.start;
  document.getElementById('editEnd').value      = s.end;
  document.getElementById('editNote').value     = s.note;
  document.getElementById('editFilePrev').textContent = s.file || '';
  document.getElementById('editOverlapWarn').style.display = 'none';
  document.getElementById('editSaveBtn').disabled = false;
  updateEditSummary();
  openModal('editSettlementModal');
}

function saveEditSettlement() {
  const s = settlements.find(x => x.id === editingSettleId);
  if (!s) return;
  const start = document.getElementById('editStart').value;
  const end   = document.getElementById('editEnd').value;
  if (hasOverlap(start, end, editingSettleId)) { showToast('기간이 겹칩니다.'); return; }
  s.title     = document.getElementById('editTitle').value.trim();
  s.start     = start;
  s.end       = end;
  s.note      = document.getElementById('editNote').value.trim();
  s.updatedAt = new Date().toISOString().slice(0, 10);
  const f = document.getElementById('editFile').files[0];
  if (f) s.file = f.name;
  closeModal('editSettlementModal');
  renderSettlementList();
  renderTimeline('timelineTrack');
  renderTimeline('miniTimeline');
  showToast('정산이 수정되었습니다.');
}
