import { useState, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";

// ─── INITIAL DATA ──────────────────────────────────────────────────────────────
const INITIAL_GOALS = [
  { id: 1, name: "Health & Fitness", icon: "💪", current: 20, target: 60, color: "#22c55e", notes: "Exercise 4x/week, better diet" },
  { id: 2, name: "Wealth & Finance", icon: "💰", current: 15, target: 50, color: "#f59e0b", notes: "Save, invest, grow income" },
  { id: 3, name: "Personality & Mindset", icon: "🧠", current: 25, target: 55, color: "#8b5cf6", notes: "Read, meditate, grow" },
  { id: 4, name: "Career & Skills", icon: "🚀", current: 30, target: 70, color: "#3b82f6", notes: "Land new job, upskill" },
  { id: 5, name: "Social & Relationships", icon: "🤝", current: 35, target: 60, color: "#ec4899", notes: "Network, nurture relationships" },
  { id: 6, name: "Travel & Experiences", icon: "✈️", current: 10, target: 40, color: "#14b8a6", notes: "Visit 3+ new places" },
];

const INITIAL_CERTS = [
  { id: 1, name: "AWS Solutions Architect", category: "Cloud", status: "In Progress", progress: 45, targetDate: "2026-06-30", studyHours: 32, totalHours: 80, color: "#f59e0b" },
  { id: 2, name: "Google Data Analytics", category: "Data", status: "Planned", progress: 0, targetDate: "2026-09-30", studyHours: 0, totalHours: 60, color: "#3b82f6" },
  { id: 3, name: "PMP Certification", category: "Management", status: "Planned", progress: 0, targetDate: "2026-12-01", studyHours: 0, totalHours: 120, color: "#8b5cf6" },
];

const INITIAL_PROJECTS = [
  { id: 1, name: "Personal Portfolio Website", category: "Web", status: "In Progress", progress: 60, startDate: "2026-01-15", targetDate: "2026-05-01", notes: "React + Node.js", milestones: ["Design ✅", "Frontend 🔄", "Backend ⬜", "Deploy ⬜"] },
  { id: 2, name: "Budget Tracker App", category: "Mobile", status: "Planned", progress: 0, startDate: "2026-05-01", targetDate: "2026-09-01", notes: "React Native", milestones: ["Wireframes ⬜", "MVP ⬜", "Launch ⬜"] },
  { id: 3, name: "ML Side Project", category: "AI/ML", status: "Planned", progress: 10, startDate: "2026-03-01", targetDate: "2026-12-01", notes: "Python, scikit-learn", milestones: ["Research ✅", "Dataset ⬜", "Model ⬜", "Deploy ⬜"] },
];

const INITIAL_TRAVEL = [
  { id: 1, name: "Goa, India", type: "Completed", date: "2026-01-20", notes: "Beaches, relaxation 🏖️" },
  { id: 2, name: "Rajasthan, India", type: "Planned", date: "2026-07-15", notes: "Culture, forts, history 🏰" },
  { id: 3, name: "Thailand", type: "Planned", date: "2026-12-20", notes: "Year-end vacation 🌴" },
];

const INITIAL_JOBS = [
  { id: 1, company: "TechCorp", role: "Senior Dev", status: "Applied", date: "2026-04-01", notes: "Sent resume" },
  { id: 2, company: "StartupXYZ", role: "Full Stack", status: "Interview", date: "2026-04-05", notes: "1st round done" },
  { id: 3, company: "BigTech Inc", role: "SDE II", status: "Applied", date: "2026-04-10", notes: "Via LinkedIn" },
  { id: 4, company: "FinTech Co", role: "Backend Dev", status: "Rejected", date: "2026-03-20", notes: "Culture mismatch" },
];

const INITIAL_INVESTMENTS = [
  { id: 1, name: "Emergency Fund", category: "Savings", current: 30000, target: 100000, status: "In Progress", notes: "6 months expenses", icon: "🏦" },
  { id: 2, name: "Mutual Funds SIP", category: "Investment", current: 5000, target: 60000, status: "In Progress", notes: "Monthly SIP ₹5000", icon: "📈" },
  { id: 3, name: "Crypto (BTC/ETH)", category: "Investment", current: 0, target: 20000, status: "Planned", notes: "Only 5% of portfolio", icon: "🪙" },
  { id: 4, name: "Term Insurance", category: "Protection", current: 0, target: 1, status: "Planned", notes: "Get insured ASAP", icon: "🛡️" },
];

const INITIAL_IDEAS = [
  { id: 1, title: "SaaS expense tracker for freelancers", tag: "Business", status: "Idea", date: "2026-03-10", notes: "Gap in market for India" },
  { id: 2, title: "YouTube channel on personal finance", tag: "Career", status: "In Progress", date: "2026-02-15", notes: "Record first video" },
  { id: 3, title: "Write a blog on system design", tag: "Tech", status: "Idea", date: "2026-04-01", notes: "Target developers in India" },
];

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444", "#f97316"];
const TAGS = ["Tech", "Business", "Career", "Personal", "Finance", "Health"];
const STATUS_COLORS = {
  "Completed": "bg-green-100 text-green-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Planned": "bg-gray-100 text-gray-600",
  "Applied": "bg-yellow-100 text-yellow-700",
  "Interview": "bg-purple-100 text-purple-700",
  "Rejected": "bg-red-100 text-red-700",
  "Offer": "bg-green-100 text-green-700",
  "Idea": "bg-gray-100 text-gray-600",
};

// ─── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── PROGRESS RING ─────────────────────────────────────────────────────────────
function ProgressRing({ current, target, color, size = 80 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(current / 100, 1);
  const tpct = Math.min(target / 100, 1);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#d1d5db" strokeWidth="4"
        strokeDasharray={`${tpct * circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeDashoffset="0" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">{current}%</text>
    </svg>
  );
}

// ─── YEAR PROGRESS BAR ────────────────────────────────────────────────────────
function YearProgress() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const pct = Math.round(((now - start) / (end - start)) * 100);
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white mb-6">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-blue-100 text-sm font-medium">2026 Year Progress</p>
          <p className="text-3xl font-black">{pct}% Complete</p>
        </div>
        <div className="text-right">
          <p className="text-blue-100 text-sm">Days Remaining</p>
          <p className="text-2xl font-black">{daysLeft}</p>
        </div>
      </div>
      <div className="w-full bg-blue-800 bg-opacity-50 rounded-full h-4">
        <div className="bg-white rounded-full h-4 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-blue-100 text-xs mt-2">Make every day count — {daysLeft} days left to hit your targets!</p>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ goals, certs, projects, jobs, travel }) {
  const radarData = goals.map(g => ({ subject: g.name.split(" ")[0], current: g.current, target: g.target }));
  const completedGoals = goals.filter(g => g.current >= g.target).length;
  const completedCerts = certs.filter(c => c.status === "Completed").length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const activeJobs = jobs.filter(j => j.status === "Interview" || j.status === "Offer").length;
  const monthlyData = [
    { month: "Jan", progress: 15 }, { month: "Feb", progress: 22 },
    { month: "Mar", progress: 30 }, { month: "Apr", progress: 38 },
    { month: "May", progress: 38 }, { month: "Jun", progress: 38 },
    { month: "Jul", progress: 38 }, { month: "Aug", progress: 38 },
    { month: "Sep", progress: 38 }, { month: "Oct", progress: 38 },
    { month: "Nov", progress: 38 }, { month: "Dec", progress: 38 },
  ];
  return (
    <div>
      <YearProgress />
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {[
          { label: "Goals On Track", val: `${completedGoals}/${goals.length}`, icon: "🎯", color: "bg-blue-50 text-blue-700" },
          { label: "Certs Done", val: `${completedCerts}/${certs.length}`, icon: "📜", color: "bg-green-50 text-green-700" },
          { label: "Projects Active", val: `${completedProjects}/${projects.length}`, icon: "🛠️", color: "bg-purple-50 text-purple-700" },
          { label: "Job Interviews", val: activeJobs, icon: "💼", color: "bg-yellow-50 text-yellow-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black">{s.val}</div>
            <div className="text-xs font-medium opacity-70">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">🕸️ Life Balance Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Target" dataKey="target" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.3} />
              <Radar name="Current" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">📈 2026 Monthly Progress</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── GOALS TAB ────────────────────────────────────────────────────────────────
function GoalsTab({ goals, setGoals }) {
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "🎯", current: 10, target: 50, color: "#3b82f6", notes: "" });

  const openAdd = () => { setForm({ name: "", icon: "🎯", current: 10, target: 50, color: "#3b82f6", notes: "" }); setEditing(null); setShowAdd(true); };
  const openEdit = (g) => { setForm({ ...g }); setEditing(g.id); setShowAdd(true); };
  const save = () => {
    if (!form.name) return;
    if (editing) setGoals(goals.map(g => g.id === editing ? { ...g, ...form } : g));
    else setGoals([...goals, { ...form, id: Date.now() }]);
    setShowAdd(false);
  };
  const del = (id) => { setGoals(goals.filter(g => g.id !== id)); if (selected?.id === id) setSelected(null); };

  const barData = goals.map(g => ({ name: g.name.split(" ")[0], Current: g.current, Target: g.target }));

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black text-gray-800">🎯 Life Goals & Progress</h2>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">+ Add Goal</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-sm">Current vs Target (click a bar to focus)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} onClick={(e) => { if (e?.activePayload) { const g = goals.find(g => g.name.startsWith(e.activeLabel)); setSelected(g || null); }}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Bar dataKey="Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Current" radius={[4, 4, 0, 0]}>
              {goals.map((g, i) => <Cell key={i} fill={g.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selected && (
        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
          <div className="flex justify-between">
            <h3 className="font-bold text-gray-800">{selected.icon} {selected.name} — Detailed View</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <ProgressRing current={selected.current} target={selected.target} color={selected.color} size={100} />
            <div>
              <p className="text-sm text-gray-500">Current: <span className="font-bold text-gray-800">{selected.current}%</span></p>
              <p className="text-sm text-gray-500">Target: <span className="font-bold" style={{ color: selected.color }}>{selected.target}%</span></p>
              <p className="text-sm text-gray-500">Gap: <span className="font-bold text-red-500">{selected.target - selected.current}% to go</span></p>
              <p className="text-xs text-gray-400 mt-1">{selected.notes}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {goals.map(g => (
          <div key={g.id} className="bg-white rounded-2xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(g === selected ? null : g)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{g.icon}</span>
                <span className="font-semibold text-gray-800 text-sm">{g.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={e => { e.stopPropagation(); openEdit(g); }} className="text-gray-400 hover:text-blue-600 text-xs">✏️</button>
                <button onClick={e => { e.stopPropagation(); del(g.id); }} className="text-gray-400 hover:text-red-600 text-xs">🗑️</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressRing current={g.current} target={g.target} color={g.color} size={64} />
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Current: {g.current}%</span><span>Target: {g.target}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full" style={{ width: `${g.target}%`, background: "#e5e7eb" }} />
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mt-1 relative">
                  <div className="h-3 rounded-full transition-all" style={{ width: `${g.current}%`, background: g.color }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{g.notes}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title={editing ? "Edit Goal" : "Add New Goal"} onClose={() => setShowAdd(false)}>
          {[["Goal Name", "name", "text"], ["Icon (emoji)", "icon", "text"], ["Current %", "current", "number"], ["Target %", "target", "number"]].map(([label, key, type]) => (
            <div key={key} className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Color</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-lg border cursor-pointer" />
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" rows={2} />
          </div>
          <button onClick={save} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Save</button>
        </Modal>
      )}
    </div>
  );
}

// ─── CERTIFICATIONS TAB ───────────────────────────────────────────────────────
function CertsTab({ certs, setCerts }) {
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", status: "Planned", progress: 0, targetDate: "", studyHours: 0, totalHours: 40, color: "#3b82f6" });

  const openAdd = () => { setForm({ name: "", category: "", status: "Planned", progress: 0, targetDate: "", studyHours: 0, totalHours: 40, color: "#3b82f6" }); setEditing(null); setShowAdd(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditing(c.id); setShowAdd(true); };
  const save = () => {
    if (!form.name) return;
    if (editing) setCerts(certs.map(c => c.id === editing ? { ...c, ...form } : c));
    else setCerts([...certs, { ...form, id: Date.now() }]);
    setShowAdd(false);
  };
  const del = (id) => { setCerts(certs.filter(c => c.id !== id)); if (selected?.id === id) setSelected(null); };

  const stats = [
    { label: "Total", val: certs.length, color: "bg-gray-100 text-gray-700" },
    { label: "Completed", val: certs.filter(c => c.status === "Completed").length, color: "bg-green-100 text-green-700" },
    { label: "In Progress", val: certs.filter(c => c.status === "In Progress").length, color: "bg-blue-100 text-blue-700" },
    { label: "Planned", val: certs.filter(c => c.status === "Planned").length, color: "bg-gray-100 text-gray-600" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black text-gray-800">📜 Certifications & Studies</h2>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">+ Add Cert</button>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(s => <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}><div className="text-2xl font-black">{s.val}</div><div className="text-xs">{s.label}</div></div>)}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-5">
          <div className="flex justify-between mb-3">
            <h3 className="font-bold text-gray-800">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400">×</button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{ name: "Study Hours", Done: selected.studyHours, Remaining: selected.totalHours - selected.studyHours }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Done" fill={selected.color} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Remaining" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-500 mt-2">{selected.studyHours} / {selected.totalHours} study hours · Target: {selected.targetDate}</p>
        </div>
      )}

      <div className="space-y-4">
        {certs.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(c === selected ? null : c)}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">{c.category} · Target: {c.targetDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="text-gray-400 hover:text-blue-600 text-xs">✏️</button>
                <button onClick={e => { e.stopPropagation(); del(c.id); }} className="text-gray-400 hover:text-red-600 text-xs">🗑️</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Study Progress</span><span>{c.progress}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${c.progress}%`, background: c.color }} />
                </div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{c.studyHours}h / {c.totalHours}h</span>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title={editing ? "Edit Certification" : "Add Certification"} onClose={() => setShowAdd(false)}>
          {[["Cert Name", "name", "text"], ["Category", "category", "text"], ["Target Date", "targetDate", "date"], ["Progress %", "progress", "number"], ["Study Hours Done", "studyHours", "number"], ["Total Hours Needed", "totalHours", "number"]].map(([label, key, type]) => (
            <div key={key} className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {["Planned", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Color</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-lg border" />
          </div>
          <button onClick={save} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Save</button>
        </Modal>
      )}
    </div>
  );
}

// ─── PROJECTS TAB ─────────────────────────────────────────────────────────────
function ProjectsTab({ projects, setProjects }) {
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", status: "Planned", progress: 0, startDate: "", targetDate: "", notes: "", milestones: [] });
  const [milestone, setMilestone] = useState("");

  const openAdd = () => { setForm({ name: "", category: "", status: "Planned", progress: 0, startDate: "", targetDate: "", notes: "", milestones: [] }); setMilestone(""); setEditing(null); setShowAdd(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditing(p.id); setShowAdd(true); };
  const save = () => {
    if (!form.name) return;
    if (editing) setProjects(projects.map(p => p.id === editing ? { ...p, ...form } : p));
    else setProjects([...projects, { ...form, id: Date.now() }]);
    setShowAdd(false);
  };
  const del = (id) => { setProjects(projects.filter(p => p.id !== id)); if (selected?.id === id) setSelected(null); };
  const addMilestone = () => { if (milestone) { setForm({ ...form, milestones: [...form.milestones, milestone + " ⬜"] }); setMilestone(""); } };

  const colorFor = (s) => s === "Completed" ? "#22c55e" : s === "In Progress" ? "#3b82f6" : "#9ca3af";

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black text-gray-800">🛠️ Personal Projects</h2>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">+ Add Project</button>
      </div>

      {selected && (
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-5">
          <div className="flex justify-between mb-3">
            <h3 className="font-bold text-gray-800">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400">×</button>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <ProgressRing current={selected.progress} target={100} color={colorFor(selected.status)} size={90} />
            <div>
              <p className="text-sm text-gray-500">Status: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></p>
              <p className="text-sm text-gray-500 mt-1">Category: {selected.category}</p>
              <p className="text-sm text-gray-500">Start: {selected.startDate} → Target: {selected.targetDate}</p>
              <p className="text-xs text-gray-400 mt-1">{selected.notes}</p>
            </div>
          </div>
          {selected.milestones?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">MILESTONES</p>
              <div className="flex flex-wrap gap-2">
                {selected.milestones.map((m, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{m}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p === selected ? null : p)}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                <button onClick={e => { e.stopPropagation(); openEdit(p); }} className="text-gray-400 hover:text-blue-600 text-xs">✏️</button>
                <button onClick={e => { e.stopPropagation(); del(p.id); }} className="text-gray-400 hover:text-red-600 text-xs">🗑️</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressRing current={p.progress} target={100} color={colorFor(p.status)} size={56} />
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full" style={{ width: `${p.progress}%`, background: colorFor(p.status) }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{p.notes}</p>
                <p className="text-xs text-gray-400">→ {p.targetDate}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title={editing ? "Edit Project" : "Add Project"} onClose={() => setShowAdd(false)}>
          {[["Project Name", "name", "text"], ["Category", "category", "text"], ["Start Date", "startDate", "date"], ["Target Date", "targetDate", "date"], ["Progress %", "progress", "number"]].map(([label, key, type]) => (
            <div key={key} className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {["Planned", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Add Milestone</label>
            <div className="flex gap-2">
              <input value={milestone} onChange={e => setMilestone(e.target.value)} placeholder="e.g. Design done" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button onClick={addMilestone} className="bg-gray-200 px-3 rounded-lg text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">{form.milestones.map((m, i) => <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{m}</span>)}</div>
          </div>
          <button onClick={save} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Save</button>
        </Modal>
      )}
    </div>
  );
}

// ─── TRAVEL TAB ───────────────────────────────────────────────────────────────
function TravelTab({ travel, setTravel }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Planned", date: "", notes: "" });
  const done = travel.filter(t => t.type === "Completed");
  const planned = travel.filter(t => t.type === "Planned");
  const save = () => {
    if (!form.name) return;
    setTravel([...travel, { ...form, id: Date.now() }]);
    setShowAdd(false);
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black text-gray-800">✈️ Travel Tracker</h2>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">+ Add Trip</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="text-4xl font-black text-green-600">{done.length}</div>
          <div className="text-sm text-green-700 font-medium">Places Visited in 2026</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <div className="text-4xl font-black text-blue-600">{planned.length}</div>
          <div className="text-sm text-blue-700 font-medium">Trips Planned</div>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-bold text-gray-700 mb-3">✅ Completed Trips</h3>
        {done.length === 0 ? <p className="text-gray-400 text-sm">No completed trips yet.</p> : (
          <div className="space-y-3">
            {done.map(t => (
              <div key={t.id} className="bg-white rounded-xl border p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.date} · {t.notes}</p>
                </div>
                <span className="text-green-500 text-lg">✅</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="font-bold text-gray-700 mb-3">🗓️ Upcoming Trips</h3>
        {planned.length === 0 ? <p className="text-gray-400 text-sm">No trips planned yet.</p> : (
          <div className="space-y-3">
            {planned.map(t => (
              <div key={t.id} className="bg-white rounded-xl border p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.date} · {t.notes}</p>
                </div>
                <span className="text-blue-400 text-lg">✈️</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {showAdd && (
        <Modal title="Add Trip" onClose={() => setShowAdd(false)}>
          {[["Destination", "name", "text"], ["Date", "date", "date"], ["Notes", "notes", "text"]].map(([label, key, type]) => (
            <div key={key} className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option>Planned</option><option>Completed</option>
            </select>
          </div>
          <button onClick={save} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Save</button>
        </Modal>
      )}
    </div>
  );
}

// ─── JOB SEARCH TAB ───────────────────────────────────────────────────────────
function JobsTab({ jobs, setJobs }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ company: "", role: "", status: "Applied", date: "", notes: "" });

  const statusOrder = ["Applied", "Interview", "Offer", "Rejected"];
  const counts = statusOrder.map(s => ({ name: s, count: jobs.filter(j => j.status === s).length }));
  const openAdd = () => { setForm({ company: "", role: "", status: "Applied", date: "", notes: "" }); setEditing(null); setShowAdd(true); };
  const openEdit = (j) => { setForm({ ...j }); setEditing(j.id); setShowAdd(true); };
  const save = () => {
    if (!form.company) return;
    if (editing) setJobs(jobs.map(j => j.id === editing ? { ...j, ...form } : j));
    else setJobs([...jobs, { ...form, id: Date.now() }]);
    setShowAdd(false);
  };
  const del = (id) => setJobs(jobs.filter(j => j.id !== id));

  const barColors = { Applied: "#f59e0b", Interview: "#8b5cf6", Offer: "#22c55e", Rejected: "#ef4444" };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black text-gray-800">💼 Job Search</h2>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">+ Add Application</button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {counts.map(c => (
          <div key={c.name} className="rounded-xl p-3 text-center" style={{ background: barColors[c.name] + "20" }}>
            <div className="text-2xl font-black" style={{ color: barColors[c.name] }}>{c.count}</div>
            <div className="text-xs font-medium text-gray-600">{c.name}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-sm">Application Pipeline</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={counts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {counts.map((c, i) => <Cell key={i} fill={barColors[c.name]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {jobs.map(j => (
          <div key={j.id} className="bg-white rounded-xl border shadow-sm p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">{j.company}</p>
              <p className="text-sm text-gray-500">{j.role}</p>
              <p className="text-xs text-gray-400">{j.date} · {j.notes}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[j.status]}`}>{j.status}</span>
              <button onClick={() => openEdit(j)} className="text-gray-400 hover:text-blue-600 text-xs">✏️</button>
              <button onClick={() => del(j.id)} className="text-gray-400 hover:text-red-600 text-xs">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title={editing ? "Edit Application" : "Add Application"} onClose={() => setShowAdd(false)}>
          {[["Company", "company", "text"], ["Role / Position", "role", "text"], ["Date Applied", "date", "date"], ["Notes", "notes", "text"]].map(([label, key, type]) => (
            <div key={key} className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {["Applied", "Interview", "Offer", "Rejected"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={save} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Save</button>
        </Modal>
      )}
    </div>
  );
}

// ─── INVESTMENTS TAB ──────────────────────────────────────────────────────────
function InvestmentsTab({ investments, setInvestments }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", current: 0, target: 0, status: "Planned", notes: "", icon: "💰" });

  const openAdd = () => { setForm({ name: "", category: "", current: 0, target: 0, status: "Planned", notes: "", icon: "💰" }); setEditing(null); setShowAdd(true); };
  const openEdit = (inv) => { setForm({ ...inv }); setEditing(inv.id); setShowAdd(true); };
  const save = () => {
    if (!form.name) return;
    if (editing) setInvestments(investments.map(i => i.id === editing ? { ...i, ...form } : i));
    else setInvestments([...investments, { ...form, id: Date.now() }]);
    setShowAdd(false);
  };
  const del = (id) => setInvestments(investments.filter(i => i.id !== id));

  const pieData = investments.filter(i => i.target > 0).map((i, idx) => ({ name: i.name, value: i.current || 0, color: COLORS[idx % COLORS.length] }));
  const totalTarget = investments.reduce((a, b) => a + (b.target || 0), 0);
  const totalCurrent = investments.reduce((a, b) => a + (b.current || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black text-gray-800">📈 Investments & Finance Plans</h2>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">+ Add Plan</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="text-xs text-green-600 mb-1">Total Saved / Invested</div>
          <div className="text-2xl font-black text-green-700">₹{totalCurrent.toLocaleString()}</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <div className="text-xs text-blue-600 mb-1">Total Target</div>
          <div className="text-2xl font-black text-blue-700">₹{totalTarget.toLocaleString()}</div>
        </div>
      </div>

      {pieData.some(p => p.value > 0) && (
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-700 mb-4 text-sm">Portfolio Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-4">
        {investments.map(inv => {
          const pct = inv.target > 1 ? Math.min((inv.current / inv.target) * 100, 100) : inv.current === inv.target ? 100 : 0;
          return (
            <div key={inv.id} className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{inv.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{inv.name}</p>
                    <p className="text-xs text-gray-400">{inv.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                  <button onClick={() => openEdit(inv)} className="text-gray-400 hover:text-blue-600 text-xs">✏️</button>
                  <button onClick={() => del(inv.id)} className="text-gray-400 hover:text-red-600 text-xs">🗑️</button>
                </div>
              </div>
              {inv.target > 1 && (
                <>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>₹{inv.current.toLocaleString()}</span><span>Target: ₹{inv.target.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% complete</p>
                </>
              )}
              <p className="text-xs text-gray-400 mt-1">{inv.notes}</p>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <Modal title={editing ? "Edit Plan" : "Add Investment / Plan"} onClose={() => setShowAdd(false)}>
          {[["Name", "name", "text"], ["Category", "category", "text"], ["Icon (emoji)", "icon", "text"], ["Current Amount (₹)", "current", "number"], ["Target Amount (₹)", "target", "number"], ["Notes", "notes", "text"]].map(([label, key, type]) => (
            <div key={key} className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {["Planned", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={save} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Save</button>
        </Modal>
      )}
    </div>
  );
}

// ─── IDEAS TAB ────────────────────────────────────────────────────────────────
function IdeasTab({ ideas, setIdeas }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", tag: "Tech", status: "Idea", notes: "" });
  const [filter, setFilter] = useState("All");

  const save = () => {
    if (!form.title) return;
    setIdeas([...ideas, { ...form, id: Date.now(), date: new Date().toISOString().split("T")[0] }]);
    setShowAdd(false);
    setForm({ title: "", tag: "Tech", status: "Idea", notes: "" });
  };
  const del = (id) => setIdeas(ideas.filter(i => i.id !== id));
  const cycle = (idea) => {
    const states = ["Idea", "In Progress", "Completed"];
    const next = states[(states.indexOf(idea.status) + 1) % states.length];
    setIdeas(ideas.map(i => i.id === idea.id ? { ...i, status: next } : i));
  };

  const filtered = filter === "All" ? ideas : ideas.filter(i => i.tag === filter || i.status === filter);
  const tagColors = { Tech: "bg-blue-100 text-blue-700", Business: "bg-yellow-100 text-yellow-700", Career: "bg-purple-100 text-purple-700", Personal: "bg-pink-100 text-pink-700", Finance: "bg-green-100 text-green-700", Health: "bg-red-100 text-red-700" };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black text-gray-800">💡 Ideas Notepad</h2>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">+ New Idea</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {["All", ...TAGS, "In Progress", "Completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map(idea => (
          <div key={idea.id} className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-gray-800 flex-1 pr-2">{idea.title}</p>
              <button onClick={() => del(idea.id)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
            </div>
            <p className="text-xs text-gray-400 mb-3">{idea.notes}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${tagColors[idea.tag] || "bg-gray-100 text-gray-600"}`}>{idea.tag}</span>
                <span className="text-xs text-gray-400">{idea.date}</span>
              </div>
              <button onClick={() => cycle(idea)} className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer ${STATUS_COLORS[idea.status]}`}>{idea.status} →</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-2 text-center py-8">No ideas yet. Start capturing them!</p>}
      </div>

      {showAdd && (
        <Modal title="Capture New Idea" onClose={() => setShowAdd(false)}>
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Idea Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What's the idea?" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Details / Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Describe the idea..." className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Tag</label>
            <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {TAGS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {["Idea", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={save} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700">Save Idea</button>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "goals", label: "Goals", icon: "🎯" },
  { id: "certs", label: "Certifications", icon: "📜" },
  { id: "projects", label: "Projects", icon: "🛠️" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "jobs", label: "Job Search", icon: "💼" },
  { id: "investments", label: "Investments", icon: "📈" },
  { id: "ideas", label: "Ideas", icon: "💡" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [certs, setCerts] = useState(INITIAL_CERTS);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [travel, setTravel] = useState(INITIAL_TRAVEL);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [investments, setInvestments] = useState(INITIAL_INVESTMENTS);
  const [ideas, setIdeas] = useState(INITIAL_IDEAS);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Pramod's 2026 Progress Tracker</h1>
          <p className="text-sm text-gray-500">Track everything that matters · Updated live</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border"}`}>
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && <OverviewTab goals={goals} certs={certs} projects={projects} jobs={jobs} travel={travel} />}
          {activeTab === "goals" && <GoalsTab goals={goals} setGoals={setGoals} />}
          {activeTab === "certs" && <CertsTab certs={certs} setCerts={setCerts} />}
          {activeTab === "projects" && <ProjectsTab projects={projects} setProjects={setProjects} />}
          {activeTab === "travel" && <TravelTab travel={travel} setTravel={setTravel} />}
          {activeTab === "jobs" && <JobsTab jobs={jobs} setJobs={setJobs} />}
          {activeTab === "investments" && <InvestmentsTab investments={investments} setInvestments={setInvestments} />}
          {activeTab === "ideas" && <IdeasTab ideas={ideas} setIdeas={setIdeas} />}
        </div>
      </div>
    </div>
  );
}
