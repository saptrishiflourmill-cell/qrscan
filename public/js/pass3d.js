if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

export async function createPass3D(container, visitorData) {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');

  const rect = container.getBoundingClientRect();
  const cw = rect.width || 300;
  const ch = rect.height || 200;
  const isSmall = cw < 400;

  const scene = new THREE.Scene();
  const camDist = isSmall ? 7.5 : 6;
  const camFov = isSmall ? 30 : 35;
  const camera = new THREE.PerspectiveCamera(camFov, cw / ch, 0.1, 100);
  camera.position.set(0, 1.2, camDist);
  camera.lookAt(0, 0.5, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(cw, ch);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.5);
  scene.add(hemi);
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(4, 8, 6);
  dirLight.castShadow = true;
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0x8888ff, 1.0);
  rimLight.position.set(-4, 1, -4);
  scene.add(rimLight);

  // --- Draw card face ---
  const cardCanvas = document.createElement('canvas');
  cardCanvas.width = 1000;
  cardCanvas.height = 650;
  const ctx = cardCanvas.getContext('2d');

  function drawCardFront(data) {
    const W = 1000, H = 650;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f0a2e');
    grad.addColorStop(0.4, '#1a1040');
    grad.addColorStop(1, '#0d0a2e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(8, 8, W - 16, H - 16, 20);
    ctx.fill();

    ctx.strokeStyle = 'rgba(99,102,241,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, W - 16, H - 16, 20);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(20, 15, W - 40, 90, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText('VISITMANAGER', 36, 62);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Visitor Pass', 36, 88);

    ctx.fillStyle = 'rgba(99,102,241,0.35)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(data.visitorId || '', W - 36, 62);
    ctx.textAlign = 'left';

    const accentGrad = ctx.createLinearGradient(20, 105, W - 20, 105);
    accentGrad.addColorStop(0, '#6366f1');
    accentGrad.addColorStop(0.3, '#8b5cf6');
    accentGrad.addColorStop(0.7, '#8b5cf6');
    accentGrad.addColorStop(1, '#6366f1');
    ctx.fillStyle = accentGrad;
    ctx.beginPath();
    ctx.roundRect(20, 105, W - 40, 4, 2);
    ctx.fill();

    const photoX = 30, photoY = 130, photoS = 110;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoS, photoS, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoS, photoS, 14);
    ctx.stroke();

    if (data.photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoS, photoS, 14);
        ctx.clip();
        ctx.drawImage(img, photoX, photoY, photoS, photoS);
        ctx.restore();
        updateTex();
      };
      img.src = data.photoUrl;
    } else {
      ctx.fillStyle = 'rgba(99,102,241,0.4)';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((data.fullName || '?').charAt(0).toUpperCase(), photoX + photoS / 2, photoY + photoS / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillText(data.fullName || 'Visitor', 160, 170);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText(data.company || '', 160, 202);
    if (data.personToMeet) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Meeting: ' + data.personToMeet, 160, 228);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(20, 258, W - 40, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(20, 275, W - 300, 130, 12);
    ctx.fill();

    const fields = [
      ['Phone', data.phone || '', 'Date', data.entryDate || ''],
      ['Purpose', data.purpose || '', 'Time', data.entryTime || ''],
    ];
    const colW2 = (W - 340) / 2;
    let fy = 295;
    for (const row of fields) {
      for (let fi = 0; fi < 2; fi++) {
        const fx = 32 + fi * colW2;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(row[fi * 2].toUpperCase(), fx, fy);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Inter, sans-serif';
        const val = row[fi * 2 + 1];
        ctx.fillText(val.length > 20 ? val.slice(0, 18) + '..' : val, fx, fy + 22);
      }
      fy += 55;
    }

    if (data.qrDataUrl) {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        ctx.save();
        ctx.shadowColor = 'rgba(99,102,241,0.2)';
        ctx.shadowBlur = 12;
        ctx.drawImage(qrImg, W - 190, H - 190, 150, 150);
        ctx.restore();
        updateTex();
      };
      qrImg.onerror = () => {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data.visitorId || 'VISITOR', W - 115, H - 115);
        ctx.textAlign = 'left';
        updateTex();
      };
      qrImg.src = data.qrDataUrl;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN FOR VERIFICATION', W / 2, H - 14);
    ctx.textAlign = 'left';
  }

  let cardTex = new THREE.CanvasTexture(cardCanvas);
  cardTex.colorSpace = THREE.SRGBColorSpace;
  cardTex.anisotropy = 4;

  function updateTex() { cardTex.needsUpdate = true; }

  const cardW = 4.2, cardH = 2.7, cardD = 0.14;

  const faceMat = new THREE.MeshPhysicalMaterial({
    map: cardTex, roughness: 0.25, metalness: 0.4, clearcoat: 1.0, clearcoatRoughness: 0.1,
  });
  const edgeMat = new THREE.MeshPhysicalMaterial({
    roughness: 0.3, metalness: 0.5, clearcoat: 0.8, color: 0x0d0a2e,
  });

  const cardGeo = new THREE.BoxGeometry(cardW, cardH, cardD);
  const card = new THREE.Mesh(cardGeo, [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, edgeMat]);
  card.castShadow = true;
  card.receiveShadow = true;
  scene.add(card);

  // --- Card glow ---
  const glowGeo = new THREE.BoxGeometry(cardW + 0.2, cardH + 0.2, cardD + 0.02);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x6366f1, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glow);

  // --- Lanyard band ---
  const lanyardMat = new THREE.MeshPhysicalMaterial({
    color: 0x6366f1, metalness: 0.1, roughness: 0.6, emissive: 0x4444ff, emissiveIntensity: 0.08,
  });

  function buildLanyardCurve(cardPos) {
    const endX = cardPos.x;
    const endY = cardPos.y + cardH / 2;
    const segs = 24;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = endX * t + Math.sin(t * Math.PI * 2.5) * 0.3 * (1 - t);
      const z = Math.sin(t * Math.PI * 3 + t * 0.5) * 0.15 * (1 - t);
      const y = 3.8 - (3.8 - endY) * t + Math.sin(t * Math.PI * 1.2) * 0.2 * (1 - t);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pts);
  }

  let lanyardMesh = null;

  function updateLanyard(cardPos) {
    if (lanyardMesh) {
      lanyardMesh.geometry.dispose();
      scene.remove(lanyardMesh);
    }
    const curve = buildLanyardCurve(cardPos);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.03, 5, false);
    lanyardMesh = new THREE.Mesh(tubeGeo, lanyardMat);
    lanyardMesh.castShadow = true;
    scene.add(lanyardMesh);
  }

  // --- Hang point marker ---
  const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });
  const hangDot = new THREE.Mesh(dotGeo, dotMat);
  hangDot.position.set(0, 3.8, 0);
  scene.add(hangDot);

  // --- Particles ---
  const pCount = 80;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 9;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.02, color: 0x818cf8, transparent: true, opacity: 0.2,
    blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  particles.position.y = 2.5;
  scene.add(particles);

  // --- Physics ---
  let angle = 0.35;
  let velocity = 0.8;
  const gravity = 12;
  const len = 2.0;
  const maxAngle = 0.9;
  let dragged = false;
  let dragOff = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  container.addEventListener('pointerdown', (e) => {
    const r = container.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(card);
    if (hits.length > 0) {
      dragged = true;
      container.setPointerCapture(e.pointerId);
      const wp = hits[0].point;
      dragOff.x = wp.x - card.position.x;
      dragOff.y = wp.y - card.position.y;
      container.style.cursor = 'grabbing';
    }
  });

  container.addEventListener('pointermove', (e) => {
    const r = container.getBoundingClientRect();
    mouse.x = (e.clientX / r.width) * 2 - 1;
    mouse.y = -(e.clientY / r.height) * 2 + 1;
    if (!dragged) {
      pointer.x = mouse.x;
      pointer.y = mouse.y;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(card);
      container.style.cursor = hits.length > 0 ? 'grab' : 'default';
    }
  });

  const onUp = (e) => {
    if (dragged) {
      dragged = false;
      if (e) container.releasePointerCapture(e.pointerId);
      container.style.cursor = 'default';
    }
  };
  container.addEventListener('pointerup', onUp);
  container.addEventListener('pointercancel', onUp);

  if (visitorData) drawCardFront(visitorData);

  let running = true;

  function animate(t) {
    if (!running) return;
    requestAnimationFrame(animate);

    const dt = Math.min(1 / 60, 0.04);

    if (dragged) {
      const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      const wx = camera.position.x + dir.x * dist;
      const wy = camera.position.y + dir.y * dist;
      card.position.x = wx - dragOff.x;
      card.position.y = wy - dragOff.y;
      card.position.z = 0;
      angle = Math.asin(Math.max(-1, Math.min(1, card.position.x / len)));
      velocity = 0;
    } else {
      const damping = 0.97;
      const idlePush = Math.sin(t * 0.0008) * 0.003;
      const force = -gravity * Math.sin(angle) / len + idlePush;
      velocity += force * dt;
      velocity *= damping;
      angle += velocity * dt;
      angle = Math.max(-maxAngle, Math.min(maxAngle, angle));

      const tx = Math.sin(angle) * len;
      const ty = -Math.cos(angle) * len + len + 1.2;

      card.position.x += (tx - card.position.x) * 0.1;
      card.position.y += (ty - card.position.y) * 0.1;
      card.position.z = 0;
    }

    card.rotation.x = card.position.y * 0.04 + velocity * 0.015;
    card.rotation.y = card.position.x * 0.1 + angle * 0.2;
    card.rotation.z = card.position.x * -0.03;

    glow.position.copy(card.position);
    glow.rotation.copy(card.rotation);
    glow.material.opacity = 0.04 + Math.sin(t * 0.001) * 0.02;

    updateLanyard(card.position);

    hangDot.position.set(0, 3.8, 0);
    particles.rotation.y = t * 0.00015;

    renderer.render(scene, camera);
  }

  animate(0);

  const resize = () => {
    const r = container.getBoundingClientRect();
    const rw = r.width || 300;
    const rh = r.height || 200;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
  };
  window.addEventListener('resize', resize);

  return {
    cleanup: () => {
      running = false;
      window.removeEventListener('resize', resize);
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      renderer.dispose();
      cardGeo.dispose();
      faceMat.dispose();
      edgeMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      lanyardMat.dispose();
      if (lanyardMesh) lanyardMesh.geometry.dispose();
    },
    updateCard: (data) => {
      drawCardFront(data);
      cardTex.needsUpdate = true;
    }
  };
}
