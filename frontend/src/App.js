import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaMinus, FaHistory, FaClock, FaTable, FaFileExcel, FaTerminal, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa';
import LandingPage from './LandingPage';
import LoginModal from './LoginModal';
import AdminPanel from './AdminPanel';
import './index.css';

function DashboardComponent({ user, onLogout }) {
  const initialView = user.permissions[0] || 'live';
  const [viewMode, setViewMode] = useState(initialView);
  const [marketData, setMarketData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [historyPeriod, setHistoryPeriod] = useState('week');
  const [loading, setLoading] = useState(false);
  const currencies = ['AUD', 'CAD', 'CHF', 'EUR', 'GBP', 'JPY', 'NZD', 'USD'];

  // Link oficial da sua API no Render
  const API_URL = "https://api-forca-3um5.onrender.com";

  const canAccess = (perm) => user.role === 'admin' || user.permissions.includes(perm);

  const fetchLiveHead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/live-data?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setMarketData(json);
      }
    } catch (err) { console.error("Erro LiveHead:", err); }
  };

  const fetchTable = async () => {
    if (viewMode === 'terminal' || viewMode === 'admin') return;
    const period = viewMode === 'live' ? 'day' : historyPeriod;
    if (viewMode !== 'live') setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/history?period=${period}&t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setTableData(json);
      }
    } catch (err) { console.error("Erro Table:", err); }
    if (viewMode !== 'live') setLoading(false);
  };

  useEffect(() => {
    // 1. Busca imediata ao carregar ou trocar de aba
    fetchLiveHead();
    if (viewMode !== 'terminal' && viewMode !== 'admin') fetchTable();

    // 2. Lógica de Sincronização Institucional (Ciclos de 5 min + 30s de delay)
    let timeoutId;

    const scheduleUpdate = () => {
      const now = new Date();
      const msIn5Min = 5 * 60 * 1000;
      const delayOffset = 30 * 1000; // Delay de 30s após o fechamento da vela

      // Calcula milissegundos restantes para o próximo múltiplo de 5 min
      const msToNextCycle = msIn5Min - (now.getTime() % msIn5Min);
      const totalWait = msToNextCycle + delayOffset;

      timeoutId = setTimeout(() => {
        console.log("🕒 Ciclo atingido (5m + 30s). Atualizando...");
        fetchLiveHead();
        if (viewMode !== 'terminal' && viewMode !== 'admin') fetchTable();

        // Reagenda para o próximo ciclo
        scheduleUpdate();
      }, totalWait);
    };

    scheduleUpdate();

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line
  }, [viewMode, historyPeriod]);

  // Renderizadores
  const renderTerminalBlock = (title, dataObj, scoreObj) => {
    if (!dataObj || Object.keys(dataObj).length === 0) return <div className="term-line">Aguardando dados...</div>;
    const sortedEntries = Object.entries(dataObj).sort(([, a], [, b]) => b - a);
    return (
      <div className="term-block">
        <div className="term-section-title">{title}</div>
        {sortedEntries.map(([moeda, valor]) => {
          const score = scoreObj[moeda] || 0;
          let arrow = "→"; if (score > 0) arrow = "↑"; if (score < 0) arrow = "↓";
          return (<div key={moeda} className="term-line"><span className="term-currency">{moeda}:</span><span className="term-value"> {Number(valor).toFixed(3).padStart(6, ' ')} </span><span className="term-separator">| Score:</span><span className={`term-score ${score > 0 ? 'sc-pos' : (score < 0 ? 'sc-neg' : '')}`}>{score.toString().padStart(3, ' ')} {arrow}</span></div>)
        })}
      </div>
    );
  };

  const getIndicator = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return <span className="val-neutral">-</span>;
    if (num > 0.05) return <div className="cell-content val-pos"><FaArrowUp size={10} style={{ marginRight: 4 }} /> {Math.abs(num).toFixed(2)}</div>;
    if (num < -0.05) return <div className="cell-content val-neg"><FaArrowDown size={10} style={{ marginRight: 4 }} /> {Math.abs(num).toFixed(2)}</div>;
    return <div className="cell-content val-neutral"><FaMinus size={8} style={{ marginRight: 4, opacity: 0.5 }} /> {Math.abs(num).toFixed(2)}</div>;
  };

  const getExcelCell = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return <td className="excel-cell-neutral">-</td>;
    let bgClass = "excel-bg-neutral";
    if (num > 0.05) bgClass = "excel-bg-green"; if (num > 1.0) bgClass = "excel-bg-green-dark";
    if (num < -0.05) bgClass = "excel-bg-red"; if (num < -1.0) bgClass = "excel-bg-red-dark";
    return <td className={`excel-cell-flat ${bgClass}`}>{num.toFixed(2)}</td>;
  };

  const getDisplayTime = (row) => {
    if (row.metadata && row.metadata.last_update) {
      return row.metadata.last_update.slice(0, 5);
    }
    return row.timestamp.slice(11, 16);
  };

  return (
    <div className={`dashboard-container ${viewMode === 'terminal' ? 'terminal-mode-bg' : ''}`}>
      <header className="glass-header">
        <div className="logo-area">
          <div className={`status-dot ${marketData?.metadata?.last_update !== 'AGUARDANDO...' ? 'online' : ''}`}></div>
          <h1>INSTITUTIONAL <span className="neon-text">TRACKER</span></h1>
        </div>
        <div className="mode-switch">
          {canAccess('live') && <button className={`nav-btn ${viewMode === 'live' ? 'active' : ''}`} onClick={() => setViewMode('live')}><FaTable /> Ao Vivo</button>}
          {canAccess('excel') && <button className={`nav-btn ${viewMode === 'excel' ? 'active' : ''}`} onClick={() => setViewMode('excel')}><FaFileExcel /> Planilha</button>}
          {canAccess('terminal') && <button className={`nav-btn ${viewMode === 'terminal' ? 'active' : ''}`} onClick={() => setViewMode('terminal')}><FaTerminal /> Terminal</button>}
          {canAccess('history') && <button className={`nav-btn ${viewMode === 'history' ? 'active' : ''}`} onClick={() => setViewMode('history')}><FaHistory /> Histórico</button>}
          {user.role === 'admin' && <button className={`nav-btn ${viewMode === 'admin' ? 'active' : ''}`} onClick={() => setViewMode('admin')} style={{ borderColor: 'var(--neon-amber)', color: 'var(--neon-amber)' }}><FaShieldAlt /> Admin</button>}
          <button className="nav-btn logout-btn" onClick={onLogout}><FaSignOutAlt /> Sair</button>
        </div>
      </header>

      {viewMode === 'admin' ? (
        <AdminPanel />
      ) : viewMode === 'terminal' ? (
        <div className="terminal-console-wrapper">
          <div className="terminal-header-line">========================================================</div>
          <div className="term-line" style={{ marginBottom: 20, color: '#ccc', fontWeight: 'bold' }}>
            C:\SYSTEM\INSTITUTIONAL_TRACKER.EXE [UTC-5: {marketData?.metadata?.last_update || 'AGUARDANDO...'}]
          </div>

          {marketData ? (
            <>
              {renderTerminalBlock("[ 1 HORA ]", marketData.data.h1, marketData.scores.h1)}
              <br />
              {renderTerminalBlock("[ 4 HORAS ]", marketData.data.h4, marketData.scores.h4)}
              <br />
              {renderTerminalBlock("[ DIÁRIO ]", marketData.data.daily, marketData.scores.daily)}
              <div className="terminal-header-line" style={{ margin: '15px 0' }}>--------------------------------------------------------</div>
              <div className="term-block">
                <div className="term-section-title" style={{ color: '#fbbf24', marginBottom: 10 }}>[ SETUPS DETECTADOS ]</div>
                <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  <div className="term-line setup-line"><span style={{ color: '#888' }}>⚡ 1H ..... </span> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{marketData.setups?.setup_1h || '-'}</span></div>
                  <div className="term-line setup-line"><span style={{ color: '#888' }}>⚡ 4H ..... </span> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{marketData.setups?.setup_4h || '-'}</span></div>
                  <div className="term-line setup-line"><span style={{ color: '#888' }}>⚡ DAILY .. </span> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{marketData.setups?.setup_daily || '-'}</span></div>
                </div>
              </div>
            </>
          ) : <div className="term-line">Conectando ao mainframe...</div>}
          <div className="term-line" style={{ marginTop: 20 }}>{'>'} SYSTEM READY. WAITING NEXT TICK... <span className="cursor-blink">_</span></div>
        </div>
      ) : (
        <>
          {marketData && viewMode !== 'live' && viewMode !== 'admin' && (
            <div className="setups-container">
              <div className="setup-card"><span>Setup 1H</span><h3>{marketData.setups?.setup_1h || '-'}</h3></div>
              <div className="setup-card highlight"><span>Setup 4H</span><h3>{marketData.setups?.setup_4h || '-'}</h3></div>
              <div className="setup-card"><span>Setup Diário</span><h3>{marketData.setups?.setup_daily || '-'}</h3></div>
            </div>
          )}
          {(viewMode === 'history' || viewMode === 'excel') && (
            <div className="controls-bar"><div className="filter-group"><FaClock className="icon-filter" /><select value={historyPeriod} onChange={(e) => setHistoryPeriod(e.target.value)} className="neon-select"><option value="week">7 Dias</option><option value="month">30 Dias</option></select></div></div>
          )}
          {viewMode !== 'admin' && (
            loading ? <div className="loading-text">CARREGANDO...</div> : (
              <div className="table-wrapper glass-panel history-table-container">
                <table className={viewMode === 'excel' ? 'excel-table flat-mode' : 'excel-table'}>
                  <thead>
                    <tr>
                      <th className="sticky-col timestamp-header" rowSpan={2}>HORÁRIO (NY)</th>
                      {currencies.map(c => (viewMode === 'excel' ? (<React.Fragment key={c}><th className="flat-header">1H_{c}</th><th className="flat-header">4H_{c}</th><th className="flat-header">D_{c}</th></React.Fragment>) : (<th key={c} colSpan={3} className="currency-group-header">{c}</th>)))}
                      {viewMode !== 'excel' && viewMode !== 'live' && <th colSpan={3} className="setup-group-header">SETUPS</th>}
                    </tr>
                    {viewMode !== 'excel' && (<tr>{currencies.map(c => <React.Fragment key={c}><th className="sub-header">1H</th><th className="sub-header">4H</th><th className="sub-header">D</th></React.Fragment>)}{viewMode !== 'live' && (<><th className="sub-header">1H</th><th className="sub-header">4H</th><th className="sub-header">D</th></>)}</tr>)}
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="sticky-col timestamp-cell">{getDisplayTime(row)}</td>
                        {currencies.map(curr => (<React.Fragment key={curr}>{viewMode === 'excel' ? (<>{getExcelCell(row.data.h1?.[curr])}{getExcelCell(row.data.h4?.[curr])}{getExcelCell(row.data.daily?.[curr])}</>) : (<><td>{getIndicator(row.data.h1?.[curr])}</td><td>{getIndicator(row.data.h4?.[curr])}</td><td>{getIndicator(row.data.daily?.[curr])}</td></>)}</React.Fragment>))}
                        {viewMode !== 'excel' && viewMode !== 'live' && (<><td className="setup-cell">{row.setups?.setup_1h}</td><td className="setup-cell">{row.setups?.setup_4h}</td><td className="setup-cell">{row.setups?.setup_daily}</td></>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => {
    const storedUser = localStorage.getItem('appUser');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);
  const handleLoginSuccess = (userData) => { setUser(userData); localStorage.setItem('appUser', JSON.stringify(userData)); setShowLogin(false); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('appUser'); window.location.reload(); };
  return (<>{!user ? (<><LandingPage onLogin={() => setShowLogin(true)} />{showLogin && (<LoginModal onClose={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />)}</>) : (<DashboardComponent user={user} onLogout={handleLogout} />)}</>);
}

export default App;