import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, RefreshCw } from 'lucide-react';

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
    const [moves, setMoves] = useState(20);
    const [draggedItem, setDraggedItem] = useState(null);
    const [targetItem, setTargetItem] = useState(null);
    const [isFalling, setIsFalling] = useState(false); // prevent interactions during cascade
    
    // Animation state
    const [animatingTiles, setAnimatingTiles] = useState([]); // Array of { id, x, y }
    const [isAnimating, setIsAnimating] = useState(false);

    // Initialize the available candy pool
    useEffect(() => {
        let pool = [];
        if (GAME_IMAGES.length >= UNIQUE_CANDIES) {
            pool = [...GAME_IMAGES].sort(() => Math.random() - 0.5).slice(0, UNIQUE_CANDIES);
        } else if (GAME_IMAGES.length > 0) {
            pool = [...GAME_IMAGES]; // Use whatever is available
        } else {
            pool = [...FALLBACK_ITEMS].slice(0, Math.min(UNIQUE_CANDIES, FALLBACK_ITEMS.length));
        }
        setCandies(pool);
    }, []);

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
        if (board.length === 0) return;

        const timer = setInterval(() => {
            const newBoard = [...board];
            let changesMade = false;

            // Priority: Check Fours, then Threes, then Gravity
            if (checkForColumnOfFour(newBoard)) { changesMade = true; setScore(s => s + 40); }
            if (checkForRowOfFour(newBoard)) { changesMade = true; setScore(s => s + 40); }
            if (checkForColumnOfThree(newBoard)) { changesMade = true; setScore(s => s + 30); }
            if (checkForRowOfThree(newBoard)) { changesMade = true; setScore(s => s + 30); }
            
            if (moveDown(newBoard)) {
                changesMade = true;
            }

            if (changesMade) {
                setBoard(newBoard);
                setIsFalling(true);
            } else {
                setIsFalling(false);
            }

        }, 150); // fast cascade

        return () => clearInterval(timer);
    }, [board]);


    // Handlers
    const handleDragStart = (e) => {
        if (isFalling || isAnimating || moves <= 0) return; // Disallow actions while matching or dead
        setDraggedItem(e.target);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        if (isFalling || isAnimating || moves <= 0) return;
        setTargetItem(e.target);
    };

    const handleDragEnd = (e) => {
        if (isFalling || isAnimating || moves <= 0 || !draggedItem || !targetItem) return;

        const draggedId = parseInt(draggedItem.getAttribute('data-id'));
        const targetId = parseInt(targetItem.getAttribute('data-id'));

        // Validate Adjacency (Left, Right, Up, Down)
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
            const draggedRect = draggedItem.getBoundingClientRect();
            const targetRect = targetItem.getBoundingClientRect();
            
            const dx = targetRect.left - draggedRect.left;
            const dy = targetRect.top - draggedRect.top;

            // Set temporary animation state
            setAnimatingTiles([
                { id: draggedId, x: dx, y: dy },
                { id: targetId, x: -dx, y: -dy }
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
                    // Revert swap (Bounce back animation)
                    setAnimatingTiles([
                        { id: draggedId, x: 0, y: 0 },
                        { id: targetId, x: 0, y: 0 }
                    ]);
                    setTimeout(() => {
                        setAnimatingTiles([]);
                        setIsAnimating(false);
                    }, 200); // 200ms to bounce back
                }
            }, 200); // 200ms to slide forward
            
        }

        setDraggedItem(null);
        setTargetItem(null);
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
                    <button className="btn btn-primary" onClick={createNewBoard} style={{ padding: '8px 12px', borderRadius: '12px' }}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </header>

            {/* Status Bar */}
            <div className="glass-panel" style={{ padding: '8px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Moves Left</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{moves}</p>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Score</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#EC4899', margin: 0 }}>{score}</p>
                </div>
            </div>

            {/* Game Board */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
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
                            draggable={true}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
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
                                transition: 'transform 0.2s ease-in-out, opacity 0.2s',
                                transform: animatingTiles.find(t => t.id === index) 
                                    ? `translate(${animatingTiles.find(t => t.id === index).x}px, ${animatingTiles.find(t => t.id === index).y}px)` 
                                    : 'translate(0px, 0px)',
                                zIndex: animatingTiles.find(t => t.id === index) ? 10 : 1
                            }}
                        >
                            {/* Make draggable region robust */}
                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                                {GAME_IMAGES.length > 0 ? (
                                    item ? <img src={item} alt="candy" style={{ width: '85%', height: '85%', objectFit: 'contain' }} /> : null
                                ) : (
                                    <span style={{ fontSize: '2rem' }}>{item}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
