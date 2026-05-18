'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // ══════════════════════════════════════
  //  PARTICLES
  // ══════════════════════════════════════
  (function () {
    const wrap = document.getElementById('particles-wrap');
    if (!wrap) return;
    const emojis = ['🌸','✨','💕','🌷','⭐','💫','🎀','🌺','💖','🎊'];
    const colors = ['#f7a8c0','#ffd6e0','#ffb347','#dab8f3','#a8d8ea','#fcbad3'];
    for (let i = 0; i < 28; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      if (Math.random() > 0.5) {
        el.textContent    = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.fontSize = (10 + Math.random() * 14) + 'px';
      } else {
        el.style.width        = (4 + Math.random() * 8) + 'px';
        el.style.height       = (4 + Math.random() * 8) + 'px';
        el.style.background   = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
      }
      el.style.left              = Math.random() * 100 + '%';
      el.style.animationDelay    = Math.random() * 8 + 's';
      el.style.animationDuration = (6 + Math.random() * 8) + 's';
      wrap.appendChild(el);
    }
  })();

  // ══════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════
  function getPhotos(w) {
    if (Array.isArray(w.photos) && w.photos.length) return w.photos;
    if (w.photo) return [w.photo];
    return [];
  }
  function getInitial(n) { return n ? n.charAt(0).toUpperCase() : '?'; }
  function escHtml(s) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }
  function photoUrl(f) { return 'uploads/' + f; }
  function isToday(t) {
    if (!t) return false;
    const mo = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'Mei':4,'May':4,'Jun':5,'Jul':6,'Agu':7,'Aug':7,'Sep':8,'Okt':9,'Oct':9,'Nov':10,'Des':11,'Dec':11};
    const m = t.match(/(\d{2})\s(\w+)\s(\d{4})/);
    if (!m) return false;
    const now = new Date();
    return now.getDate()===parseInt(m[1]) && now.getMonth()===(mo[m[2]]??-1) && now.getFullYear()===parseInt(m[3]);
  }

  // ══════════════════════════════════════
  //  STATE
  // ══════════════════════════════════════
  let allWishes    = [];   // data asli dari server
  let selectMode   = false;
  let selectedIdxs = new Set(); // set of original indices

  // ══════════════════════════════════════
  //  LIGHTBOX
  // ══════════════════════════════════════
  let lbImages = [], lbIndex = 0, lbMeta = {name:'',time:''};

  const lbEl    = document.getElementById('lightbox');
  const lbClose = document.getElementById('lb-close');
  const lbPrev  = document.getElementById('lb-prev');
  const lbNext  = document.getElementById('lb-next');
  const lbImg   = document.getElementById('lb-img');
  const lbName  = document.getElementById('lb-name');
  const lbTime  = document.getElementById('lb-time');
  const lbCount = document.getElementById('lb-counter');

  function openLightbox(images, idx, name, time) {
    if (selectMode) return; // jangan buka lightbox saat select mode
    lbImages = images; lbIndex = idx; lbMeta = {name:name||'',time:time||''};
    renderLb();
    lbEl.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lbEl.classList.add('d-none');
    document.body.style.overflow = '';
  }
  function renderLb() {
    if (!lbImg) return;
    lbImg.src            = photoUrl(lbImages[lbIndex]);
    if (lbName)  lbName.textContent  = lbMeta.name;
    if (lbTime)  lbTime.textContent  = lbMeta.time;
    if (lbCount) lbCount.textContent = lbImages.length > 1 ? `${lbIndex+1} / ${lbImages.length}` : '';
    if (lbPrev)  lbPrev.disabled     = lbIndex === 0;
    if (lbNext)  lbNext.disabled     = lbIndex === lbImages.length - 1;
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbEl)    lbEl.addEventListener('click', e => { if (e.target===lbEl) closeLightbox(); });
  if (lbPrev)  lbPrev.addEventListener('click', () => { if (lbIndex>0){lbIndex--;renderLb();} });
  if (lbNext)  lbNext.addEventListener('click', () => { if (lbIndex<lbImages.length-1){lbIndex++;renderLb();} });
  document.addEventListener('keydown', e => {
    if (!lbEl||lbEl.classList.contains('d-none')) return;
    if (e.key==='Escape') closeLightbox();
    if (e.key==='ArrowLeft'  && lbIndex>0)                  {lbIndex--;renderLb();}
    if (e.key==='ArrowRight' && lbIndex<lbImages.length-1)  {lbIndex++;renderLb();}
  });

  // ══════════════════════════════════════
  //  SELECT MODE
  // ══════════════════════════════════════
  const wall          = document.getElementById('wishes-wall');
  const actionBar     = document.getElementById('select-action-bar');
  const selectCountEl = document.getElementById('select-count');
  const btnKelola     = document.getElementById('btn-kelola');
  const btnSelectAll  = document.getElementById('btn-select-all');
  const btnDeselectAll= document.getElementById('btn-deselect-all');
  const btnDelSel     = document.getElementById('btn-delete-selected');
  const btnCancelSel  = document.getElementById('btn-cancel-select');

  function enterSelectMode() {
    selectMode = true;
    selectedIdxs.clear();
    wall.classList.add('select-mode');
    actionBar.classList.add('visible');
    if (btnKelola) { btnKelola.classList.add('active'); btnKelola.textContent = '✕ Selesai'; }
    updateSelectBar();
  }

  function exitSelectMode() {
    selectMode = false;
    selectedIdxs.clear();
    wall.classList.remove('select-mode');
    actionBar.classList.remove('visible');
    if (btnKelola) { btnKelola.classList.remove('active'); btnKelola.textContent = '⚙️ Kelola'; }
    // hapus visual selected dari semua card
    wall.querySelectorAll('.wish-card.selected').forEach(c => c.classList.remove('selected'));
    wall.querySelectorAll('.card-checkbox').forEach(c => c.textContent = '');
  }

  function toggleCard(card, origIdx) {
    if (!selectMode) return;
    if (selectedIdxs.has(origIdx)) {
      selectedIdxs.delete(origIdx);
      card.classList.remove('selected');
      card.querySelector('.card-checkbox').textContent = '';
    } else {
      selectedIdxs.add(origIdx);
      card.classList.add('selected');
      card.querySelector('.card-checkbox').textContent = '✓';
    }
    updateSelectBar();
  }

  function selectAll() {
    wall.querySelectorAll('.wish-card[data-orig-idx]').forEach(card => {
      const idx = parseInt(card.dataset.origIdx);
      selectedIdxs.add(idx);
      card.classList.add('selected');
      card.querySelector('.card-checkbox').textContent = '✓';
    });
    updateSelectBar();
  }

  function deselectAll() {
    selectedIdxs.clear();
    wall.querySelectorAll('.wish-card.selected').forEach(c => {
      c.classList.remove('selected');
      c.querySelector('.card-checkbox').textContent = '';
    });
    updateSelectBar();
  }

  function updateSelectBar() {
    const n = selectedIdxs.size;
    const total = wall.querySelectorAll('.wish-card[data-orig-idx]').length;
    if (selectCountEl) selectCountEl.textContent = n;
    if (btnDelSel)     btnDelSel.disabled = n === 0;
    // toggle select all / deselect all
    const allSelected = n === total && total > 0;
    if (btnSelectAll)   btnSelectAll.style.display   = allSelected ? 'none'  : 'inline-flex';
    if (btnDeselectAll) btnDeselectAll.style.display = allSelected ? 'inline-flex' : 'none';
  }

  if (btnKelola)     btnKelola.addEventListener('click', () => selectMode ? exitSelectMode() : enterSelectMode());
  if (btnSelectAll)  btnSelectAll.addEventListener('click', selectAll);
  if (btnDeselectAll)btnDeselectAll.addEventListener('click', deselectAll);
  if (btnCancelSel)  btnCancelSel.addEventListener('click', exitSelectMode);
  if (btnDelSel)     btnDelSel.addEventListener('click', () => {
    if (selectedIdxs.size === 0) return;
    openDeleteModal([...selectedIdxs]);
  });

  // ══════════════════════════════════════
  //  DELETE MODAL
  // ══════════════════════════════════════
  const modalDel  = document.getElementById('modal-delete');
  const btnCancel = document.getElementById('modal-delete-cancel');
  const btnConf   = document.getElementById('modal-delete-confirm');
  const delTitle  = document.getElementById('modal-delete-title');
  const delDesc   = document.getElementById('modal-delete-desc');

  let pendingDeleteIdxs = []; // array of original indices

  function openDeleteModal(idxArray) {
    pendingDeleteIdxs = idxArray;
    const n = idxArray.length;
    if (delTitle) delTitle.textContent = n > 1 ? `Hapus ${n} Ucapan?` : 'Hapus Ucapan?';
    if (delDesc) {
      if (n > 1) {
        delDesc.innerHTML = `<strong>${n} ucapan</strong> akan dihapus permanen beserta semua fotonya.`;
      } else {
        const w = allWishes[idxArray[0]];
        delDesc.innerHTML = `Ucapan dari <strong>${escHtml(w ? w.name : '?')}</strong> akan dihapus permanen beserta fotonya.`;
      }
    }
    modalDel.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }

  function closeDeleteModal() {
    modalDel.classList.add('d-none');
    document.body.style.overflow = '';
    pendingDeleteIdxs = [];
  }

  if (btnCancel) btnCancel.addEventListener('click', closeDeleteModal);
  if (modalDel)  modalDel.addEventListener('click', e => { if (e.target===modalDel) closeDeleteModal(); });
  if (btnConf)   btnConf.addEventListener('click', () => {
    if (pendingDeleteIdxs.length > 0) executeDelete(pendingDeleteIdxs);
  });

  function executeDelete(idxArray) {
    if (btnConf) { btnConf.disabled = true; btnConf.innerHTML = '⏳ Menghapus...'; }

    // Sort descending agar hapus dari belakang tidak geser index
    const sorted = [...idxArray].sort((a,b) => b - a);

    const fd = new FormData();
    sorted.forEach(i => fd.append('indices[]', i));

    fetch('delete_wish.php', { method:'POST', body: fd })
      .then(r => r.json())
      .then(data => {
        closeDeleteModal();
        exitSelectMode();
        showToast(data.success
          ? `✅ ${sorted.length} ucapan berhasil dihapus!`
          : '❌ ' + (data.message || 'Gagal menghapus'), !data.success);
        if (data.success) loadDashboard();
      })
      .catch(() => { closeDeleteModal(); showToast('❌ Gagal terhubung ke server.', true); })
      .finally(() => {
        if (btnConf) { btnConf.disabled = false; btnConf.innerHTML = '🗑️ Hapus'; }
      });
  }

  function showToast(msg, isError = false) {
    const old = document.getElementById('dash-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.id = 'dash-toast';
    t.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:${isError?'rgba(153,27,27,.95)':'rgba(76,29,149,.95)'};
      color:#f3e8ff;padding:12px 24px;border-radius:50px;
      font-family:'Quicksand',sans-serif;font-weight:700;font-size:14px;
      box-shadow:0 4px 20px rgba(0,0,0,.4);z-index:999999;
      border:1px solid ${isError?'rgba(220,38,38,.5)':'rgba(167,139,250,.4)'};
      backdrop-filter:blur(10px);white-space:nowrap;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ══════════════════════════════════════
  //  GALLERY SLIDER
  // ══════════════════════════════════════
  let gallerySlides = [], galleryIdx = 0, galleryTimer = null;

  function buildGallery(wishes) {
    const wrap  = document.getElementById('gallery-wrap');
    const label = document.getElementById('gallery-count-label');
    if (!wrap) return;
    gallerySlides = [];
    [...wishes].reverse().forEach(w => {
      getPhotos(w).forEach(p => gallerySlides.push({url:p,name:w.name,time:w.time}));
    });
    if (label) label.textContent = gallerySlides.length ? `${gallerySlides.length} foto` : '';
    if (!gallerySlides.length) {
      wrap.innerHTML = `<div class="gallery-slider-wrap"><div class="gallery-empty"><span class="gallery-empty-icon">📷</span>Belum ada foto</div></div>`;
      return;
    }
    const slidesHtml = gallerySlides.map((s,i) => `
      <div class="gallery-slide" data-idx="${i}">
        <img src="${photoUrl(s.url)}" alt="${escHtml(s.name)}" loading="lazy">
        <div class="gallery-slide-caption">
          <div class="gallery-cap-avatar">${escHtml(getInitial(s.name))}</div>
          <div class="gallery-cap-info">
            <span class="gallery-cap-name">${escHtml(s.name)}</span>
            <span class="gallery-cap-time">${escHtml(s.time)}</span>
          </div>
        </div>
      </div>`).join('');
    const dotsHtml = gallerySlides.map((_,i) =>
      `<span class="gallery-dot${i===0?' active':''}" data-idx="${i}"></span>`).join('');
    wrap.innerHTML = `
      <div class="gallery-slider-wrap">
        <div class="gallery-track" id="gallery-track">${slidesHtml}</div>
        <button class="gallery-btn gallery-btn-prev" id="gal-prev">‹</button>
        <button class="gallery-btn gallery-btn-next" id="gal-next">›</button>
      </div>
      <div class="gallery-dots" id="gallery-dots">${dotsHtml}</div>`;
    galleryIdx = 0; updateGalleryUI();
    document.getElementById('gal-prev').addEventListener('click', () => moveGallery(-1));
    document.getElementById('gal-next').addEventListener('click', () => moveGallery(1));
    document.querySelectorAll('.gallery-dot').forEach(d => {
      d.addEventListener('click', () => { galleryIdx=parseInt(d.dataset.idx); updateGalleryUI(); resetGalleryTimer(); });
    });
    document.querySelectorAll('.gallery-slide img').forEach((img,i) => {
      img.addEventListener('click', () => {
        const s = gallerySlides[i];
        openLightbox(gallerySlides.map(x=>x.url), i, s.name, s.time);
      });
    });
    startGalleryTimer();
  }
  function moveGallery(dir) { galleryIdx=(galleryIdx+dir+gallerySlides.length)%gallerySlides.length; updateGalleryUI(); resetGalleryTimer(); }
  function updateGalleryUI() {
    const track=document.getElementById('gallery-track'); if(!track)return;
    track.style.transform=`translateX(-${galleryIdx*100}%)`;
    document.querySelectorAll('.gallery-dot').forEach((d,i)=>d.classList.toggle('active',i===galleryIdx));
    const p=document.getElementById('gal-prev'),n=document.getElementById('gal-next');
    if(p)p.disabled=galleryIdx===0; if(n)n.disabled=galleryIdx===gallerySlides.length-1;
  }
  function startGalleryTimer() {
    clearInterval(galleryTimer);
    if(gallerySlides.length>1) galleryTimer=setInterval(()=>{galleryIdx=(galleryIdx+1)%gallerySlides.length;updateGalleryUI();},4000);
  }
  function resetGalleryTimer(){clearInterval(galleryTimer);startGalleryTimer();}

  // ══════════════════════════════════════
  //  WISH CARDS
  // ══════════════════════════════════════
  function buildWishCards(wishes) {
    if (!wall) return;
    if (!wishes || !wishes.length) {
      wall.innerHTML = `<div class="wall-empty"><span class="wall-empty-icon">💌</span>Belum ada ucapan. Jadilah yang pertama! 🌟</div>`;
      return;
    }
    const sorted    = [...wishes].reverse();
    const cardsHtml = sorted.map((w, i) => {
      const origIdx    = wishes.length - 1 - i;
      const photos     = getPhotos(w);
      const photoCount = photos.length;
      let photosHtml   = '';
      if (photoCount > 0) {
        const MAX = 4, more = photoCount - MAX;
        const items = photos.slice(0, MAX).map((p, pi) => {
          const overlay = (pi===MAX-1 && more>0) ? `<div class="wish-photo-more">+${more+1}</div>` : '';
          return `<div class="wish-photo-item" data-orig-idx="${origIdx}" data-photo-idx="${pi}">
            <img src="${photoUrl(p)}" alt="foto ${pi+1}" loading="lazy">${overlay}</div>`;
        }).join('');
        photosHtml = `<div class="wish-photos-grid count-${Math.min(photoCount,5)}">${items}</div>`;
      }
      const badge = photoCount > 0 ? `<span class="wish-card-photos-count">📷 ${photoCount} foto</span>` : `<span></span>`;
      return `
        <div class="wish-card" data-orig-idx="${origIdx}" style="animation-delay:${Math.min(i*0.06,0.5)}s">
          <!-- Checkbox overlay -->
          <div class="card-checkbox"></div>
          <div class="wish-card-header">
            <div class="wish-avatar-sm">${escHtml(getInitial(w.name))}</div>
            <div class="wish-meta">
              <span class="wish-name">${escHtml(w.name)}</span>
              <span class="wish-time">🕐 ${escHtml(w.time)}</span>
            </div>
            <button class="btn-delete-wish" data-orig-idx="${origIdx}" data-name="${escHtml(w.name)}" title="Hapus">🗑️</button>
          </div>
          <div class="wish-card-body">
            ${photosHtml}
            <p class="wish-msg">${escHtml(w.message)}</p>
          </div>
          <div class="wish-card-footer">
            <span class="wish-card-num">#${wishes.length - i}</span>
            ${badge}
          </div>
        </div>`;
    }).join('');

    wall.innerHTML = `<div class="wishes-grid">${cardsHtml}</div>`;

    // Klik foto → lightbox
    wall.querySelectorAll('.wish-photo-item').forEach(item => {
      item.addEventListener('click', e => {
        if (selectMode) { e.stopPropagation(); return; }
        const w = allWishes[parseInt(item.dataset.origIdx)];
        openLightbox(getPhotos(w), parseInt(item.dataset.photoIdx), w.name, w.time);
      });
    });

    // Klik card → toggle select
    wall.querySelectorAll('.wish-card').forEach(card => {
      card.addEventListener('click', () => {
        if (!selectMode) return;
        toggleCard(card, parseInt(card.dataset.origIdx));
      });
    });

    // Klik delete single
    wall.querySelectorAll('.btn-delete-wish').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openDeleteModal([parseInt(btn.dataset.origIdx)]);
      });
    });

    // Restore visual jika masih di select mode setelah reload
    if (selectMode) {
      wall.classList.add('select-mode');
      updateSelectBar();
    }
  }

  // ══════════════════════════════════════
  //  STATS
  // ══════════════════════════════════════
  function updateStats(wishes) {
    animateCount('stat-total',  wishes.length);
    animateCount('stat-photos', wishes.reduce((a,w)=>a+getPhotos(w).length,0));
    animateCount('stat-today',  wishes.filter(w=>isToday(w.time)).length);
  }
  function animateCount(id, target) {
    const el = document.getElementById(id); if(!el)return;
    const start=parseInt(el.textContent)||0, steps=30, inc=(target-start)/steps;
    let cur=start,n=0;
    const t=setInterval(()=>{cur+=inc;n++;el.textContent=Math.round(cur);if(n>=steps){el.textContent=target;clearInterval(t);}},20);
  }

  // ══════════════════════════════════════
  //  LOAD
  // ══════════════════════════════════════
  function loadDashboard() {
    fetch('get_wishes.php')
      .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(data => {
        allWishes = data.wishes || [];
        updateStats(allWishes);
        buildGallery(allWishes);
        buildWishCards(allWishes);
      })
      .catch(err => {
        console.error('[dashboard]', err);
        if (wall) wall.innerHTML = `<div class="wall-empty"><span class="wall-empty-icon">😢</span>Gagal memuat data.<br><small style="color:rgba(167,139,250,.6)">Pastikan get_wishes.php ada & XAMPP berjalan</small></div>`;
      });
  }

  loadDashboard();
  setInterval(loadDashboard, 30000);

}); // END DOMContentLoaded