import { useState } from 'react';

const TOOLS = [
  {
    bg: 'linear-gradient(135deg,#0d1b2e,#1565C0)',
    emoji: '🗺️',
    label: 'VIOLATION HEATMAP',
    badge: { text: '● LIVE', style: { background: 'rgba(82,183,136,.9)', color: '#fff' } },
    tag: 'City Intelligence',
    tagColor: '#1565C0',
    title: 'Violation Heatmap',
    desc: 'See where violations cluster across every intersection and ward in real time.',
    tags: [{ cls: 'tt-blue', text: 'Heat Zones' }, { cls: 'tt-blue', text: 'Ward Filter' }],
    svgBg: true,
  },
  {
    bg: 'linear-gradient(135deg,#1a2535,#e85d26)',
    emoji: '📹',
    label: 'CAMERA NETWORK',
    badge: { text: '🔥 47 LIVE', style: { background: 'rgba(232,93,38,.9)', color: '#fff' } },
    tag: 'Live Surveillance',
    tagColor: '#e85d26',
    title: 'Camera Dashboard',
    desc: 'Monitor all 47 active CCTV feeds across 5 cities from one unified panel.',
    tags: [{ cls: 'tt-red', text: 'Live Feed' }, { cls: 'tt-red', text: 'Health Monitor' }],
  },
  {
    bg: 'linear-gradient(135deg,#1a2535,#2E7D32)',
    emoji: '📊',
    label: 'ANALYTICS',
    badge: { text: 'NEW', style: { background: 'rgba(244,162,97,.9)', color: '#0B3D91' } },
    tag: 'Zone Analytics',
    tagColor: '#2E7D32',
    title: 'Officer Reports',
    desc: 'Daily, weekly, and monthly enforcement stats per zone for traffic command.',
    tags: [{ cls: 'tt-green', text: 'Export PDF' }, { cls: 'tt-green', text: 'Trend Analysis' }],
  },
  {
    bg: 'linear-gradient(135deg,#0d1b2e,#0B3D91)',
    emoji: '📱',
    label: 'OFFICER APP',
    badge: { text: 'COMING SOON', style: { background: 'rgba(82,183,136,.9)', color: '#fff' } },
    tag: 'Mobile Alerts',
    tagColor: '#1565C0',
    title: 'Officer Mobile App',
    desc: 'On-ground officers receive instant violation alerts with GPS location and snapshot.',
    tags: [{ cls: 'tt-blue', text: 'Push Alerts' }, { cls: 'tt-blue', text: 'GPS Dispatch' }],
  },
];

export default function ToolsSlider() {
  const [pos, setPos] = useState(0);

  const next = () => setPos((p) => Math.min(p + 1, 2));
  const prev = () => setPos((p) => Math.max(p - 1, 0));

  return (
    <section className="tools-section" id="tools">
      <div className="tools-inner">
        <div className="tools-header">
          <div className="tools-title-wrap">
            <span>Explore</span>
            <h2 className="tools-title">Your City, <em>Visualised.</em></h2>
          </div>
          <div className="slider-btns">
            <button className="sl-btn" onClick={prev}>←</button>
            <button className="sl-btn" onClick={next}>→</button>
          </div>
        </div>
        <div className="slider-track-wrap">
          <div className="slider-track" style={{ transform: `translateX(calc(-${pos} * (50% + .75rem)))` }}>
            {TOOLS.map((tool) => (
              <div className="tool-card" key={tool.title}>
                <div className="tool-card-img" style={{ background: tool.bg }}>
                  {tool.svgBg && (
                    <svg style={{ position: 'absolute', inset: 0, opacity: 0.5 }} width="100%" height="100%">
                      <circle cx="30%" cy="45%" r="40" fill="rgba(255,100,50,.5)"/>
                      <circle cx="60%" cy="30%" r="55" fill="rgba(255,180,50,.35)"/>
                      <circle cx="75%" cy="65%" r="30" fill="rgba(232,93,38,.6)"/>
                    </svg>
                  )}
                  <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem' }}>{tool.emoji}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '.85rem', letterSpacing: '4px', color: 'rgba(255,255,255,.7)', marginTop: '.3rem' }}>{tool.label}</div>
                  </div>
                  <div className="badge-pill" style={tool.badge.style}>{tool.badge.text}</div>
                </div>
                <div className="tool-card-body">
                  <div className="tool-card-tag" style={{ color: tool.tagColor }}>{tool.tag}</div>
                  <h3 className="tool-card-title">{tool.title}</h3>
                  <p className="tool-card-desc">{tool.desc}</p>
                  <div className="tool-tags">
                    {tool.tags.map((t) => (
                      <span key={t.text} className={`tool-tag ${t.cls}`}>{t.text}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
