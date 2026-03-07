import React from 'react';
import { Sparkles, Calendar, BookOpen, Video } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="dashboard-container">
            {/* Header / Intro */}
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Jay Swaminarayan</p>
                    <h1 style={{ fontSize: '1.8rem' }} className="text-gradient">Good Morning</h1>
                </div>

                {/* Rajipo Badge */}
                <div className="rajipo-badge">
                    <Sparkles className="rajipo-icon" size={16} />
                    <span>850 Rajipo</span>
                </div>
            </header>

            {/* Daily Darshan Prominent Card */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, var(--primary-light), transparent)', opacity: 0.2, borderRadius: '50%', transform: 'translate(30%, -30%)' }}></div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Daily Darshan</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Loyadham, NJ - Morning Shangar</p>

                {/* Placeholder for video / 3D model */}
                <div style={{ width: '100%', height: '200px', backgroundColor: 'rgba(255,123,0,0.05)', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--primary-light)', marginBottom: '16px' }}>
                    <Video size={48} color="var(--primary-light)" opacity={0.5} />
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }}>
                    Perform Shangar
                </button>
            </div>

            {/* Quick Actions Grid */}
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>Your Daily Niyams</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 123, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1rem' }}>E-Hisaab</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>4/7 Completed</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(248, 180, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-color)' }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1rem' }}>Vachanamrut</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gadhada First 1</p>
                    </div>
                </div>

            </div>

        </div>
    );
}
