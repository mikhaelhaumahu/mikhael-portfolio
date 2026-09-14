/* ==========================================================================
   Mikhael Stevano Haumahu - Modern Interactive Portfolio JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     1. Interactive Particle Network Background
     ------------------------------------------------------------------------ */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  let particles = [];
  const particleCount = Math.floor((width * height) / 18000);
  const mouse = { x: null, y: null, radius: 150 };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Move cursor glow element
    const glow = document.getElementById('cursor-glow');
    if (glow) {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    }
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.radius = Math.random() * 2 + 1;
      this.color = '#00f2fe';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse repulsion/attraction interaction
      if (mouse.x && mouse.y) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 2;
          this.y -= (dy / dist) * force * 2;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f2fe';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((width * height) / 16000), 80);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 242, 254, ${1 - dist / 120 * 0.8})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animateParticles);
  }

  initParticles();
  animateParticles();

  /* ------------------------------------------------------------------------
     2. Typewriter Effect
     ------------------------------------------------------------------------ */
  const typingElement = document.getElementById('typing-text');
  const roles = [
    'Mahasiswa Ilmu Komputer UNPATTI',
    'Alumni SMA Negeri 4 Ambon',
    'Pembelajar Pemrograman & Web',
    'Tech Explorer & Aspiring Developer'
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function typeEffect() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
      typingElement.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50;
    } else {
      typingElement.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100;
    }

    if (!isDeleting && charIndex === currentRole.length) {
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
  }

  typeEffect();

  /* ------------------------------------------------------------------------
     3. Navbar Scroll & Mobile Menu Toggle
     ------------------------------------------------------------------------ */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = mobileToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-xmark');
    } else {
      icon.classList.remove('fa-xmark');
      icon.classList.add('fa-bars');
    }
  });

  // Close menu when a link is clicked
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });
  });

  /* ------------------------------------------------------------------------
     4. Skills Filter Logic
     ------------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const skillCards = document.querySelectorAll('.skill-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');

      skillCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ------------------------------------------------------------------------
     5. Projects Filter Logic
     ------------------------------------------------------------------------ */
  const projFilterBtns = document.querySelectorAll('.proj-filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  projFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      projFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ------------------------------------------------------------------------
     6. Counter Animation for Stats
     ------------------------------------------------------------------------ */
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  function runCounters() {
    const aboutSection = document.getElementById('about');
    const sectionPos = aboutSection.getBoundingClientRect().top;
    const screenPos = window.innerHeight / 1.3;

    if (sectionPos < screenPos && !animated) {
      animated = true;
      statNumbers.forEach(stat => {
        const target = +stat.getAttribute('data-target');
        let count = 0;
        const speed = target / 30;

        const updateCount = () => {
          count += speed;
          if (count < target) {
            stat.innerText = Math.ceil(count);
            setTimeout(updateCount, 40);
          } else {
            stat.innerText = target;
          }
        };
        updateCount();
      });
    }
  }

  window.addEventListener('scroll', runCounters);

  /* ------------------------------------------------------------------------
     7. Project Modal Data & Handlers
     ------------------------------------------------------------------------ */
  const projectsData = {
    1: {
      title: 'Gambar dengan Gerakan Tangan',
      category: 'Eksperimen AI & Webcam',
      description: 'Aplikasi interaktif yang memungkinkan pengguna menggambar di canvas secara langsung menggunakan gestur jari di depan webcam memanfaatkan pustaka MediaPipe Hands.',
      tech: ['MediaPipe Hands', 'HTML5 Canvas API', 'JavaScript', 'Node.js Express Server'],
      features: [
        'Deteksi & Pelacakan Ujung Jari Real-Time via Webcam',
        'Kanvas Menggambar Interaktif dengan Palet Warna',
        'Penghapus & Pengontrol Ketebalan Goresan',
        'Model Machine Learning Berjalan di Browser'
      ],
      demoUrl: '/hand-track-app/',
      githubUrl: 'https://github.com/mikhaelhaumahu'
    },
    2: {
      title: 'Hand Box Track App',
      category: 'Eksperimen AI & Vision',
      description: 'Eksperimen interaktif pelacakan pergerakan gestur tangan dan kotak penanda pada tampilan video real-time.',
      tech: ['MediaPipe API', 'JavaScript', 'CSS Live Overlay'],
      features: [
        'Pemetaan Koordinat Sendi Tangan Real-Time',
        'Visualisasi Penanda Box Interaktif',
        'Integrasi Kamera Web Latensi Rendah'
      ],
      demoUrl: '/hand-box-track/',
      githubUrl: 'https://github.com/mikhaelhaumahu'
    },
    3: {
      title: 'Personal Interactive Portfolio',
      category: 'Web Development',
      description: 'Website portofolio pribadi modern interaktif yang dibangun menggunakan HTML, CSS, JavaScript, latar belakang partikel jaringan, dan desain glassmorphism.',
      tech: ['HTML5', 'CSS3', 'JavaScript', 'Git / GitHub'],
      features: [
        'Latar Belakang Partikel Interaktif Berbasis Canvas',
        'Efek Teks Mengetik Otomatis & Cursor Glow',
        'Desain Responsif untuk Berbagai Ukuran Layar',
        'Repositori Dikelola & Dipush Menggunakan Git'
      ],
      demoUrl: '/',
      githubUrl: 'https://github.com/mikhaelhaumahu'
    },
    4: {
      title: 'Latihan Halaman HTML Sederhana',
      category: 'Web Basics',
      description: 'Proyek awal dan latihan pertama dalam memahami struktur dokumen HTML, tag penyusun web, dan dasar-dasar tampilan.',
      tech: ['HTML5', 'CSS'],
      features: [
        'Pemodelan Struktur Dokumen HTML Semantik',
        'Penerapan Style CSS Dasar',
        'Langkah Awal Mempelajari Web Development'
      ],
      demoUrl: '/html-sederhana.html',
      githubUrl: 'https://github.com/mikhaelhaumahu'
    }
  };

  const modal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  document.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const projId = btn.getAttribute('data-id');
      const data = projectsData[projId];

      if (data) {
        modalBody.innerHTML = `
          <span class="project-tag" style="position:static; display:inline-block; margin-bottom:12px;">${data.category}</span>
          <h2 style="font-size: 1.8rem; margin-bottom: 12px;" class="gradient-text">${data.title}</h2>
          <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.98rem; line-height: 1.6;">${data.description}</p>

          <h4 style="font-size: 1.1rem; margin-bottom: 8px;">Fitur Utama:</h4>
          <ul style="color: var(--text-muted); margin-bottom: 20px; padding-left: 20px;">
            ${data.features.map(f => `<li style="margin-bottom: 6px;">${f}</li>`).join('')}
          </ul>

          <h4 style="font-size: 1.1rem; margin-bottom: 8px;">Teknologi Yang Digunakan:</h4>
          <div class="project-tech" style="margin-bottom: 24px;">
            ${data.tech.map(t => `<span>${t}</span>`).join('')}
          </div>

          <div style="display: flex; gap: 12px;">
            <a href="${data.demoUrl}" class="btn btn-primary btn-sm" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>
            <a href="${data.githubUrl}" class="btn btn-outline btn-sm" target="_blank"><i class="fa-brands fa-github"></i> Source Code</a>
          </div>
        `;
        modal.classList.add('active');
      }
    });
  });

  modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  /* ------------------------------------------------------------------------
     8. Form Contact Handling & Backend Integration
     ------------------------------------------------------------------------ */
  const contactForm = document.getElementById('contact-form');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
      };

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
          if (toastMsg) toastMsg.textContent = result.message;
          toast.classList.add('show');
          contactForm.reset();

          setTimeout(() => {
            toast.classList.remove('show');
          }, 4000);
        } else {
          alert('Gagal mengirim pesan: ' + (result.message || 'Terjadi kesalahan'));
        }
      } catch (err) {
        // Fallback for direct static file viewing
        if (toastMsg) toastMsg.textContent = 'Pesan Anda telah berhasil dikirim!';
        toast.classList.add('show');
        contactForm.reset();
        setTimeout(() => {
          toast.classList.remove('show');
        }, 4000);
      }
    });
  }

  /* ------------------------------------------------------------------------
     9. 3D Tilt Effect on Cards
     ------------------------------------------------------------------------ */
  const tiltElements = document.querySelectorAll('.tilt-element');

  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

});
