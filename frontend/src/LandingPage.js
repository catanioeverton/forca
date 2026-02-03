import React from 'react';
import { FaChartLine, FaUniversity, FaLock, FaArrowRight } from 'react-icons/fa';
import './index.css';

const LandingPage = ({ onLogin }) => {
    return (
        <div className="landing-container">
            {/* --- NAVBAR --- */}
            <nav className="landing-nav glass-header">
                <div className="logo-area">
                    <h1>INSTITUTIONAL <span className="neon-text">TRACKER</span></h1>
                </div>
                <button className="login-btn-nav" onClick={onLogin}>
                    <FaLock size={12} /> ÁREA DO MEMBRO
                </button>
            </nav>

            {/* --- HERO SECTION (Topo Impactante) --- */}
            <header className="hero-section">
                <div className="hero-content">
                    <span className="hero-tag">SISTEMA DE RASTREAMENTO INSTITUCIONAL</span>
                    <h1 className="hero-title">
                        Pare de Adivinhar.<br />
                        Comece a <span className="neon-text-animate">Rastrear.</span>
                    </h1>
                    <p className="hero-subtitle">
                        A única ferramenta que combina a <strong>Força Relativa das Moedas</strong> em tempo real
                        com os conceitos de <strong>ICT (Inner Circle Trader)</strong> para revelar onde os bancos estão posicionados.
                    </p>
                    <button className="cta-button" onClick={onLogin}>
                        ACESSAR SISTEMA <FaArrowRight />
                    </button>
                </div>
            </header>

            {/* --- CARDS EXPLICATIVOS --- */}
            <section className="features-grid">
                {/* CARD 1: FORÇA DA MOEDA */}
                <div className="feature-card">
                    <div className="icon-box cyan-glow"><FaChartLine size={30} /></div>
                    <h3>Força da Moeda (Currency Strength)</h3>
                    <p>
                        O mercado Forex é um jogo de pares. Nosso algoritmo processa milhares de ticks por segundo
                        para calcular matematicamente qual moeda está sendo comprada e qual está sendo vendida.
                    </p>
                    <ul className="feature-list">
                        <li>Identifique tendências antes do gráfico se mover.</li>
                        <li>Evite pares consolidados.</li>
                        <li>Opere sempre a favor do fluxo de dinheiro.</li>
                    </ul>
                </div>

                {/* CARD 2: CONCEITOS ICT */}
                <div className="feature-card">
                    <div className="icon-box green-glow"><FaUniversity size={30} /></div>
                    <h3>Conceitos ICT (Smart Money)</h3>
                    <p>
                        Não opere linhas de suporte e resistência aleatórias. Utilizamos algoritmos para detectar
                        onde o "Dinheiro Inteligente" deixou suas pegadas.
                    </p>
                    <ul className="feature-list">
                        <li><strong>Order Blocks:</strong> Zonas de injeção de liquidez institucional.</li>
                        <li><strong>Fair Value Gaps (FVG):</strong> Desequilíbrios que o preço tende a preencher.</li>
                        <li><strong>Liquidity Pools:</strong> Onde os stops do varejo estão posicionados.</li>
                    </ul>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="landing-footer">
                <p>&copy; 2026 Institutional Tracker. Todos os direitos reservados.</p>
                <p className="footer-obs">Ferramenta exclusiva para traders profissionais.</p>
            </footer>
        </div>
    );
};

export default LandingPage;