import { useState, useEffect } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap";

const HOTSPOTS = [
  { id:1,  name:"CBS Chowk",            lat:19.9975, lng:73.7898, violations:318, helmet:142, signal:88,  triple:55, lane:33, risk:"critical", ward:"Nashik Road",    cam:"CAM-01, CAM-02" },
  { id:11, name:"Ashok Stambh",         lat:20.0021, lng:73.7858, violations:229, helmet:96,  signal:67,  triple:42, lane:24, risk:"critical", ward:"Nashik Central", cam:"CAM-14, CAM-15" },
  { id:2,  name:"MG Road Junction",     lat:20.0059, lng:73.7768, violations:270, helmet:118, signal:72,  triple:47, lane:33, risk:"high",     ward:"Nashik West",    cam:"CAM-03, CAM-04" },
  { id:3,  name:"Gangapur Road Circle", lat:20.0142, lng:73.7624, violations:218, helmet:89,  signal:64,  triple:38, lane:27, risk:"high",     ward:"Gangapur",       cam:"CAM-05"         },
  { id:10, name:"Mumbai Naka",          lat:19.9834, lng:73.7643, violations:188, helmet:79,  signal:55,  triple:33, lane:21, risk:"high",     ward:"Nashik South",   cam:"CAM-13"         },
  { id:9,  name:"College Road",         lat:20.0011, lng:73.7921, violations:143, helmet:61,  signal:42,  triple:24, lane:16, risk:"high",     ward:"Nashik Central", cam:"CAM-11, CAM-12" },
  { id:4,  name:"Dwarka Circle",        lat:19.9891, lng:73.7712, violations:177, helmet:72,  signal:49,  triple:34, lane:22, risk:"moderate", ward:"Dwarka",         cam:"CAM-06"         },
  { id:5,  name:"Panchavati Naka",      lat:20.0198, lng:73.8012, violations:131, helmet:47,  signal:35,  triple:28, lane:21, risk:"moderate", ward:"Panchavati",     cam:"CAM-07"         },
  { id:7,  name:"Sharanpur Road",       lat:20.0087, lng:73.7835, violations:94,  helmet:38,  signal:29,  triple:16, lane:11, risk:"moderate", ward:"Nashik East",    cam:"CAM-09"         },
  { id:6,  name:"Satpur MIDC Gate",     lat:19.9762, lng:73.7541, violations:77,  helmet:19,  signal:24,  triple:12, lane:22, risk:"low",      ward:"Satpur",         cam:"CAM-08"         },
  { id:8,  name:"Trimbak Road",         lat:20.0231, lng:73.7699, violations:62,  helmet:24,  signal:19,  triple:11, lane:8,  risk:"low",      ward:"Nashik North",   cam:"CAM-10"         },
  { id:12, name:"Pathardi Phata",       lat:19.9711, lng:73.8098, violations:55,  helmet:21,  signal:17,  triple:9,  lane:8,  risk:"low",      ward:"Nashik East",    cam:"CAM-16"         },
];

const RISK = {
  critical: { color:"#C62828", light:"rgba(198,40,40,0.18)",  border:"rgba(198,40,40,0.45)", label:"Critical" },
  high:     { color:"#e85d26", light:"rgba(232,93,38,0.14)",  border:"rgba(232,93,38,0.4)",  label:"High"     },
  moderate: { color:"#f59e0b", light:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.4)", label:"Moderate" },
  low:      { color:"#52b788", light:"rgba(82,183,136,0.1)",  border:"rgba(82,183,136,0.3)", label:"Low"      },
};

const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = ["00","02","04","06","08","10","12","14","16","18","20","22"];
const BASE_H = [3,2,1,1,2,8,20,44,52,33,26,28,24,19,18,22,30,38,46,36,22,14,9,5];
const HMAP = DAYS.map((_,di) =>
  HOURS.map((_,hi) => {
    const base = BASE_H[hi*2] ?? 0;
    const seed = (di*31 + hi*17) % 10;
    return Math.max(0, Math.round(base * (0.65 + seed*0.07)));
  })
);
const HMAXVAL = Math.max(...HMAP.flat());

const WEEK = [
  {day:"Mon",v:148},{day:"Tue",v:173},{day:"Wed",v:162},
  {day:"Thu",v:189},{day:"Fri",v:221},{day:"Sat",v:198},{day:"Sun",v:100},
];

const LAT_MIN=19.965, LAT_MAX=20.030, LNG_MIN=73.738, LNG_MAX=73.820;
const toX = lng => ((lng-LNG_MIN)/(LNG_MAX-LNG_MIN))*680+20;
const toY = lat => (1-(lat-LAT_MIN)/(LAT_MAX-LAT_MIN))*360+20;

function hmColor(v) {
  const r = Math.min(v/HMAXVAL, 1);
  if (r > 0.72) return `rgba(198,40,40,${(0.45+r*0.55).toFixed(2)})`;
  if (r > 0.42) return `rgba(232,93,38,${(0.3+r*0.5).toFixed(2)})`;
  if (r > 0.18) return `rgba(21,101,192,${(0.18+r*0.45).toFixed(2)})`;
  return `rgba(21,101,192,${Math.max(0.05,r*0.35).toFixed(2)})`;
}

function NashikMap({ hotspots, selected, onSelect, riskFilter }) {
  const maxV = Math.max(...hotspots.map(h=>h.violations));
  return (
    <div style={{background:"#0a1628",position:"relative"}}>
      <div style={{position:"absolute",top:10,right:10,zIndex:10,background:"rgba(10,22,40,0.92)",border:"1px solid rgba(255,255,255,.1)",padding:"10px 14px"}}>
        <div style={{fontSize:".56rem",fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:8}}>Risk Level</div>
        {Object.entries(RISK).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:v.color,boxShadow:`0 0 6px ${v.color}88`}}/>
            <span style={{fontSize:".62rem",color:"rgba(255,255,255,.55)",textTransform:"capitalize"}}>{v.label}</span>
          </div>
        ))}
        <div style={{borderTop:"1px solid rgba(255,255,255,.08)",marginTop:8,paddingTop:8,fontSize:".56rem",color:"rgba(255,255,255,.25)"}}>Bubble = violation count</div>
      </div>
      <div style={{position:"absolute",top:10,left:12,zIndex:10}}>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:".95rem",letterSpacing:3,color:"rgba(255,255,255,.1)"}}>NASHIK ZONE</div>
        <div style={{fontSize:".55rem",color:"rgba(255,255,255,.15)",letterSpacing:1.5}}>19.97°N · 73.78°E</div>
      </div>
      <svg viewBox="0 0 720 400" style={{width:"100%",height:460,display:"block"}}>
        {[...Array(12)].map((_,i)=><line key={"gx"+i} x1={i*64} y1={0} x2={i*64} y2={400} stroke="rgba(255,255,255,.025)" strokeWidth={1}/>)}
        {[...Array(7)].map((_,i) =><line key={"gy"+i} x1={0} y1={i*58} x2={720} y2={i*58} stroke="rgba(255,255,255,.025)" strokeWidth={1}/>)}
        <g stroke="rgba(21,101,192,.2)" strokeWidth={2} fill="none">
          <path d="M80,210 Q200,190 360,205 Q490,218 640,205"/>
          <path d="M360,15 Q352,115 360,205 Q368,285 360,395"/>
          <path d="M80,210 Q115,295 175,345 Q240,385 330,395"/>
          <path d="M640,205 Q600,285 545,335 Q488,375 415,395"/>
          <path d="M175,75 Q255,130 325,150 Q400,168 465,158 Q535,148 590,115"/>
        </g>
        <g stroke="rgba(21,101,192,.07)" strokeWidth={1} fill="none">
          <path d="M200,15 Q218,105 235,205 Q252,305 245,395"/>
          <path d="M50,125 Q200,145 360,135 Q505,125 665,145"/>
          <path d="M460,15 Q452,105 460,205 Q468,305 475,395"/>
          <path d="M145,305 Q275,282 360,292 Q445,302 565,280"/>
        </g>
        <path d="M50,165 Q180,158 285,168 Q362,178 445,162 Q525,148 675,158" stroke="rgba(33,150,243,.28)" strokeWidth={5} fill="none" strokeLinecap="round"/>
        <text x={318} y={152} fill="rgba(33,150,243,.3)" fontSize={8} letterSpacing={2} fontFamily="DM Sans,sans-serif">GODAVARI</text>
        {hotspots.map(h=>{
          const x=toX(h.lng), y=toY(h.lat);
          const r=10+(h.violations/maxV)*28;
          const cfg=RISK[h.risk];
          const isActive=selected?.id===h.id;
          const dimmed=riskFilter!=="all" && h.risk!==riskFilter;
          return (
            <g key={h.id} onClick={()=>onSelect(h)} style={{cursor:"pointer"}} opacity={dimmed?0.12:1}>
              {!dimmed && (h.risk==="critical"||h.risk==="high") && (
                <circle cx={x} cy={y} r={r} fill="none" stroke={cfg.color} strokeWidth={1.5} opacity={0.3}>
                  <animate attributeName="r" values={`${r};${r+16};${r}`} dur="2.4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle cx={x} cy={y} r={isActive?r+5:r} fill={cfg.light} stroke={cfg.color} strokeWidth={isActive?2.5:1.5}/>
              <circle cx={x} cy={y} r={isActive?5:3.5} fill={cfg.color}/>
              <text x={x} y={y-r-5} textAnchor="middle" fill={cfg.color} fontSize={10} fontFamily="Bebas Neue,cursive" letterSpacing={1}>{h.violations}</text>
              <text x={x} y={y+r+13} textAnchor="middle" fill={isActive?"rgba(255,255,255,.85)":"rgba(255,255,255,.42)"} fontSize={isActive?8.5:7.5} fontFamily="DM Sans,sans-serif">
                {h.name.length>17?h.name.slice(0,16)+"…":h.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HeatmapGrid() {
  const [hov, setHov] = useState(null);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"44px repeat(12,1fr)",gap:3,marginBottom:4}}>
        <div/>
        {HOURS.map(h=><div key={h} style={{fontSize:".57rem",color:"#90A4AE",textAlign:"center"}}>{h}:00</div>)}
      </div>
      {DAYS.map((day,di)=>(
        <div key={day} style={{display:"grid",gridTemplateColumns:"44px repeat(12,1fr)",gap:3,marginBottom:3}}>
          <div style={{fontSize:".66rem",color:"#546E7A",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:7}}>{day}</div>
          {HOURS.map((hr,hi)=>{
            const val=HMAP[di][hi];
            const key=di+"-"+hi;
            const isH=hov===key;
            return (
              <div key={hr}
                onMouseEnter={()=>setHov(key)}
                onMouseLeave={()=>setHov(null)}
                title={`${day} ${hr}:00 — ${val} violations`}
                style={{aspectRatio:"1",background:hmColor(val),borderRadius:3,cursor:"pointer",transform:isH?"scale(1.35)":"scale(1)",transition:"transform .15s",outline:isH?"2px solid rgba(255,255,255,.45)":"none",position:"relative",zIndex:isH?5:1}}
              />
            );
          })}
        </div>
      ))}
      <div style={{display:"flex",alignItems:"center",gap:5,marginTop:10,justifyContent:"flex-end"}}>
        <span style={{fontSize:".6rem",color:"#90A4AE",marginRight:4}}>Low</span>
        {[.06,.18,.35,.55,.75,.95].map((o,i)=>(
          <div key={i} style={{width:14,height:14,borderRadius:2,background:i<2?`rgba(21,101,192,${o})`:i<4?`rgba(232,93,38,${(o-.05).toFixed(2)})`:`rgba(198,40,40,${(o-.1).toFixed(2)})`}}/>
        ))}
        <span style={{fontSize:".6rem",color:"#90A4AE",marginLeft:4}}>High</span>
      </div>
    </div>
  );
}

function HotspotDetail({ spot }) {
  if (!spot) return (
    <div style={{background:"#1a2535",border:"1px solid rgba(232,93,38,.12)",padding:"1.4rem",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:180}}>
      <div style={{fontSize:"2rem",opacity:.25,marginBottom:8}}>📍</div>
      <div style={{fontSize:".73rem",color:"rgba(248,245,240,.22)",textAlign:"center",lineHeight:1.7}}>Click any hotspot on the map<br/>to view breakdown</div>
    </div>
  );
  const cfg=RISK[spot.risk];
  return (
    <div style={{background:"#1a2535",border:`1px solid ${cfg.border}`,padding:"1.4rem"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",fontWeight:700,color:"#E3F0FF",lineHeight:1.2}}>{spot.name}</div>
          <div style={{fontSize:".63rem",color:"rgba(248,245,240,.28)",marginTop:3}}>{spot.ward} · {spot.cam}</div>
        </div>
        <span style={{fontSize:".6rem",fontWeight:700,padding:"3px 8px",background:cfg.light,border:`1px solid ${cfg.border}`,color:cfg.color,whiteSpace:"nowrap"}}>{cfg.label}</span>
      </div>
      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:"2.6rem",letterSpacing:4,color:cfg.color,lineHeight:1,marginBottom:12}}>{spot.violations}</div>
      {[{label:"🪖 No Helmet",v:spot.helmet,color:"#C62828"},{label:"🚦 Signal Jump",v:spot.signal,color:"#e85d26"},{label:"👥 Triple Riding",v:spot.triple,color:"#1565C0"},{label:"🚗 Wrong Lane",v:spot.lane,color:"#52b788"}].map(b=>(
        <div key={b.label} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <span style={{fontSize:".64rem",color:"rgba(248,245,240,.52)"}}>{b.label}</span>
            <span style={{fontSize:".64rem",fontWeight:600,color:"rgba(248,245,240,.8)"}}>{b.v}</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,.05)"}}>
            <div style={{height:"100%",width:`${(b.v/spot.violations)*100}%`,background:b.color,transition:"width 1s ease"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekBars() {
  const max=Math.max(...WEEK.map(d=>d.v));
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:80}}>
      {WEEK.map(d=>(
        <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontSize:".57rem",color:"#90A4AE"}}>{d.v}</span>
          <div style={{width:"100%",height:Math.max((d.v/max)*60,3),background:d.day==="Fri"?"#e85d26":"linear-gradient(0deg,#1565C0,#42a5f5)",borderRadius:"2px 2px 0 0"}}/>
          <span style={{fontSize:".6rem",color:"#546E7A"}}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

const FBtn = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"4px 12px",fontSize:".7rem",fontWeight:500,border:`1px solid ${active?"#0B3D91":"rgba(21,101,192,.2)"}`,color:active?"#fff":"#546E7A",background:active?"#0B3D91":"transparent",cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}>{label}</button>
);

const SecLabel = ({children}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:".67rem",fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#1565C0",marginBottom:14,marginTop:6}}>
    <span>{children}</span>
    <div style={{flex:1,height:1,background:"rgba(21,101,192,.15)"}}/>
  </div>
);

const CardHead = ({title,sub,badge}) => (
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
    <div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",fontWeight:700,color:"#0B3D91"}}>{title}</div>
      {sub && <div style={{fontSize:".65rem",color:"#90A4AE",marginTop:2}}>{sub}</div>}
    </div>
    {badge && <span style={{fontSize:".58rem",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",padding:"3px 8px",background:"rgba(21,101,192,.07)",color:"#1565C0"}}>{badge}</span>}
  </div>
);

export default function HotspotHeatmap() {
  const [selected,   setSelected]   = useState(null);
  const [riskFilter, setRiskFilter] = useState("all");
  const [period,     setPeriod]     = useState("week");
  const [bars,       setBars]       = useState(false);

  useEffect(()=>{ setTimeout(()=>setBars(true),300); },[]);

  const sorted = [...HOTSPOTS].sort((a,b)=>b.violations-a.violations);
  const maxV   = sorted[0].violations;
  const total  = HOTSPOTS.reduce((s,h)=>s+h.violations,0);
  const handleSelect = (h) => setSelected((p) => (p?.id === h.id ? null : h));

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#F4F6F8",minHeight:"100%",color:"#1a2530"}}>
      <style>{`
        @import url('${FONT_URL}');
        /* *{box-sizing:border-box;margin:0;padding:0} */
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(21,101,192,.25)}
        @keyframes breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.5)}}
      `}</style>

      {/* BANNER (Optional: If we want it to look like the standalone version) */}
      <div style={{background:"linear-gradient(135deg,#0B3D91 0%,#1565C0 55%,#0d47a1 100%)",padding:"2rem",position:"relative",overflow:"hidden", borderRadius: '8px', marginBottom: '1.5rem'}}>
        <div style={{position:"absolute",inset:0,opacity:.4,backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M20 20h20v20H20zM0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`}}/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:".67rem",fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(227,240,255,.55)",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <span style={{display:"inline-block",width:20,height:1,background:"rgba(227,240,255,.4)"}}/>
            Phase 04 · Hotspot Intelligence · नाशिक हॉटस्पॉट
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,2.5vw,2.2rem)",fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:8}}>
            Nashik Violation <em style={{fontStyle:"italic",fontWeight:400,color:"#E3F0FF"}}>Hotspot Map.</em>
          </h1>
          <div style={{display:"flex",gap:0,marginTop:"1rem",flexWrap:"wrap"}}>
            {[
              {num:total.toLocaleString("en-IN"), label:"Total Violations",  trend:"↑ +14.2% this week"},
              {num:HOTSPOTS.length,               label:"Monitored Zones",   trend:"12 intersections"},
              {num:HOTSPOTS.filter(h=>h.risk==="critical").length, label:"Critical Hotspots", trend:"🔴 Immediate action"},
            ].map((k,i,arr)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",padding:"8px 16px",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRight:i===arr.length-1?"1px solid rgba(255,255,255,.12)":"none",backdropFilter:"blur(10px)",minWidth:110}}>
                <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:"1.4rem",letterSpacing:2,color:"#fff",lineHeight:1}}>{k.num}</span>
                <span style={{fontSize:".5rem",fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,.38)",marginTop:3}}>{k.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{padding:"0 0 2rem"}}>

        {/* FILTER BAR */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"11px 16px",background:"#fff",border:"1px solid rgba(21,101,192,.1)",marginBottom:18,flexWrap:"wrap"}}>
          <span style={{fontSize:".63rem",fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#546E7A",whiteSpace:"nowrap"}}>Period</span>
          {[["today","Today"],["week","This Week"],["month","Month"],["90d","90 Days"]].map(([v,l])=>(
            <FBtn key={v} label={l} active={period===v} onClick={()=>setPeriod(v)}/>
          ))}
          <div style={{width:1,height:20,background:"rgba(21,101,192,.15)",margin:"0 4px"}}/>
          <span style={{fontSize:".63rem",fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#546E7A",whiteSpace:"nowrap"}}>Risk</span>
          {[["all","All"],["critical","Critical"],["high","High"],["moderate","Moderate"],["low","Low"]].map(([v,l])=>(
            <FBtn key={v} label={l} active={riskFilter===v} onClick={()=>setRiskFilter(v)}/>
          ))}
        </div>

        {/* ROW 1: MAP + SIDEBAR */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,marginBottom:16,alignItems:"start"}}>
          <div style={{background:"#0a1628",border:"1px solid rgba(21,101,192,.12)",overflow:"hidden", borderRadius: '8px'}}>
            <div style={{padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"#0f1e35",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:".98rem",fontWeight:700,color:"#E3F0FF"}}>Nashik City — Violation Cluster Map</div>
                <div style={{fontSize:".63rem",color:"rgba(248,245,240,.28)",marginTop:2}}>Bubble size = violation count · Click to inspect</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#52b788",boxShadow:"0 0 6px #52b78888"}}/>
                <span style={{fontSize:".6rem",color:"rgba(255,255,255,.35)"}}>Live</span>
              </div>
            </div>
            <NashikMap hotspots={HOTSPOTS} selected={selected} onSelect={handleSelect} riskFilter={riskFilter}/>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <HotspotDetail spot={selected}/>
            <div style={{background:"#fff",border:"1px solid rgba(21,101,192,.08)",padding:"1.2rem", borderRadius: '8px'}}>
              <CardHead title="Top Hotspots" sub="Ranked by violations" badge="RANK"/>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto"}}>
                {sorted.map((h,i)=>{
                  const cfg=RISK[h.risk];
                  const isA=selected?.id===h.id;
                  return (
                    <div key={h.id} onClick={()=>handleSelect(h)}
                      style={{padding:"9px 10px",background:isA?cfg.light:"rgba(21,101,192,.02)",border:`1px solid ${isA?cfg.border:"rgba(21,101,192,.07)"}`,cursor:"pointer",transition:"all .18s"}}>
                      <div style={{display:"flex",alignItems:"center"}}>
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,background:cfg.light,border:`1px solid ${cfg.border}`,fontSize:".6rem",fontWeight:700,color:cfg.color,marginRight:8,flexShrink:0}}>{i+1}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:".72rem",fontWeight:600,color:"#1a2530"}}>{h.name}</div>
                          <div style={{fontSize:".6rem",color:"#90A4AE",marginTop:1}}>{h.ward}</div>
                        </div>
                        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:"1.15rem",letterSpacing:2,color:cfg.color}}>{h.violations}</span>
                      </div>
                      {isA && <div style={{marginTop:5,height:3,background:"rgba(21,101,192,.06)"}}><div style={{height:"100%",width:`${(h.violations/maxV)*100}%`,background:cfg.color}}/></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: SECTION BARS + WEEKLY + RISK */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={{background:"#fff",border:"1px solid rgba(21,101,192,.08)",padding:"1.3rem", borderRadius: '8px'}}>
            <CardHead title="Violations by Section" sub="All 12 zones · this week" badge="BAR"/>
            {sorted.map(h=>{
              const cfg=RISK[h.risk];
              return (
                <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <span style={{fontSize:".64rem",color:"#546E7A",width:108,flexShrink:0,textAlign:"right"}}>{h.name.length>14?h.name.slice(0,13)+"…":h.name}</span>
                  <div style={{flex:1,height:8,background:"rgba(21,101,192,.06)",overflow:"hidden", borderRadius: '4px'}}>
                    <div style={{height:"100%",width:bars?`${(h.violations/maxV)*100}%`:0,background:cfg.color,transition:"width 1.3s cubic-bezier(.16,1,.3,1)"}}/>
                  </div>
                  <span style={{fontSize:".68rem",fontWeight:600,color:"#0B3D91",width:30,textAlign:"right"}}>{h.violations}</span>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"#fff",border:"1px solid rgba(21,101,192,.08)",padding:"1.3rem", borderRadius: '8px'}}>
              <CardHead title="Weekly Trend" sub="Total violations · this week" badge="7-DAY"/>
              <WeekBars/>
            </div>
            <div style={{background:"#fff",border:"1px solid rgba(21,101,192,.08)",padding:"1.3rem", borderRadius: '8px'}}>
              <CardHead title="Risk Summary" sub="Zone classification"/>
              {Object.entries(RISK).map(([k,v])=>{
                const cnt=HOTSPOTS.filter(h=>h.risk===k).length;
                const t2=HOTSPOTS.reduce((s,h)=>s+(h.risk===k?h.violations:0),0);
                return (
                  <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:8,height:8,borderRadius:2,background:v.color,flexShrink:0}}/>
                    <span style={{fontSize:".7rem",color:"#546E7A",textTransform:"capitalize",width:68}}>{k}</span>
                    <div style={{flex:1,height:6,background:"rgba(21,101,192,.06)", borderRadius: '3px'}}>
                      <div style={{height:"100%",width:bars?`${(t2/total)*100}%`:0,background:v.color,transition:"width 1.4s ease"}}/>
                    </div>
                    <span style={{fontSize:".68rem",fontWeight:600,color:"#0B3D91",width:20,textAlign:"right"}}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROW 3: TYPE CARDS */}
        <SecLabel>Type Breakdown · उल्लंघन प्रकार</SecLabel>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {emoji:"🪖",name:"No Helmet · बिना हेलमेट",    key:"helmet",pct:41},
            {emoji:"🚦",name:"Signal Jump · सिग्नल उल्लंघन",key:"signal",pct:26},
            {emoji:"👥",name:"Triple Riding · तीन सवारी",   key:"triple",pct:19},
            {emoji:"🚗",name:"Wrong Lane · गलत लेन",         key:"lane",  pct:14},
          ].map(t=>{
            const tv=HOTSPOTS.reduce((s,h)=>s+h[t.key],0);
            return (
              <div key={t.key} style={{background:"#1a2535",border:"1px solid rgba(232,93,38,.12)",padding:"1rem",position:"relative",overflow:"hidden", borderRadius: '8px'}}>
                <div style={{fontSize:"1.5rem",marginBottom:6}}>{t.emoji}</div>
                <div style={{fontSize:".67rem",fontWeight:600,color:"rgba(227,240,255,.88)",marginBottom:3}}>{t.name}</div>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:"2rem",letterSpacing:3,color:"#f4a261",lineHeight:1}}>{tv.toLocaleString("en-IN")}</div>
                <div style={{fontSize:".6rem",color:"rgba(248,245,240,.28)",marginTop:3}}>{t.pct}% of total · Nashik Zone</div>
                <div style={{height:3,background:"rgba(255,255,255,.05)",marginTop:10,overflow:"hidden"}}>
                  <div style={{height:"100%",width:bars?`${Math.min(t.pct*2.4,100)}%`:0,background:"linear-gradient(90deg,#f4a261,#e85d26)",transition:"width 1.3s ease"}}/>
                </div>
                <div style={{position:"absolute",bottom:-14,right:4,fontFamily:"'Bebas Neue',cursive",fontSize:"3.8rem",color:"rgba(255,255,255,.025)",letterSpacing:4,lineHeight:1,pointerEvents:"none"}}>{t.pct}%</div>
              </div>
            );
          })}
        </div>

        {/* ROW 4: HEATMAP */}
        <SecLabel>Hour × Day Heatmap · घंटेवार पैटर्न</SecLabel>
        <div style={{background:"#fff",border:"1px solid rgba(21,101,192,.08)",padding:"1.4rem",marginBottom:16, borderRadius: '8px'}}>
          <CardHead title="Peak Hour Intelligence — Nashik Zone" sub="Hour-by-day intensity · hover for count · darker = more violations" badge="HEATMAP"/>
          <HeatmapGrid/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
            {[
              {label:"Busiest Hour", val:"8:00 – 9:00 AM", color:"#52b788"},
              {label:"Peak Day",     val:"Friday",          color:"#f4a261"},
              {label:"Quiet Period", val:"2:00 – 5:00 AM", color:"#1565C0"},
            ].map(p=>(
              <div key={p.label} style={{padding:"9px 13px",background:"rgba(21,101,192,.03)",borderLeft:`2px solid ${p.color}`}}>
                <div style={{fontSize:".58rem",letterSpacing:2,textTransform:"uppercase",color:"#90A4AE",marginBottom:3}}>{p.label}</div>
                <div style={{fontSize:".85rem",fontWeight:600,color:p.color}}>{p.val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
