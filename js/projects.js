// ===== Projects Page =====

document.addEventListener('DOMContentLoaded', () => {
  const filterBar = document.getElementById('filterBar');
  const cards = document.querySelectorAll('.project-card');
  const searchInput = document.getElementById('searchInput');

  // 필터 버튼 클릭
  filterBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter();
  });

  // 검색 입력
  searchInput.addEventListener('input', applyFilter);

  function applyFilter() {
    const filter = filterBar.querySelector('.filter-btn.active').dataset.filter;
    const q = searchInput.value.trim().toLowerCase();
    cards.forEach(card => {
      const statusMatch = filter === 'all' || card.dataset.status === filter;
      const textMatch   = !q || card.querySelector('.project-title').textContent.toLowerCase().includes(q);
      card.hidden = !(statusMatch && textMatch);
    });
  }
});
