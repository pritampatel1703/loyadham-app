import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Trophy } from 'lucide-react';

// Dynamically load all game images from the public folder
const rawImages = import.meta.glob('/public/games/smurti game/*.{png,jpg,jpeg,webp}', { eager: true });
const GAME_IMAGES = Object.keys(rawImages).map(path => path.replace('/public', ''));

// Fallback emojis in case the images folder is empty
const FALLBACK_ITEMS = ['📿', '🕉️', '👑', '🦶', '🌷', '📖'];

export default function Smruti({ onBack }) {
    const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing'
    const [gridSize, setGridSize] = useState({ cols: 4, rows: 5 });
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [pairsNeeded, setPairsNeeded] = useState(0);

    const [cards, setCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [rajipoEarned, setRajipoEarned] = useState(0);

    // Initialize game
    const initializeGame = (sizeObj = gridSize) => {
        const { cols, rows } = sizeObj;
        const totalCards = cols * rows;
        const targetPairs = totalCards / 2;

        let selectedItems = [];
        if (GAME_IMAGES.length > 0) {
            // Pick 'targetPairs' random images. If GAME_IMAGES is shorter, reuse them.
            while (selectedItems.length < targetPairs) {
                const shuffledImages = [...GAME_IMAGES].sort(() => Math.random() - 0.5);
                const needed = targetPairs - selectedItems.length;
                selectedItems.push(...shuffledImages.slice(0, Math.min(needed, shuffledImages.length)));
            }
        } else {
            while (selectedItems.length < targetPairs) {
                const shuffled = [...FALLBACK_ITEMS].sort(() => Math.random() - 0.5);
                const needed = targetPairs - selectedItems.length;
                selectedItems.push(...shuffled.slice(0, Math.min(needed, shuffled.length)));
            }
        }

        const duplicatedItems = [...selectedItems, ...selectedItems];
        const shuffledItems = duplicatedItems.sort(() => Math.random() - 0.5);

        const cardsArray = shuffledItems.map((item, id) => ({
            id, item, isFlipped: false, isMatched: false, isImage: GAME_IMAGES.length > 0, isSpecial: false
        }));

        setGridSize(sizeObj);
        setPairsNeeded(targetPairs);
        setCards(cardsArray);
        setFlippedIndices([]);
        setMatchedPairs(0);
        setMoves(0);
        setGameWon(false);
        setRajipoEarned(0);
        setGameState('playing');
        setIsPreviewing(true);
    };

    // 5-second preview timer
    useEffect(() => {
        let timer;
        if (isPreviewing) {
            timer = setTimeout(() => {
                setIsPreviewing(false);
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [isPreviewing]);

    // No auto-start — user selects grid size from the menu first

    const handleCardClick = (index) => {
        // Prevent clicking if previewing, if two cards are already flipped, or if the card is already flipped/matched
        if (isPreviewing || flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlippedIndices = [...flippedIndices, index];
        setFlippedIndices(newFlippedIndices);

        if (newFlippedIndices.length === 2) {
            setMoves(moves + 1);
            const [firstIndex, secondIndex] = newFlippedIndices;

            if (cards[firstIndex].item === cards[secondIndex].item) {
                // Match found
                setTimeout(() => {
                    const matchedCards = [...cards];
                    matchedCards[firstIndex].isMatched = true;
                    matchedCards[secondIndex].isMatched = true;
                    setCards(matchedCards);
                    setFlippedIndices([]);
                    setMatchedPairs(prev => {
                        const newCount = prev + 1;
                        if (newCount === pairsNeeded) { // win condition based on dynamic pairs
                            setGameWon(true);
                            setRajipoEarned(100 + (pairsNeeded * 10) - Math.min(moves * 2, pairsNeeded * 10)); // Base Rajipo based on moves and grid size
                        }
                        return newCount;
                    });
                }, 500);
            } else {
                // No match
                setTimeout(() => {
                    const resetCards = [...cards];
                    resetCards[firstIndex].isFlipped = false;
                    resetCards[secondIndex].isFlipped = false;
                    setCards(resetCards);
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    return (
        <div className="smruti-container">
            <header style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '1.4rem', marginBottom: '2px' }}>Games</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Play Memory Game to earn Rajipo</p>
                </div>
                {gameState === 'playing' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => setGameState('menu')} style={{ padding: '8px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>
                            Menu
                        </button>
                        <button className="btn btn-primary" onClick={() => initializeGame(gridSize)} style={{ padding: '8px 12px', borderRadius: '12px' }}>
                            <RefreshCw size={18} />
                        </button>
                    </div>
                )}
            </header>

            {gameState === 'menu' ? (
                <div className="glass-panel pulse-glow" style={{ padding: '32px 24px', textAlign: 'center', marginTop: '40px', position: 'relative' }}>
                    {onBack && (
                        <button 
                            className="btn btn-secondary" 
                            onClick={onBack} 
                            style={{ position: 'absolute', top: '24px', left: '24px', padding: '8px 12px', fontSize: '0.8rem' }}
                        >
                            ← Back to Hub
                        </button>
                    )}
                    <h2 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Select Grid Size</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Bigger grids earn more Rajipo!</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px', margin: '0 auto' }}>
                        {[
                            { cols: 4, rows: 5, label: '4 x 5' },
                            { cols: 5, rows: 6, label: '5 x 6' },
                            { cols: 6, rows: 7, label: '6 x 7' },
                            { cols: 7, rows: 8, label: '7 x 8' },
                            { cols: 8, rows: 9, label: '8 x 9' },
                            { cols: 9, rows: 10, label: '9 x 10' }
                        ].map((size) => (
                            <button
                                key={size.label}
                                className="btn btn-primary"
                                style={{ padding: '16px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                onClick={() => initializeGame(size)}
                            >
                                {size.label} Grid
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Status Bar */}
                    <div className="glass-panel" style={{ padding: '4px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Moves</p>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>{moves}</p>
                        </div>
                        <div style={{ width: '1px', height: '16px', background: 'rgba(0,0,0,0.1)' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Found</p>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-color)' }}>{matchedPairs} / {pairsNeeded}</p>
                        </div>
                    </div>

                    {/* Game Board — square wrapper so all cards are square cells */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flex: 1,
                        minHeight: 0
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
                            gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
                            gap: Math.max(gridSize.cols, gridSize.rows) > 7 ? '3px' : '6px',
                            perspective: '1000px',
                            // Make the grid strictly follow cols/rows ratio so child cells are perfectly square
                            aspectRatio: `${gridSize.cols} / ${gridSize.rows}`,
                            width: '100%',
                            maxWidth: `min(calc((100vh - 240px) * ${gridSize.cols / gridSize.rows}), 100%)`
                        }}>
                            {cards.map((card, index) => (
                                    <div
                                        key={card.id}
                                        onClick={() => handleCardClick(index)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            position: 'relative',
                                            cursor: (card.isMatched || isPreviewing) ? 'default' : 'pointer',
                                            transformStyle: 'preserve-3d',
                                            transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                            transform: (card.isFlipped || card.isMatched || isPreviewing) ? 'rotateY(180deg)' : 'rotateY(0)',
                                        }}
                                    >
                                    {/* Card Back (showing Loyadham logo) */}
                                    <div style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 'var(--border-radius-md)',
                                        boxShadow: 'var(--shadow-sm)',
                                        overflow: 'hidden'
                                    }}>
                                            <img
                                                src="/favicon.png"
                                                alt="logo"
                                                style={{
                                                    width: Math.max(gridSize.cols, gridSize.rows) > 7 ? '40%' : '50%',
                                                    height: Math.max(gridSize.cols, gridSize.rows) > 7 ? '40%' : '50%',
                                                    objectFit: 'contain',
                                                    opacity: 0.8
                                                }}
                                            />
                                    </div>

                                    {/* Card Front (Revealed) */}
                                    <div className="glass-panel" style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        background: card.isMatched ? 'var(--bg-color)' : 'white',
                                        border: card.isMatched ? '2px solid var(--primary-light)' : '1px solid rgba(0,0,0,0.1)',
                                        transform: 'rotateY(180deg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: Math.max(gridSize.cols, gridSize.rows) > 6 ? '1.5rem' : '2.5rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        boxShadow: card.isMatched ? '0 0 15px rgba(255,123,0,0.2)' : 'var(--shadow-sm)',
                                        opacity: card.isMatched ? 0.7 : 1,
                                        overflow: 'hidden'
                                    }}>
                                        {card.isImage ? (
                                            <img src={card.item} alt="memory card" style={{ width: '85%', height: '85%', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            card.item
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Win State Overlay */}
                    {gameWon && (
                        <div className="glass-panel pulse-glow" style={{
                            padding: '20px',
                            textAlign: 'center',
                            background: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid var(--secondary-color)',
                            animation: 'fadeIn 0.5s',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                            width: '90%',
                            maxWidth: '300px'
                        }}>
                            <Trophy size={36} color="var(--primary-color)" style={{ margin: '0 auto 8px' }} />
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '6px' }} className="text-gradient">Amazing Memory!</h2>
                            <p style={{ color: 'var(--text-main)', marginBottom: '12px', fontSize: '0.9rem' }}>You matched all pairs in {moves} moves.</p>
                            <div className="rajipo-badge" style={{ display: 'inline-flex', marginBottom: '16px', fontSize: '1rem', padding: '6px 16px' }}>
                                <Sparkles className="rajipo-icon" size={16} />
                                <span>+{rajipoEarned} Rajipo</span>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', padding: '10px' }} onClick={() => setGameState('menu')}>
                                Play Again
                            </button>
                        </div>
                    )}

                </>
            )}

        </div>
    );
}
