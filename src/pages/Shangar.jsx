import React, { useState, useRef, useEffect } from 'react';
import { Shirt, Circle, Flower2, Sparkles, Hand, Undo2, Redo2, Trash2, XCircle, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

const CATEGORIES = [
    { id: 'lower', name: 'Lower Wear', icon: Shirt },
    { id: 'upper', name: 'Upper Wear', icon: Shirt },
    { id: 'khesh', name: 'Khesh', icon: Circle },
    { id: 'pagh', name: 'Pagh', icon: Circle },
    { id: 'kantho', name: 'Kantho', icon: Flower2 },
    { id: 'earrings', name: 'Earrings', icon: Sparkles },
    { id: 'right_hand', name: 'Right Hand', icon: Hand },
];

// Scan public folders for user-uploaded images dynamically using Vite
const filePaths = Object.keys(import.meta.glob('/public/**/*.{png,jpg,jpeg,svg}', { eager: true }));

const formatName = (fileName) => {
    return fileName.split('.')[0]
        .replace(/[_:-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};

const ITEMS = {
    murti: [],
    lower: [],
    upper: [],
    khesh: [],
    pagh: [],
    kantho: [],
    earrings: [],
    right_hand: []
};

filePaths.forEach((path) => {
    const cleanPath = path.replace('/public', '');
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length >= 2) {
        const category = parts[0];
        if (ITEMS[category]) {
            if (category === 'murti') {
                const fileName = parts[1];
                ITEMS[category].push({
                    id: `${category}_${fileName}`,
                    name: formatName(fileName),
                    image: cleanPath
                });
            } else {
                const possibleSubfolder = parts[1];
                if (possibleSubfolder === 'preview' || possibleSubfolder === 'actual') {
                    const fileName = parts[2];
                    if (fileName) {
                        const baseFileName = fileName.replace(/(\s|_|-)?(preview|actual)/i, '');
                        const id = `${category}_${baseFileName}`;
                        let existingItem = ITEMS[category].find(i => i.id === id);
                        if (!existingItem) {
                            existingItem = { id, name: formatName(baseFileName) };
                            ITEMS[category].push(existingItem);
                        }
                        if (possibleSubfolder === 'preview') existingItem.preview = cleanPath;
                        if (possibleSubfolder === 'actual') existingItem.actual = cleanPath;
                    }
                } else {
                    const fileName = parts[1];
                    ITEMS[category].push({
                        id: `${category}_${fileName}`,
                        name: formatName(fileName),
                        image: cleanPath
                    });
                }
            }
        }
    }
});

// Add a None option to all categories
Object.keys(ITEMS).filter(c => c !== 'murti').forEach(category => {
    const noneItem = { id: 'none', name: 'None' };
    ITEMS[category] = [noneItem, ...ITEMS[category]];
});

export default function Shangar() {
    const murtiRef = useRef(null);
    const [selectedMurti, setSelectedMurti] = useState(() => {
        const savedMurti = localStorage.getItem('shangar_murti');
        return savedMurti ? JSON.parse(savedMurti) : null;
    });
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('lower');
    const [hues, setHues] = useState(() => {
        const savedHues = localStorage.getItem('shangar_hues');
        return savedHues ? JSON.parse(savedHues) : { lower: 0, upper: 0, pagh: 0 };
    });

    // Default empty state
    const defaultEquipped = {
        lower: null, upper: null, khesh: null, pagh: null, kantho: null, earrings: null, right_hand: null
    };

    const [equipped, setEquipped] = useState(() => {
        const savedState = localStorage.getItem('shangar_equipped');
        return savedState ? JSON.parse(savedState) : defaultEquipped;
    });

    const [history, setHistory] = useState([equipped]); // Initialize history with initial equipped state
    const [historyIndex, setHistoryIndex] = useState(0);
    const [rajipoEarned, setRajipoEarned] = useState(false);

    // Save state to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('shangar_equipped', JSON.stringify(equipped));
        localStorage.setItem('shangar_hues', JSON.stringify(hues));
        if (selectedMurti) localStorage.setItem('shangar_murti', JSON.stringify(selectedMurti));
    }, [equipped, hues, selectedMurti]);

    const equipItem = (categoryId, item) => {
        const value = item.id === 'none' ? null : item;
        const newState = { ...equipped, [categoryId]: value };

        // Earn rajipo if at least 3 main slots are filled
        if (newState.lower && newState.upper && newState.pagh && !rajipoEarned) {
            setRajipoEarned(true);
        }

        setEquipped(newState);

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setEquipped(history[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setEquipped(history[newIndex]);
        }
    };

    const clearAll = () => {
        const newState = { lower: null, upper: null, khesh: null, pagh: null, kantho: null, earrings: null, right_hand: null };
        setEquipped(newState);
        setHues({ lower: 0, upper: 0, pagh: 0 });
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // Clear local storage completely on clearAll
        localStorage.removeItem('shangar_equipped');
        localStorage.removeItem('shangar_hues');
    };

    const resetMurtiSelection = () => {
        setSelectedMurti(null);
        localStorage.removeItem('shangar_murti');
    };

    const downloadImage = () => {
        if (!murtiRef.current) return;
        setIsDownloading(true);

        // Wait for React to render the watermark
        setTimeout(() => {
            toPng(murtiRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: 'transparent' })
                .then((dataUrl) => {
                    download(dataUrl, 'loya-shangar.png');
                    setIsDownloading(false);
                })
                .catch((err) => {
                    console.error('Failed to download image', err);
                    setIsDownloading(false);
                });
        }, 100);
    };

    // If no murti is selected and there are multiple options, show selection screen
    if (!selectedMurti && ITEMS.murti.length > 0) {
        return (
            <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ marginBottom: '24px', color: 'var(--primary-color)', textAlign: 'center' }}>Select a Swaroop</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', width: '100%', maxWidth: '500px' }}>
                    {ITEMS.murti.map((murti) => (
                        <button
                            key={murti.id}
                            onClick={() => setSelectedMurti(murti)}
                            className="glass-panel"
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', border: 'none',
                                cursor: 'pointer', transition: 'all 0.3s', outline: 'none'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        >
                            <img src={murti.image} alt={murti.name} style={{ width: '100%', height: '200px', objectFit: 'contain', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.1))' }} />
                            <span style={{ marginTop: '12px', fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-main)' }}>{murti.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '20px' }}>

            <header style={{ marginBottom: '16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Shangar</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }} onClick={resetMurtiSelection} title="Click to select a different Swaroop">
                            {selectedMurti ? `Dressing: ${selectedMurti.name} (Change)` : 'Dress the Murti'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {rajipoEarned && (
                            <div className="rajipo-badge pulse-glow">
                                <Sparkles className="rajipo-icon" size={16} />
                                <span>+200</span>
                            </div>
                        )}
                        <button onClick={downloadImage} disabled={isDownloading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: 'none', background: 'var(--primary-color)', borderRadius: '20px', color: 'white', cursor: isDownloading ? 'wait' : 'pointer', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: '600' }}>
                            <Download size={14} /> {isDownloading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Interactive Canvas */}
            <div className="glass-panel" style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                overflow: 'hidden',
                background: 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(253,251,247,0.3))'
            }}>
                {/* Color/Hue Slider (Only for Lower, Upper, Pagh) */}
                {['lower', 'upper', 'pagh'].includes(activeCategory) && equipped[activeCategory] && (
                    <div style={{
                        position: 'absolute',
                        left: '-95px', // Shift left to account for rotation width/height swap
                        top: '50%',
                        transform: 'translateY(-50%) rotate(-90deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        width: '250px',
                        height: '40px'
                    }}>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={hues[activeCategory]}
                            onChange={(e) => setHues(prev => ({ ...prev, [activeCategory]: parseInt(e.target.value) }))}
                            className="rainbow-slider"
                            style={{ '--thumb-color': `hsl(${hues[activeCategory]}, 100%, 50%)` }}
                        />
                    </div>
                )}
                {/* Real Murti Image */}
                <div ref={murtiRef} style={{ position: 'relative', width: '220px', height: 'auto', display: 'flex', justifyContent: 'center' }}>
                    <img
                        src={selectedMurti ? selectedMurti.image : "/murti/murti.png"}
                        alt="Murti"
                        style={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
                        }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML += '<div style="padding: 20px; text-align: center; color: var(--text-muted); border: 2px dashed var(--primary-light); border-radius: 12px; font-size: 0.9rem;">Please save the image as<br/><b>public/murti/murti.png</b></div>';
                        }}
                    />

                    {/* Pagh/Head Layer Overlay */}
                    {equipped.pagh && (equipped.pagh.image || equipped.pagh.actual) && (
                        <img src={equipped.pagh.actual || equipped.pagh.image} alt="Pagh" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 20, pointerEvents: 'none', filter: `drop-shadow(0 5px 15px rgba(0,0,0,0.2)) hue-rotate(${hues.pagh}deg)` }} />
                    )}

                    {/* Earrings Layer Overlay */}
                    {equipped.earrings && (equipped.earrings.image || equipped.earrings.actual) && (
                        <img src={equipped.earrings.actual || equipped.earrings.image} alt="Earrings" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 18, pointerEvents: 'none', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }} />
                    )}

                    {/* Upper Wear Layer Overlay */}
                    {equipped.upper && (equipped.upper.image || equipped.upper.actual) && (
                        <img src={equipped.upper.actual || equipped.upper.image} alt="Upper Wear" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 5, pointerEvents: 'none', filter: `drop-shadow(0 5px 15px rgba(0,0,0,0.2)) hue-rotate(${hues.upper}deg)` }} />
                    )}

                    {/* Lower Wear Layer Overlay */}
                    {equipped.lower && (equipped.lower.image || equipped.lower.actual) && (
                        <img src={equipped.lower.actual || equipped.lower.image} alt="Lower Wear" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 4, pointerEvents: 'none', filter: `drop-shadow(0 5px 15px rgba(0,0,0,0.2)) hue-rotate(${hues.lower}deg)` }} />
                    )}

                    {/* Khesh Layer Overlay */}
                    {equipped.khesh && (equipped.khesh.image || equipped.khesh.actual) && (
                        <img src={equipped.khesh.actual || equipped.khesh.image} alt="Khesh" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 12, pointerEvents: 'none', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }} />
                    )}

                    {/* Kantho Layer Overlay */}
                    {equipped.kantho && (equipped.kantho.image || equipped.kantho.actual) && (
                        <img src={equipped.kantho.actual || equipped.kantho.image} alt="Kantho" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 15, pointerEvents: 'none', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }} />
                    )}

                    {/* Right Hand Layer Overlay */}
                    {equipped.right_hand && (equipped.right_hand.image || equipped.right_hand.actual) && (
                        <img src={equipped.right_hand.actual || equipped.right_hand.image} alt="Right Hand" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 25, pointerEvents: 'none', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }} />
                    )}

                    {/* Watermark (Only visible during download) */}
                    <img
                        src="/watermark.png"
                        alt="Loyadham Watermark"
                        style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '5px',
                            width: '80px',
                            opacity: isDownloading ? 0.9 : 0,
                            zIndex: 100,
                            pointerEvents: 'none',
                            transition: 'opacity 0.1s'
                        }}
                    />
                </div>

                {/* Completion Message */}
                {rajipoEarned && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--primary-dark)',
                        boxShadow: 'var(--shadow-md)',
                        animation: 'fadeIn 0.5s'
                    }}>
                        Beautiful Shangar! 🙏
                    </div>
                )}
            </div>

            {/* Wardrobe Controls */}
            <div className="glass-panel" style={{ flexShrink: 0, overflow: 'hidden' }}>
                {/* Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <button onClick={undo} disabled={historyIndex === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', background: 'white', borderRadius: '20px', color: historyIndex === 0 ? '#ccc' : 'var(--text-main)', cursor: historyIndex === 0 ? 'default' : 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                        <Undo2 size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Undo</span>
                    </button>
                    <button onClick={redo} disabled={historyIndex === history.length - 1} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', background: 'white', borderRadius: '20px', color: historyIndex === history.length - 1 ? '#ccc' : 'var(--text-main)', cursor: historyIndex === history.length - 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                        <Redo2 size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Redo</span>
                    </button>
                    <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', background: '#FFF0F0', borderRadius: '20px', color: '#E53E3E', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                        <Trash2 size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Clear</span>
                    </button>
                </div>

                {/* Category Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: isActive ? 'rgba(255,123,0,0.05)' : 'transparent',
                                    border: 'none',
                                    borderBottom: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
                                    color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={20} />
                                <span style={{ fontSize: '0.75rem', fontWeight: isActive ? '600' : '400' }}>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Items Grid */}
                <div style={{ padding: '16px', display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ display: 'flex', gap: '12px', margin: '0 auto' }}>
                        {ITEMS[activeCategory].map(item => {
                            const isEquipped = equipped[activeCategory]?.id === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => equipItem(activeCategory, item)}
                                    style={{
                                        minWidth: '80px',
                                        height: '80px',
                                        borderRadius: 'var(--border-radius-md)',
                                        background: 'white',
                                        border: isEquipped ? '2px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: isEquipped ? '0 4px 12px rgba(255,123,0,0.2)' : 'var(--shadow-sm)',
                                        transform: isEquipped ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s',
                                        padding: '8px'
                                    }}
                                >
                                    {item.id === 'none' ? (
                                        <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                            <XCircle size={32} />
                                        </div>
                                    ) : (item.image || item.preview || item.actual) ? (
                                        <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={item.preview || item.actual || item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: item.color,
                                            border: item.border ? `2px solid ${item.border}` : '1px solid rgba(0,0,0,0.1)'
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}
