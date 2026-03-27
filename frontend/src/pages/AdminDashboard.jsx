import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HotspotHeatmap from '../components/HotspotHeatmap';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ViolationLog from '../components/ViolationLog';
import ChallanSection from '../components/ChallanSection';
import './AdminDashboard.css';

// ─── NASHIK VIOLATION DATA ───
const INITIAL_VIOLATIONS = [
  { id: 101, type: 'No Helmet', type_hi: 'बिना हेलमेट', icon: '🪖', status: 'urgent', conf: 94, loc: 'Sadar Junction', ward: 'Sadar', cam: 'CAM-01', plate: 'MH-15-AB-4421', risk: 78, narration: 'Rider without helmet detected at 67 km/h. Fine: ₹1,000.', time: '13:13:42' },
  { id: 102, type: 'Red Light', type_hi: 'लाल बत्ती', icon: '🚦', status: 'active', conf: 89, loc: 'MG Road Signal', ward: 'MG Road', cam: 'CAM-04', plate: 'MH-15-CD-7723', risk: 55, narration: 'Vehicle jumped red light. Fine: ₹1,000.', time: '13:13:28' },
  { id: 103, type: 'Triple Riding', type_hi: 'तीन सवारी', icon: '🏍️', status: 'urgent', conf: 97, loc: 'College Road Junction', ward: 'College Road', cam: 'CAM-07', plate: 'MH-15-EF-3310', risk: 88, narration: 'Three riders on single two-wheeler. Fine: ₹2,000.', time: '13:13:15' },
  { id: 104, type: 'Wrong Side', type_hi: 'गलत दिशा', icon: '⛔', status: 'active', conf: 92, loc: 'Gangapur Road Flyover', ward: 'Gangapur Road', cam: 'CAM-06', plate: 'MH-15-GH-9901', risk: 62, narration: 'Vehicle moving against traffic direction. Fine: ₹500.', time: '13:12:45' },
  { id: 105, type: 'Speed Breach', type_hi: 'गति उल्लंघन', icon: '⚡', status: 'active', conf: 86, loc: 'Nashik–Pune Highway', ward: 'Nashik Road', cam: 'CAM-05', plate: 'MH-15-IJ-5544', risk: 50, narration: 'Vehicle at 89 km/h in 50 km/h zone. Fine: ₹1,000.', time: '13:12:30' },
  { id: 106, type: 'No Helmet', type_hi: 'बिना हेलमेट', icon: '🪖', status: 'resolved', conf: 91, loc: 'Panchavati Circle', ward: 'Panchavati', cam: 'CAM-03', plate: 'MH-15-KL-2281', risk: 20, narration: 'Helmet violation resolved. Challan issued.', time: '13:12:12' },
  { id: 107, type: 'Zebra Cross', type_hi: 'ज़ेब्रा क्रॉसिंग', icon: '🦺', status: 'resolved', conf: 90, loc: 'Cidco Bus Stand', ward: 'Cidco', cam: 'CAM-09', plate: 'MH-15-MN-8872', risk: 18, narration: 'Vehicle stopped on pedestrian crossing. Fine: ₹500.', time: '13:11:55' },
];

const INITIAL_AGENTS = [
  { tool: 'analyze', msg: '<strong>analyze_frame</strong> → No Helmet confirmed', result: '94.2% conf', time: '13:13:42' },
  { tool: 'log', msg: '<strong>log_violation</strong> → #TW-4821 pushed', result: 'Firebase ✓', time: '13:13:42' },
  { tool: 'challan', msg: '<strong>generate_challan</strong> → ₹1,000 fine drafted', result: 'PDF ready', time: '13:13:43' },
  { tool: 'risk', msg: '<strong>risk_score</strong> → MH-15-XZ scored <strong>78</strong>', result: 'Alert fired', time: '13:13:45' },
];

const WARDS = [
  'All Wards', 'Sadar', 'Panchavati', 'Nashik Road', 'Deolali Camp', 'Cidco', 'Satpur', 
  'Gangapur Road', 'Indira Nagar', 'Trimbak Road', 'MG Road', 'College Road', 'Ambad', 'Dwarka'
];

const VIOLATION_TYPES = [
  'All Types', 'No Helmet', 'Red Light', 'Triple Riding', 'Wrong Side', 'Speed Breach', 'Zebra Cross'
];

const ZONES = [
  'Nashik Zone', 'Mumbai West', 'Pune Central', 'Nagpur South', 'Amravati City'
];

export default function AdminDashboard({ onOpenModal }) {
  const { signOut } = useAuth();
  const [violations, setViolations] = useState(INITIAL_VIOLATIONS);
  const [agentLogs, setAgentLogs] = useState(INITIAL_AGENTS);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));
  const [tlSeconds, setTlSeconds] = useState(18);
  const [tlPhase, setTlPhase] = useState('red');
  const [activeZone, setActiveZone] = useState('Nashik Zone');
  const [filters, setFilters] = useState({ ward: '', type: '', status: '', plate: '' });
  const [agentCollapsed, setAgentCollapsed] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [activeCam, setActiveCam] = useState('CAM-01');
  const [sessionCount, setSessionCount] = useState(23);
  const [activeTab, setActiveTab] = useState('live');

  // Stats State
  const [stats, setStats] = useState({
    violations: 1284,
    alerts: 7,
    challans: 389,
    fine: '₹1.94L'
  });

  // Clock & Traffic Light Effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour12: false }));

      setTlSeconds(prev => {
        if (prev <= 1) {
          if (tlPhase === 'red') { setTlPhase('green'); return 22; }
          if (tlPhase === 'green') { setTlPhase('amber'); return 4; }
          setTlPhase('red'); return 18;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [tlPhase]);

  const triggerDemo = () => {
    const randomV = INITIAL_VIOLATIONS[Math.floor(Math.random() * INITIAL_VIOLATIONS.length)];
    const newV = {
      ...randomV,
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      risk: Math.floor(Math.random() * 50) + 40
    };

    setViolations(prev => [newV, ...prev].slice(0, 25));
    setSessionCount(prev => prev + 1);
    
    // Update Stats
    setStats(prev => ({
      ...prev,
      violations: prev.violations + 1,
      alerts: (newV.status === 'urgent') ? prev.alerts + 1 : prev.alerts
    }));

    // Add Agent Logs
    const steps = [
      { tool: 'analyze', msg: `<strong>analyze_frame</strong> → ${newV.type} confirmed`, result: `${newV.conf}% conf` },
      { tool: 'log', msg: `<strong>log_violation</strong> → #TW-${Math.floor(Math.random()*9000)+1000} pushed`, result: 'Firebase ✓' },
      { tool: 'challan', msg: `<strong>generate_challan</strong> → Fine drafted`, result: 'PDF ready' }
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setAgentLogs(prev => [{ ...step, time: new Date().toLocaleTimeString('en-IN', { hour12: false }) }, ...prev].slice(0, 20));
        if (step.tool === 'challan') {
          setStats(prev => ({ ...prev, challans: prev.challans + 1 }));
        }
      }, i * 600);
    });
  };

  // Simulation Effect
  useEffect(() => {
    const demoTimer = setInterval(() => {
      triggerDemo();
    }, 14000);
    return () => clearInterval(demoTimer);
  }, []);

  const filteredViolations = violations.filter(v => {
    if (filters.ward && v.ward !== filters.ward) return false;
    if (filters.type && v.type !== filters.type) return false;
    if (filters.status && v.status !== filters.status) return false;
    if (filters.plate && !v.plate.toUpperCase().includes(filters.plate.toUpperCase())) return false;
    return true;
  });

  return (
    <div className="adm-shell">
      {/* TOP BAR */}
      <header className="adm-topbar">
        <div className="adm-topbar-brand">
          <svg viewBox="0 0 34 44" fill="none">
            <rect x="4" y="4" width="26" height="36" rx="3" fill="#E3F0FF" opacity=".9" />
            <path d="M10 14h14M10 20h10M10 26h12" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round" />
            <circle cx="27" cy="34" r="6" fill="#e85d26" />
            <path d="M25 34l1.5 1.5L29 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          TrafficWatch — Nashik
        </div>

        <div className="adm-topbar-stats">
          <div className="adm-tstat">
            <div className="adm-tstat-num">{stats.violations.toLocaleString('en-IN')}</div>
            <div className="adm-tstat-label">Violations Today</div>
          </div>
          <div className="adm-tstat">
            <div className="adm-tstat-num">{stats.alerts}</div>
            <div className="adm-tstat-label">Active Alerts</div>
          </div>
          <div className="adm-tstat">
            <div className="adm-tstat-num">{stats.challans}</div>
            <div className="adm-tstat-label">Challans Issued</div>
          </div>
          <div className="adm-tstat">
            <div className="adm-tstat-num">{stats.fine}</div>
            <div className="adm-tstat-label">Fine Recoverable</div>
          </div>
        </div>

        <div className="adm-topbar-right">
          <div className="adm-live-pill"><span className="adm-live-dot"></span>LIVE</div>
          <select 
            className="adm-zone-select" 
            value={activeZone}
            onChange={(e) => setActiveZone(e.target.value)}
          >
            {ZONES.map(z => <option key={z} value={z}>{z} ▼</option>)}
          </select>
          <div className="adm-clock">{time}</div>
          <button className="adm-demo-btn" onClick={triggerDemo}>▶ Demo</button>
          <button className="adm-signout-btn" style={{ marginLeft: '10px', height: '30px', padding: '0 10px' }} onClick={signOut}>Sign Out</button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="adm-filterbar">
        <span className="adm-filter-label">🗺 Filter by:</span>
        <div className="adm-filter-group">
          <label>Ward</label>
          <select value={filters.ward} onChange={e => setFilters({...filters, ward: e.target.value})}>
            {WARDS.map(w => <option key={w} value={w === 'All Wards' ? '' : w}>{w}</option>)}
          </select>
        </div>
        <div className="adm-filter-sep"></div>
        <div className="adm-filter-group">
          <label>Violation Type</label>
          <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
            {VIOLATION_TYPES.map(t => <option key={t} value={t === 'All Types' ? '' : t}>{t}</option>)}
          </select>
        </div>
        <div className="adm-filter-sep"></div>
        <div className="adm-filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">All</option>
            <option value="urgent">Urgent</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="adm-filter-sep"></div>
        <div className="adm-filter-group">
          <label>Plate No.</label>
          <input 
            type="text" 
            placeholder="e.g. MH-15-AB" 
            style={{ width: '120px' }} 
            value={filters.plate} 
            onChange={e => setFilters({...filters, plate: e.target.value})}
          />
        </div>
        <button className="adm-clear-filter" onClick={() => setFilters({ ward: '', type: '', status: '', plate: '' })}>✕ Clear Filters</button>
        {(filters.ward || filters.type || filters.status || filters.plate) && <span className="adm-filter-badge">Filtered</span>}
      </div>

      {/* MAIN BODY */}
      <div className="adm-body">
        {/* SIDEBAR */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-section-label">Navigation</div>
          <div className={`adm-nav-item ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
            <span>📡</span> Live Command <span className="adm-nav-badge">{stats.alerts}</span>
          </div>
          <div className={`adm-nav-item ${activeTab === 'violation' ? 'active' : ''}`} onClick={() => setActiveTab('violation')}>
            <span>📋</span> Violation Log <span className="adm-nav-badge blue">1.2K</span>
          </div>
          <div className={`adm-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <span>📊</span> Analytics
          </div>
          <div className={`adm-nav-item ${activeTab === 'heatmap' ? 'active' : ''}`} onClick={() => setActiveTab('heatmap')}>
            <span>🗺️</span> Heatmap
          </div>
          <div className={`adm-nav-item ${activeTab === 'challans' ? 'active' : ''}`} onClick={() => setActiveTab('challans')}>
            <span>📄</span> Challans <span className="adm-nav-badge green">{stats.challans}</span>
          </div>
          <div className={`adm-nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <span>🔍</span> NL Search
          </div>

          <div className="adm-sidebar-section-label" style={{ marginTop: '1.5rem' }}>Features</div>
          <div className="adm-nav-item" onClick={() => onOpenModal('camera')}>
            <span>📷</span> Camera Portal
          </div>

          <div className="adm-sidebar-section-label">Cameras Online</div>
          <div className="adm-cam-list">
            {['CAM-01', 'CAM-02', 'CAM-04', 'CAM-06', 'CAM-09'].map((c, i) => (
              <div key={c} className="adm-cam-row">
                <span className={`adm-cam-dot ${i === 0 ? 'on' : i === 2 ? 'warn' : 'on'}`}></span>
                <span className="adm-cam-name">{c} · {INITIAL_VIOLATIONS[i]?.loc}</span>
                <span className="adm-cam-fps">30 FPS</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT AREA */}
        <div className={`adm-content ${activeTab !== 'live' ? 'adm-full-content' : ''}`}>
          {activeTab === 'live' ? (
            <>
              {/* VIDEO SECTION */}
              <section className="adm-video-section">
                <div className="adm-section-head">
                  <span className="adm-section-title">Live Camera Feed</span>
                  <div className="adm-cam-switch-btns">
                    {['CAM-01', 'CAM-02', 'CAM-04', 'CAM-06', 'CAM-09'].map(c => (
                      <button 
                        key={c} 
                        className={`adm-cam-btn ${activeCam === c ? 'active' : ''}`}
                        onClick={() => setActiveCam(c)}
                      >{c}</button>
                    ))}
                  </div>
                </div>

                <div className="adm-video-frame">
                  <video 
                    src="/videoplayback.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                  />
                  <div className="adm-stop-line"></div>
                  {/* Traffic Light */}
                  <div className="adm-traffic-light">
                    <div className={`adm-tl-bulb ${tlPhase === 'red' ? 'red-on' : ''}`}></div>
                    <div className={`adm-tl-bulb ${tlPhase === 'amber' ? 'amber-on' : ''}`}></div>
                    <div className={`adm-tl-bulb ${tlPhase === 'green' ? 'green-on' : ''}`}></div>
                    <div className="adm-tl-phase" style={{ color: tlPhase === 'red' ? '#ef5350' : tlPhase === 'amber' ? '#ffa726' : '#66bb6a' }}>
                      {tlPhase.toUpperCase()}
                    </div>
                    <div className="adm-tl-timer">{tlSeconds}</div>
                  </div>

                  <div className="adm-overlay-badges">
                    <div className="adm-overlay-badge red">● REC · LIVE</div>
                    <div className="adm-overlay-badge">30 FPS · YOLOv8n</div>
                    <div className="adm-overlay-badge">{time}</div>
                  </div>

                  {/* Bounding Boxes Simulation */}
                  <div className="adm-bbox violation" style={{ left: '42%', top: '28%', width: '14%', height: '28%' }}>
                    <div className="adm-bbox-label">No Helmet</div>
                    <div className="adm-bbox-conf">94.2%</div>
                  </div>
                  <div className="adm-bbox risk" style={{ left: '18%', top: '46%', width: '16%', height: '22%' }}>
                    <div className="adm-bbox-label">Risk: 78</div>
                    <div className="adm-bbox-conf">MH-15-XZ</div>
                  </div>
                  <div className="adm-bbox normal" style={{ left: '65%', top: '38%', width: '13%', height: '20%' }}>
                    <div className="adm-bbox-label">Car · OK</div>
                    <div className="adm-bbox-conf">99%</div>
                  </div>
                </div>

                <div className="adm-video-infobar">
                  <div className="adm-vib-item">
                    <div className="adm-vib-label">Model</div>
                    <div className="adm-vib-val">YOLOv8n</div>
                  </div>
                  <div className="adm-vib-item">
                    <div className="adm-vib-label">Inference</div>
                    <div className="adm-vib-val green">28ms</div>
                  </div>
                  <div className="adm-vib-item">
                    <div className="adm-vib-label">Vehicles in Frame</div>
                    <div className="adm-vib-val orange">4</div>
                  </div>
                  <div className="adm-vib-item">
                    <div className="adm-vib-label">Session Violations</div>
                    <div className="adm-vib-val red">{sessionCount}</div>
                  </div>
                  <div className="adm-vib-item">
                    <div className="adm-vib-label">Light Phase</div>
                    <div className={`adm-vib-val ${tlPhase === 'red' ? 'red' : tlPhase === 'amber' ? 'orange' : 'green'}`}>
                      {tlPhase.toUpperCase()} · {tlSeconds}s
                    </div>
                  </div>
                  <div className="adm-vib-item">
                    <div className="adm-vib-label">Gemini Agent</div>
                    <div className="adm-vib-val green">ACTIVE</div>
                  </div>
                </div>
              </section>

              {/* RIGHT PANEL */}
              <aside className="adm-right-panel">
                <div className="adm-feed-section">
                  <div className="adm-feed-head">
                    <span className="adm-feed-title">Live Violation Feed</span>
                    <span className="adm-feed-count">{stats.alerts} Active</span>
                  </div>
                  <div className="adm-feed-scroll">
                    {filteredViolations.map(v => (
                      <div key={v.id} className={`adm-vcard ${v.status}`} onClick={() => setSelectedViolation(v)}>
                        <span className="adm-vc-icon">{v.icon}</span>
                        <div className="adm-vc-body">
                          <div className="adm-vc-type">{v.type} <em>· {v.type_hi}</em></div>
                          <div className="adm-vc-loc">📍 {v.loc} · {v.ward} Ward · {v.cam}</div>
                          <div className="adm-vc-narration">{v.narration}</div>
                          <div className="adm-vc-meta">
                            <span className="adm-vc-plate">{v.plate}</span>
                            <span className="adm-vc-conf">{v.conf}% conf</span>
                          </div>
                        </div>
                        <div className="adm-vc-right">
                          <span className="adm-vc-time">{v.time}</span>
                          <span className={`adm-vc-status ${v.status}`}>● {v.status.toUpperCase()}</span>
                          <span className={`adm-vc-risk ${v.risk >= 65 ? 'hi' : 'lo'}`}>RISK {v.risk}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="adm-agent-section">
                  <div className="adm-agent-head" onClick={() => setAgentCollapsed(!agentCollapsed)}>
                    <span className="adm-agent-title"><span className="adm-agent-active-dot"></span>Gemini Agent Log</span>
                    <span style={{ fontSize: '10px', color: '#666' }}>{agentCollapsed ? '▼ Show' : '▲ Hide'}</span>
                  </div>
                  {!agentCollapsed && (
                    <div className="adm-agent-log">
                      {agentLogs.map((log, i) => (
                        <div key={i} className="adm-arow">
                          <span className="adm-ar-time">{log.time}</span>
                          <span className={`adm-ar-tool ${log.tool}`}>{log.tool}</span>
                          <span className="adm-ar-msg" dangerouslySetInnerHTML={{ __html: log.msg }}></span>
                          <span style={{ fontSize: '9px', color: '#888' }}>{log.result}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </>
          ) : activeTab === 'violation' ? (
            <div className="adm-heatmap-container">
              <ViolationLog />
            </div>
          ) : activeTab === 'heatmap' ? (
            <div className="adm-heatmap-container">
              <HotspotHeatmap />
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="adm-heatmap-container">
              <AnalyticsDashboard />
            </div>
          ) : activeTab === 'challans' ? (
            <div className="adm-heatmap-container">
              <ChallanSection />
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#90A4AE' }}>
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section</h2>
              <p>This module is currently under development.</p>
            </div>
          ) }
        </div>
      </div>

      {/* CHALLAN MODAL */}
      {selectedViolation && (
        <div className="adm-modal-overlay" onClick={() => setSelectedViolation(null)}>
          <div className="adm-modal-box" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div>
                <div className="adm-modal-title">Auto-Generated Challan · स्वचालित चालान</div>
                <div className="adm-modal-sub">Gemini Agent · generate_challan()</div>
              </div>
              <button style={{ background: 'none', color: '#fff', fontSize: '16px', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedViolation(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-modal-stamp">🧠 Gemini Generated · IPC Section 194B</div>
              <div className="adm-challan-grid">
                <div className="adm-cf"><div className="adm-cf-label">Challan ID</div><div className="adm-cf-val">#TW-4821</div></div>
                <div className="adm-cf"><div className="adm-cf-label">Date & Time</div><div className="adm-cf-val">{selectedViolation.time}</div></div>
                <div className="adm-cf"><div className="adm-cf-label">Vehicle Plate</div><div className="adm-cf-val">{selectedViolation.plate}</div></div>
                <div className="adm-cf"><div className="adm-cf-label">Vehicle Type</div><div className="adm-cf-val">Two-Wheeler</div></div>
                <div className="adm-cf"><div className="adm-cf-label">Violation</div><div className="adm-cf-val">{selectedViolation.type}</div></div>
                <div className="adm-cf"><div className="adm-cf-label">Camera</div><div className="adm-cf-val">{selectedViolation.cam} · {selectedViolation.loc}</div></div>
                <div className="adm-cf"><div className="adm-cf-label">Confidence</div><div className="adm-cf-val">{selectedViolation.conf}%</div></div>
                <div className="adm-cf"><div className="adm-cf-label">Ward</div><div className="adm-cf-val">{selectedViolation.ward}</div></div>
              </div>
              <div className="adm-challan-narration">{selectedViolation.narration}</div>
              <div className="adm-challan-fine">
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Fine Amount · जुर्माना</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>IPC Section 194B · No Helmet</div>
                </div>
                <div className="adm-fine-amount">₹1,000</div>
              </div>
              <div className="adm-modal-actions">
                <button className="adm-modal-btn primary">📄 Download PDF Challan</button>
                <button className="adm-modal-btn ghost" onClick={() => setSelectedViolation(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
