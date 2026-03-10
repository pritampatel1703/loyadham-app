import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Trophy } from 'lucide-react';

// Dynamically load all game images from the public folder
const rawImages = import.meta.glob('/public/games/smurti game/*.{png,jpg,jpeg,webp}', { eager: true });
const GAME_IMAGES = Object.keys(rawImages).map(path => path.replace('/public', ''));

// Fallback emojis in case the images folder is empty
const FALLBACK_ITEMS = ['📿', '🕉️', '👑', '🦶', '🌷', '📖'];

export default function Smruti() {
    const [cards, setCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [rajipoEarned, setRajipoEarned] = useState(0);

    // Initialize game
    const initializeGame = () => {
        let selectedItems = [];
        if (GAME_IMAGES.length >= 6) {
            // Pick a random 6 images for this session
            const shuffledImages = [...GAME_IMAGES].sort(() => Math.random() - 0.5);
            selectedItems = shuffledImages.slice(0, 6);
        } else {
            selectedItems = FALLBACK_ITEMS;
        }

        const duplicatedItems = [...selectedItems, ...selectedItems];
        const shuffled = duplicatedItems
            .sort(() => Math.random() - 0.5)
            .map((item, index) => ({ id: index, item, isFlipped: false, isMatched: false, isImage: GAME_IMAGES.length >= 6 }));

        setCards(shuffled);
        setFlippedIndices([]);
        setMatchedPairs(0);
        setMoves(0);
        setGameWon(false);
        setRajipoEarned(0);
    };

    useEffect(() => {
        initializeGame();
    }, []);

    const handleCardClick = (index) => {
        // Prevent clicking if two cards are already flipped or if the card is already flipped/matched
        if (flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

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
                        if (newCount === 6) { // 6 pairs to win
                            setGameWon(true);
                            setRajipoEarned(100 - Math.min(moves * 2, 50)); // Base Rajipo based on moves
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
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Games</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Play Memory Game to earn Rajipo</p>
                </div>
                <button className="btn btn-secondary" onClick={initializeGame} style={{ padding: '8px 12px', borderRadius: '12px' }}>
                    <RefreshCw size={18} />
                </button>
            </header>

            {/* Status Bar */}
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Moves</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: '700' }}>{moves}</p>
                </div>
                <div style={{ width: '1px', height: '30px', background: 'rgba(0,0,0,0.1)' }}></div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Found</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-color)' }}>{matchedPairs} / 6</p>
                </div>
            </div>

            {/* Game Board */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '24px',
                perspective: '1000px'
            }}>
                {cards.map((card, index) => (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(index)}
                        style={{
                            aspectRatio: '1/1',
                            position: 'relative',
                            cursor: card.isMatched ? 'default' : 'pointer',
                            transformStyle: 'preserve-3d',
                            transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
                            transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0)',
                        }}
                    >
                        {/* Card Back (Hidden) */}
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--border-radius-md)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <Sparkles color="rgba(255,255,255,0.4)" size={24} />
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
                            fontSize: '2.5rem',
                            borderRadius: 'var(--border-radius-md)',
                            boxShadow: card.isMatched ? '0 0 15px rgba(255,123,0,0.2)' : 'var(--shadow-sm)',
                            opacity: card.isMatched ? 0.7 : 1,
                            overflow: 'hidden'
                        }}>
                            {card.isImage ? (
                                <img src={card.item} alt="memory card" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            ) : (
                                card.item
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Win State Overlay */}
            {gameWon && (
                <div className="glass-panel pulse-glow" style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '2px solid var(--secondary-color)',
                    animation: 'fadeIn 0.5s'
                }}>
                    <Trophy size={48} color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }} className="text-gradient">Amazing Memory!</h2>
                    <p style={{ color: 'var(--text-main)', marginBottom: '16px' }}>You matched all pairs in {moves} moves.</p>
                    <div className="rajipo-badge" style={{ display: 'inline-flex', marginBottom: '20px', fontSize: '1.2rem', padding: '8px 20px' }}>
                        <Sparkles className="rajipo-icon" size={20} />
                        <span>+{rajipoEarned} Rajipo Earned</span>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={initializeGame}>
                        Play Again
                    </button>
                </div>
            )}

        </div>
    );
}
