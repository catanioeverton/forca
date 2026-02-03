import React, { useState, useEffect } from 'react';
import { FaTrash, FaUserPlus, FaShieldAlt } from 'react-icons/fa';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user', permissions: [] });

    // Link base da sua API
    const API_URL = 'https://api-forca-3um5.onrender.com/api/users';

    const availablePermissions = [
        { id: 'live', label: 'Monitor Ao Vivo' },
        { id: 'excel', label: 'Planilha' },
        { id: 'terminal', label: 'Terminal' },
        { id: 'history', label: 'Histórico' }
    ];

    const fetchUsers = async () => {
        try {
            const res = await fetch(API_URL);
            if (res.ok) {
                const json = await res.json();
                setUsers(json);
            }
        } catch (err) { console.error("Erro ao buscar usuários:", err); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.password) return alert('Preencha usuario e senha');

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                setNewUser({ username: '', password: '', role: 'user', permissions: [] });
                fetchUsers();
            }
        } catch (err) { alert('Erro ao cadastrar usuário'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Remover usuário?')) {
            try {
                // ATUALIZADO: Removido localhost e usado link oficial
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                fetchUsers();
            } catch (err) { alert('Erro ao deletar'); }
        }
    };

    const togglePermission = (permId) => {
        setNewUser(prev => {
            const perms = prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: perms };
        });
    };

    return (
        <div className="admin-panel-container">
            <h2><FaShieldAlt /> Painel Administrativo</h2>

            <div className="admin-form glass-panel">
                <h3>Novo Usuário</h3>
                <div className="form-row">
                    <input
                        type="text" placeholder="Usuário" className="admin-input"
                        value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    />
                    <input
                        type="text" placeholder="Senha" className="admin-input"
                        value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <select
                        className="admin-select"
                        value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    >
                        <option value="user">Usuário Comum</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>

                <div className="perms-row">
                    <span>Acesso permitido:</span>
                    {availablePermissions.map(p => (
                        <label key={p.id} className="perm-label">
                            <input
                                type="checkbox"
                                checked={newUser.permissions.includes(p.id)}
                                onChange={() => togglePermission(p.id)}
                            />
                            {p.label}
                        </label>
                    ))}
                </div>

                <button className="add-btn" onClick={handleAddUser}><FaUserPlus /> Cadastrar</button>
            </div>

            <div className="users-list glass-panel">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Função</th>
                            <th>Permissões</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.username}</td>
                                <td style={{ color: u.role === 'admin' ? 'var(--neon-green)' : 'inherit' }}>
                                    {u.role.toUpperCase()}
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {Array.isArray(u.permissions) ? u.permissions.join(', ') : u.permissions}
                                </td>
                                <td>
                                    {u.username !== 'admin' && (
                                        <button className="delete-btn" onClick={() => handleDelete(u.id)}>
                                            <FaTrash />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;