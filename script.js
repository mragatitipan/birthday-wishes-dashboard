'use strict';

// ══════════════════════════════════════
//  MUSIC
// ══════════════════════════════════════
const music = document.getElementById('background-music');
const startMusic = () => music.play().catch(() => {});
document.addEventListener('click',      startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });

// ══════════════════════════════════════
//  PAGE NAV
// ══════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════
//  FLOATING PARTICLES
// ══════════════════════════════════════
(function spawnParticles() {
  const wrap   = document.getElementById('particles-wrap');
  if (!wrap) return;
  const emojis = ['🌸','✨','💕','🌷','⭐','💫','🎀','🌺','💖','🎊'];
  const colors = ['#f7a8c0','#ffd6e0','#ffb347','#dab8f3','#a8d8ea','#fcbad3','#ffe4b5'];
  for (let i = 0; i < 35; i++) {
    const el      = document.createElement('div');
    const isEmoji = Math.random() > 0.5;
    el.className  = 'particle';
    if (isEmoji) {
      el.textContent    = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.fontSize = (12 + Math.random() * 14) + 'px';
    } else {
      el.style.cssText += `
        width:${5 + Math.random() * 9}px;
        height:${5 + Math.random() * 9}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        border-radius:${Math.random() > 0.5 ? '50%' : '3px'};
      `;
    }
    el.style.left              = Math.random() * 100 + '%';
    el.style.animationDelay    = Math.random() * 8 + 's';
    el.style.animationDuration = (6 + Math.random() * 8) + 's';
    wrap.appendChild(el);
  }
})();

// ══════════════════════════════════════
//  TYPEIT OPENING
// ══════════════════════════════════════
if (document.getElementById('teks-opening')) {
  new TypeIt('#teks-opening', {
    strings: [
      'بَارَكَ اللهُ فِي عُمْرِكِ',
      'Semoga Allah memberkahi umurmu, memberikan kesehatan pada jasadmu, dan meluaskan rezkimu.',
      'Semoga setiap hari yang kau lalui menjadi lebih baik dari hari sebelumnya.',
      'Semoga Allah menjagamu dalam ketaatan, dan menjadikanmu wanita yang dicintai-Nya.',
      'Tetaplah istiqomah, Kaka — karena dunia ini hanya persinggahan, dan yang terbaik adalah bekal untuk akhirat.',
      'Uhibbuki fillah, Kaka. 🤍'
    ],
    speed: 55,
    startDelay: 800,
    waitUntilVisible: true,
    afterComplete: () => {
      const footer = document.querySelector('.paper-luxury-footer');
      if (footer) footer.style.opacity = '1';
    }
  }).go();
}

// ══════════════════════════════════════
//  LOAD WISHERS
// ══════════════════════════════════════
function loadWishers() {
  fetch('get_wishes.php')
    .then(r => r.json())
    .then(data => {
      const count  = (data.wishes || []).length;
      const badge  = document.getElementById('mail-badge');
      const descEl = document.getElementById('mail-counter-desc');
      if (!badge || !descEl) return;
      badge.textContent = count;
      badge.classList.remove('pop');
      void badge.offsetWidth;
      badge.classList.add('pop');
      setTimeout(() => badge.classList.remove('pop'), 400);
      descEl.textContent = count === 0
        ? 'Jadilah yang pertama mengucapkan! 🌟'
        : count === 1
          ? '1 orang sudah mengucapkan 🎉'
          : `${count} orang sudah mengucapkan 🎉`;
    })
    .catch(() => {});
}
loadWishers();

// ══════════════════════════════════════
//  NAVIGASI
// ══════════════════════════════════════
const _btnWrite = document.getElementById('btn-write-wish');
const _btnBack  = document.getElementById('btn-back');
const _btnOk    = document.getElementById('modal-ok');
const _btnSub   = document.getElementById('btn-submit');

if (_btnWrite) _btnWrite.addEventListener('click', () => {
  showPage('page-form');
  initPhotoUpload(); // ← init SETELAH page-form visible
});
if (_btnBack)  _btnBack.addEventListener('click',  () => showPage('page-opening'));
if (_btnOk)    _btnOk.addEventListener('click', () => {
  document.getElementById('modal-success').classList.add('d-none');
  showPage('page-opening');
});
if (_btnSub)   _btnSub.addEventListener('click', submitWish);

// ══════════════════════════════════════
//  MULTI PHOTO UPLOAD
//  Init dipanggil SAAT tombol "Tulis Ucapan"
//  diklik — DOM page-form sudah pasti ada
// ══════════════════════════════════════
const MAX_PHOTOS = 5;
const MAX_SIZE   = 5 * 1024 * 1024;

let selectedPhotos  = [];
let photoInitDone   = false;

function initPhotoUpload() {
  // Hanya init sekali
  if (photoInitDone) return;
  photoInitDone = true;

  // Query LAZY — dipanggil setelah page-form aktif
  const inpPhoto    = document.getElementById('inp-photo');
  const dropArea    = document.getElementById('photo-drop-area');
  const placeholder = document.getElementById('photo-placeholder');
  const smallHint   = placeholder ? placeholder.querySelector('small') : null;

  // Debug — hapus setelah konfirmasi OK
  console.log('[photo] inpPhoto   :', inpPhoto);
  console.log('[photo] dropArea   :', dropArea);
  console.log('[photo] placeholder:', placeholder);
  console.log('[photo] previewGrid:', document.getElementById('photo-multi-preview'));
  console.log('[photo] countNum   :', document.getElementById('photo-count-num'));

  if (!inpPhoto || !dropArea) {
    console.error('[photo] Element tidak ditemukan! Cek ID di index.html');
    return;
  }

  // Klik drop area
  dropArea.addEventListener('click', () => {
    if (selectedPhotos.length < MAX_PHOTOS) inpPhoto.click();
  });

  // Drag & Drop
  dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
  dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    addPhotos(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  });

  // File input
  inpPhoto.addEventListener('change', () => {
    addPhotos(Array.from(inpPhoto.files));
    inpPhoto.value = '';
  });
}

// ── Tambah foto ──
function addPhotos(files) {
  const remaining = MAX_PHOTOS - selectedPhotos.length;
  if (remaining <= 0) {
    showFormAlert(`Maksimal ${MAX_PHOTOS} foto ya! 📷`, 'error');
    return;
  }
  const errors = [];
  files.slice(0, remaining).forEach(file => {
    if (file.size > MAX_SIZE) {
      errors.push(`"${file.name}" melebihi 5MB`);
    } else {
      selectedPhotos.push(file);
    }
  });
  if (files.length > remaining) {
    errors.push(`Hanya ${remaining} slot tersisa (maks ${MAX_PHOTOS} foto)`);
  }
  if (errors.length) showFormAlert(errors.join(' · '), 'error');
  renderPhotoPreview();
}

// ── Hapus foto ──
function removePhoto(idx) {
  selectedPhotos.splice(idx, 1);
  renderPhotoPreview();
}

// ── Render preview — query DOM di sini (lazy) ──
function renderPhotoPreview() {
  // Query setiap kali — 100% aman
  const previewGrid = document.getElementById('photo-multi-preview');
  const countNum    = document.getElementById('photo-count-num');
  const countDots   = document.querySelectorAll('.photo-dot');
  const placeholder = document.getElementById('photo-placeholder');
  const smallHint   = placeholder ? placeholder.querySelector('small') : null;

  if (!previewGrid) {
    console.error('[renderPhotoPreview] #photo-multi-preview tidak ditemukan!');
    return;
  }

  const count  = selectedPhotos.length;
  const isFull = count >= MAX_PHOTOS;

  if (countNum)  countNum.textContent = count;
  countDots.forEach((dot, i) => dot.classList.toggle('filled', i < count));
  document.getElementById('photo-drop-area')?.classList.toggle('is-full', isFull);

  if (smallHint) {
    smallHint.textContent = isFull
      ? 'Sudah mencapai batas maksimal 5 foto ✅'
      : `Klik atau drag · ${MAX_PHOTOS - count} slot tersisa · maks 5MB per foto`;
  }

  if (placeholder) placeholder.style.display = count > 0 ? 'none' : '';

  previewGrid.innerHTML = '';
  selectedPhotos.forEach((file, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-thumb-wrap';

    const img = document.createElement('img');
    img.alt   = file.name;
    const reader = new FileReader();
    reader.onload = ev => { img.src = ev.target.result; };
    reader.readAsDataURL(file);

    const num = document.createElement('span');
    num.className   = 'photo-thumb-num';
    num.textContent = idx + 1;

    const btn = document.createElement('button');
    btn.className   = 'photo-thumb-remove';
    btn.textContent = '✕';
    btn.title       = 'Hapus foto ini';
    btn.addEventListener('click', e => { e.stopPropagation(); removePhoto(idx); });

    wrap.append(img, num, btn);
    previewGrid.appendChild(wrap);
  });
}

// ══════════════════════════════════════
//  SUBMIT
// ══════════════════════════════════════
function submitWish() {
  const name    = document.getElementById('inp-name').value.trim();
  const message = document.getElementById('inp-message').value.trim();

  if (!name || !message) {
    showFormAlert('Nama dan ucapan tidak boleh kosong ya! 😊', 'error');
    return;
  }

  const btnEl   = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-submit-text');
  btnText.textContent = 'Mengirim... ⏳';
  btnEl.disabled = true;

  const fd = new FormData();
  fd.append('name',    name);
  fd.append('message', message);
  selectedPhotos.forEach(file => fd.append('photos[]', file));

  fetch('save_wish.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        document.getElementById('inp-name').value    = '';
        document.getElementById('inp-message').value = '';
        selectedPhotos = [];
        renderPhotoPreview();
        loadWishers();
        document.getElementById('modal-success').classList.remove('d-none');
      } else {
        showFormAlert(data.error || 'Gagal mengirim ucapan 😢', 'error');
      }
    })
    .catch(() => showFormAlert('Koneksi bermasalah, coba lagi! 😢', 'error'))
    .finally(() => {
      btnText.textContent = 'Kirim Ucapan untuk Kinanti 💝';
      btnEl.disabled = false;
    });
}

// ══════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════
function showFormAlert(msg, type) {
  const el = document.getElementById('form-alert');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'form-alert ' + type;
  el.classList.remove('d-none');
  setTimeout(() => el.classList.add('d-none'), 4000);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}