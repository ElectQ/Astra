import { createUpdatesRenderer } from './assets/official-scene.js';

const nav = document.querySelector('#navigation');
const menu = document.querySelector('.menu-toggle');
const groups = [...nav.querySelectorAll('details')];
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
groups.forEach(group => group.addEventListener('toggle', () => {
  if (group.open) groups.forEach(other => { if (other !== group) other.open = false; });
}));
function closeMenu() {
  groups.forEach(group => { group.open = false; });
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', event => {
  if (!event.target.closest('.header') || event.target.closest('nav a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const group = groups.find(item => item.open);
  if (group) group.querySelector('summary').focus();
  else if (nav.classList.contains('open')) menu.focus();
  closeMenu();
});
document.querySelector('#year').textContent = new Date().getFullYear();

const scene = document.querySelector('.scene');
const canvas = document.querySelector('#cosmos');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = motion.matches;
let visible = true;
let ready = false;
let frame = 0;
let last = 0;
let elapsed = motion.matches ? 9 : 0;
let renderer;
const profile = {
  tier: 2,
  canUseWebGL: () => true,
  getPostprocessing: () => innerWidth < 720 ? 'selective' : 'full',
  getAntialias: () => false,
  shouldUseContinuousMotion: () => true,
  getMaxParticleCount: () => innerWidth < 720 ? 6000 : 12000,
  getDpr: () => [1, 1.5],
};
function draw(now) {
  frame = 0;
  if (last) elapsed += Math.min((now - last) / 1000, .05);
  last = now;
  renderer.draw(elapsed);
  if (!paused && visible && !document.hidden) frame = requestAnimationFrame(draw);
}
function run() {
  cancelAnimationFrame(frame);
  last = 0;
  if (!ready) return;
  renderer.draw(elapsed);
  if (!paused && visible && !document.hidden) frame = requestAnimationFrame(draw);
}
function resize() {
  if (!ready) return;
  const top = document.querySelector('.header').offsetHeight;
  const bottom = document.querySelector('.scene-title').offsetHeight + 120;
  const height = Math.max(260, scene.clientHeight - top - bottom);
  renderer.resize(scene.clientWidth, scene.clientHeight, {
    height,
    centerY: top + height / 2,
  });
  run();
}
motion.addEventListener('change', () => {
  paused = motion.matches;
  if (paused) elapsed = Math.max(9, elapsed);
  run();
});
document.querySelectorAll('[data-explore]').forEach(button => button.addEventListener('click', () => {
  scene.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' });
}));
let pointerX = null;
canvas.addEventListener('pointerdown', event => {
  if (!ready || paused || motion.matches) return;
  pointerX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (pointerX === null) return;
  renderer.rotate((event.clientX - pointerX) * .005);
  pointerX = event.clientX;
});
function release() {
  pointerX = null;
  renderer?.resetRotation();
}
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
new ResizeObserver(resize).observe(scene);
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; run(); }).observe(scene);
document.addEventListener('visibilitychange', run);
try {
  renderer = createUpdatesRenderer(canvas, profile);
  await renderer.ready;
  ready = true;
  scene.dataset.scene = 'ready';
  resize();
} catch (error) {
  renderer?.dispose();
  scene.dataset.scene = 'unavailable';
  document.querySelector('.live').textContent = 'WEBGL UNAVAILABLE';
  console.error('Scene initialization failed:', error);
}
window.addEventListener('pagehide', event => {
  if (!event.persisted) { cancelAnimationFrame(frame); renderer?.dispose(); }
});
