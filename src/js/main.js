/**
 * ===================================================================
 * MOTOR PRINCIPAL - BODA NAIARA & GUILLERMO
 * ===================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
  initParticleCanvas();
  initScrollAnimations();
  initNavigation();
  initBackToTop();
  initCopyToClipboard();
  initAtavioGallery();
  initDynamicContent();
});

/**
 * 1. POBLAR CONTENIDO DINÁMICO DESDE CONFIG
 */
function initDynamicContent() {
  if (typeof WEDDING_CONFIG === "undefined") return;
  const cfg = WEDDING_CONFIG;

  document.querySelectorAll("[data-bind]").forEach(el => {
    const key = el.getAttribute("data-bind");
    const val = getNestedValue(cfg, key);
    if (val !== undefined) {
      if (el.tagName === "A" && (key.includes("Url") || key.includes("maps"))) {
        el.href = val;
      } else if (el.tagName === "IFRAME" && key.includes("Url")) {
        el.src = val;
      } else {
        el.textContent = val;
      }
    }
  });

  // Renderizar Cronograma / Timeline
  const timelineContainer = document.getElementById("timeline-list");
  if (timelineContainer && cfg.timeline) {
    timelineContainer.innerHTML = cfg.timeline.map((item, idx) => `
      <div class="timeline-step reveal" style="--delay: ${idx * 0.1}s">
        <div class="step-rune-badge" aria-hidden="true">${item.rune}</div>
        <div class="step-content">
          <div class="step-time">${item.time}</div>
          <h4 class="step-title">${item.title}</h4>
          <p class="step-desc">${item.desc}</p>
        </div>
      </div>
    `).join("");
  }
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * 2. CUENTA REGRESIVA (COUNTDOWN)
 */
function initCountdown() {
  if (typeof WEDDING_CONFIG === "undefined") return;
  const targetCfg = WEDDING_CONFIG.weddingDate;
  const targetDate = new Date(
    targetCfg.year,
    targetCfg.month - 1,
    targetCfg.day,
    targetCfg.hours || 12,
    targetCfg.minutes || 0
  ).getTime();

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      const banner = document.getElementById("countdown-box");
      if (banner) {
        banner.innerHTML = `<div class="countdown-ended" style="font-size: 1.1rem; color: var(--gold-light);">¡El gran día ha llegado! Que los dioses bendigan a Naïara & Guillermo</div>`;
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days);
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
    if (minsEl) minsEl.textContent = String(mins).padStart(2, "0");
    if (secsEl) secsEl.textContent = String(secs).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

/**
 * 3. CANVAS DE BRASAS FLOTANTES
 */
function initParticleCanvas() {
  const canvas = document.getElementById("ember-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const isMobile = width < 768;
  const particleCount = isMobile ? 16 : 32;
  const particles = [];

  class Ember {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 2 + 0.6;
      this.speedY = Math.random() * 0.6 + 0.25;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.6 + 0.25;
      this.decay = Math.random() * 0.003 + 0.001;
      const colors = ["#d4af37", "#f39c12", "#e67e22", "#f1c40f"];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
      this.y -= this.speedY;
      this.pulse += 0.02;
      this.x += Math.sin(this.pulse) * 0.3 + this.speedX;
      this.opacity -= this.decay;

      if (this.y < -10 || this.opacity <= 0 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Ember());
  }

  let animationFrameId;
  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    animationFrameId = requestAnimationFrame(animate);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrameId);
    } else {
      animate();
    }
  });

  animate();
}

/**
 * 4. ANIMACIONES AL HACER SCROLL
 */
function initScrollAnimations() {
  const reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    reveals.forEach(el => el.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.08
    }
  );

  reveals.forEach(el => observer.observe(el));
}

/**
 * 5. NAVEGACIÓN Y MENÚ MÓVIL
 */
function initNavigation() {
  const navbar = document.getElementById("viking-navbar");
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const backdrop = document.getElementById("nav-backdrop");

  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("open");
    navLinks.classList.toggle("open", isOpen);
    menuToggle.classList.toggle("active", isOpen);
    if (backdrop) backdrop.classList.toggle("active", isOpen);
    document.body.classList.toggle("menu-locked", isOpen);
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => toggleMenu());

    if (backdrop) {
      backdrop.addEventListener("click", () => toggleMenu(false));
    }

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => toggleMenu(false));
    });
  }
}

/**
 * 6. BOTÓN FLOTANTE "BACK TO TOP"
 */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 320) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  }, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/**
 * 7. COPIAR AL PORTAPAPELES
 */
function initCopyToClipboard() {
  const copyButtons = document.querySelectorAll("[data-copy-target]");
  const toast = document.getElementById("copy-toast");

  copyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const text = targetEl.getAttribute("data-copy-val") || targetEl.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        const customMsg = btn.getAttribute("data-toast-msg") || "¡Copiado al portapapeles!";
        showToast(toast, customMsg);
        btn.classList.add("copied");
        setTimeout(() => btn.classList.remove("copied"), 2000);
      }).catch(err => {
        console.error("No se pudo copiar", err);
      });
    });
  });
}

function showToast(toastEl, message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2800);
}

/**
 * 8. GALERÍA DE ATAVÍO
 */
function initAtavioGallery() {
  const lightbox = document.getElementById("atavio-lightbox");
  const lightboxImage = document.getElementById("atavio-lightbox-image");
  const categoryLabel = document.getElementById("atavio-lightbox-title");
  const counter = document.getElementById("atavio-lightbox-counter");
  const previousButton = lightbox?.querySelector(".atavio-lightbox-prev");
  const nextButton = lightbox?.querySelector(".atavio-lightbox-next");
  const thumbnails = document.querySelectorAll(".atavio-cat-card");

  if (!lightbox || !lightboxImage || !categoryLabel || !counter || !previousButton || !nextButton) return;

  let images = [];
  let currentIndex = 0;
  let lastTrigger = null;

  const renderImage = () => {
    const image = images[currentIndex];
    if (!image) return;
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    counter.textContent = `${currentIndex + 1} de ${images.length}`;
  };

  const close = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-locked");
    lightboxImage.removeAttribute("src");
    if (lastTrigger) lastTrigger.focus();
  };

  const move = (offset) => {
    currentIndex = (currentIndex + offset + images.length) % images.length;
    renderImage();
  };

  thumbnails.forEach(category => {
    const categoryImages = [...category.querySelectorAll(".atavio-gallery-thumb img")];
    category.querySelectorAll(".atavio-gallery-thumb").forEach((thumbnail, index) => {
      thumbnail.addEventListener("click", () => {
        images = categoryImages;
        currentIndex = index;
        lastTrigger = thumbnail;
        categoryLabel.textContent = category.dataset.galleryCategory || "";
        renderImage();
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("gallery-locked");
        lightbox.querySelector(".atavio-lightbox-close").focus();
      });
    });
  });

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  lightbox.querySelectorAll("[data-lightbox-close]").forEach(element => {
    element.addEventListener("click", close);
  });
  document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });
}
