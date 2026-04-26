// ── Auth guard ──────────────────────────────────────────────
async function guardAuth(requiredRole) {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) { window.location.href = '/login'; return null; }
    const user = await res.json();
    if (requiredRole && user.role !== requiredRole) {
      const routes = { admin: '/admin', founder: '/founder', investor: '/investor' };
      window.location.href = routes[user.role] || '/login';
      return null;
    }
    return user;
  } catch { window.location.href = '/login'; return null; }
}

// ── Navbar ───────────────────────────────────────────────────
function renderNav(user) {
  const el = document.getElementById('navbar');
  if (!el) return;
  el.innerHTML = `
    <div class="container">
      <a class="navbar-brand fw-bold text-primary" href="/">InVenture</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navContent">
        <ul class="navbar-nav ms-auto align-items-center">
          ${user.role === 'admin' ? '<li class="nav-item me-3"><a class="nav-link" href="#" onclick="openAnnouncementModal()">Broadcast</a></li>' : ''}
          <li class="nav-item me-3">
            <span class="badge bg-light text-dark border text-uppercase" style="font-size:0.7rem;">${user.role}</span>
          </li>
          <li class="nav-item me-3">
            <span class="text-muted small">Signed in as <strong class="text-dark">${user.name}</strong></span>
          </li>
          <li class="nav-item">
            <button class="btn btn-sm btn-outline-danger" onclick="logout()">Sign Out</button>
          </li>
        </ul>
      </div>
    </div>
  `;
  loadAnnouncements();
}

async function loadAnnouncements() {
  try {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    if (data.length > 0) {
      let banner = document.getElementById('announcement-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'announcement-banner';
        document.body.prepend(banner);
      }
      banner.innerHTML = `
        <div class="bg-primary text-white py-2 px-3 small d-flex justify-content-between align-items-center mb-0 shadow-sm border-bottom border-primary-subtle">
          <div class="container d-flex align-items-center gap-2">
            <span class="badge bg-white text-primary fw-bold" style="font-size:0.6rem;">NEW</span>
            <span class="fw-bold">${data[0].title}:</span>
            <span class="text-white-50 text-truncate" style="max-width:60vw;">${data[0].content || ''}</span>
          </div>
          <button class="btn-close btn-close-white" style="font-size:0.6rem;" onclick="this.parentElement.remove()"></button>
        </div>
      `;
    }
  } catch {}
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}

// ── Toast (Using simple alerts) ───────────────────────────────
function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:1060;';
    document.body.appendChild(container);
  }
  const colorMap = { success: 'success', error: 'danger', info: 'info' };
  const el = document.createElement('div');
  el.className = `alert alert-${colorMap[type]} shadow-sm fade show mb-2`;
  el.role = 'alert';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Stars ──────────────────────────────────────────────────────
function renderStars(rating) {
  let html = '<span>';
  for (let i = 1; i <= 5; i++) {
    html += i > rating ? '☆' : '★';
  }
  return html + '</span>';
}

// ── Stage badge ────────────────────────────────────────────────
function stageBadge(stage) {
  const map = { Idea: 'bg-info', MVP: 'bg-primary', Funding: 'bg-success' };
  return `<span class="badge ${map[stage] || 'bg-secondary'}">${stage}</span>`;
}

// ── Progress color ─────────────────────────────────────────────
function progressClass(p) {
  if (p < 30) return 'bg-danger';
  if (p < 60) return 'bg-warning';
  return 'bg-success';
}

// ── Days since ────────────────────────────────────────────────
function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ── Format currency ───────────────────────────────────────────
function formatCurrency(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-IN');
}

// ── Format date ───────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) { 
  const el = document.getElementById(id);
  if (window.bootstrap) {
    const modal = new bootstrap.Modal(el);
    modal.show();
    el._bsModal = modal;
  } else {
    el.classList.add('show', 'd-block');
  }
}
function closeModal(id) { 
  const el = document.getElementById(id);
  if (el._bsModal) {
    el._bsModal.hide();
  } else {
    el.classList.remove('show', 'd-block');
  }
}

// ── Tab system ─────────────────────────────────────────────────
function initTabs(navSelector) {
  const nav = document.querySelector(navSelector);
  if (!nav) return;
  const links = nav.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (!targetPane) return;

      // Find sibling panes (panes that share the same parent as the target)
      const parent = targetPane.parentElement;
      const siblingPanes = parent.querySelectorAll(':scope > .tab-pane');

      links.forEach(l => l.classList.remove('active'));
      siblingPanes.forEach(p => p.classList.add('d-none'));

      link.classList.add('active');
      targetPane.classList.remove('d-none');
    });
  });
}
