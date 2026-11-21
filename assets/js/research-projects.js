{
  const preview = document.getElementById('research-projects');
  const growth = preview.querySelector('.growth');
  const frame = growth.querySelector('.growth-frame');
  const canvas = frame.querySelector('canvas');
  const replay = frame.querySelector('.replay');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const paint = canvas.getContext('2d');

  function installTree() {
    const paths = [];
    const leaves = [];
    const branches = [...frame.querySelectorAll('.branch')];
    const leafColors = ['leaf-one', 'leaf-two', 'leaf-three'];
    let randomSeed = 12;
    const random = () => {
      randomSeed = (Math.imul(1664525, randomSeed) + 1013904223) >>> 0;
      return randomSeed / 4294967296;
    };
    const clamp = value => Math.max(0, Math.min(1, value));
    const point = (curve, t) => {
      const s = 1 - t;
      return [0, 1].map(axis => s ** 3 * curve[0][axis] + 3 * s ** 2 * t * curve[1][axis] +
        3 * s * t ** 2 * curve[2][axis] + t ** 3 * curve[3][axis]);
    };
    const addPath = (curve, width, tip, start, duration, color) => {
      paths.push({
        points: Array.from({ length: 31 }, (_, index) => point(curve, index / 30)),
        width, tip, start, duration, color
      });
      return curve;
    };

    const trunk = addPath([[420, 455], [451, 350], [379, 249], [430, 105]], 22, 2.4, 0, .68, 'trunk');
    addPath([[420, 455], [403, 451], [389, 464], [359, 464]], 9, .8, .02, .20, 'root');
    addPath([[420, 455], [439, 458], [451, 470], [482, 464]], 9, .8, .04, .21, 'root');
    const major = [
      { at: .36, end: [148, 198], bend: [334, 233], near: [208, 286], width: 11, start: .25 },
      { at: .60, end: [273, 85], bend: [334, 197], near: [295, 137], width: 8, start: .42 },
      { at: .72, end: [535, 70], bend: [460, 171], near: [476, 106], width: 7, start: .50 },
      { at: .48, end: [704, 159], bend: [501, 251], near: [625, 263], width: 11, start: .34 }
    ];

    for (const limb of major) {
      const origin = point(trunk, limb.at);
      const branch = addPath([origin, limb.bend, limb.near, limb.end], limb.width, 1.05, limb.start, .33, 'branch');
      const side = limb.end[0] < origin[0] ? -1 : 1;
      for (let index = 0; index < 6; index++) {
        const t = .27 + index * .13;
        const [x, y] = point(branch, t);
        const sideways = index % 2 === 0;
        const dx = (30 + random() * 32) * side * (sideways ? -1 : 1);
        const dy = -(40 + random() * 34) * (sideways ? 1 : .63);
        const start = limb.start + .33 * t;
        const twig = addPath([[x, y], [x + dx * .25, y + dy * .22], [x + dx * .82, y + dy * .45], [x + dx, y + dy]],
          3.6 - index * .23, .46, start, .20, 'twig');
        for (let fork = 0; fork < 3; fork++) {
          const forkAt = .42 + fork * .24;
          const [tx, ty] = point(twig, forkAt);
          const direction = (fork % 2 ? -1 : 1) * side;
          const reach = direction * (13 + random() * 25);
          const rise = 18 + random() * 25;
          const forkStart = start + .2 * forkAt;
          const branchlet = addPath([[tx, ty], [tx + reach * .32, ty - rise * .15], [tx + reach * .65, ty - rise * .70], [tx + reach, ty - rise]],
            1.5, .33, forkStart, .13, 'fine');
          for (let blade = 0; blade < 5; blade++) {
            const at = .18 + blade * .2;
            const [lx, ly] = point(branchlet, at);
            const angle = blade % 2 ? -.42 - random() : -2.22 - random() * .67;
            leaves.push({ x: lx, y: ly, angle, length: 8 + random() * 11, width: 2.6 + random() * 3.4,
              start: Math.min(.91, forkStart + .13 * at), color: leafColors[Math.floor(random() * leafColors.length)] });
          }
        }
      }
    }

    let replayStart = null;
    let scheduled = 0;
    let progress = 0;
    let lastFrame = '';
    let replayEndedAt = null;
    let endpoints = null;
    let palette;

    function syncPalette() {
      const style = getComputedStyle(preview);
      const shades = ['trunk', 'root', 'branch', 'twig', 'fine', ...leafColors, 'connector', 'bud'];
      palette = Object.fromEntries(shades.map(shade => [shade, style.getPropertyValue('--tree-' + shade).trim()]));
      refreshGeometry();
    }

    function refreshGeometry() {
      endpoints = null;
      lastFrame = '';
      queueDraw();
    }

    function draw(fraction) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const frameKey = [width, height, ratio, fraction.toFixed(3)].join(':');
      if (frameKey === lastFrame) return;
      lastFrame = frameKey;
      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const scaleX = Math.min(width / (width < 620 ? 1280 : 1120), height / 490);
      const scaleY = Math.min(height / 490, scaleX * (width < 620 ? 1.55 : 1.08));
      const offsetX = width / 2 - 420 * scaleX;
      const offsetY = (height - 480 * scaleY) * .64;
      paint.setTransform(1, 0, 0, 1, 0, 0);
      paint.clearRect(0, 0, canvas.width, canvas.height);
      paint.setTransform(scaleX * ratio, 0, 0, scaleY * ratio, offsetX * ratio, offsetY * ratio);
      paint.lineCap = 'round';
      paint.fillStyle = palette.bud;
      paint.beginPath();
      paint.ellipse(420, 457, 4.5, 2.9, -.32, 0, Math.PI * 2);
      paint.fill();

      for (const path of paths) {
        const end = clamp((fraction - path.start) / path.duration) * (path.points.length - 1);
        paint.strokeStyle = palette[path.color];
        for (let segment = 0; segment < end; segment++) {
          const [x, y] = path.points[segment];
          const [nextX, nextY] = path.points[segment + 1];
          const tip = Math.min(1, end - segment);
          paint.lineWidth = path.width + (path.tip - path.width) * (segment / (path.points.length - 1));
          paint.beginPath();
          paint.moveTo(x, y);
          paint.lineTo(x + (nextX - x) * tip, y + (nextY - y) * tip);
          paint.stroke();
        }
      }
      for (const leaf of leaves) {
        const size = clamp((fraction - leaf.start) / .09);
        if (size === 0) continue;
        paint.save();
        paint.translate(leaf.x, leaf.y);
        paint.rotate(leaf.angle);
        paint.scale(size, size);
        paint.fillStyle = palette[leaf.color];
        paint.beginPath();
        paint.moveTo(0, 0);
        paint.quadraticCurveTo(leaf.length * .47, -leaf.width, leaf.length, 0);
        paint.quadraticCurveTo(leaf.length * .39, leaf.width, 0, 0);
        paint.fill();
        paint.restore();
      }

      if (!endpoints) {
        const stage = canvas.getBoundingClientRect();
        endpoints = branches.map((branch, index) => {
          const bounds = branch.getBoundingClientRect();
          const heading = branch.querySelector('h3').getBoundingClientRect();
          const gap = Math.min(6, width * .01);
          return [(index < 2 ? bounds.right + gap : bounds.left - gap) - stage.left,
            heading.top + heading.height / 2 - stage.top];
        });
      }
      paint.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint.strokeStyle = palette.connector;
      paint.fillStyle = palette.bud;
      paint.lineWidth = 1.3;
      for (const [index, branch] of branches.entries()) {
        const limb = major[index];
        const start = [offsetX + limb.end[0] * scaleX, offsetY + limb.end[1] * scaleY];
        const end = endpoints[index];
        const span = end[0] - start[0];
        const curve = [start, [start[0] + span * .48, start[1]], [end[0] - span * .28, end[1]], end];
        const reveal = clamp((fraction - limb.start - .31) / .09);
        const question = clamp((fraction - limb.start - .38) / .07);
        const response = clamp((fraction - limb.start - .43) / .07);
        branch.style.setProperty('--question', question.toFixed(3));
        branch.style.setProperty('--response', response.toFixed(3));
        branch.style.setProperty('--branch-shift', ((1 - question) * (index < 2 ? 8 : -8)).toFixed(2));
        branch.classList.toggle('is-open', response > .45);
        if (reveal === 0) continue;
        paint.beginPath();
        paint.moveTo(...start);
        for (let step = 1; step <= 20; step++) paint.lineTo(...point(curve, reveal * step / 20));
        paint.stroke();
        const bud = point(curve, reveal);
        paint.beginPath();
        paint.arc(bud[0], bud[1], 2.6, 0, 2 * Math.PI);
        paint.fill();
      }
    }

    function update(now) {
      scheduled = 0;
      if (replayStart !== null) {
        progress = clamp((now - replayStart) / 2400);
        if (progress < 1) queueDraw();
        else {
          replayStart = null;
          replayEndedAt = window.scrollY;
        }
      } else if (motion.matches || replayEndedAt === window.scrollY) {
        progress = 1;
      } else {
        const finish = Math.max(0, (innerHeight - canvas.clientHeight) / 2);
        const start = Math.max(finish + 100, innerHeight * .91);
        progress = clamp((start - growth.getBoundingClientRect().top) / (start - finish));
      }
      draw(progress);
    }

    function queueDraw() {
      if (!scheduled) scheduled = requestAnimationFrame(update);
    }
    function syncMotion() {
      growth.classList.toggle('is-live', !motion.matches);
      replay.hidden = motion.matches;
      if (motion.matches) replayStart = null;
      queueDraw();
    }
    replay.addEventListener('click', () => {
      replayStart = performance.now();
      replayEndedAt = null;
      queueDraw();
    });
    motion.addEventListener('change', syncMotion);
    window.addEventListener('scroll', queueDraw, { passive: true });
    const observer = new ResizeObserver(refreshGeometry);
    observer.observe(canvas);
    branches.forEach(branch => observer.observe(branch));
    document.fonts.ready.then(refreshGeometry);
    new MutationObserver(syncPalette).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    syncPalette();
    syncMotion();
  }

  if (paint) installTree();
  const answer = preview.querySelector('.answer');
  const title = answer.querySelector('h3');
  const copy = answer.querySelector('p');
  const chapter = answer.querySelector('.answer-chapter');
  const projects = {
    openeye: ['Can we improve the interconnect itself?', 'OpenEYE uses differentiable physics to shape interconnects around the signal quality they deliver.'],
    disco: ['Can we improve how a link sends and receives signals?', 'DiSCO accounts for signal and power interactions when tuning transmitters and receivers.'],
    decap: ['Can we improve the power delivery itself?', 'BlockCAP selects decoupling capacitors by how much they improve link margin.'],
    patterns: ['Can we find the conditions most likely to break a link?', 'GPU-Bit finds input patterns that expose weak margins and replays them in circuit simulation.'],
    drift: ['What should we check again when a 3D IC changes?', 'DRIFT studies which time windows need a fresh simulation after the power network changes.'],
    ml: ['Can we make individual evaluations faster?', 'Keysight ML predictors estimate expensive electrical responses during design exploration.'],
    agents: ['Can we track and coordinate the whole workflow?', 'LLM-based optimization agents are a next direction at Keysight for connecting evaluation, optimization, and validation.'],
    mosaic: ['Can we apply what we learned about computing to routing?', 'MosaicGR divides work between CPU and GPU to find better routes within the same time budget.']
  };
  const controls = preview.querySelectorAll('[data-proj]');
  controls.forEach(control => {
    control.setAttribute('aria-pressed', 'false');
    control.setAttribute('aria-controls', answer.id);
    control.addEventListener('click', event => {
      const selected = control.getAttribute('aria-pressed') !== 'true';
      controls.forEach(other => other.setAttribute('aria-pressed', String(other === control && selected)));
      answer.hidden = !selected;
      if (selected) {
        [title.textContent, copy.textContent] = projects[control.dataset.proj];
        chapter.href = '#research-' + control.dataset.proj;
        if (event.detail > 0) answer.scrollIntoView({ block: 'nearest' });
      }
    });
  });
}
