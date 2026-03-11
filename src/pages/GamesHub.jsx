import React, { useState } from 'react';
import { Gamepad2, BrainCircuit } from 'lucide-react';
import Smruti from './Smruti';
import HariSaga from './HariSaga';

export default function GamesHub() {
    const [activeGame, setActiveGame] = useState('hub'); // 'hub' | 'smruti' | 'harisaga'

    if (activeGame === 'smruti') {
        return <Smruti onBack={() => setActiveGame('hub')} />;
    }

    if (activeGame === 'harisaga') {
        return <HariSaga onBack={() => setActiveGame('hub')} />;
    }

    return (
        <div className="games-hub-container" style={{
            padding: '24px',
            maxWidth: '600px',
            margin: '0 auto',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
        }}>
            <header style={{ textAlign: 'center', marginTop: '20px' }}>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Games Hub</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Play games to earn Rajipo!</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Smruti Card */}
                <div 
                    className="glass-panel hover-lift" 
                    style={{ 
                        padding: '24px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        borderLeft: '4px solid var(--primary-color)'
                    }}
                    onClick={() => setActiveGame('smruti')}
                >
                    <div style={{
                        background: 'rgba(255, 123, 0, 0.1)',
                        padding: '16px',
                        borderRadius: '50%',
                        color: 'var(--primary-color)'
                    }}>
                        <BrainCircuit size={40} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Smruti</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Test your memory and match pairs!</p>
                    </div>
                </div>

                {/* Hari Saga Card */}
                <div 
                    className="glass-panel hover-lift animate-float" 
                    style={{ 
                        padding: '24px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        borderLeft: '4px solid #EC4899', // Pink theme for Hari Saga
                        background: 'linear-gradient(145deg, rgba(236,72,153,0.05), transparent)'
                    }}
                    onClick={() => setActiveGame('harisaga')}
                >
                    <div style={{
                        background: 'rgba(236, 72, 153, 0.1)',
                        padding: '16px',
                        borderRadius: '50%',
                        color: '#EC4899'
                    }}>
                        <Gamepad2 size={40} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '4px', color: '#EC4899' }}>Hari Saga</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Match 3 or more images to clear the board!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
