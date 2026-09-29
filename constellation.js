import { createCloudMesh } from './assets/cloud-mesh.js?v=2';
const labs = [
  ['OpenAI', 'openai', 22, 17, '#91d9c1', 'https://openai.com/', 'ChatGPT', 'https://chatgpt.com/'],
  ['Google DeepMind', 'deepmind', 50, 10, '#8db8ff', 'https://deepmind.google/', 'Gemini', 'https://gemini.google.com/'],
  ['Anthropic', 'anthropic', 78, 17, '#e6ad8c', 'https://www.anthropic.com/', 'Claude', 'https://claude.ai/'],
  ['DeepSeek', 'deepseek', 90, 35, '#83a1ff', 'https://www.deepseek.com/en/', 'DeepSeek Chat', 'https://chat.deepseek.com/'],
  ['Z.ai', 'zai', 91, 57, '#c1d58d', 'https://z.ai/', 'Z.ai Chat', 'https://chat.z.ai/'],
  ['MiniMax', 'minimax', 78, 78, '#f0a6c8', 'https://www.minimax.io/', 'Hailuo', 'https://hailuoai.video/'],
  ['Qwen', 'qwen', 57, 88, '#b7a0f8', 'https://qwen.ai/', 'Qwen Chat', 'https://chat.qwen.ai/'],
  ['xAI', 'xai', 34, 86, '#e6eaf0', 'https://x.ai/', 'Grok', 'https://grok.com/'],
  ['Hugging Face', 'huggingface', 15, 73, '#ffdc83', 'https://huggingface.co/', 'Models', 'https://huggingface.co/models'],
  ['GitHub', 'github', 9, 52, '#c6badf', 'https://github.com/', 'Explore repositories', 'https://github.com/explore'],
  ['X', 'x', 12, 32, '#e6eaf0', 'https://x.com/', 'Explore conversations', 'https://x.com/explore'],
  ['arXiv', 'arxiv', 36, 27, '#df9d99', 'https://arxiv.org/', 'Artificial intelligence', 'https://arxiv.org/list/cs.AI/recent'],
  ['Kimi', 'kimi', 65, 28, '#a7b5ff', 'https://www.kimi.com/', 'Moonshot AI', 'https://www.moonshot.ai/'],
  ['Z-Library', 'zlib', 44, 31, '#d8c48a', 'https://z-library.sk/', 'Search the library', 'https://z-library.sk/'],
];
const products = {
  openai: [['ChatGPT', 'https://chatgpt.com/'], ['API Platform', 'https://platform.openai.com/']],
  deepmind: [['Gemini', 'https://gemini.google.com/'], ['Google AI Studio', 'https://aistudio.google.com/']],
  anthropic: [['Claude', 'https://claude.ai/'], ['Claude Code', 'https://claude.com/product/claude-code']],
  deepseek: [['DeepSeek Chat', 'https://chat.deepseek.com/'], ['API Platform', 'https://platform.deepseek.com/']],
  zai: [['Z.ai Chat', 'https://chat.z.ai/'], ['API Platform', 'https://open.bigmodel.cn/']],
  minimax: [['Hailuo', 'https://hailuoai.video/'], ['MiniMax Audio', 'https://www.minimax.io/audio']],
  qwen: [['Qwen Chat', 'https://chat.qwen.ai/'], ['Open models', 'https://huggingface.co/Qwen']],
  xai: [['Grok', 'https://grok.com/'], ['API Console', 'https://console.x.ai/']],
  kimi: [['Kimi', 'https://www.kimi.com/'], ['Moonshot API', 'https://platform.moonshot.ai/']],
};
const descriptions = {
  huggingface: 'An open platform for sharing machine learning models, datasets, and interactive demos. A place to build, discover, and collaborate.',
  github: 'A home for source code and collaboration. Explore repositories, follow projects, and contribute to the software people build together.',
  x: 'A space for public conversation, live updates, and ideas exchanged across communities.',
  arxiv: 'An open repository of scholarly preprints across science and technology. Explore emerging research; preprints are not necessarily peer reviewed.',
  zlib: 'A digital library for searching and reading books and articles. Access and availability can vary by location.',
};
const map = document.querySelector('.star-map');
const stars = document.querySelector('#lab-stars');
const detail = document.querySelector('#lab-detail');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
function select(index) {
  const [name, id, , , color, url] = labs[index];
  stars.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  detail.style.setProperty('--star-color', color);
  map.style.setProperty('--selected-color', color);
  document.querySelectorAll('.lab-constellation').forEach((line, i) => line.classList.toggle('selected', i === index));
  const cta = document.querySelector('.constellation-closing .nav-cta');
  cta.href = url;
  cta.setAttribute('aria-label', `Stay curious — visit ${name} (opens in a new tab)`);
  document.querySelector('#curious-destination').textContent = `EXPLORE ${name.toUpperCase()}`;
  const content = products[id]
    ? `<div class="star-products"><span class="label">PRODUCTS & TOOLS</span><div class="star-links">${products[id].map(([title, link]) => `<a href="${link}" target="_blank" rel="noopener noreferrer">${title} ↗</a>`).join('')}</div></div>`
    : `<div class="star-description"><span class="label">ABOUT THE PLATFORM</span><p>${descriptions[id]}</p></div>`;
  detail.innerHTML = `<div><span class="label">SELECTED CONSTELLATION / ${String(index + 1).padStart(2, '0')}</span><h3>${name}</h3></div>${content}`;
}
labs.forEach(([name, id, x, y, color], index) => {
  const button = document.createElement('button');
  button.className = 'lab-star';
  button.style.cssText = `--x:${x}%;--y:${y}%;--star-color:${color};--delay:${index * -.7}s;--drift-delay:${index * -2.3}s;--drift-duration:${22 + index % 5 * 3}s`;
  button.setAttribute('aria-controls', 'lab-detail');
  button.setAttribute('aria-pressed', 'false');
  const extension = id === 'qwen' ? 'png' : ['zai', 'huggingface', 'zlib'].includes(id) ? 'svg' : 'ico';
  button.innerHTML = `<span class="star-core"><img src="assets/logos/${id}.${extension}" alt="" width="22" height="22"></span><span class="star-name">${name}</span>`;
  button.addEventListener('click', () => select(index));
  stars.append(button);
});
function connectStars() {
  const svg = document.querySelector('.constellation-lines');
  const width = map.clientWidth;
  const height = map.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.replaceChildren();
  stars.querySelectorAll('button').forEach((button, index) => {
    const style = getComputedStyle(button);
    const x = parseFloat(style.getPropertyValue('--x')) / 100 * width;
    const y = parseFloat(style.getPropertyValue('--y')) / 100 * height;
    const sign = x < width / 2 ? 1 : -1;
    const spread = width < 720 ? 22 : 45;
    const points = [[x, y - 10], [x + sign * spread, y - 35], [x + sign * spread * 1.5, y + 5], [x + sign * spread * 2.2, y - 16]];
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', `lab-constellation${button.getAttribute('aria-pressed') === 'true' ? ' selected' : ''}`);
    group.style.setProperty('--line-color', labs[index][4]);
    group.style.setProperty('--drift-delay', `${index * -2.3}s`);
    group.style.setProperty('--drift-duration', `${22 + index % 5 * 3}s`);
    group.innerHTML = `<path d="M${points.map(point => point.join(' ')).join(' L')}"/>${points.slice(1).map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.5"/>`).join('')}`;
    svg.append(group);
  });
}
new ResizeObserver(connectStars).observe(map);
function motion() {
  map.classList.toggle('motion-paused', reduce.matches);
}
reduce.addEventListener('change', motion);
new IntersectionObserver(([entry]) => map.classList.toggle('offscreen', !entry.isIntersecting)).observe(map);
document.addEventListener('visibilitychange', () => map.classList.toggle('page-hidden', document.hidden));
select(0);
motion();
try { createCloudMesh(document.querySelector('.cloud-mesh')); } catch (error) { console.error('Cloud mesh initialization failed:', error); }
