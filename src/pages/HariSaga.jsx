import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Trophy, RefreshCw, Volume2, VolumeX } from 'lucide-react';

// Use same dynamic images as Smruti
const rawImages = import.meta.glob('/public/games/smurti game/*.{png,jpg,jpeg,webp}', { eager: true });
const GAME_IMAGES = Object.keys(rawImages).map(path => path.replace('/public', ''));
const FALLBACK_ITEMS = ['📿', '🕉️', '👑', '🦶', '🌷', '📖'];

const BOARD_SIZE = 8;
const UNIQUE_CANDIES = 6;

export default function HariSaga({ onBack }) {
    const [board, setBoard] = useState([]);
    const [candies, setCandies] = useState([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [moves, setMoves] = useState(20);
    const [gameState, setGameState] = useState('playing'); // playing, gameover
    const [draggedItem, setDraggedItem] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    
    // Audio Context Ref for synthesized sounds
    const audioCtxRef = useRef(null);
    const [targetItem, setTargetItem] = useState(null);
    const [isFalling, setIsFalling] = useState(false); // prevent interactions during cascade
    
    // Animation state
    const [animatingTiles, setAnimatingTiles] = useState([]); // Array of { id, x, y }
    const [isAnimating, setIsAnimating] = useState(false);

    // Initialize the available candy pool and High Score
    useEffect(() => {
        const savedHighScore = localStorage.getItem('hariSagaHighScore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }

        let pool = [];
        if (GAME_IMAGES.length >= UNIQUE_CANDIES) {
            pool = [...GAME_IMAGES].sort(() => Math.random() - 0.5).slice(0, UNIQUE_CANDIES);
        } else if (GAME_IMAGES.length > 0) {
            pool = [...GAME_IMAGES]; // Use whatever is available
        } else {
            pool = [...FALLBACK_ITEMS].slice(0, Math.min(UNIQUE_CANDIES, FALLBACK_ITEMS.length));
        }
        setCandies(pool);

        // Init Audio Context on first mount
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtxRef.current = new AudioContext();
        }

        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    // Helper to play synthesized sounds
    const playSound = (type) => {
        if (!soundEnabled || !audioCtxRef.current) return;
        
        // Resume context if suspended (browser auto-play policy)
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        const now = audioCtxRef.current.currentTime;

        if (type === 'match') {
            // Cheerful Pop
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
        } else if (type === 'gameover') {
            // Descending chime
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.5);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            oscillator.start(now);
            oscillator.stop(now + 0.6);
        }
    };

    // Create a new random board when candies are ready
    useEffect(() => {
        if (candies.length > 0) {
            createNewBoard();
        }
    }, [candies]);

    const randomCandy = () => candies[Math.floor(Math.random() * candies.length)];

    const createNewBoard = () => {
        const newBoard = [];
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            newBoard.push(randomCandy());
        }
        setBoard(newBoard);
        setScore(0);
        setMoves(20);
        setGameState('playing');
        setIsFalling(false);
    };

    // Check for matches
    const checkForColumnOfThree = (currentBoard) => {
        for (let i = 0; i <= (BOARD_SIZE * BOARD_SIZE) - (BOARD_SIZE * 2) - 1; i++) {
            const columnOfThree = [i, i + BOARD_SIZE, i + BOARD_SIZE * 2];
            const decidedColor = currentBoard[i];
            const isBlank = decidedColor === '';

            if (columnOfThree.every(square => currentBoard[square] === decidedColor && !isBlank)) {
                columnOfThree.forEach(square => currentBoard[square] = '');
                return true;
            }
        }
        return false;
    };

    const checkForRowOfThree = (currentBoard) => {
        for (let i = 0; i < (BOARD_SIZE * BOARD_SIZE); i++) {
            const rowOfThree = [i, i + 1, i + 2];
            const decidedColor = currentBoard[i];
            const isBlank = decidedColor === '';
            
            // Prevent wrapping across rows
            const notValid = [
                6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63
            ];
            if (notValid.includes(i)) continue;

            if (rowOfThree.every(square => currentBoard[square] === decidedColor && !isBlank)) {
                rowOfThree.forEach(square => currentBoard[square] = '');
                return true;
            }
        }
        return false;
    };

    const checkForColumnOfFour = (currentBoard) => {
        for (let i = 0; i <= (BOARD_SIZE * BOARD_SIZE) - (BOARD_SIZE * 3) - 1; i++) {
            const columnOfFour = [i, i + BOARD_SIZE, i + BOARD_SIZE * 2, i + BOARD_SIZE * 3];
            const decidedColor = currentBoard[i];
            const isBlank = decidedColor === '';

            if (columnOfFour.every(square => currentBoard[square] === decidedColor && !isBlank)) {
                columnOfFour.forEach(square => currentBoard[square] = '');
                return true;
            }
        }
        return false;
    };

    const checkForRowOfFour = (currentBoard) => {
        for (let i = 0; i < (BOARD_SIZE * BOARD_SIZE); i++) {
            const rowOfFour = [i, i + 1, i + 2, i + 3];
            const decidedColor = currentBoard[i];
            const isBlank = decidedColor === '';
            
            const notValid = [
                5, 6, 7, 13, 14, 15, 21, 22, 23, 29, 30, 31, 37, 38, 39, 45, 46, 47, 53, 54, 55, 61, 62, 63
            ];
            if (notValid.includes(i)) continue;

            if (rowOfFour.every(square => currentBoard[square] === decidedColor && !isBlank)) {
                rowOfFour.forEach(square => currentBoard[square] = '');
                return true;
            }
        }
        return false;
    };

    const moveDown = (currentBoard) => {
        let moved = false;
        // Check standard elements
        for (let i = 0; i < (BOARD_SIZE * BOARD_SIZE) - BOARD_SIZE; i++) {
            // If the element below is empty
            if (currentBoard[i + BOARD_SIZE] === '') {
                currentBoard[i + BOARD_SIZE] = currentBoard[i];
                currentBoard[i] = '';
                if(currentBoard[i + BOARD_SIZE] !== '') moved = true;
            }
        }
        
        // Spawn elements in the top row
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (currentBoard[i] === '') {
                currentBoard[i] = randomCandy();
                moved = true;
            }
        }
        return moved;
    };

    // Cascade engine
    useEffect(() => {
        if (board.length === 0 || gameState !== 'playing') return;

        const timer = setInterval(() => {
            const newBoard = [...board];
            let changesMade = false;
            let matchMadeThisTick = false;

            // Priority: Check Fours, then Threes, then Gravity
            if (checkForColumnOfFour(newBoard)) { changesMade = true; matchMadeThisTick = true; setScore(s => s + 40); }
            if (checkForRowOfFour(newBoard)) { changesMade = true; matchMadeThisTick = true; setScore(s => s + 40); }
            if (checkForColumnOfThree(newBoard)) { changesMade = true; matchMadeThisTick = true; setScore(s => s + 30); }
            if (checkForRowOfThree(newBoard)) { changesMade = true; matchMadeThisTick = true; setScore(s => s + 30); }
            
            if (matchMadeThisTick) {
                playSound('match');
            }

            if (moveDown(newBoard)) {
                changesMade = true;
            }

            if (changesMade) {
                setBoard(newBoard);
                setIsFalling(true);
            } else {
                setIsFalling(false);
                // Check Win/Loss Condition when board is fully settled
                if (moves <= 0) {
                    setGameState('gameover');
                    playSound('gameover');
                    // Handle High Score
                    if (score > highScore) {
                        setHighScore(score);
                        localStorage.setItem('hariSagaHighScore', score.toString());
                    }
                }
            }

        }, 150); // fast cascade

        return () => clearInterval(timer);
    }, [board, moves, score, gameState]);


    // Touch / Swipe System
    const handleSwipeStart = (e) => {
        if (isFalling || isAnimating || moves <= 0 || gameState !== 'playing') return;
        
        // Find the closest draggable tile div (stops images from hijacking event)
        const tile = e.target.closest('[data-id]');
        if (!tile) return;

        const index = parseInt(tile.getAttribute('data-id'));
        
        // Support both touch and mouse events globally
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        setDraggedItem({
            id: index,
            startX: clientX,
            startY: clientY,
            element: tile
        });
    };

    const handleSwipeMove = (e) => {
        if (!draggedItem || isFalling || isAnimating || moves <= 0 || gameState !== 'playing') return;
        
        // Prevent generic scrolling while interacting
        e.preventDefault(); 
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const diffX = clientX - draggedItem.startX;
        const diffY = clientY - draggedItem.startY;
        
        // Cap visual dragging to a maximum of ~100% of the tile width/height (roughly 40px depending on screen)
        // We calculate which axis is the primary swipe axis to restrict diagonal movement
        let moveX = 0;
        let moveY = 0;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal drag
            moveX = Math.max(-50, Math.min(50, diffX));
        } else {
            // Vertical drag
            moveY = Math.max(-50, Math.min(50, diffY));
        }

        // Apply real-time drag translation
        setDraggedItem({
            ...draggedItem,
            currentX: moveX,
            currentY: moveY
        });
    };

    const handleSwipeEnd = (e) => {
        if (isFalling || isAnimating || moves <= 0 || !draggedItem || gameState !== 'playing') return;

        // For touchend, changedTouches contains the last coordinates
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const diffX = clientX - draggedItem.startX;
        const diffY = clientY - draggedItem.startY;
        
        const draggedId = draggedItem.id;
        let targetId = -1;

        // We require a minimum distance of 20px to count as a swipe so taps don't trigger it
        if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) {
            setDraggedItem(null);
            return;
        }

        // Determine swipe direction based on greatest axis delta
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal Swipe
            if (diffX > 0) {
                targetId = draggedId + 1; // Swipe Right
            } else {
                targetId = draggedId - 1; // Swipe Left
            }
        } else {
            // Vertical Swipe
            if (diffY > 0) {
                targetId = draggedId + BOARD_SIZE; // Swipe Down
            } else {
                targetId = draggedId - BOARD_SIZE; // Swipe Up
            }
        }

        // Reset drag tracker early
        setDraggedItem(null);

        // If target is out of bounds
        if (targetId < 0 || targetId >= BOARD_SIZE * BOARD_SIZE) return;

        // Validate Adjacency & Wrapping (Left, Right, Up, Down)
        const isAdjacent = 
            targetId === draggedId - 1 || 
            targetId === draggedId + 1 || 
            targetId === draggedId - BOARD_SIZE || 
            targetId === draggedId + BOARD_SIZE;

        // Prevent wrapping logic (e.g., right edge to left edge)
        const validMove = isAdjacent && !(
            (draggedId % BOARD_SIZE === 0 && targetId === draggedId - 1) || 
            (draggedId % BOARD_SIZE === BOARD_SIZE - 1 && targetId === draggedId + 1)
        );

        if (validMove) {
            setIsAnimating(true);
            
            // Calculate pixel distance for animation
            const isHorizontal = Math.abs(targetId - draggedId) === 1;
            const dir = targetId > draggedId ? 1 : -1;
            
            const translateStringOffset = isHorizontal 
                ? `translate(${dir * 110}%, 0)` 
                : `translate(0, ${dir * 110}%)`;

            const translateStringTarget = isHorizontal 
                ? `translate(${-dir * 110}%, 0)` 
                : `translate(0, ${-dir * 110}%)`;

            // Set temporary animation state directly as CSS strings
            setAnimatingTiles([
                { id: draggedId, transform: translateStringOffset },
                { id: targetId, transform: translateStringTarget }
            ]);

            // Wait for CSS transition (200ms) before snapping state
            setTimeout(() => {
                // Attempt swap
                const newBoard = [...board];
                newBoard[draggedId] = board[targetId];
                newBoard[targetId] = board[draggedId];

                // Validate match possibility
                const isMatch = checkForRowOfFour(newBoard) || checkForColumnOfFour(newBoard) || checkForRowOfThree(newBoard) || checkForColumnOfThree(newBoard);
                
                if (isMatch) {
                    // Keep swap
                    setBoard(newBoard);
                    setMoves(m => m - 1);
                    setAnimatingTiles([]);
                    setIsAnimating(false);
                } else {
                    // Revert swap visual only
                    setAnimatingTiles([
                        { id: draggedId, transform: 'translate(0,0)' },
                        { id: targetId, transform: 'translate(0,0)' }
                    ]);
                    setTimeout(() => {
                        setAnimatingTiles([]);
                        setIsAnimating(false);
                    }, 200); 
                }
            }, 200); 
        }
    };

    return (
        <div className="shangar-container" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {onBack && (
                        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                            ← Hub
                        </button>
                    )}
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '1.8rem', margin: 0, color: '#EC4899' }}>Hari Saga</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Match 3 or more!</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => setSoundEnabled(!soundEnabled)} style={{ padding: '8px 12px', borderRadius: '12px' }}>
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <button className="btn btn-primary" onClick={createNewBoard} style={{ padding: '8px 12px', borderRadius: '12px' }}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </header>

            {/* Status Bar */}
            <div className="glass-panel" style={{ padding: '8px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Moves Left</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: moves <= 5 ? '#f43f5e' : 'inherit' }}>{moves}</p>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Score</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#EC4899', margin: 0 }}>{score}</p>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Best</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-light)', margin: 0 }}>{Math.max(score, highScore)}</p>
                </div>
            </div>

            {/* Game Board Container*/}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, position: 'relative' }}>
                
                {/* Game Over Overlay */}
                {gameState === 'gameover' && (
                    <div className="glass-panel" style={{
                        position: 'absolute',
                        zIndex: 100,
                        width: '80%',
                        maxWidth: '300px',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <Trophy size={48} color="#f59e0b" style={{ marginBottom: '8px' }} />
                        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>Game Over!</h2>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>Final Score</p>
                            <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#EC4899' }}>{score}</p>
                        </div>
                        {score >= highScore && score > 0 && (
                            <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                New High Score!
                            </div>
                        )}
                        <button className="btn btn-primary" onClick={createNewBoard} style={{ marginTop: '16px', padding: '12px 24px', fontSize: '1.1rem', width: '100%', borderRadius: '12px' }}>
                            Play Again
                        </button>
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
                    gap: '4px',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxWidth: 'min(calc(100vh - 220px), 100%)',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px',
                    borderRadius: 'var(--border-radius-lg)',
                    boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.3)'
                }}>
                    {board.map((item, index) => (
                        <div
                            key={index}
                            data-id={index}
                            onPointerDown={handleSwipeStart}
                            onPointerMove={handleSwipeMove}
                            onPointerUp={handleSwipeEnd}
                            onPointerCancel={handleSwipeEnd}
                            style={{
                                width: '100%',
                                height: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'grab',
                                overflow: 'hidden',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                opacity: item === '' ? 0 : 1, // Hide during match/clear phase easily
                                transition: draggedItem && draggedItem.id === index ? 'none' : 'transform 0.2s ease-in-out, opacity 0.2s',
                                transform: animatingTiles.find(t => t.id === index) 
                                    ? animatingTiles.find(t => t.id === index).transform 
                                    : (draggedItem && draggedItem.id === index ? `translate(${draggedItem.currentX || 0}px, ${draggedItem.currentY || 0}px)` : 'translate(0, 0)'),
                                zIndex: (animatingTiles.find(t => t.id === index) || (draggedItem && draggedItem.id === index)) ? 10 : 1,
                                touchAction: 'none', // Crucial for preventing mobile scroll while swiping
                                userSelect: 'none', // Prevent text highlighting
                                WebkitUserSelect: 'none'
                            }}
                        >
                            {/* Make draggable region robust */}
                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                                {GAME_IMAGES.length > 0 ? (
                                    item ? <img src={item} alt="candy" style={{ width: '85%', height: '85%', objectFit: 'contain', userSelect: 'none', WebkitUserDrag: 'none' }} draggable="false" /> : null
                                ) : (
                                    <span style={{ fontSize: '2rem', userSelect: 'none' }}>{item}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
