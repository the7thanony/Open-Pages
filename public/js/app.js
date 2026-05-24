/**
 * Open Pages — Client-Side JavaScript
 * Handles animations, interactions, and form validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Mobile Menu Toggle ─────────────────
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      mobileToggle.classList.toggle('active');
    });
  }

  // ── User Dropdown ──────────────────────
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const userMenu = document.getElementById('userMenu');
  if (userAvatarBtn && userMenu) {
    userAvatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) userMenu.classList.remove('open');
    });
  }

  // ── Flash Message Auto-Dismiss ─────────
  document.querySelectorAll('.flash').forEach((flash) => {
    const closeBtn = flash.querySelector('.flash-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        flash.style.opacity = '0';
        flash.style.transform = 'translateY(-10px)';
        setTimeout(() => flash.remove(), 300);
      });
    }
    setTimeout(() => {
      if (flash.parentNode) {
        flash.style.opacity = '0';
        flash.style.transform = 'translateY(-10px)';
        setTimeout(() => flash.remove(), 300);
      }
    }, 5000);
  });

  // ── Character Count ────────────────────
  const titleInput = document.getElementById('titleInput');
  const titleCount = document.getElementById('titleCharCount');
  if (titleInput && titleCount) {
    const update = () => { titleCount.textContent = `${titleInput.value.length}/300`; };
    titleInput.addEventListener('input', update);
    update();
  }

  const contentInput = document.getElementById('contentInput');
  const contentCount = document.getElementById('contentCharCount');
  if (contentInput && contentCount) {
    const update = () => {
      const len = contentInput.value.length;
      contentCount.textContent = `${len} character${len !== 1 ? 's' : ''}`;
    };
    contentInput.addEventListener('input', update);
    update();
  }

  // ── Fade-In on Scroll (Intersection Observer) ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach((el) => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
  // Immediately play animations for elements already visible
  document.querySelectorAll('.fade-in').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.style.animationPlayState = 'running';
    }
  });

  // ── Smooth scroll for anchor links ─────
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
