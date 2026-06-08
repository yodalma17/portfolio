/* =========================================================
   YORMAN ALVAREZ — PORTFOLIO  ·  main.js
   Three.js shader background · Lenis smooth scroll
   GSAP ScrollTrigger reveals · custom cursor · counters
   ========================================================= */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

/* ---------- tiny text splitter (chars / words) ---------- */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  const frag = document.createDocumentFragment();
  [...text].forEach(ch => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    frag.appendChild(span);
  });
  el.appendChild(frag);
  return el.querySelectorAll('.char');
}
function splitWords(el) {
  const words = el.textContent.split(/\s+/);
  el.textContent = '';
  const frag = document.createDocumentFragment();
  words.forEach((w, i) => {
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-block';
    wrap.style.overflow = 'hidden';
    wrap.style.paddingBottom = '0.12em'; // keep descenders (g, p, y) from clipping
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = w;
    wrap.appendChild(span);
    frag.appendChild(wrap);
    if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
  });
  el.appendChild(frag);
  return el.querySelectorAll('.word');
}

/* =========================================================
   1. WEBGL SHADER BACKGROUND (Three.js)
   Flowing aurora gradient driven by fbm noise + mouse
   ========================================================= */
function initBackground() {
  if (!window.THREE) return;
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    u_time:  { value: 0 },
    u_res:   { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_scroll:{ value: 0 },
  };

  const frag = `
    precision highp float;
    uniform float u_time;
    uniform vec2  u_res;
    uniform vec2  u_mouse;
    uniform float u_scroll;

    // hash / noise / fbm
    vec2 hash(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      vec2 u=f*f*(3.0-2.0*f);
      return mix( mix(dot(hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),
                      dot(hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),
                  mix(dot(hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),
                      dot(hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x), u.y);
    }
    float fbm(vec2 p){
      float v=0.0, a=0.5;
      for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      vec2 p = uv;
      p.x *= u_res.x / u_res.y;

      float t = u_time * 0.06;
      vec2 m = (u_mouse - 0.5) * 0.6;

      // domain-warped fbm
      vec2 q = vec2(fbm(p + t + m), fbm(p + vec2(5.2,1.3) - t));
      float n = fbm(p + q*1.8 + m + t*0.5);

      // palette
      vec3 violet = vec3(0.486, 0.361, 1.0);
      vec3 cyan   = vec3(0.133, 0.890, 1.0);
      vec3 pink   = vec3(1.0, 0.361, 0.784);
      vec3 deep   = vec3(0.024, 0.027, 0.051);

      vec3 col = deep;
      col = mix(col, violet, smoothstep(0.15, 0.75, n));
      col = mix(col, cyan,   smoothstep(0.45, 0.95, q.x));
      col = mix(col, pink,   smoothstep(0.55, 1.05, q.y*0.9));

      // central glow following mouse
      float d = distance(uv, u_mouse);
      col += violet * smoothstep(0.55, 0.0, d) * 0.18;

      // overall darkening so text reads; fade with scroll
      float vig = smoothstep(1.1, 0.2, length(uv-0.5));
      col *= 0.30 + 0.55*vig;
      col *= 1.0 - u_scroll*0.25;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `void main(){ gl_Position = vec4(position,1.0); }`,
    fragmentShader: frag,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const targetMouse = { x: 0.5, y: 0.5 };
  window.addEventListener('pointermove', e => {
    targetMouse.x = e.clientX / window.innerWidth;
    targetMouse.y = 1.0 - e.clientY / window.innerHeight;
  });
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  function render() {
    uniforms.u_time.value = clock.getElapsedTime();
    uniforms.u_mouse.value.x += (targetMouse.x - uniforms.u_mouse.value.x) * 0.04;
    uniforms.u_mouse.value.y += (targetMouse.y - uniforms.u_mouse.value.y) * 0.04;
    const max = document.body.scrollHeight - window.innerHeight;
    uniforms.u_scroll.value = max > 0 ? window.scrollY / max : 0;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
}

/* =========================================================
   2. CUSTOM CURSOR
   ========================================================= */
function initCursor() {
  if (isTouch) return;
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;

  window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  (function loop(){
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    dot.style.transform  = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('[data-cursor]').forEach(el => {
    const type = el.getAttribute('data-cursor');
    el.addEventListener('mouseenter', () => ring.classList.add(type === 'view' ? 'is-view' : 'is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-view','is-hover'));
  });
}

/* =========================================================
   3. MAGNETIC BUTTONS
   ========================================================= */
function initMagnetic() {
  if (isTouch) return;
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      el.style.transform = `translate(${x*0.3}px, ${y*0.4}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* =========================================================
   4. TILT (about card)
   ========================================================= */
function initTilt() {
  if (isTouch) return;
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - 0.5;
      const py = (e.clientY - r.top)/r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px*8}deg) rotateX(${-py*8}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'; });
  });
}

/* =========================================================
   5. STACK CARD spotlight
   ========================================================= */
function initSpotlight() {
  document.querySelectorAll('.stack__cat').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* =========================================================
   6. PRELOADER
   ========================================================= */
function runPreloader(onDone) {
  const fill = document.getElementById('preloader-fill');
  const count = document.getElementById('preloader-count');
  const pre = document.getElementById('preloader');
  const nameChars = splitChars(document.querySelector('.preloader__name'));

  if (window.gsap) {
    gsap.from(nameChars, { yPercent: 110, opacity: 0, stagger: 0.03, duration: 0.7, ease: 'power3.out' });
  }

  let p = 0;
  const obj = { v: 0 };
  const tick = setInterval(() => {
    p = Math.min(100, p + Math.random()*18);
    fill.style.width = p + '%';
    count.textContent = Math.floor(p);
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        if (window.gsap) {
          gsap.to(pre, { yPercent: -100, duration: 1, ease: 'expo.inOut',
            onComplete: () => { pre.style.display = 'none'; onDone && onDone(); } });
        } else { pre.style.display = 'none'; onDone && onDone(); }
      }, 250);
    }
  }, 130);
}

/* =========================================================
   7. LENIS SMOOTH SCROLL + GSAP sync
   ========================================================= */
let lenis;
function initSmoothScroll() {
  if (prefersReduced || typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.15, smoothWheel: true,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });

  lenis.on('scroll', () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
  function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // anchor links via lenis
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -10 }); closeMenu(); }
    });
  });
}

/* =========================================================
   8. GSAP ENTRANCE + SCROLL ANIMATIONS
   ========================================================= */
function initAnimations() {
  if (!window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // split hero/contact title lines into chars
  document.querySelectorAll('[data-split]').forEach(el => {
    if (el.closest('.preloader')) return;
    el._chars = splitChars(el);
  });
  document.querySelectorAll('[data-split-words]').forEach(el => { el._words = splitWords(el); });

  // HERO timeline (on load)
  const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power4.out' } });
  document.querySelectorAll('.hero__title [data-split]').forEach((line) => {
    tl.from(line._chars, { yPercent: 120, opacity: 0, duration: 1, stagger: 0.025 }, '-=0.75');
  });
  tl.to('.hero__tagline', { opacity: 1, y: 0, duration: 0.8 }, '-=0.9');
  tl.to('.hero__role',    { opacity: 1, y: 0, duration: 0.8 }, '-=0.7');
  tl.to('.hero__desc',    { opacity: 1, y: 0, duration: 0.8 }, '-=0.7');
  gsap.set(['.hero__tagline','.hero__role','.hero__desc'], { y: 24, opacity: 0 });
  tl.from('.hero__tags span', { y: 20, opacity: 0, stagger: 0.06, duration: 0.6 }, '-=0.6');
  tl.from('.hero__scroll', { opacity: 0, duration: 0.8 }, '-=0.3');

  // generic reveal-up
  gsap.utils.toArray('.reveal-up').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // data-reveal blocks
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // section titles word reveal
  gsap.utils.toArray('[data-split-words]').forEach(el => {
    gsap.from(el._words, { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.04, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // contact title chars
  document.querySelectorAll('.contact__title [data-split]').forEach(line => {
    gsap.from(line._chars, { yPercent: 120, opacity: 0, duration: 1, stagger: 0.02, ease: 'power4.out',
      scrollTrigger: { trigger: '.contact', start: 'top 70%' } });
  });

  // stat bar trigger
  gsap.utils.toArray('.stat').forEach(s => {
    ScrollTrigger.create({ trigger: s, start: 'top 85%', onEnter: () => s.classList.add('in') });
  });

  // marquee scroll-velocity drift
  const track = document.getElementById('marquee');
  if (track) {
    const clone = track.innerHTML; track.innerHTML += clone; // seamless
    let mpos = 0;
    gsap.ticker.add(() => { mpos -= 0.6; if (Math.abs(mpos) > track.scrollWidth/2) mpos = 0; track.style.transform = `translateX(${mpos}px)`; });
  }

  // timeline fill draw
  const tlFill = document.getElementById('timeline-fill');
  if (tlFill) {
    gsap.to(tlFill, { height: '100%', ease: 'none',
      scrollTrigger: { trigger: '#timeline', start: 'top 60%', end: 'bottom 70%', scrub: true } });
  }

  // subtle parallax on hero title while scrolling
  gsap.to('.hero__title', { yPercent: 18, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* =========================================================
   9. COUNTERS
   ========================================================= */
function initCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.getAttribute('data-count');
    const suffix = el.getAttribute('data-suffix') || '';
    const run = () => {
      const obj = { v: 0 };
      if (window.gsap) {
        gsap.to(obj, { v: target, duration: 2, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.floor(obj.v) + suffix; } });
      } else { el.textContent = target + suffix; }
    };
    if (window.ScrollTrigger) {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: run });
    } else { run(); }
  });
}

/* =========================================================
   10. NAV + PROGRESS + MENU
   ========================================================= */
function closeMenu() {
  document.getElementById('mobile-menu')?.classList.remove('is-open');
  document.getElementById('burger')?.classList.remove('is-open');
}
function initNav() {
  const nav = document.getElementById('nav');
  const prog = document.getElementById('scroll-progress');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobile-menu');

  burger?.addEventListener('click', () => {
    menu.classList.toggle('is-open');
    burger.classList.toggle('is-open');
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  const onScroll = () => {
    const max = document.body.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    prog.style.width = pct + '%';
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =========================================================
   BOOT
   ========================================================= */
document.getElementById('year').textContent = new Date().getFullYear();

initBackground();
initCursor();
initNav();

// Verification mode (?verify): skip preloader, reveal everything, fill counters.
// Used only to inspect layout in a headless screenshot.
if (location.search.includes('verify')) {
  document.documentElement.classList.add('verify');
  document.getElementById('preloader')?.remove();
  document.querySelectorAll('[data-count]').forEach(el => {
    el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
  });
} else {
  runPreloader(() => {
    initSmoothScroll();
    initAnimations();
    initCounters();
    initMagnetic();
    initTilt();
    initSpotlight();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
}
