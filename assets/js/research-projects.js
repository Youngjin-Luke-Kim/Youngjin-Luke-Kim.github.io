(() => {
  const map = document.querySelector('#package-map');
  if (!map) return;

  const svg = map.querySelector('.package-drawing');
  const playback = map.querySelector('.package-playback');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animatedDiagrams = new Map([[svg, false]]);
  let pauseRequested = false;

  function syncPlayback() {
    for (const [drawing, inView] of animatedDiagrams) {
      const paused = pauseRequested || reducedMotion.matches || !inView || document.hidden;
      if (paused) drawing.pauseAnimations();
      else drawing.unpauseAnimations();
    }
    playback.hidden = reducedMotion.matches;
    playback.textContent = pauseRequested ? 'Play motion' : 'Pause motion';
  }

  playback.addEventListener('click', () => {
    pauseRequested = !pauseRequested;
    syncPlayback();
  });
  reducedMotion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => animatedDiagrams.set(entry.target, entry.isIntersecting));
    syncPlayback();
  });
  observer.observe(svg);

  const regions = {
    openeye: { view: [488, 315, 254, 124], label: 'Parallel lanes on the silicon interposer' },
    ml: { view: [20, 25, 1160, 660], label: 'Predict a design response · Keysight ML' },
    disco: { view: [375, 350, 203, 99], label: 'PHY Design | Transmitter and receiver settings' },
    decap: { view: [240, 359, 179, 87], label: 'Decoupling capacitor' },
    patterns: { view: [484, 325, 256, 125], label: 'GPU to HBM · Forward and return traffic' },
    drift: { view: [388, 244, 206, 101], label: 'Power straps on orthogonal metal layers, connected by vias' },
    mosaic: { view: [265, 251, 181, 89], label: 'Planar metal routes on the GPU die' },
    agents: { view: [20, 25, 1160, 660], label: 'Agentic workflow · Plan the next design evaluation' }
  };
  const namespace = 'http://www.w3.org/2000/svg';

  for (const [key, region] of Object.entries(regions)) {
    const chapter = document.getElementById('research-' + key);
    const figure = chapter.querySelector('.chapter-figure');
    const visuals = document.createElement('div');
    visuals.className = 'chapter-visuals';
    const zoom = document.createElement('figure');
    zoom.className = 'package-zoom';
    const crop = document.createElementNS(namespace, 'svg');
    crop.setAttribute('viewBox', region.view.join(' '));
    crop.setAttribute('aria-hidden', 'true');
    const hardware = document.createElementNS(namespace, 'use');
    hardware.setAttribute('href', '#package-hardware');
    crop.append(hardware);
    crop.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    if (key === 'ml' || key === 'agents') crop.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    if (key === 'patterns') {
      const packets = svg.querySelector('.package-packets').cloneNode(true);
      crop.append(packets);
      animatedDiagrams.set(crop, false);
      observer.observe(crop);
    }
    const caption = document.createElement('figcaption');
    caption.textContent = region.label;
    zoom.append(crop, caption);
    figure.before(visuals);
    visuals.append(zoom, figure);
  }

  const links = [...map.querySelectorAll('[data-package-part]')];
  function highlightLocation() {
    for (const link of links) {
      if (link.getAttribute('href') === location.hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  window.addEventListener('hashchange', highlightLocation);
  highlightLocation();
  syncPlayback();
})();
