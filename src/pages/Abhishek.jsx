import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Droplet, Cookie, Flower2, Circle, Droplets, GlassWater, Hand, Trash2, Loader2 } from 'lucide-react';

// Format names from file paths (e.g., 'rose_flower.png' -> 'Rose Flower')
const formatName = (fileName) => {
    return fileName.split('.')[0]
        .replace(/[_:-]/g, ' ')
        .replace(/preview|actual/gi, '')
        .trim()
        .replace(/\b\w/g, l => l.toUpperCase());
};

// Scan public/abhishek folders for dynamic items
const filePaths = Object.keys(import.meta.glob('/public/abhishek/**/*.{png,jpg,jpeg,svg}', { eager: true }));

const OFFERING_ITEMS = {
    flower: [],
    dryfruit: [],
    moti: []
};

filePaths.forEach((path) => {
    const cleanPath = path.replace('/public', '');
    const parts = cleanPath.split('/').filter(Boolean);
    // Parts example: ['abhishek', 'flower', 'preview', 'rose.png']

    if (parts.length >= 4 && parts[0] === 'abhishek') {
        const folder = parts[1].replace(' ', ''); // 'dry fruit' -> 'dryfruit'
        const categoryId = folder === 'flower' ? 'flower' : folder === 'dryfruit' ? 'dryfruit' : folder === 'moti' ? 'moti' : null;

        if (categoryId && OFFERING_ITEMS[categoryId]) {
            const subfolder = parts[2]; // 'preview' or 'actual'
            const fileName = parts[3];

            if (subfolder === 'preview' || subfolder === 'actual') {
                const baseName = fileName.split('.')[0].replace(/preview|actual/gi, '').trim();
                const id = `${categoryId}_${baseName.toLowerCase().replace(/\s+/g, '_')}`;

                let item = OFFERING_ITEMS[categoryId].find(i => i.id === id);
                if (!item) {
                    item = { id, name: formatName(fileName) };
                    OFFERING_ITEMS[categoryId].push(item);
                }

                if (subfolder === 'preview') item.preview = cleanPath;
                if (subfolder === 'actual') item.actual = cleanPath;
            }
        }
    }
});

// Unified Offerings following the Hari App flat category structure
const CATEGORIES = [
    { id: 'jal', name: 'Jal', tool: 'kalash', color: '#A0E6FF', icon: Droplet, type: 'liquid' },
    { id: 'milk', name: 'Dugdha', tool: 'kalash', color: '#FFFFFF', icon: Droplets, type: 'liquid' },
    { id: 'juice', name: 'Juice', tool: 'kalash', color: '#E53E3E', icon: Droplets, type: 'liquid' },
    { id: 'dryfruit', name: 'Dry Fruits', tool: 'basket', color: '#B7791F', icon: Cookie, type: 'solid', options: OFFERING_ITEMS.dryfruit },
    { id: 'flower', name: 'Pushpa', tool: 'basket', color: '#D53F8C', icon: Flower2, type: 'solid', options: OFFERING_ITEMS.flower },
    { id: 'moti', name: 'Moti', tool: 'basket', color: '#E2E8F0', icon: Circle, type: 'solid', options: OFFERING_ITEMS.moti }
];

export default function Abhishek() {
    const [rajipo, setRajipo] = useState(0);
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [activeSubItem, setActiveSubItem] = useState(null); // Used for multi-option categories like flowers

    // Physics & Interaction State
    const [particles, setParticles] = useState([]);
    const [accumulations, setAccumulations] = useState([]);
    const [isInteracting, setIsInteracting] = useState(false);
    const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
    const [showTool, setShowTool] = useState(false);

    // Image Preloader State
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Mutable references for the continuous physics loop
    const pointerPosRef = useRef({ x: 0, y: 0 });
    const isInteractingRef = useRef(false);

    const canvasRef = useRef(null);
    const lastSpawnTime = useRef(0);

    // Initialize Rajipo
    useEffect(() => {
        const saved = localStorage.getItem('rajipo');
        if (saved) setRajipo(parseInt(saved, 10));
    }, []);

    // Preload heavy graphics to prevent staggered rendering
    useEffect(() => {
        const imagesToLoad = ['/abhishek/murti.png', '/abhishek/kalash.png', '/abhishek/basket.png'];
        let loadedCount = 0;

        const handleImageLoad = () => {
            loadedCount++;
            if (loadedCount === imagesToLoad.length) setImagesLoaded(true);
        };

        imagesToLoad.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = handleImageLoad;
            img.onerror = handleImageLoad; // Don't block screen forever if one fails
        });
    }, []);

    // Initialize activeSubItem if the initial activeCategory has options
    useEffect(() => {
        if (activeCategory.options && activeCategory.options.length > 0) {
            setActiveSubItem(activeCategory.options[0].id);
        } else {
            setActiveSubItem(null);
        }
    }, [activeCategory]);

    // --- Aggressive Mobile Zoom & Scroll Prevention ---
    // Apple iOS Safari frequently ignores CSS touch-action: none. We must kill the gesture at the DOM level.
    useEffect(() => {
        const preventNativeGestures = (e) => {
            if (canvasRef.current && canvasRef.current.contains(e.target)) {
                // If it's a multi-touch (pinch-to-zoom) or single touch (scroll), kill it.
                if (e.touches.length > 1 || e.type === 'touchmove') {
                    e.preventDefault();
                }
            }
        };

        // { passive: false } allows us to manually call preventDefault on scroll/zoom events
        document.addEventListener('touchmove', preventNativeGestures, { passive: false });

        return () => {
            document.removeEventListener('touchmove', preventNativeGestures);
        };
    }, []);


    // Memory Management: Clear dead particles automatically
    useEffect(() => {
        if (particles.length > 0) {
            const timer = setTimeout(() => {
                const now = Date.now();
                setParticles(prev => prev.filter(p => now - p.birthTime < 2000));
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [particles]);

    // Background Audio Loop Management
    useEffect(() => {
        // Initialize HTML5 Audio specifically for Abhishek
        const abhishekAudio = new Audio('/abhishek/Abhishek.mp3');
        abhishekAudio.loop = true;

        // Attempt to auto-play (browsers may require interaction first, but since the user navigated here via a click it usually succeeds)
        abhishekAudio.play().catch(error => {
            console.warn("Auto-play prevented by browser policy. User interaction required:", error);
        });

        // Cleanup function: stop audio if the user navigates to another tab (e.g. Dashboard, Shangar)
        return () => {
            abhishekAudio.pause();
            abhishekAudio.currentTime = 0;
        };
    }, []);

    // Handles the actual spawning of particles at the cursor location
    const spawnParticles = useCallback((x, y, category, toolVx = 0, toolVy = 0) => {
        const now = Date.now();
        const isLiquid = category.type === 'liquid';

        // Solids need throttling so they don't spawn 60 per second. Liquids need high density for a stream.
        if (!isLiquid) {
            // Drop more solids by reducing throttle from 150 to 80
            if (now - lastSpawnTime.current < 80) return;
        } else {
            // Liquids spawn rapidly for a cohesive stream, throttled slightly for performance constraints
            if (now - lastSpawnTime.current < 35) return;
        }

        lastSpawnTime.current = now;

        // Determine particle image based on active category and sub-selection ONCE per spawn block
        let resolvedImage = null;
        if (category.options && activeSubItem) {
            const selectedOpt = category.options.find(opt => opt.id === activeSubItem);
            if (selectedOpt) resolvedImage = selectedOpt.actual;
        } else if (category.images) {
            resolvedImage = category.images[Math.floor(Math.random() * category.images.length)];
        }

        // Spawn dense droplets for liquids, single particles for solids
        const count = isLiquid ? Math.floor(Math.random() * 2 + 1) : 1;

        const newParticles = Array.from({ length: count }).map(() => {
            const spread = isLiquid ? 12 : 40;
            const offsetX = (Math.random() - 0.5) * spread;
            const offsetY = (Math.random() - 0.5) * spread;

            const size = isLiquid ? Math.random() * 6 + 6 : Math.random() * 15 + 10;

            // Inherit Kalash velocity for realistic arcing water
            const vx = isLiquid ? (Math.random() - 0.5) * 1.5 + (toolVx * 0.15) : (Math.random() - 0.5) * 6;
            const vy = isLiquid ? Math.random() * 2 + (toolVy * 0.1) : Math.random() * 2 + 1;

            return {
                id: Math.random().toString(36).substr(2, 9),
                x: x + offsetX,
                y: y + offsetY,
                vx: vx,
                vy: vy,
                color: category.color,
                image: resolvedImage,
                size: size,
                type: category.type,
                life: 1.0,
                birthTime: now,
                layerZIndex: Math.random() > 0.5 ? 20 : 5 // Render randomly in front of or behind the Murti
            };
        });

        // Massively increase particle cap to allow continuous streams
        setParticles(prev => [...prev, ...newParticles].slice(-250)); // Capped lower for performance

        // Add 1 accumulation at the floor randomly
        setAccumulations(prev => {
            if (Math.random() > 0.3) return prev; // Accumulate slowly
            const newAcc = {
                id: Math.random().toString(36).substr(2, 9),
                left: `${Math.random() * 80 + 10}%`,
                bottom: `${Math.random() * 15}%`,
                size: category.type === 'liquid' ? Math.random() * 40 + 20 : Math.random() * 15 + 10,
                color: category.color,
                image: resolvedImage,
                type: category.type,
                layerZIndex: Math.random() > 0.5 ? 15 : 1 // Drop behind (1) or in front of (15) the Murti
            };
            return [...prev, newAcc].slice(-40); // Cap floor items
        });

        // Earn Rajipo points for continuous devotion
        if (Math.random() > 0.8) {
            setRajipo(r => {
                const newR = r + 1;
                localStorage.setItem('rajipo', newR);
                return newR;
            });
        }
    }, [activeCategory, activeSubItem]);

    // Canvas Interaction Event Handlers
    const handlePointerDown = (e) => {
        isInteractingRef.current = true;
        setIsInteracting(true);
        setShowTool(true);
        updatePointerPos(e);
        e.target.setPointerCapture(e.pointerId);
    };

    const updatePointerPos = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();

        // Calculate local X/Y relative to the canvas div
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;

        pointerPosRef.current = { x: localX, y: localY };
        setPointerPos({ x: localX, y: localY });
    };

    const handlePointerMove = (e) => {
        updatePointerPos(e);

        // Show hover tool on desktop if just moving mouse
        if (e.pointerType === 'mouse' && !isInteractingRef.current) {
            setShowTool(true);
        }
    };

    const handlePointerUp = (e) => {
        isInteractingRef.current = false;
        setIsInteracting(false);
        e.target.releasePointerCapture(e.pointerId);
    };

    const handlePointerLeave = () => {
        isInteractingRef.current = false;
        setShowTool(false);
        setIsInteracting(false);
    };

    // Physics Engine Loop: Continuously spawn particles and update physics positions
    useEffect(() => {
        let animationFrameId;
        const GRAVITY = 0.5;
        const TERMINAL_VELOCITY = 15;
        const FLOOR_Y = canvasRef.current ? canvasRef.current.clientHeight - 40 : 800; // Approximate floor line

        let lastToolPos = { ...pointerPosRef.current };

        const loop = () => {
            const currentPos = pointerPosRef.current;
            const toolVx = isInteractingRef.current ? currentPos.x - lastToolPos.x : 0;
            const toolVy = isInteractingRef.current ? currentPos.y - lastToolPos.y : 0;
            lastToolPos = { ...currentPos };

            // 1. Spawning
            if (isInteractingRef.current) {
                const { x, y } = currentPos;

                // When rotated -35deg, the spout/opening is positioned toward the top-left of the center point
                const spawnYOffset = -25;
                const spawnXOffset = -35;

                const startX = x + spawnXOffset;
                const startY = y + spawnYOffset;

                // Spawning
                spawnParticles(startX, startY, activeCategory, toolVx, toolVy);
            }

            // 2. Physics Update Step
            setParticles(currentParticles => {
                if (currentParticles.length === 0) return currentParticles;
                const now = Date.now();

                return currentParticles.map(p => {
                    let newVy = p.vy + GRAVITY;
                    if (newVy > TERMINAL_VELOCITY) newVy = TERMINAL_VELOCITY;

                    let newVx = p.vx;

                    // Liquid specifically wobbles organically like a real stream using sine waves based on particle birth
                    if (p.type === 'liquid') {
                        const age = now - p.birthTime;
                        // Organic horizontal waving
                        newVx += Math.sin(age * 0.01 + p.id.charCodeAt(0)) * 0.15;
                    }

                    let newX = p.x + newVx;
                    let newY = p.y + newVy;

                    // --- Lightweight Murti Surface Collision ---
                    // The Murti container is centrally aligned with a maxWidth of 380px.
                    // So the body spans approximately +180px and -180px from the exact screen center.
                    const centerX = window.innerWidth / 2;
                    const bodyLeft = centerX - 160;   // Slight inset to account for Murti's arm gaps
                    const bodyRight = centerX + 160;

                    const isOverMurti = p.type === 'liquid' &&
                        newX > bodyLeft &&
                        newX < bodyRight &&
                        newY > window.innerHeight * 0.15 &&
                        newY < window.innerHeight * 0.75;

                    if (isOverMurti) {
                        // Apply surface friction / viscosity
                        newVy = newVy * 0.55; // Huge gravity dampening (water slides instead of falls)
                        newVx = newVx * 0.85; // Slow horizontal speed
                        newY = p.y + newVy;
                        newX = p.x + newVx;
                    }

                    let newLife = p.life - (isOverMurti ? 0.006 : 0.012); // Slower fade on body


                    // Floor Collision & Bounce
                    if (newY > FLOOR_Y) {
                        newY = FLOOR_Y;
                        newVy = newVy * -0.4; // Bounce dampening
                        newVx = newVx * 0.7;  // Friction
                        newLife -= 0.05; // Fade faster on floor
                    }

                    return { ...p, x: newX, y: newY, vx: newVx, vy: newVy, life: newLife };
                }).filter(p => p.life > 0); // Remove dead particles
            });

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, [activeCategory, spawnParticles]);

    // Show beautiful loading screen while high-res images are downloading into memory
    if (!imagesLoaded) {
        return (
            <div className="page-loader-overlay">
                <Loader2 className="spinner-icon" size={48} color="var(--primary-color)" />
                <span className="text-gradient" style={{ fontSize: '1.2rem', fontWeight: '600' }}>Preparing Sacred Abhishek...</span>
            </div>
        );
    }

    return (
        <div className="page-container shangar-layout" style={{ animation: 'fadeIn 0.4s ease-out', touchAction: 'none', overscrollBehavior: 'none' }}>
            {/* Header */}
            <header style={{ padding: '24px 24px 12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '1.8rem' }}>Abhishek</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Drag to perform sacred rituals.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setAccumulations([])} className="btn" style={{ background: 'rgba(255,255,255,0.4)', padding: '8px 12px', color: '#E53E3E', boxShadow: 'none' }}>
                        <Trash2 size={16} />
                    </button>
                    <div className="rajipo-badge pulse-glow">
                        <Droplet className="rajipo-icon" size={16} />
                        <span>{rajipo} pt</span>
                    </div>
                </div>
            </header>

            <div className="shangar-layout">
                {/* Interactive Canvas Area */}
                <div className="murti-section" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div
                        ref={canvasRef}
                        className="glass-panel"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                            flex: 1,
                            position: 'relative',
                            borderRadius: 'var(--border-radius-xl)',
                            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.05), var(--shadow-lg)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            touchAction: 'none', // Prevent browser scrolling while swiping
                            cursor: showTool ? 'none' : 'default', // Hide default cursor when custom tool is shown
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onPointerLeave={handlePointerLeave}
                    >
                        {/* Instructional Overlay */}
                        {!showTool && accumulations.length === 0 && (
                            <div style={{ position: 'absolute', top: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary-light)', animation: 'pulseGlow 2s infinite alternate', zIndex: 5, pointerEvents: 'none' }}>
                                <Hand size={32} />
                                <span style={{ fontWeight: '500', marginTop: '8px' }}>Touch & Drag over Swaroop</span>
                            </div>
                        )}

                        {/* Central Murti Engine */}
                        <div style={{ position: 'relative', width: '100%', maxWidth: '380px', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '20px', pointerEvents: 'none' }}>

                            {/* Background Splashes (Behind Murti) */}
                            {accumulations.filter(a => a.type === 'liquid').map((acc) => (
                                <div key={acc.id} className="accumulation" style={{
                                    position: 'absolute', left: acc.left, bottom: acc.bottom,
                                    width: `${acc.size}px`, height: `${acc.size * 0.4}px`, borderRadius: '50%',
                                    background: acc.color, opacity: 0.6, zIndex: acc.layerZIndex, filter: 'blur(4px)'
                                }} />
                            ))}

                            <img
                                draggable="false"
                                onDragStart={(e) => e.preventDefault()}
                                src="/abhishek/murti.png"
                                alt="Murti"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '85vh',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.2))',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    padding: '40px',
                                    pointerEvents: 'none'
                                }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML += '<div style="padding: 20px; text-align: center; color: var(--text-muted); border: 2px dashed var(--primary-light); border-radius: 12px; font-size: 0.9rem;">Please place <br/><b>abhishek/murti.png</b></div>';
                                }}
                            />

                            {/* Foreground Deposits (In front of Murti) */}
                            {accumulations.map((acc) => (
                                acc.layerZIndex > 10 && (
                                    <div key={acc.id} className="accumulation" style={{
                                        position: 'absolute', left: acc.left, bottom: acc.bottom,
                                        width: `${acc.size}px`, height: acc.type === 'liquid' ? `${acc.size * 0.4}px` : `${acc.size}px`,
                                        background: acc.image ? `url("${encodeURI(acc.image)}") center/contain no-repeat` : acc.color,
                                        borderRadius: acc.image ? '0' : (acc.type === 'liquid' ? '50%' : '30%'),
                                        opacity: acc.type === 'liquid' ? 0.6 : 0.9,
                                        zIndex: acc.layerZIndex,
                                        filter: acc.type === 'liquid' ? 'blur(4px)' : 'none',
                                        transform: acc.image || acc.type === 'liquid' ? 'none' : `rotate(${Math.random() * 360}deg)`,
                                        boxShadow: acc.image || acc.type === 'liquid' ? 'none' : 'inset -2px -2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                )
                            ))}
                        </div>

                        {/* Active Physics Particles */}
                        {particles.map((p) => (
                            <div key={p.id} className="particle" style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                transform: `translate(${p.x}px, ${p.y}px)`,
                                width: `${p.size}px`,
                                height: p.type === 'liquid' ? `${p.size + p.vy * 1.5}px` : `${p.size}px`,
                                background: p.image ? `url("${encodeURI(p.image)}") center/contain no-repeat` : p.color,
                                borderRadius: p.image ? '0' : (p.type === 'liquid' ? '50% 50% 40% 40%' : '20%'),
                                opacity: Math.max(0, p.life),
                                pointerEvents: 'none',
                                zIndex: p.layerZIndex,
                                willChange: 'transform, opacity, height',
                                boxShadow: p.image ? 'none' : 'inset -2px -2px 4px rgba(0,0,0,0.2)'
                            }} />
                        ))}

                        {/* Interactive Virtual Tool (Kalash or Basket) */}
                        {showTool && (
                            <div style={{
                                position: 'absolute',
                                left: `${pointerPos.x}px`,
                                top: `${pointerPos.y}px`,
                                transform: `translate(-50%, -50%) ${isInteracting ? 'rotate(-35deg)' : 'rotate(0deg)'}`,
                                transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                pointerEvents: 'none',
                                zIndex: 50,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: activeCategory.tool === 'kalash' ? '80px' : '90px',
                                height: activeCategory.tool === 'kalash' ? '80px' : '90px',
                                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))'
                            }}>
                                <img
                                    src={
                                        activeCategory.options && activeSubItem
                                            ? activeCategory.options.find(o => o.id === activeSubItem)?.preview
                                            : `/abhishek/${activeCategory.tool}.png`
                                    }
                                    alt={activeCategory.tool}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Horizontal Navigation (Hari App Style) */}
                <div className="controls-section glass-panel" style={{
                    overflow: 'hidden',
                    borderRadius: 'var(--border-radius-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                        <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-dark)', marginBottom: '4px' }}>Sacred Offerings</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select an item to offer.</p>
                    </div>

                    {/* Sub-Menu for Categories with dynamic options (e.g. Flowers, Dry Fruits) */}
                    {activeCategory.options && activeCategory.options.length > 0 && (
                        <div className="scrollable-row" style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                            {activeCategory.options.map(opt => {
                                const isSubActive = activeSubItem === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setActiveSubItem(opt.id)}
                                        style={{
                                            minWidth: '80px',
                                            height: '80px',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            background: isSubActive ? 'rgba(255,123,0,0.1)' : 'white',
                                            border: isSubActive ? `2px solid var(--primary-color)` : '1px solid rgba(0,0,0,0.05)',
                                            boxShadow: isSubActive ? 'none' : 'var(--shadow-sm)',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer',
                                            padding: '8px'
                                        }}
                                    >
                                        <img src={opt.preview} alt={opt.name} style={{ width: '40px', height: '40px', objectFit: 'contain', marginBottom: '4px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                                        <span style={{ fontSize: '0.7rem', fontWeight: isSubActive ? '700' : '500', color: isSubActive ? 'var(--primary-dark)' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                            {opt.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="scrollable-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px', overflowY: 'auto' }}>
                        {CATEGORIES.map(category => {
                            const isActive = activeCategory.id === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        setActiveCategory(category);
                                        if (category.options && category.options.length > 0) {
                                            setActiveSubItem(category.options[0].id); // Auto-select first Option visually
                                        } else {
                                            setActiveSubItem(null);
                                        }
                                    }}
                                    style={{
                                        flex: '1 1 calc(50% - 8px)',
                                        minWidth: '80px',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: isActive ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'white',
                                        color: isActive ? 'white' : 'var(--text-main)',
                                        border: isActive ? 'none' : '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: isActive ? '0 8px 15px rgba(255,123,0,0.3)' : 'var(--shadow-sm)',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <category.icon size={24} color={isActive ? 'white' : category.color} style={{ filter: !isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none' }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: isActive ? '600' : '500', whiteSpace: 'nowrap' }}>
                                        {category.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
