export function initialize({ showToast } = {}) {
    const canvas = document.getElementById('venue-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let venueType = 'banquet';
    let lighting = 'warm';
    let layout = 'round';
    let decorColor = 'rose';
    let capacity = 100;
    let rotation = 0;
    let animating = true;
    let zoom = 1;

    function draw() {
        const w = canvas.offsetWidth || 800;
        const h = canvas.offsetHeight || 500;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // Background based on venue type
        const bgColors = {
            banquet: ['#1a1a3e', '#2d1b69'],
            outdoor: ['#1a3a2e', '#0d2b1a'],
            rooftop: ['#1a2a3e', '#0d1b2b'],
            beach: ['#2a1a3e', '#1b0d2b']
        };
        const [bg1, bg2] = bgColors[venueType] || bgColors.banquet;
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, bg1);
        gradient.addColorStop(1, bg2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        ctx.translate(w / 2,h / 2);
        ctx.scale(zoom,zoom);
        ctx.translate(-w / 2,-h / 2);
        canvas.dataset.zoom = String(zoom);

        // Floor
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.7);
        ctx.lineTo(w * 0.9, h * 0.7);
        ctx.lineTo(w * 0.8, h * 0.95);
        ctx.lineTo(w * 0.2, h * 0.95);
        ctx.closePath();
        ctx.fill();

        // Floor grid lines
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const t = i / 10;
            ctx.beginPath();
            ctx.moveTo(w * (0.1 + t * 0.8), h * 0.7);
            ctx.lineTo(w * (0.2 + t * 0.6), h * 0.95);
            ctx.stroke();
        }

        // Lighting effects
        const lightColors = {
            warm: ['rgba(255, 167, 38, 0.15)', 'rgba(255, 112, 67, 0.1)'],
            cool: ['rgba(66, 165, 245, 0.15)', 'rgba(126, 87, 194, 0.1)'],
            neon: ['rgba(224, 64, 251, 0.15)', 'rgba(0, 229, 255, 0.1)'],
            fairy: ['rgba(255, 213, 79, 0.2)', 'rgba(255, 171, 64, 0.15)']
        };
        const [light1, light2] = lightColors[lighting] || lightColors.warm;

        // Ceiling lights
        for (let i = 0; i < 5; i++) {
            const lx = w * (0.2 + i * 0.15);
            const ly = h * 0.15;
            const lightGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 100);
            lightGrad.addColorStop(0, light1);
            lightGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lightGrad;
            ctx.fillRect(lx - 100, ly - 50, 200, 200);

            // Light fixture
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(lx, ly, 4, 0, Math.PI * 2);
            ctx.fill();

            // Light beam
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx - 30, h * 0.7);
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + 30, h * 0.7);
            ctx.stroke();
        }

        // Fairy lights (if fairy mode)
        if (lighting === 'fairy') {
            for (let i = 0; i < 30; i++) {
                const fx = w * 0.1 + Math.random() * w * 0.8;
                const fy = h * 0.1 + Math.random() * h * 0.3;
                ctx.fillStyle = `rgba(255, 213, 79, ${Math.random() * 0.6 + 0.2})`;
                ctx.beginPath();
                ctx.arc(fx, fy, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Decoration color accents
        const decorColors = {
            rose: ['rgba(244, 143, 177, 0.3)', '#f48fb1'],
            gold: ['rgba(255, 213, 79, 0.3)', '#ffd54f'],
            blue: ['rgba(100, 181, 246, 0.3)', '#64b5f6'],
            green: ['rgba(129, 199, 132, 0.3)', '#81c784'],
            purple: ['rgba(179, 157, 219, 0.3)', '#b39ddb'],
            white: ['rgba(224, 224, 224, 0.3)', '#e0e0e0']
        };
        const [dGlow, dColor] = decorColors[decorColor] || decorColors.rose;

        // Stage / Backdrop
        ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
        ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.35);
        ctx.strokeStyle = dColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.3, h * 0.2, w * 0.4, h * 0.35);

        // Stage decoration
        ctx.fillStyle = dGlow;
        ctx.fillRect(w * 0.32, h * 0.22, w * 0.36, h * 0.31);

        // Stage text
        ctx.fillStyle = dColor;
        ctx.font = 'bold 16px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 STAGE 🎉', w * 0.5, h * 0.4);

        // Tables based on layout
        const tableCount = Math.min(Math.ceil(capacity / 8), 12);

        if (layout === 'round') {
            for (let i = 0; i < tableCount; i++) {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const tx = w * (0.2 + col * 0.2);
                const ty = h * (0.65 + row * 0.12);

                // Table
                ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
                ctx.beginPath();
                ctx.arc(tx, ty, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = dColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Chairs around table
                for (let c = 0; c < 8; c++) {
                    const angle = (c / 8) * Math.PI * 2 + rotation;
                    const cx = tx + Math.cos(angle) * 28;
                    const cy = ty + Math.sin(angle) * 28;
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (layout === 'long') {
            for (let i = 0; i < Math.min(tableCount, 6); i++) {
                const tx = w * 0.2;
                const ty = h * (0.62 + i * 0.06);

                ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
                ctx.fillRect(tx, ty - 6, w * 0.6, 12);
                ctx.strokeStyle = dColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(tx, ty - 6, w * 0.6, 12);

                // Chairs on both sides
                for (let c = 0; c < 10; c++) {
                    const cx = tx + (c / 10) * w * 0.6 + w * 0.03;
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.beginPath();
                    ctx.arc(cx, ty - 14, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(cx, ty + 14, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else { // cocktail
            for (let i = 0; i < tableCount; i++) {
                const tx = w * (0.15 + (i % 5) * 0.17);
                const ty = h * (0.65 + Math.floor(i / 5) * 0.15);

                ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
                ctx.beginPath();
                ctx.arc(tx, ty, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = dColor;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Stand
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.moveTo(tx, ty + 10);
                ctx.lineTo(tx, ty + 25);
                ctx.stroke();
            }
        }

        // Entrance
        ctx.fillStyle = dColor;
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('↑ ENTRANCE', w * 0.5, h * 0.98);

        // Venue-specific decorations
        if (venueType === 'outdoor') {
            // Trees
            for (let i = 0; i < 4; i++) {
                const treeX = i < 2 ? w * 0.05 : w * 0.92;
                const treeY = h * (0.3 + (i % 2) * 0.3);
                ctx.fillStyle = 'rgba(129, 199, 132, 0.3)';
                ctx.beginPath();
                ctx.arc(treeX, treeY, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (venueType === 'beach') {
            // Waves
            ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
            ctx.lineWidth = 2;
            for (let w2 = 0; w2 < 3; w2++) {
                ctx.beginPath();
                for (let x = 0; x < w; x += 5) {
                    ctx.lineTo(x, h * 0.08 + Math.sin(x * 0.02 + w2 + rotation) * 8);
                }
                ctx.stroke();
            }
        }
    }

    // Initial draw & expose for multi-page switcher
    draw();
    window.redrawVenue3D = draw;

    // Auto-rotate
    let frameId = null;
    let lastFrame = 0;
    function animate(now = performance.now()) {
        frameId = null;
        if (document.hidden || !document.getElementById('page-venue-3d').classList.contains('active')) return;
        if (!animating || reducedMotion.matches) return;
        if (now - lastFrame >= 1000 / 30) {
            rotation += Math.min(now - lastFrame, 100) * 0.0003;
            lastFrame = now;
            draw();
        }
        frameId = requestAnimationFrame(animate);
    }
    window.startVenueAnimation = () => { if (frameId === null) { lastFrame = performance.now(); animate(); } };
    window.stopVenueAnimation = () => { if (frameId !== null) cancelAnimationFrame(frameId); frameId = null; };
    document.addEventListener('visibilitychange', () => {
        window.stopVenueAnimation();
        if (!document.hidden && document.getElementById('page-venue-3d').classList.contains('active')) window.startVenueAnimation();
    });

    // Controls
    document.querySelectorAll('.venue-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.venue-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            venueType = btn.dataset.venue;
            updateVenueInfoBadge();
            draw();
        });
    });

    document.querySelectorAll('.lighting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lighting-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            lighting = btn.dataset.lighting;
            updateVenueInfoBadge();
            draw();
        });
    });

    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            layout = btn.dataset.layout;
            updateVenueInfoBadge();
            draw();
        });
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            decorColor = btn.dataset.color;
            draw();
        });
    });

    document.getElementById('venue-capacity').addEventListener('input', (e) => {
        capacity = parseInt(e.target.value);
        document.getElementById('venue-capacity-val').textContent = capacity;
        updateVenueInfoBadge();
        draw();
    });

    function updateVenueInfoBadge() {
        const badge = document.getElementById('venue-info-badge');
        const names = { banquet: 'Banquet Hall', outdoor: 'Outdoor Garden', rooftop: 'Rooftop', beach: 'Beach Venue' };
        const layouts = { round: 'Round tables', long: 'Long tables', cocktail: 'Cocktail' };
        badge.querySelector('.venue-name').textContent = names[venueType] || 'Venue';
        badge.querySelector('.venue-details').textContent = `${capacity} guests • ${lighting.charAt(0).toUpperCase() + lighting.slice(1)} lighting • ${layouts[layout]}`;
    }

    // 3D Controls
    document.getElementById('v3d-rotate').addEventListener('click', () => {
        animating = !animating;
        document.getElementById('v3d-rotate').setAttribute('aria-pressed',String(animating));
        if (animating) window.startVenueAnimation(); else window.stopVenueAnimation();
    });
    document.getElementById('v3d-rotate').setAttribute('aria-pressed','true');
    document.getElementById('v3d-zoom-in').addEventListener('click',()=>{zoom=Math.min(1.6,Math.round((zoom+.1)*10)/10);draw();});
    document.getElementById('v3d-zoom-out').addEventListener('click',()=>{zoom=Math.max(.6,Math.round((zoom-.1)*10)/10);draw();});
    document.getElementById('v3d-fullscreen').addEventListener('click',async()=>{
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await canvas.parentElement.requestFullscreen();
            draw();
        } catch {showToast('Fullscreen is unavailable in this browser','info');}
    });
    document.addEventListener('fullscreenchange',draw);
    new ResizeObserver(() => {
        if (document.getElementById('page-venue-3d').classList.contains('active')) draw();
    }).observe(canvas.parentElement);
    reducedMotion.addEventListener('change', () => {
        window.stopVenueAnimation();
        window.startVenueAnimation();
    });
}
