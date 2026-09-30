/* ═══════════════════════════════════════════════
   SEMILLERO — Interactive Engine
   Mycelium Canvas + Scroll Animations + Nav
   ═══════════════════════════════════════════════ */

// ── MYCELIUM NETWORK CANVAS ───────────────────
(function initMyceliumCanvas() {
  const canvas = document.getElementById('myceliumCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let nodes = [];
  let branches = [];
  let mouse = { x: -9999, y: -9999 };
  let animFrame;

  const CONFIG = {
    nodeCount: 90,
    maxBranches: 120,
    connectionDist: 160,
    mouseRadius: 200,
    growthSpeed: 0.4,
    nodeSize: 2,
    lineWidth: 0.6,
    baseColor: { r: 57, g: 255, b: 127 },
    secondColor: { r: 0, g: 229, b: 200 },
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes = [];
    for (let i = 0; i < CONFIG.nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * CONFIG.nodeSize + 0.5,
        pulse: Math.random() * Math.PI * 2,
        type: Math.random() > 0.7 ? 'secondary' : 'primary',
      });
    }
  }

  function spawnBranch(from, to) {
    if (branches.length >= CONFIG.maxBranches) return;
    branches.push({
      x1: from.x, y1: from.y,
      x2: from.x, y2: from.y,
      tx: to.x, ty: to.y,
      progress: 0,
      life: 1,
      color: from.type === 'secondary' ? CONFIG.secondColor : CONFIG.baseColor,
    });
  }

  function update() {
    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      node.pulse += 0.02;

      // Boundary bounce
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      // Mouse interaction: gentle push
      const dx = node.x - mouse.x;
      const dy = node.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius) {
        const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * 0.02;
        node.vx += dx / dist * force;
        node.vy += dy / dist * force;
      }

      // Damping
      node.vx *= 0.998;
      node.vy *= 0.998;
    });

    // Grow branches
    branches.forEach(b => {
      if (b.progress < 1) {
        b.progress += CONFIG.growthSpeed * 0.05;
        b.x2 = b.x1 + (b.tx - b.x1) * b.progress;
        b.y2 = b.y1 + (b.ty - b.y1) * b.progress;
      }
      b.life -= 0.003;
    });

    // Remove dead branches
    branches = branches.filter(b => b.life > 0);

    // Spawn new branches between close nodes (limited rate)
    if (Math.random() < 0.15) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONFIG.connectionDist && Math.random() < 0.02) {
            spawnBranch(nodes[i], nodes[j]);
          }
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw branches
    branches.forEach(b => {
      const alpha = b.life * 0.5;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${alpha})`;
      ctx.lineWidth = CONFIG.lineWidth;
      ctx.stroke();
    });

    // Draw connection lines between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDist) {
          const alpha = (1 - dist / CONFIG.connectionDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(57, 255, 127, ${alpha})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(node => {
      const pulseSize = node.size + Math.sin(node.pulse) * 0.5;
      const color = node.type === 'secondary' ? CONFIG.secondColor : CONFIG.baseColor;
      
      // Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseSize * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.03)`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
      ctx.fill();
    });
  }

  function animate() {
    update();
    draw();
    animFrame = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    resize();
    createNodes();
  });

  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  resize();
  createNodes();
  animate();
})();


// ── SCROLL ANIMATIONS (Intersection Observer) ──
(function initScrollAnimations() {
  const sections = document.querySelectorAll('.section');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
  });

  sections.forEach(s => observer.observe(s));
})();


// ── STAT COUNTER ANIMATION ────────────────────
(function initStatCounters() {
  const stats = document.querySelectorAll('.stat-number');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        stats.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'), 10);
          animateCounter(stat, target);
        });
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);

  function animateCounter(el, target) {
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current);
    }, 25);
  }
})();


// ── NAVIGATION SCROLL BEHAVIOR ────────────────
(function initNavigation() {
  const nav = document.getElementById('mainNav');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  // Scroll detection for nav bg
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
  }

  // Close mobile menu on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
})();


// ── PARALLAX EFFECTS ON HERO ──────────────────
(function initParallax() {
  const hero = document.querySelector('.hero-content');
  if (!hero) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      hero.style.transform = `translateY(${scrolled * 0.15}px)`;
      hero.style.opacity = 1 - scrolled / (window.innerHeight * 0.8);
    }
  });
})();


// ── TYPING EFFECT FOR TITLE (subtle) ──────────
(function initTextEffects() {
  // Active nav link highlight based on scroll
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section[id]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.style.color = '';
      if (link.getAttribute('href') === `#${current}`) {
        link.style.color = 'var(--bio-primary)';
      }
    });
  });
})();


// ── TECH CARD MOUSE GLOW FOLLOW ───────────────
(function initCardGlow() {
  document.querySelectorAll('.tech-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const glow = card.querySelector('.tech-card-glow');
      if (glow) {
        glow.style.left = `${x - rect.width}px`;
        glow.style.top = `${y - rect.height}px`;
      }
    });
  });
})();
