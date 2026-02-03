import React, { useState } from 'react';
import { FaLock, FaTimes } from 'react-icons/fa';

const LoginModal = ({ onClose, onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                onLoginSuccess(data); // Passa os dados do usuário para o App
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Erro de conexão com servidor');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel">
                <button className="close-modal" onClick={onClose}><FaTimes /></button>
                <div className="modal-header">
                    <FaLock size={30} color="var(--neon-cyan)" />
                    <h2>Acesso Restrito</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text" placeholder="Usuário" className="login-input"
                        value={username} onChange={e => setUsername(e.target.value)}
                    />
                    <input
                        type="password" placeholder="Senha" className="login-input"
                        value={password} onChange={e => setPassword(e.target.value)}
                    />
                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-submit">ENTRAR</button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;