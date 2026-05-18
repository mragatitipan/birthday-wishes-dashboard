'use strict';

// ══════════════════════════════════════════════════
// KONFIGURASI — GANTI PASSWORD DI SINI
// ══════════════════════════════════════════════════
const ADMIN_PASSWORD = 'kinanti2024'; // <-- ganti sesuai keinginan

// ── Page nav ──────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Floating particles ────────────────────────────
(function spawnParticles() {
  const wrap   = document.getElementById('particles-wrap');
  const emojis = ['🌸','✨','💜','⭐','💫','✦','✧','🔮'];
  const colors = ['#c084fc','#a855f7','#e879f9','#f0abfc','#7c3aed','#fcd34d'];

  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    const isEmoji = Math.random() > 0.5;
    el.className = 'particle';

    if (isEmoji) {
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.fontSize = (10 + Math.random() * 12) + 'px';
    } else {
      el.style.cssText += `
        width:${4 + Math.random() * 7}px;
        height:${4 + Math.random() * 7}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        border-radius:50%;
        box-shadow: 0 0 6px ${colors[Math.floor(Math.random() * colors.length)]};
      `;
    }
    el.style.left              = Math.random() * 100 + '%';
    el.style.animationDelay    = Math.random() * 10 + 's';
    el.style.animationDuration = (7 + Math.random() * 9) + 's';
    wrap.appendChild(el);
  }
})();

// ── Cek session login ─────────────────────────────
if (sessionStorage.getItem('admin_auth') === 'true') {
  showPage('page-wall');
  loadWall();
}

// ── Login ─────────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', doLogin);
document.getElementById('inp-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function doLogin() {
  const val = document.getElementById('inp-password').value;
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_auth', 'true');
    showPage('page-wall');
    loadWall();
  } else {
    showLoginAlert('Password salah! Coba lagi. 🔒', 'error');
    document.getElementById('inp-password').value = '';
    document.getElementById('inp-password').focus();
  }
}

// ── Logout ────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('admin_auth');
  showPage('page-login');
  document.getElementById('inp-password').value = '';
});

// ── Load wall ─────────────────────────────────────
function loadWall() {
  const list = document.getElementById('wall-list');
  list.innerHTML = '<p class="wall-loading">Memuat ucapan... 💫</p>';

  fetch('get_wishes.php')
    .then(r => r.json())
    .then(data => {
      const wishes = data.wishes || [];

      // Update total count
      const totalEl = document.getElementById('total-count');
      if (totalEl) totalEl.textContent = `${wishes.length} ucapan masuk 🎉`;

      if (wishes.length === 0) {
        list.innerHTML = '<p class="wall-empty">Belum ada ucapan 🌸</p>';
        return;
      }

      list.innerHTML = [...wishes].reverse().map((w, i) => `
        <div class="wish-card animate__animated animate__fadeInUp" style="animation-delay:${Math.min(i * 0.06, 1.5)}s">
          <div class="paper-luxury wish-paper-luxury">
            <div class="paper-luxury-lines wish-paper-lines">
              ${w.photo ? `<img src="uploads/${escHtml(w.photo)}" class="wish-photo" alt="foto dari ${escHtml(w.name)}">` : ''}
              <div class="wish-card-header">
                <div class="wish-avatar-sm">
                  ${w.photo
                    ? `<img src="uploads/${escHtml(w.photo)}" alt="${escHtml(w.name)}">`
                    : `<span>${getInitial(w.name)}</span>`}
                </div>
                <div class="wish-meta">
                  <strong class="wish-name">${escHtml(w.name)}</strong>
                  <small class="wish-time">🕐 ${escHtml(w.time)}</small>
                </div>
              </div>
              <p class="wish-msg">${escHtml(w.message)}</p>
            </div>
          </div>
        </div>
      `).join('');
    })
    .catch(() => {
      list.innerHTML = '<p class="wall-empty">Gagal memuat ucapan 😢<br><small>Pastikan get_wishes.php tersedia</small></p>';
    });
}

// ── Helpers ───────────────────────────────────────
function showLoginAlert(msg, type) {
  const el = document.getElementById('login-alert');
  el.textContent = msg;
  el.className   = 'form-alert ' + type;
  el.classList.remove('d-none');
  setTimeout(() => el.classList.add('d-none'), 4000);
}

function getInitial(name) { return name ? name.charAt(0).toUpperCase() : '?'; }

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}