// ============ NAV SCROLL STATE ============
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

// ============ SCROLL REVEAL ============
const revealEls = document.querySelectorAll('[data-reveal]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ============ LOCAL TIME ============
const timeEl = document.getElementById('localTime');
function updateTime() {
  if (!timeEl) return;
  const now = new Date();
  const parts = new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul'
  }).formatToParts(now);
  const hh = parts.find(p => p.type === 'hour').value;
  const mm = parts.find(p => p.type === 'minute').value;
  timeEl.textContent = `${hh}:${mm} — Antalya`;
}
updateTime();
setInterval(updateTime, 1000 * 15);

// ============ WORK MODAL (gallery + tabs) ============
const overlay = document.getElementById('workModalOverlay');
const modal = overlay ? overlay.querySelector('.work-modal') : null;
let currentSlide = 0;
let currentSlideCount = 1;

function openWorkModal(card) {
  const title = card.dataset.title;
  const meta = card.dataset.meta;
  const overview = card.dataset.overview;
  const role = card.dataset.role;
  const stack = card.dataset.stack;
  const outcome = card.dataset.outcome;
  const link = card.dataset.link;
  const images = (card.dataset.images || '').split('|').filter(Boolean);

  modal.querySelector('.wm-title').textContent = title;
  modal.querySelector('.wm-meta').textContent = meta;
  modal.querySelector('.wm-overview').textContent = overview;
  modal.querySelector('.wm-role').textContent = role;
  modal.querySelector('.wm-stack').textContent = stack;
  modal.querySelector('.wm-outcome').textContent = outcome;

  const linkEl = modal.querySelector('.wm-link');
  if (link) {
    linkEl.href = link;
    linkEl.style.display = 'inline-flex';
    linkEl.textContent = link.includes('github.com') ? 'GitHub\u2019da incele →' : 'Canlı projeyi gör →';
  } else {
    linkEl.style.display = 'none';
  }

  // build gallery
  const track = modal.querySelector('.work-gallery-track');
  const dots = modal.querySelector('.gallery-dots');
  track.innerHTML = '';
  dots.innerHTML = '';
  const slides = images.length ? images : ['placeholder'];
  currentSlideCount = slides.length;
  currentSlide = 0;
  slides.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'work-gallery-slide';
    if (src === 'placeholder') {
      slide.textContent = 'GÖRSEL EKLENECEK';
    } else if (/\.(mp4|webm|mov)$/i.test(src)) {
      const video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      slide.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = src; img.alt = `${title} — görsel ${i + 1}`;
      slide.appendChild(img);
    }
    track.appendChild(slide);
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dots.appendChild(dot);
  });
  updateGalleryPosition();

  // pause any playing video when navigating away from its slide
  track.querySelectorAll('video').forEach(v => v.addEventListener('play', () => {
    track.querySelectorAll('video').forEach(other => { if (other !== v) other.pause(); });
  }));

  // reset tabs to first
  modal.querySelectorAll('.work-tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  modal.querySelectorAll('.work-tab-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeWorkModal() {
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  modal.querySelectorAll('video').forEach(v => v.pause());
}

function updateGalleryPosition() {
  const track = modal.querySelector('.work-gallery-track');
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  modal.querySelectorAll('.gallery-dots span').forEach((d, i) => d.classList.toggle('active', i === currentSlide));

  const allVideos = track.querySelectorAll('video');
  allVideos.forEach(v => v.pause()); // önce hepsini durdur

  const slides = track.querySelectorAll('.work-gallery-slide');
  const activeSlide = slides[currentSlide];
  const activeVideo = activeSlide ? activeSlide.querySelector('video') : null;
  if (activeVideo) {
    activeVideo.muted = true;      // tarayıcıların otomatik oynatma izni için sessiz başlat
    activeVideo.currentTime = 0;
    activeVideo.play().catch(() => {}); // otomatik oynatma engellenirse sessizce yut, kullanıcı play'e basar
  }
}

document.querySelectorAll('.work-card').forEach(card => {
  card.addEventListener('click', () => openWorkModal(card));
});

if (overlay) {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWorkModal(); });
  modal.querySelector('.work-modal-close').addEventListener('click', closeWorkModal);
  modal.querySelector('.gallery-nav.prev').addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + currentSlideCount) % currentSlideCount;
    updateGalleryPosition();
  });
  modal.querySelector('.gallery-nav.next').addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % currentSlideCount;
    updateGalleryPosition();
  });
  modal.querySelectorAll('.work-tab-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.work-tab-btn').forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.work-tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      modal.querySelectorAll('.work-tab-panel')[i].classList.add('active');
    });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWorkModal(); });
}

// ============ LANG TOGGLE (skeleton — TR default) ============
const langToggle = document.getElementById('langToggle');
let lang = 'tr';
if (langToggle) {
  langToggle.addEventListener('click', () => {
    lang = lang === 'tr' ? 'en' : 'tr';
    langToggle.querySelector('span').textContent = lang.toUpperCase();
    document.querySelectorAll('[data-tr]').forEach(el => {
      el.textContent = lang === 'tr' ? el.dataset.tr : (el.dataset.en || el.dataset.tr);
    });
  });

  // ============ WORK ACCORDION ============
document.querySelectorAll('.work-accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.closest('.work-accordion-item');
    const isOpen = item.classList.contains('is-open');

    // Diğerlerini kapat (isteğe bağlı)
    document.querySelectorAll('.work-accordion-item.is-open').forEach(openItem => {
      if (openItem !== item) openItem.classList.remove('is-open');
    });

    item.classList.toggle('is-open');
  });
});
// ============ GALERİ (KAYDIRMA) ============
document.querySelectorAll('.work-gallery-slider').forEach(slider => {
  const track = slider.querySelector('.work-gallery-track');
  const images = track.querySelectorAll('img');
  const prevBtn = slider.querySelector('.gallery-btn.prev');
  const nextBtn = slider.querySelector('.gallery-btn.next');
  const dotsContainer = slider.closest('.work-accordion-gallery').querySelector('.gallery-dots');
  let currentIndex = 0;
  const totalSlides = images.length;

  // Noktaları oluştur
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.dataset.index = i;
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  }

  function goTo(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Noktaları güncelle
    dotsContainer.querySelectorAll('span').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  // Klavye ile kontrol
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });
});
}