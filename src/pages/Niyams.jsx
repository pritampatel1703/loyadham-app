import React, { useState } from 'react';
import { Check, Flame, Trophy } from 'lucide-react';

const INITIAL_NIYAMS = [
    { id: 1, title: 'Morning Puja', completed: false, rajipo: 50 },
    { id: 2, title: 'Read Vachanamrut (1 Vachnamrut)', completed: false, rajipo: 30 },
    { id: 3, title: 'Read Swamini Vato (5 Vatos)', completed: false, rajipo: 30 },
    { id: 4, title: 'Listening to Katha (15 mins)', completed: false, rajipo: 40 },
    { id: 5, title: 'Evening Chesta', completed: false, rajipo: 50 },
    { id: 6, title: 'Mansi Puja', completed: false, rajipo: 40 },
    { id: 7, title: 'Jap Yagna (5 Malas)', completed: false, rajipo: 20 },
];

export default function Niyams() {
    const [niyams, setNiyams] = useState(INITIAL_NIYAMS);
    const [lastCompletedId, setLastCompletedId] = useState(null);

    const toggleNiyam = (id) => {
        setNiyams(prev => prev.map(n => {
            if (n.id === id) {
                if (!n.completed) {
                    setLastCompletedId(id);
                    setTimeout(() => setLastCompletedId(null), 1000); // clear animation
                }
                return { ...n, completed: !n.completed };
            }
            return n;
        }));
    };

    const completedCount = niyams.filter(n => n.completed).length;
    const totalRajipo = niyams.filter(n => n.completed).reduce((sum, n) => sum + n.rajipo, 0);
    const progress = (completedCount / niyams.length) * 100;

    return (
        <div className="niyams-container">
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>E-Hisaab</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track your daily spiritual progress</p>
            </header>

            {/* Progress Summary */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Daily Streak <Flame size={16} color="var(--primary-color)" style={{ display: 'inline', verticalAlign: 'text-bottom' }} /></h2>
                    <p style={{ fontWeight: '700', fontSize: '1.5rem', color: 'var(--primary-dark)' }}>12 Days</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Today's Rajipo</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: 'var(--secondary-color)', fontWeight: '700', fontSize: '1.5rem' }}>
                        <Trophy size={20} />
                        <span>+{totalRajipo}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                    <span>Completion</span>
                    <span>{completedCount} / {niyams.length}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,123,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                        transition: 'width 0.5s ease-out'
                    }}></div>
                </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {niyams.map((niyam) => (
                    <div
                        key={niyam.id}
                        className={`glass-panel ${niyam.completed ? 'completed' : ''}`}
                        onClick={() => toggleNiyam(niyam.id)}
                        style={{
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            border: niyam.completed ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.4)',
                            transform: lastCompletedId === niyam.id ? 'scale(1.02)' : 'scale(1)',
                            opacity: niyam.completed ? 0.8 : 1
                        }}
                    >
                        {/* Checkbox */}
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: `2px solid ${niyam.completed ? 'var(--primary-color)' : 'var(--text-muted)'}`,
                            background: niyam.completed ? 'var(--primary-color)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '16px',
                            transition: 'all 0.2s'
                        }}>
                            {niyam.completed && <Check size={16} color="white" />}
                        </div>

                        <div style={{ flex: 1 }}>
                            <h3 style={{
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                textDecoration: niyam.completed ? 'line-through' : 'none',
                                color: niyam.completed ? 'var(--text-muted)' : 'var(--text-main)'
                            }}>
                                {niyam.title}
                            </h3>
                        </div>

                        <div style={{
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: niyam.completed ? 'var(--primary-color)' : 'var(--secondary-color)',
                            background: niyam.completed ? 'rgba(255,123,0,0.1)' : 'rgba(248,180,0,0.1)',
                            padding: '4px 8px',
                            borderRadius: '12px'
                        }}>
                            +{niyam.rajipo}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
