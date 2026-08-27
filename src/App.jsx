import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

// ==========================================
// DATA & CONSTANTS
// ==========================================

const INITIAL_TEAMS = [
  { id: 1, name: "فريق 1", pin: "1111", balance: 1000, engineers: 1, progress: 0, completedParts: 0, stations: 0 },
  { id: 2, name: "فريق 2", pin: "2222", balance: 1000, engineers: 1, progress: 0, completedParts: 0, stations: 0 },
  { id: 3, name: "فريق 3", pin: "3333", balance: 1000, engineers: 1, progress: 0, completedParts: 0, stations: 0 },
  { id: 4, name: "فريق 4", pin: "4444", balance: 1000, engineers: 1, progress: 0, completedParts: 0, stations: 0 },
];

// buildTime is in MINUTES
const INITIAL_PARTS = [
  { id: 1,  name: "سور الخيمة",        price: 800,  buildTime: 12, icon: "🪵" },
  { id: 2,  name: "باب الخيمة",         price: 700,  buildTime: 10, icon: "🚪" },
  { id: 3,  name: "مرحضة",             price: 900,  buildTime: 15, icon: "🪣" },
  { id: 4,  name: "مذبح المحرقة",       price: 1200, buildTime: 20, icon: "🔥" },
  { id: 5,  name: "الأغطية",           price: 1000, buildTime: 10, icon: "🧵" },
  { id: 6,  name: "القدس",             price: 1400, buildTime: 22, icon: "🏛️" },
  { id: 7,  name: "المنارة الذهبية",    price: 1800, buildTime: 25, icon: "🕎" },
  { id: 8,  name: "مذبح البخور",        price: 1500, buildTime: 20, icon: "🪔" },
  { id: 9,  name: "مائدة خبز الوجوه",  price: 1300, buildTime: 18, icon: "🍞" },
  { id: 10, name: "قدس الأقداس",        price: 2000, buildTime: 28, icon: "✨" },
  { id: 11, name: "تابوت العهد",        price: 2500, buildTime: 30, icon: "📦" },
  { id: 12, name: "لباس رئيس الكهنة",  price: 1700, buildTime: 22, icon: "👑" },
  { id: 13, name: "مواد الخيمة",        price: 1100, buildTime: 8,  icon: "🧰" },
];

// 8 stations — no rewards (admin adds money manually)
const INITIAL_STATIONS = [
  { id: 1, name: "معدنك إيه؟",        icon: "🪨" },
  { id: 2, name: "داير ما يدور",       icon: "🔄" },
  { id: 3, name: "حرق وغسل",          icon: "🔥" },
  { id: 4, name: "من جوا لبرا",        icon: "🔀" },
  { id: 5, name: "النور والضلمة",      icon: "💡" },
  { id: 6, name: "Mystery Box",        icon: "📦" },
  { id: 7, name: "Outfit",             icon: "👗" },
  { id: 8, name: "مسابقة العباقرة",   icon: "🧠" },
];

// Tabernacle sections for visual diagram
const TENT_SECTIONS = [
  {
    id: "outer-court",
    label: "الفناء الخارجي",
    labelSub: "Outer Court",
    color: "#8B6914",
    bg: "rgba(139,105,20,0.18)",
    partIds: [1, 2, 3, 4, 5, 13],
  },
  {
    id: "holy-place",
    label: "القدس",
    labelSub: "Holy Place",
    color: "#5a3bbf",
    bg: "rgba(90,59,191,0.18)",
    partIds: [6, 7, 8, 9],
  },
  {
    id: "holy-of-holies",
    label: "قدس الأقداس",
    labelSub: "Holy of Holies",
    color: "#c0392b",
    bg: "rgba(192,57,43,0.18)",
    partIds: [10, 11],
  },
  {
    id: "priest",
    label: "لباس رئيس الكهنة",
    labelSub: "High Priest",
    color: "#1a7a4a",
    bg: "rgba(26,122,74,0.18)",
    partIds: [12],
  },
];

// ==========================================
// SOUND SYNTHESIZER
// ==========================================

function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    if (type === "buy") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === "complete" || type === "success") {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.35);
      });
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.05);
    }
  } catch { /* ignore */ }
}

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

const STORAGE_KEYS = {
  TEAMS:          "bsg_teams_v3",
  PARTS:          "bsg_parts_v4",
  TEAM_PARTS:     "bsg_team_parts_v3",
  TEAM_STATIONS:  "bsg_team_stations_v3",
  ACTIVITIES:     "bsg_activities_v3",
  STATION_LOG:    "bsg_station_log_v1",
};

function getLocal(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function setLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (err) { console.error("LocalStorage write error:", err); }
}

// ==========================================
// TENT DIAGRAM COMPONENT
// ==========================================

function TentDiagram({ completedPartIds, parts }) {
  const doneSet = useMemo(() => new Set(completedPartIds), [completedPartIds]);
  const totalDone = doneSet.size;
  const totalParts = parts.length;

  return (
    <div className="tent-diagram-wrap">
      <div className="tent-diagram-title">
        <span>🏕️ خيمة الاجتماع</span>
        <span className="tent-progress-badge">{totalDone}/{totalParts} جزء مكتمل</span>
      </div>

      <div className="tent-diagram">
        {TENT_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="tent-section"
            style={{ borderColor: section.color, background: section.bg }}
          >
            <div className="tent-section-label" style={{ color: section.color }}>
              <span>{section.label}</span>
              <small>{section.labelSub}</small>
            </div>
            <div className="tent-section-parts">
              {section.partIds.map((pid) => {
                const part = parts.find((p) => p.id === pid);
                const done = doneSet.has(pid);
                return (
                  <div
                    key={pid}
                    className={`tent-part-slot ${done ? "tent-part-done" : "tent-part-pending"}`}
                    title={part?.name}
                  >
                    <span className="tent-slot-icon">{part?.icon || "⬜"}</span>
                    <span className="tent-slot-name">{part?.name}</span>
                    {done && <span className="tent-slot-check">✅</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {totalDone === totalParts && (
        <div className="tent-complete-banner">
          🎉 اكتملت خيمة الاجتماع! تمجيد لله! 🎉
        </div>
      )}
    </div>
  );
}

// Mini tent for admin overview cards
function MiniTentGrid({ teamId, teamParts, parts }) {
  const teamList = teamParts[teamId] || [];
  const doneSet = new Set(
    teamList.filter((p) => p.status === "completed").map((p) => Number(p.partId))
  );
  return (
    <div className="mini-tent-grid">
      {parts.map((part) => (
        <div
          key={part.id}
          className={`mini-tent-part ${doneSet.has(part.id) ? "mini-done" : "mini-empty"}`}
          title={part.name}
        >
          {doneSet.has(part.id) ? part.icon : "▪"}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  const [page, setPage] = useState("home");

  const [teams, setTeams] = useState(() => getLocal(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
  const [parts, setParts] = useState(() => getLocal(STORAGE_KEYS.PARTS, INITIAL_PARTS));
  const [teamParts, setTeamParts] = useState(() => getLocal(STORAGE_KEYS.TEAM_PARTS, {}));
  const [teamStationResults, setTeamStationResults] = useState(() => getLocal(STORAGE_KEYS.TEAM_STATIONS, {}));
  const [activities, setActivities] = useState(() =>
    getLocal(STORAGE_KEYS.ACTIVITIES, [
      { id: 1, text: "🏕️ مرحباً بكم في لعبة بناء خيمة الاجتماع!", time: "الآن" },
      { id: 2, text: "📜 تنافسوا مع باقي الفرق واجمعوا الأموال لإتمام البناء.", time: "الآن" },
    ])
  );
  const [stationPaymentLog, setStationPaymentLog] = useState(() =>
    getLocal(STORAGE_KEYS.STATION_LOG, {})
  );

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [notice, setNotice] = useState("");

  // Team login
  const [selectedTeam, setSelectedTeam] = useState("");
  const [pin, setPin] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loggedTeamId, setLoggedTeamId] = useState(null);
  const [activeTeamPage, setActiveTeamPage] = useState("dashboard");

  // Admin login & state
  const [adminPin, setAdminPin] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedAdminTeamId, setSelectedAdminTeamId] = useState(null);
  const [activeAdminPage, setActiveAdminPage] = useState("overview");

  // Modals
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Admin editing states
  const [customBalanceAmount, setCustomBalanceAmount] = useState("");
  const [editingPinTeamId, setEditingPinTeamId] = useState(null);
  const [newTeamPin, setNewTeamPin] = useState("");
  const [editingNameTeamId, setEditingNameTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingPartPriceId, setEditingPartPriceId] = useState(null);
  const [newPartPrice, setNewPartPrice] = useState("");

  // Persist to localStorage
  useEffect(() => { setLocal(STORAGE_KEYS.TEAMS, teams); }, [teams]);
  useEffect(() => { setLocal(STORAGE_KEYS.PARTS, parts); }, [parts]);
  useEffect(() => { setLocal(STORAGE_KEYS.TEAM_PARTS, teamParts); }, [teamParts]);
  useEffect(() => { setLocal(STORAGE_KEYS.TEAM_STATIONS, teamStationResults); }, [teamStationResults]);
  useEffect(() => { setLocal(STORAGE_KEYS.ACTIVITIES, activities); }, [activities]);
  useEffect(() => { setLocal(STORAGE_KEYS.STATION_LOG, stationPaymentLog); }, [stationPaymentLog]);

  // 1-second ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { loadGameData(); }, []);

  function addActivity(text) {
    const timeStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    setActivities((prev) => [{ id: Date.now(), text, time: timeStr }, ...prev.slice(0, 49)]);
  }

  function showNotice(message, isError = false) {
    setNotice(message);
    if (isError) playSound("error");
    setTimeout(() => setNotice(""), 3500);
  }

  // ==========================================
  // SYNC & DATA LOADING
  // ==========================================

  async function loadGameData() {
    try {
      setLoading(true);
      const [teamsResult, partsResult, teamPartsResult, teamStationsResult] = await Promise.all([
        supabase.from("teams").select("*").order("id"),
        supabase.from("parts").select("*").order("id"),
        supabase.from("team_parts").select("*"),
        supabase.from("team_stations").select("*"),
      ]);

      let loadedTeams = INITIAL_TEAMS;
      if (teamsResult.data && teamsResult.data.length > 0) {
        loadedTeams = teamsResult.data.map((team) => {
          const rawBal = Number(team.balance ?? 0);
          const rawEng = Number(team.engineers ?? 0);
          const compParts = Number(team.completed_parts ?? team.completedParts ?? 0);
          const stCount = Number(team.stations ?? 0);
          const hasZeroInit = rawBal === 0 && rawEng === 0 && compParts === 0 && stCount === 0;
          return {
            ...team,
            balance: hasZeroInit ? 1000 : rawBal,
            engineers: hasZeroInit ? 1 : rawEng,
            completedParts: compParts,
            stations: stCount,
          };
        });
        setTeams(loadedTeams);
        loadedTeams.forEach((t) => {
          if (t.balance === 1000 && t.engineers === 1 && t.completedParts === 0 && t.stations === 0) {
            supabase.from("teams").update({ balance: 1000, engineers: 1 }).eq("id", t.id).catch(() => {});
          }
        });
      }

      // Load parts from Supabase but ensure buildTime is in minutes
      let activePartsList = INITIAL_PARTS;
      if (partsResult.data && partsResult.data.length > 0) {
        activePartsList = partsResult.data.map((part) => ({
          ...part,
          buildTime: Number(part.build_time ?? part.buildTime ?? 20),
          price: Number(part.price ?? 0),
        }));
        // If buildTime looks like seconds (old data > 60), convert to minutes
        activePartsList = activePartsList.map((p) => ({
          ...p,
          buildTime: p.buildTime > 60 ? Math.round(p.buildTime / 60) : p.buildTime,
        }));
        setParts(activePartsList);
      }

      // Don't load stations from Supabase — always use INITIAL_STATIONS
      // (names and count changed, rewards removed)

      if (teamPartsResult.data) {
        const partsByTeam = {};
        const now = Date.now();
        const autoCompletedByTeam = {};

        teamPartsResult.data.forEach((item) => {
          const tId = Number(item.team_id);
          const pId = Number(item.part_id);
          const partInfo = activePartsList.find((p) => p.id === pId);
          // buildTime is in minutes now
          const buildDuration = (partInfo?.buildTime || 20) * 60 * 1000;
          const purchasedAt = new Date(item.purchased_at || now).getTime();
          let status = item.status || "building";
          let completedAt = item.completed_at ? new Date(item.completed_at).getTime() : null;

          if (status === "building" && now >= purchasedAt + buildDuration) {
            status = "completed";
            completedAt = purchasedAt + buildDuration;
            autoCompletedByTeam[tId] = (autoCompletedByTeam[tId] || 0) + 1;
            supabase.from("team_parts")
              .update({ status: "completed", completed_at: new Date(completedAt).toISOString() })
              .eq("id", item.id).catch(() => {});
          }

          if (!partsByTeam[tId]) partsByTeam[tId] = [];
          partsByTeam[tId].push({ partId: pId, status, purchasedAt, completedAt, dbId: item.id });
        });

        setTeamParts(partsByTeam);

        if (Object.keys(autoCompletedByTeam).length > 0) {
          setTeams((prevTeams) =>
            prevTeams.map((team) => {
              const teamCompletedCount = (partsByTeam[team.id] || []).filter((p) => p.status === "completed").length;
              const newProgress = Math.min(100, Math.round((teamCompletedCount / activePartsList.length) * 100));
              if (team.completedParts !== teamCompletedCount || team.progress !== newProgress) {
                supabase.from("teams").update({ completed_parts: teamCompletedCount, progress: newProgress })
                  .eq("id", team.id).catch(() => {});
                return { ...team, completedParts: teamCompletedCount, progress: newProgress };
              }
              return team;
            })
          );
        }
      }

      if (teamStationsResult.data) {
        const stationsByTeam = {};
        teamStationsResult.data.forEach((item) => {
          const tId = Number(item.team_id);
          if (!stationsByTeam[tId]) stationsByTeam[tId] = [];
          stationsByTeam[tId].push(Number(item.station_id));
        });
        setTeamStationResults(stationsByTeam);
      }
    } catch (err) {
      console.warn("Supabase connection fallback to local storage:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateTeam(teamId, changes) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...changes } : t)));
    try {
      const dbChanges = { ...changes };
      if ("completedParts" in dbChanges) {
        dbChanges.completed_parts = dbChanges.completedParts;
        delete dbChanges.completedParts;
      }
      await supabase.from("teams").update(dbChanges).eq("id", teamId);
    } catch (err) {
      console.warn("Supabase update team warning:", err);
    }
  }

  // ==========================================
  // COMPUTED VARIABLES
  // ==========================================

  const loggedTeam = teams.find((team) => team.id === loggedTeamId);
  const teamItems = teamParts[loggedTeamId] || [];
  const completedParts = teamItems.filter((item) => item.status === "completed");
  const activeBuildingItems = teamItems.filter((item) => item.status === "building");
  const busyEngineers = activeBuildingItems.length;
  const availableEngineers = loggedTeam ? Math.max(0, (loggedTeam.engineers || 0) - busyEngineers) : 0;
  const currentStationResults = teamStationResults[loggedTeamId] || [];

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress;
      if (b.completedParts !== a.completedParts) return b.completedParts - a.completedParts;
      if (b.stations !== a.stations) return b.stations - a.stations;
      return b.balance - a.balance;
    });
  }, [teams]);

  // Auto-complete builds on ticker
  useEffect(() => {
    if (!loggedTeamId) return;
    activeBuildingItems.forEach((buildingItem) => {
      const part = parts.find((p) => p.id === buildingItem.partId);
      const durationSec = Number(part?.buildTime || 20) * 60; // minutes → seconds
      const elapsedSec = Math.floor((currentTime - buildingItem.purchasedAt) / 1000);
      if (elapsedSec >= durationSec) {
        completeBuild(loggedTeamId, buildingItem.partId);
      }
    });
  }, [currentTime, loggedTeamId, activeBuildingItems, parts]);

  function getBuildProgress(buildingItem) {
    const part = parts.find((p) => p.id === buildingItem.partId);
    const durationSec = Math.max(1, Number(part?.buildTime || 20) * 60); // minutes → seconds
    const elapsedSec = Math.max(0, Math.floor((currentTime - buildingItem.purchasedAt) / 1000));
    const remainingSec = Math.max(0, durationSec - elapsedSec);
    const percent = Math.min(100, Math.max(0, Math.round((elapsedSec / durationSec) * 100)));
    return { part, durationSec, elapsedSec, remainingSec, percent };
  }

  // ==========================================
  // AUTH ACTIONS
  // ==========================================

  function handleTeamLogin() {
    setLoginMessage("");
    if (!selectedTeam) { setLoginMessage("❌ من فضلك اختر فريقك أولاً."); playSound("error"); return; }
    if (!/^\d{4}$/.test(pin)) { setLoginMessage("❌ الرقم السري يجب أن يتكون من 4 أرقام."); playSound("error"); return; }
    const team = teams.find((item) => item.id === Number(selectedTeam));
    if (!team) { setLoginMessage("❌ الفريق غير موجود."); playSound("error"); return; }
    if (String(team.pin).trim() !== String(pin).trim()) { setLoginMessage("❌ الرقم السري غير صحيح."); playSound("error"); return; }
    setLoggedTeamId(team.id);
    setPin(""); setLoginMessage(""); setActiveTeamPage("dashboard"); setPage("team-dashboard");
    playSound("click");
  }

  function logoutTeam() {
    setSelectedTeam(""); setPin(""); setLoggedTeamId(null); setActiveTeamPage("dashboard"); setPage("home");
    playSound("click");
  }

  function handleAdminLogin() {
    setAdminMessage("");
    if (!adminPin) { setAdminMessage("❌ من فضلك أدخل الرقم السري للأدمن."); playSound("error"); return; }
    if (adminPin !== "9999" && adminPin !== "admin") { setAdminMessage("❌ الرقم السري غير صحيح."); playSound("error"); return; }
    setAdminPin(""); setAdminMessage(""); setIsAdminLoggedIn(true);
    setActiveAdminPage("overview"); setSelectedAdminTeamId(null); setPage("admin-dashboard");
    playSound("click");
  }

  function logoutAdmin() {
    setAdminPin(""); setAdminMessage(""); setIsAdminLoggedIn(false);
    setActiveAdminPage("overview"); setSelectedAdminTeamId(null); setPage("home");
    playSound("click");
  }

  function goAdminPage(nextPage, teamId = null) {
    setActiveAdminPage(nextPage); setSelectedAdminTeamId(teamId); playSound("click");
  }

  function goTeamPage(nextPage) { setActiveTeamPage(nextPage); playSound("click"); }

  // ==========================================
  // TEAM GAMEPLAY ACTIONS
  // ==========================================

  async function buyPart(part) {
    if (!loggedTeam) return;

    const isCompleted = completedParts.some((item) => Number(item.partId) === Number(part.id));
    if (isCompleted) { showNotice("✅ هذا الجزء تم بناؤه بالفعل.", true); return; }

    const isBuilding = activeBuildingItems.some((item) => Number(item.partId) === Number(part.id));
    if (isBuilding) { showNotice("🔨 هذا الجزء قيد البناء حالياً. انتظر حتى يكتمل.", true); return; }

    if (Number(loggedTeam.engineers || 0) <= 0) {
      showNotice("❌ لا يوجد مهندسون لفريقكم. راجع المشرف لإضافة مهندس.", true); return;
    }
    if (availableEngineers <= 0) {
      showNotice(`❌ جميع المهندسين (${loggedTeam.engineers}) مشغولون حالياً. انتظر اكتمال البناء.`, true); return;
    }

    const price = Number(part.price || 0);
    const balance = Number(loggedTeam.balance || 0);
    if (balance < price) {
      showNotice(`❌ رصيد غير كافٍ! تحتاجون ${price - balance} جنيه إضافياً لبناء "${part.name}".`, true); return;
    }

    const purchasedAt = Date.now();
    const newTeamPart = { partId: part.id, status: "building", purchasedAt, completedAt: null, dbId: null };

    setTeamParts((prev) => ({
      ...prev,
      [loggedTeam.id]: [...(prev[loggedTeam.id] || []).filter((p) => p.partId !== part.id), newTeamPart],
    }));

    await updateTeam(loggedTeam.id, { balance: balance - price });

    const durationMin = Math.max(1, Number(part.buildTime || 20));
    try {
      await supabase.from("team_parts").insert({
        team_id: loggedTeam.id, part_id: part.id, status: "building",
        purchased_at: new Date(purchasedAt).toISOString(), completed_at: null,
      });
    } catch (err) { console.warn("Supabase buy part sync warning:", err); }

    playSound("buy");
    showNotice(`🏕️ بدأ بناء "${part.name}"! (الوقت: ${durationMin} دقيقة)`);
    addActivity(`🏕️ بدأ ${loggedTeam.name} بناء "${part.name}".`);
  }

  async function completeBuild(teamId, partId) {
    const part = parts.find((item) => item.id === partId);
    if (!part) return;
    const team = teams.find((item) => item.id === teamId);

    let alreadyComplete = false;
    setTeamParts((prev) => {
      const teamList = prev[teamId] || [];
      const updated = teamList.map((item) => {
        if (item.partId === partId) {
          if (item.status === "completed") alreadyComplete = true;
          return { ...item, status: "completed", completedAt: Date.now() };
        }
        return item;
      });
      return { ...prev, [teamId]: updated };
    });

    if (alreadyComplete) return;

    const currentCompletedCount = (teamParts[teamId] || [])
      .filter((item) => item.status === "completed" || item.partId === partId).length;
    const newProgress = Math.min(100, Math.round((currentCompletedCount / parts.length) * 100));

    await updateTeam(teamId, { completedParts: currentCompletedCount, progress: newProgress });

    try {
      await supabase.from("team_parts")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("team_id", teamId).eq("part_id", partId);
    } catch (err) { console.warn("Supabase complete build sync warning:", err); }

    playSound("complete");
    showNotice(`🎉 اكتمل بناء "${part.name}" بنجاح! نسبة إنجاز الخيمة زادت! 🏕️`);
    addActivity(`🎉 أتم ${team?.name || "فريق"} بناء "${part.name}".`);
  }

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================

  async function adminAdjustBalance(teamId, amount) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const newBalance = Math.max(0, (team.balance || 0) + amount);
    await updateTeam(teamId, { balance: newBalance });
    playSound("buy");
    showNotice(`💰 تم تعديل رصيد ${team.name} إلى ${newBalance} جنيه.`);
    addActivity(`👑 الأدمن قام بتعديل رصيد ${team.name} (${amount > 0 ? "+" : ""}${amount} جنيه).`);
  }

  async function adminSetCustomBalance(teamId) {
    const amount = Number(customBalanceAmount);
    if (isNaN(amount) || amount < 0) { showNotice("❌ من فضلك أدخل مبلغ صحيح.", true); return; }
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    await updateTeam(teamId, { balance: amount });
    setCustomBalanceAmount("");
    playSound("buy");
    showNotice(`💰 تم ضبط رصيد ${team.name} على ${amount} جنيه.`);
    addActivity(`👑 الأدمن ضبط رصيد ${team.name} على ${amount} جنيه.`);
  }

  async function adminAdjustEngineers(teamId, delta) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const newEngineers = Math.max(0, (team.engineers || 0) + delta);
    await updateTeam(teamId, { engineers: newEngineers });
    playSound("click");
    showNotice(`👷 تم تحديث عدد مهندسي ${team.name} إلى ${newEngineers}.`);
    addActivity(`👑 الأدمن عدل مهندسي ${team.name} (${delta > 0 ? "+" : ""}${delta}).`);
  }

  async function adminMarkPartCompleted(teamId, part) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const existing = (teamParts[teamId] || []).find((item) => item.partId === part.id);
    if (existing?.status === "completed") { showNotice("✅ هذا الجزء مكتمل بالفعل.", true); return; }

    setTeamParts((prev) => {
      const list = prev[teamId] || [];
      const exists = list.some((item) => item.partId === part.id);
      const updated = exists
        ? list.map((item) => item.partId === part.id ? { ...item, status: "completed", completedAt: Date.now() } : item)
        : [...list, { partId: part.id, status: "completed", purchasedAt: Date.now(), completedAt: Date.now() }];
      return { ...prev, [teamId]: updated };
    });

    const newCompleted = (team.completedParts || 0) + 1;
    const newProgress = Math.min(100, Math.round((newCompleted / parts.length) * 100));
    await updateTeam(teamId, { completedParts: newCompleted, progress: newProgress });

    try {
      if (existing) {
        await supabase.from("team_parts")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("team_id", teamId).eq("part_id", part.id);
      } else {
        await supabase.from("team_parts").insert({
          team_id: teamId, part_id: part.id, status: "completed",
          purchased_at: new Date().toISOString(), completed_at: new Date().toISOString(),
        });
      }
    } catch (err) { console.warn("Supabase admin part complete sync warning:", err); }

    playSound("success");
    showNotice(`🎉 تم تعليم "${part.name}" كمكتمل لفريق ${team.name}.`);
    addActivity(`👑 الأدمن علّم "${part.name}" كمكتمل لـ ${team.name}.`);
  }

  async function adminResetPart(teamId, part) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const existing = (teamParts[teamId] || []).find((item) => item.partId === part.id);
    if (!existing) { showNotice("ℹ️ هذا الجزء غير مشترى أصلاً.", true); return; }

    setTeamParts((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] || []).filter((item) => item.partId !== part.id),
    }));

    if (existing.status === "completed") {
      const newCompleted = Math.max(0, (team.completedParts || 0) - 1);
      const newProgress = Math.round((newCompleted / parts.length) * 100);
      await updateTeam(teamId, { completedParts: newCompleted, progress: newProgress });
    }

    try {
      await supabase.from("team_parts").delete().eq("team_id", teamId).eq("part_id", part.id);
    } catch (err) { console.warn("Supabase admin part reset sync warning:", err); }

    playSound("click");
    showNotice(`↩️ تم إلغاء "${part.name}" لفريق ${team.name}.`);
    addActivity(`👑 الأدمن ألغى "${part.name}" لـ ${team.name}.`);
  }

  // Station toggle — no balance adjustment (admin adds money manually)
  async function adminToggleStation(teamId, stationId) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const completedList = teamStationResults[teamId] || [];
    const alreadyCompleted = completedList.includes(stationId);
    const station = INITIAL_STATIONS.find((s) => s.id === stationId);

    if (alreadyCompleted) {
      setTeamStationResults((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter((id) => id !== stationId),
      }));
      const newStations = Math.max(0, (team.stations || 0) - 1);
      await updateTeam(teamId, { stations: newStations });
      try {
        await supabase.from("team_stations").delete().eq("team_id", teamId).eq("station_id", stationId);
      } catch (err) { console.warn("Supabase admin toggle station delete warning:", err); }
      playSound("click");
      showNotice(`↩️ تم إلغاء محطة "${station?.name}" لفريق ${team.name}.`);
      addActivity(`👑 الأدمن ألغى محطة "${station?.name}" لـ ${team.name}.`);
    } else {
      setTeamStationResults((prev) => ({
        ...prev,
        [teamId]: [...(prev[teamId] || []), stationId],
      }));
      const newStations = (team.stations || 0) + 1;
      await updateTeam(teamId, { stations: newStations });
      try {
        await supabase.from("team_stations").insert({ team_id: teamId, station_id: stationId });
      } catch (err) { console.warn("Supabase admin toggle station insert warning:", err); }
      playSound("success");
      showNotice(`✅ تم تعليم محطة "${station?.name}" كمكتملة لفريق ${team.name}.`);
      addActivity(`👑 الأدمن علّم محطة "${station?.name}" كمكتملة لـ ${team.name}.`);
    }
  }

  async function adminSaveTeamPin(teamId) {
    if (!/^\d{4}$/.test(newTeamPin)) { showNotice("❌ الرقم السري يجب أن يكون 4 أرقام.", true); return; }
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    await updateTeam(teamId, { pin: newTeamPin });
    setEditingPinTeamId(null); setNewTeamPin("");
    playSound("buy");
    showNotice(`🔐 تم تغيير الرقم السري لـ ${team.name} بنجاح.`);
  }

  async function adminSaveTeamName(teamId) {
    if (!newTeamName.trim()) { showNotice("❌ اسم الفريق لا يجب أن يكون فارغاً.", true); return; }
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    await updateTeam(teamId, { name: newTeamName.trim() });
    setEditingNameTeamId(null); setNewTeamName("");
    playSound("buy");
    showNotice(`✅ تم تغيير اسم الفريق إلى "${newTeamName.trim()}".`);
    addActivity(`👑 الأدمن غيّر اسم فريق رقم ${teamId} إلى "${newTeamName.trim()}".`);
  }

  async function adminSavePartPrice(partId) {
    const price = Number(newPartPrice);
    if (isNaN(price) || price <= 0) { showNotice("❌ من فضلك أدخل سعراً صحيحاً.", true); return; }
    setParts((prev) => prev.map((p) => (p.id === partId ? { ...p, price } : p)));
    setEditingPartPriceId(null); setNewPartPrice("");
    try { await supabase.from("parts").update({ price }).eq("id", partId); }
    catch (err) { console.warn("Supabase part price update warning:", err); }
    playSound("buy");
    showNotice(`💰 تم تحديث سعر الجزء إلى ${price} جنيه.`);
  }

  async function adminAddBonusToAll() {
    const updated = teams.map((t) => ({ ...t, balance: (t.balance || 0) + 1000 }));
    setTeams(updated);
    try {
      await Promise.all(updated.map((t) => supabase.from("teams").update({ balance: t.balance }).eq("id", t.id)));
    } catch (err) { console.warn("Supabase bonus sync warning:", err); }
    playSound("buy");
    showNotice("💰 تم إضافة 1000 جنيه لكل الفرق بنجاح!");
    addActivity("👑 قام الأدمن بإعطاء منحة 1000 جنيه لجميع الفرق.");
  }

  async function adminResetSingleTeam(teamId) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    if (!window.confirm(`هل أنت متأكد من تصفير بيانات ${team.name} بالكامل؟`)) return;
    setTeamParts((prev) => ({ ...prev, [teamId]: [] }));
    setTeamStationResults((prev) => ({ ...prev, [teamId]: [] }));
    await updateTeam(teamId, { balance: 1000, engineers: 1, progress: 0, completedParts: 0, stations: 0 });
    playSound("click");
    showNotice(`🔄 تم تصفير بيانات ${team.name} وإعطائه 1000 جنيه ومهندس لبدء اللعبة.`);
    addActivity(`👑 قام الأدمن بتصفير بيانات ${team.name}.`);
  }

  async function adminResetAllTeams() {
    if (!window.confirm("⚠️ تحذير: هل أنت متأكد من تصفير بيانات جميع الفرق بالكامل لبدء مسابقة جديدة؟")) return;
    setTeamParts({}); setTeamStationResults({});
    const resetTeamsList = teams.map((team) => ({ ...team, balance: 1000, engineers: 1, progress: 0, completedParts: 0, stations: 0 }));
    setTeams(resetTeamsList);
    try {
      await Promise.all([
        supabase.from("team_parts").delete().neq("id", 0),
        supabase.from("team_stations").delete().neq("id", 0),
        ...resetTeamsList.map((t) =>
          supabase.from("teams").update({ balance: 1000, engineers: 1, progress: 0, completed_parts: 0, stations: 0 }).eq("id", t.id)
        ),
      ]);
    } catch (err) { console.warn("Supabase reset all warning:", err); }
    playSound("complete");
    showNotice("🔄 تم تصفير بيانات اللعبة وبدء جولة جديدة لجميع الفرق!");
    addActivity("👑 قام الأدمن بتصفير بيانات اللعبة وبدء جولة جديدة.");
  }

  function updateStationLog(stationId, teamId, value) {
    setStationPaymentLog((prev) => ({
      ...prev,
      [stationId]: { ...(prev[stationId] || {}), [teamId]: value },
    }));
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function handleSidebarNavigation(target) {
    playSound("click");
    if (target === "home") { setPage("home"); }
    else if (target === "team-login") {
      if (loggedTeamId) { setPage("team-dashboard"); setActiveTeamPage("dashboard"); }
      else { setPage("team-login"); }
    } else if (target === "stations") {
      if (loggedTeamId) { setPage("team-dashboard"); setActiveTeamPage("stations"); }
      else { showNotice("👥 سجل دخول فريقك أولاً للوصول إلى المحطات."); setPage("team-login"); }
    } else if (target === "parts") {
      if (loggedTeamId) { setPage("team-dashboard"); setActiveTeamPage("parts"); }
      else { showNotice("👥 سجل دخول فريقك أولاً للوصول إلى أجزاء الخيمة."); setPage("team-login"); }
    } else if (target === "ranking") {
      if (loggedTeamId) { setPage("team-dashboard"); setActiveTeamPage("ranking"); }
      else { setPage("home"); }
    } else if (target === "rules") { setShowRulesModal(true); }
    else if (target === "activity") { setShowActivityModal(true); }
  }

  // ==========================================
  // RENDER: LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🏕️</div>
          <div className="login-title-board"><h1>جاري تحميل المغامرة</h1><span>BIBLE SCHOOL ADVENTURE</span></div>
          <div className="login-content"><p className="login-description">بنجهز بيانات الفرق والمحطات وأجزاء الخيمة...</p></div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ADMIN LOGIN
  // ==========================================

  if (page === "admin-login") {
    return (
      <div className="login-page">
        <div className="login-background-decoration decoration-one">🌴</div>
        <div className="login-background-decoration decoration-two">🏕️</div>
        <div className="login-background-decoration decoration-three">🌵</div>
        <div className="login-card">
          <button className="back-button" onClick={() => { setAdminMessage(""); setAdminPin(""); setPage("home"); }}>
            ← العودة للرئيسية
          </button>
          <div className="login-logo">👑</div>
          <div className="login-title-board"><h1>دخول الأدمن</h1><span>ADMIN CONTROL CENTER</span></div>
          <div className="login-content">
            <p className="login-description">لوحة التحكم الرئيسية للمشرفين والخدام</p>
            <label>🔐 الرقم السري للأدمن</label>
            <input
              className="pin-input" type="password" inputMode="numeric" maxLength="6"
              value={adminPin} placeholder="••••" autoFocus
              onChange={(e) => { setAdminPin(e.target.value); setAdminMessage(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdminLogin(); }}
            />
            {adminMessage && <div className="login-error">{adminMessage}</div>}
            <button className="adventure-button" onClick={handleAdminLogin}>دخول لوحة التحكم 👑</button>
          </div>
          <div className="login-footer">تحكم كامل في أحداث ومغامرة Bible School</div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TEAM LOGIN
  // ==========================================

  if (page === "team-login") {
    return (
      <div className="login-page">
        <div className="login-background-decoration decoration-one">🌴</div>
        <div className="login-background-decoration decoration-two">🏕️</div>
        <div className="login-background-decoration decoration-three">🌵</div>
        <div className="login-card">
          <button className="back-button" onClick={() => { setLoginMessage(""); setSelectedTeam(""); setPin(""); setPage("home"); }}>
            ← العودة للرئيسية
          </button>
          <div className="login-logo">🏕️</div>
          <div className="login-title-board"><h1>دخول الفريق</h1><span>BIBLE SCHOOL ADVENTURE</span></div>
          <div className="login-content">
            <p className="login-description">اختر فريقك وأدخل الرقم السري لبدء المغامرة</p>
            <label>👥 اختر الفريق</label>
            <select className="team-select" value={selectedTeam} onChange={(e) => { setSelectedTeam(e.target.value); setLoginMessage(""); }}>
              <option value="">اختر فريقك...</option>
              {teams.map((team) => (<option key={team.id} value={team.id}>{team.name}</option>))}
            </select>
            <label>🔐 الرقم السري PIN (4 أرقام)</label>
            <input
              className="pin-input" type="password" inputMode="numeric" maxLength="4"
              value={pin} placeholder="••••"
              onChange={(e) => { const val = e.target.value; if (/^\d*$/.test(val)) { setPin(val); setLoginMessage(""); } }}
              onKeyDown={(e) => { if (e.key === "Enter") handleTeamLogin(); }}
            />
            {loginMessage && <div className="login-error">{loginMessage}</div>}
            <button className="adventure-button" onClick={handleTeamLogin}>ابدأ المغامرة 🏕️</button>
          </div>
          <div className="login-footer">«واصنعوا لي مقدساً فأسكن في وسطهم» (خروج 25:8)</div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TEAM DASHBOARD
  // ==========================================

  if (page === "team-dashboard" && loggedTeam) {
    const teamCompletedPartIds = (teamParts[loggedTeam.id] || [])
      .filter((p) => p.status === "completed")
      .map((p) => Number(p.partId));

    return (
      <div className="team-dashboard">
        <header className="dashboard-top">
          <div>
            <div className="dashboard-small-title">BIBLE SCHOOL ADVENTURE</div>
            <h1>🛡️ {loggedTeam.name}</h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="panel-button" style={{ margin: 0 }} onClick={() => setShowRulesModal(true)}>❓ التعليمات</button>
            <button className="logout-button" onClick={logoutTeam}>تسجيل الخروج</button>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="welcome-board">
            <div className="welcome-icon">🏕️</div>
            <div>
              <h2>أهلاً بكم يا {loggedTeam.name}! 🎉</h2>
              <p>حان وقت المغامرة وبناء خيمة الاجتماع لتمجيد اسم الرب.</p>
            </div>
          </section>

          <section className="dashboard-stats">
            <div className="dashboard-stat">
              <div>💰</div><span>الرصيد المتاح</span><strong>{loggedTeam.balance} جنيه</strong>
            </div>
            <div className="dashboard-stat">
              <div>🏕️</div><span>نسبة البناء</span><strong>{loggedTeam.progress}%</strong>
            </div>
            <div className="dashboard-stat">
              <div>👷</div><span>المهندسين</span><strong>{availableEngineers} / {loggedTeam.engineers}</strong>
            </div>
            <div className="dashboard-stat">
              <div>🗺️</div><span>المحطات</span><strong>{loggedTeam.stations} / 8</strong>
            </div>
          </section>

          {/* ACTIVE BUILDING CARDS */}
          {activeBuildingItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "18px 0" }}>
              {activeBuildingItems.map((bItem) => {
                const { part, durationSec, remainingSec, percent } = getBuildProgress(bItem);
                if (!part) return null;
                return (
                  <div className="active-build-card" key={bItem.partId} style={{ margin: 0 }}>
                    <div className="active-build-header">
                      <div className="active-build-title">
                        <span className="hammer-icon">🔨</span>
                        <div>
                          <span>جاري البناء الآن: </span>
                          <strong style={{ color: "#ffd875" }}>{part.icon} {part.name}</strong>
                        </div>
                      </div>
                      <div className="build-timer-badge">⏱️ {formatTime(remainingSec)}</div>
                    </div>
                    <div className="build-live-progress-container">
                      <div className="build-live-progress-bar" style={{ width: `${percent}%` }} />
                      <div className="build-live-progress-text">
                        {percent}% مكتمل — متبقي: {formatTime(remainingSec)} من {formatTime(durationSec)}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <small style={{ color: "#f7d794" }}>👷 مهندس يشرف على هذا الجزء. سيكتمل تلقائياً!</small>
                      <button
                        className="panel-button"
                        style={{ margin: 0, padding: "5px 12px", fontSize: "12px", background: "#e67e22" }}
                        onClick={() => completeBuild(loggedTeam.id, part.id)}
                      >
                        ⚡ إنهاء فوراً
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MAIN TENT PROGRESS */}
          <section className="building-board">
            <div className="building-header">
              <h2>🏕️ تقدم بناء خيمة الاجتماع الإجمالي</h2>
              <strong>{loggedTeam.progress}% ({loggedTeam.completedParts}/13 جزء)</strong>
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${loggedTeam.progress}%` }} />
            </div>
            {activeBuildingItems.length === 0 && (
              <p>لا يوجد جزء قيد البناء حالياً. ادخل على <strong>أجزاء الخيمة</strong> لبدء بناء جزء جديد!</p>
            )}
          </section>

          {/* DASHBOARD ACTIONS */}
          {activeTeamPage === "dashboard" && (
            <section className="dashboard-actions">
              <button className="dashboard-action green-action" onClick={() => goTeamPage("stations")}>
                🗺️<span>المحطات</span><small>{loggedTeam.stations}/8 محطة</small>
              </button>
              <button className="dashboard-action blue-action" onClick={() => goTeamPage("parts")}>
                🏕️<span>أجزاء الخيمة</span><small>ابدأ البناء</small>
              </button>
              <button className="dashboard-action gold-action" onClick={() => goTeamPage("tent")}>
                🏛️<span>خيمة الاجتماع</span><small>شوف الخيمة</small>
              </button>
              <button className="dashboard-action purple-action" onClick={() => goTeamPage("ranking")}>
                🏆<span>الترتيب</span><small>اعرف مركزك</small>
              </button>
            </section>
          )}

          {/* SUBPAGES */}
          {activeTeamPage !== "dashboard" && (
            <section className="team-subpage">
              <button className="back-button" onClick={() => goTeamPage("dashboard")}>← رجوع للوحة الفريق</button>

              {/* SUBPAGE: PARTS */}
              {activeTeamPage === "parts" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🏕️ متجر أجزاء الخيمة (13 جزء)</h2>
                      <p>اشترِ أجزاء الخيمة وسيبدأ المهندس البناء بالعداد التنازلي.</p>
                    </div>
                    <div className="subpage-balance">💰 رصيدكم: {loggedTeam.balance} جنيه</div>
                  </div>
                  <div className="parts-grid">
                    {parts.map((part) => {
                      const isCompleted = completedParts.some((item) => Number(item.partId) === Number(part.id));
                      const buildingItem = activeBuildingItems.find((item) => Number(item.partId) === Number(part.id));
                      const isBuilding = Boolean(buildingItem);
                      const progressInfo = buildingItem ? getBuildProgress(buildingItem) : null;
                      return (
                        <div className={`part-card ${isCompleted ? "part-completed" : ""}`} key={part.id}>
                          <div className="part-icon">{part.icon}</div>
                          <div className="part-number">الجزء {part.id}</div>
                          <h3>{part.name}</h3>
                          <div className="part-details">
                            <span>💰 {part.price} جنيه</span>
                            <span>⏱️ {part.buildTime} دقيقة</span>
                          </div>
                          {isCompleted ? (
                            <button className="completed-button" disabled>✅ تم بناؤه بنجاح</button>
                          ) : isBuilding ? (
                            <button className="building-button" onClick={() => completeBuild(loggedTeam.id, part.id)}>
                              🔨 جاري البناء ({formatTime(progressInfo?.remainingSec ?? 0)}) ⚡
                            </button>
                          ) : (
                            <button className="buy-button" onClick={() => buyPart(part)}>
                              شراء وبدء البناء 🔨
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* SUBPAGE: TENT DIAGRAM */}
              {activeTeamPage === "tent" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🏛️ خيمة الاجتماع — العرض المرئي</h2>
                      <p>شوفوا الأجزاء اللي اتبنت والأجزاء الناقصة في الخيمة.</p>
                    </div>
                    <div className="subpage-balance">
                      ✅ {teamCompletedPartIds.length}/13 جزء مكتمل
                    </div>
                  </div>
                  <TentDiagram completedPartIds={teamCompletedPartIds} parts={parts} />
                </>
              )}

              {/* SUBPAGE: STATIONS */}
              {activeTeamPage === "stations" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🗺️ محطات المغامرة</h2>
                      <p>شوفوا المحطات اللي أتمتوها والباقية. الخدام هيسجلوا لكم المحطات.</p>
                    </div>
                    <div className="subpage-balance">✅ {currentStationResults.length}/8 محطة</div>
                  </div>

                  <div className="stations-grid">
                    {INITIAL_STATIONS.map((station) => {
                      const completed = currentStationResults.includes(station.id);
                      return (
                        <div className={`station-card ${completed ? "station-completed" : ""}`} key={station.id}>
                          <div className="station-number-badge">محطة {station.id}</div>
                          <div className="station-icon-big">{station.icon}</div>
                          <h3 className="station-name">{station.name}</h3>
                          {completed ? (
                            <div className="station-complete-badge">✅ مكتملة!</div>
                          ) : (
                            <div className="station-pending-badge">⏳ في الانتظار</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* SUBPAGE: RANKING */}
              {activeTeamPage === "ranking" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🏆 لوحة الترتيب العام</h2>
                      <p>تابعوا تقدمكم مقارنة بباقي الفرق المتنافسة.</p>
                    </div>
                  </div>
                  <div className="full-ranking">
                    {sortedTeams.map((team, index) => (
                      <div className={`full-ranking-row ${team.id === loggedTeam.id ? "my-team" : ""}`} key={team.id}>
                        <div className="rank-position">
                          {index === 0 ? "🥇 الأول" : index === 1 ? "🥈 الثاني" : index === 2 ? "🥉 الثالث" : "🏅 الرابع"}
                        </div>
                        <div className="rank-team-name">
                          {team.name}{team.id === loggedTeam.id && <small> (فريقكم)</small>}
                        </div>
                        <div>🏕️ البناء: {team.progress}%</div>
                        <div>🧱 الأجزاء: {team.completedParts}/13</div>
                        <div>🗺️ المحطات: {team.stations}/8</div>
                        <div>💰 {team.balance} جنيه</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </main>
        {notice && <div className="game-notice">{notice}</div>}
      </div>
    );
  }

  // ==========================================
  // RENDER: ADMIN DASHBOARD
  // ==========================================

  if (page === "admin-dashboard" && isAdminLoggedIn) {
    const totalBalance = teams.reduce((sum, team) => sum + (team.balance || 0), 0);
    const averageProgress = teams.length > 0
      ? Math.round(teams.reduce((sum, team) => sum + (team.progress || 0), 0) / teams.length) : 0;
    const totalStations = teams.reduce((sum, team) => sum + (team.stations || 0), 0);

    const selectedAdminTeam = teams.find((team) => team.id === selectedAdminTeamId);
    const selectedTeamParts = selectedAdminTeamId ? teamParts[selectedAdminTeamId] || [] : [];
    const selectedTeamStationResults = selectedAdminTeamId ? teamStationResults[selectedAdminTeamId] || [] : [];

    return (
      <div className="admin-dashboard">
        <header className="admin-topbar">
          <div>
            <div className="admin-small-title">BIBLE SCHOOL ADVENTURE</div>
            <h1>👑 لوحة تحكم الأدمن والمشرفين</h1>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="panel-button" style={{ margin: 0, padding: "8px 12px", fontSize: "13px", background: "#27ae60" }} onClick={adminAddBonusToAll}>
              💰 +1000 لكل الفرق
            </button>
            <button className="panel-button admin-danger-btn" style={{ margin: 0, padding: "8px 12px", fontSize: "13px" }} onClick={adminResetAllTeams}>
              🔄 تصفير كل اللعبة
            </button>
            <button className="logout-button" onClick={logoutAdmin}>تسجيل الخروج</button>
          </div>
        </header>

        <main className="admin-content">

          {/* ==================== OVERVIEW ==================== */}
          {activeAdminPage === "overview" && (
            <>
              <section className="admin-welcome">
                <div className="admin-welcome-icon">👑</div>
                <div>
                  <h2>مركز التحكم الرئيسي</h2>
                  <p>من هنا يمكنك متابعة وإدارة حالة كل فريق. اضغط على أي فريق للتحكم فيه بالكامل.</p>
                </div>
              </section>

              <section className="admin-overview">
                <div className="admin-overview-card"><span>👥</span><small>عدد الفرق</small><strong>{teams.length}</strong></div>
                <div className="admin-overview-card"><span>💰</span><small>إجمالي أموال الفرق</small><strong>{totalBalance} جنيه</strong></div>
                <div className="admin-overview-card"><span>🏕️</span><small>متوسط البناء</small><strong>{averageProgress}%</strong></div>
                <div className="admin-overview-card"><span>🗺️</span><small>المحطات المنجزة</small><strong>{totalStations} / 32</strong></div>
              </section>

              {/* TEAMS GRID */}
              <section className="admin-section">
                <div className="admin-section-header">
                  <div>
                    <h2>👥 قائمة الفرق وتقدم بناء الخيمة</h2>
                    <p>اضغط على أي فريق لفتح لوحة التحكم الخاصة به</p>
                  </div>
                </div>
                <div className="admin-team-grid">
                  {sortedTeams.map((team, index) => {
                    const teamCompletedCount = (teamParts[team.id] || []).filter((p) => p.status === "completed").length;
                    return (
                      <div className="admin-team-card" key={team.id} onClick={() => goAdminPage("team-detail", team.id)} style={{ cursor: "pointer" }}>
                        <div className="admin-team-header">
                          <div className="team-number">{index + 1}</div>
                          <div>
                            <h3>{team.name}</h3>
                            <small style={{ color: "#f1d17a" }}>
                              {teamCompletedCount}/13 جزء — {team.stations}/8 محطات
                            </small>
                          </div>
                        </div>
                        <div className="admin-team-info">
                          <div><span>💰 الرصيد</span><strong>{team.balance} جنيه</strong></div>
                          <div><span>👷 المهندسين</span><strong>{team.engineers}</strong></div>
                          <div><span>🏕️ الإنجاز</span><strong>{team.progress}%</strong></div>
                        </div>
                        {/* Mini tent visual */}
                        <MiniTentGrid teamId={team.id} teamParts={teamParts} parts={parts} />
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* STATION PAYMENT LOG */}
              <section className="admin-section" style={{ marginTop: "30px" }}>
                <div className="admin-section-header">
                  <div>
                    <h2>📋 سجل توزيع مكافآت المحطات</h2>
                    <p>اكتب هنا المبالغ اللي أضفتها يدوياً لكل فريق في كل محطة (للأدمن بس — مش بتأثر على الرصيد تلقائياً)</p>
                  </div>
                </div>
                <div className="station-log-table-wrap">
                  <table className="station-log-table">
                    <thead>
                      <tr>
                        <th>المحطة</th>
                        {teams.map((team) => (
                          <th key={team.id}>{team.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {INITIAL_STATIONS.map((station) => (
                        <tr key={station.id}>
                          <td className="station-log-label">
                            <span>{station.icon}</span>
                            <span>{station.name}</span>
                          </td>
                          {teams.map((team) => (
                            <td key={team.id}>
                              <input
                                className="station-log-input"
                                type="text"
                                placeholder="—"
                                value={(stationPaymentLog[station.id] || {})[team.id] || ""}
                                onChange={(e) => updateStationLog(station.id, team.id, e.target.value)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ==================== TEAM DETAIL ==================== */}
          {activeAdminPage === "team-detail" && selectedAdminTeam && (
            <section className="team-subpage">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button className="back-button" onClick={() => goAdminPage("overview")}>← رجوع لكل الفرق</button>
                <button className="panel-button admin-danger-btn" style={{ margin: 0, padding: "6px 12px", fontSize: "12px" }} onClick={() => adminResetSingleTeam(selectedAdminTeam.id)}>
                  🔄 تصفير بيانات هذا الفريق
                </button>
              </div>

              {/* TEAM NAME & PIN */}
              <div className="subpage-header" style={{ marginTop: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <h2>👑 تحكم كامل في: {selectedAdminTeam.name}</h2>
                    <button className="panel-button" style={{ margin: 0, padding: "3px 10px", fontSize: "11px" }}
                      onClick={() => { setEditingNameTeamId(selectedAdminTeam.id); setNewTeamName(selectedAdminTeam.name); }}>
                      ✏️ تغيير الاسم
                    </button>
                  </div>
                  <p style={{ marginTop: "6px" }}>
                    <button className="panel-button" style={{ margin: "0 0 0 8px", padding: "3px 10px", fontSize: "11px" }}
                      onClick={() => { setEditingPinTeamId(selectedAdminTeam.id); setNewTeamPin(selectedAdminTeam.pin); }}>
                      🔐 تغيير PIN
                    </button>
                  </p>
                </div>
                <div className="subpage-balance">💰 الرصيد: {selectedAdminTeam.balance} جنيه</div>
              </div>

              {/* NAME EDIT */}
              {editingNameTeamId === selectedAdminTeam.id && (
                <div className="inline-edit-box">
                  <label>الاسم الجديد:</label>
                  <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
                    style={{ padding: "6px", borderRadius: "8px", border: "2px solid #b18436", fontSize: "14px", minWidth: "160px" }} />
                  <button className="panel-button" style={{ margin: 0 }} onClick={() => adminSaveTeamName(selectedAdminTeam.id)}>حفظ</button>
                  <button className="panel-button" style={{ margin: 0, background: "#555" }} onClick={() => setEditingNameTeamId(null)}>إلغاء</button>
                </div>
              )}

              {/* PIN EDIT */}
              {editingPinTeamId === selectedAdminTeam.id && (
                <div className="inline-edit-box">
                  <label>PIN الجديد (4 أرقام):</label>
                  <input type="text" maxLength="4" value={newTeamPin}
                    onChange={(e) => setNewTeamPin(e.target.value)}
                    style={{ width: "90px", padding: "6px", textAlign: "center", fontSize: "16px" }} />
                  <button className="panel-button" style={{ margin: 0 }} onClick={() => adminSaveTeamPin(selectedAdminTeam.id)}>حفظ</button>
                  <button className="panel-button" style={{ margin: 0, background: "#555" }} onClick={() => setEditingPinTeamId(null)}>إلغاء</button>
                </div>
              )}

              {/* STATS */}
              <div className="dashboard-stats">
                <div className="dashboard-stat"><div>💰</div><span>الرصيد</span><strong>{selectedAdminTeam.balance} جنيه</strong></div>
                <div className="dashboard-stat"><div>🏕️</div><span>نسبة البناء</span><strong>{selectedAdminTeam.progress}%</strong></div>
                <div className="dashboard-stat"><div>👷</div><span>المهندسين</span><strong>{selectedAdminTeam.engineers}</strong></div>
                <div className="dashboard-stat"><div>🗺️</div><span>المحطات</span><strong>{selectedAdminTeam.stations} / 8</strong></div>
              </div>

              {/* BALANCE CONTROL */}
              <div className="engineer-main-card" style={{ marginTop: "20px" }}>
                <h2>💰 التحكم في الرصيد</h2>
                <div className="admin-tools" style={{ marginTop: "12px" }}>
                  {[100, 500, 1000, -100, -500].map((amt) => (
                    <button key={amt} className="admin-tool-card" onClick={() => adminAdjustBalance(selectedAdminTeam.id, amt)}>
                      <span>{amt > 0 ? "➕" : "➖"}</span>
                      <strong>{amt > 0 ? "+" : ""}{amt} جنيه</strong>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "14px", alignItems: "center", justifyContent: "center" }}>
                  <input type="number" placeholder="مبلغ مخصص..." value={customBalanceAmount}
                    onChange={(e) => setCustomBalanceAmount(e.target.value)}
                    style={{ padding: "8px", borderRadius: "8px", border: "2px solid #b18436", width: "150px", fontSize: "14px" }} />
                  <button className="panel-button" style={{ margin: 0 }} onClick={() => adminSetCustomBalance(selectedAdminTeam.id)}>تحديد الرصيد</button>
                </div>
              </div>

              {/* ENGINEERS CONTROL */}
              <div className="engineer-main-card" style={{ marginTop: "20px" }}>
                <h2>👷 التحكم في المهندسين</h2>
                <strong className="engineer-count">{selectedAdminTeam.engineers}</strong>
                <div className="admin-tools" style={{ marginTop: "12px" }}>
                  <button className="admin-tool-card" onClick={() => adminAdjustEngineers(selectedAdminTeam.id, 1)}>
                    <span>➕</span><strong>إضافة مهندس</strong>
                  </button>
                  <button className="admin-tool-card" onClick={() => adminAdjustEngineers(selectedAdminTeam.id, -1)}>
                    <span>➖</span><strong>إنقاص مهندس</strong>
                  </button>
                </div>
              </div>

              {/* PARTS CONTROL */}
              <div className="subpage-header" style={{ marginTop: "25px" }}>
                <div>
                  <h2>🏕️ أجزاء الخيمة (13 جزء)</h2>
                  <p>علّم أي جزء كمكتمل، ألغِه، أو عدّل سعره للجميع</p>
                </div>
              </div>
              <div className="parts-grid">
                {parts.map((part) => {
                  const owned = selectedTeamParts.find((item) => Number(item.partId) === Number(part.id));
                  const status = owned?.status;
                  const isEditingPrice = editingPartPriceId === part.id;
                  return (
                    <div className={`part-card ${status === "completed" ? "part-completed" : ""}`} key={part.id}>
                      <div className="part-icon">{part.icon}</div>
                      <div className="part-number">الجزء {part.id}</div>
                      <h3>{part.name}</h3>
                      <div className="part-details">
                        <span>⏱️ {part.buildTime} دقيقة</span>
                        {isEditingPrice ? (
                          <span style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                            <input type="number" value={newPartPrice} onChange={(e) => setNewPartPrice(e.target.value)}
                              style={{ width: "70px", padding: "2px 4px", fontSize: "12px", borderRadius: "4px", border: "1px solid #b18436" }} />
                            <button onClick={() => adminSavePartPrice(part.id)} style={{ fontSize: "11px", padding: "2px 6px", background: "#27ae60", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>✓</button>
                            <button onClick={() => setEditingPartPriceId(null)} style={{ fontSize: "11px", padding: "2px 6px", background: "#555", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>✕</button>
                          </span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            💰 {part.price} جنيه
                            <button onClick={() => { setEditingPartPriceId(part.id); setNewPartPrice(String(part.price)); }}
                              style={{ fontSize: "10px", padding: "1px 5px", background: "#8B6914", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer" }}>
                              ✏️
                            </button>
                          </span>
                        )}
                      </div>
                      <div style={{ margin: "8px 0", fontWeight: "bold" }}>
                        {status === "completed" ? "✅ مكتمل" : status === "building" ? "🔨 قيد البناء" : "⬜ غير مشترى"}
                      </div>
                      <div className="admin-tools" style={{ marginTop: "8px" }}>
                        <button className="admin-tool-card" onClick={() => adminMarkPartCompleted(selectedAdminTeam.id, part)}
                          disabled={status === "completed"} style={{ opacity: status === "completed" ? 0.5 : 1 }}>
                          <strong>✅ تعليم كمكتمل</strong>
                        </button>
                        <button className="admin-tool-card" onClick={() => adminResetPart(selectedAdminTeam.id, part)}
                          disabled={!owned} style={{ opacity: !owned ? 0.5 : 1 }}>
                          <strong>↩️ إلغاء الجزء</strong>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* STATIONS CONTROL */}
              <div className="subpage-header" style={{ marginTop: "25px" }}>
                <div>
                  <h2>🗺️ المحطات (8 محطات)</h2>
                  <p>علّم المحطات المنجزة أو ألغِها (الفلوس تُضاف يدوياً من الرصيد)</p>
                </div>
              </div>
              <div className="stations-grid">
                {INITIAL_STATIONS.map((station) => {
                  const completed = selectedTeamStationResults.includes(station.id);
                  return (
                    <div className={`station-card station-card-admin ${completed ? "station-completed" : ""}`} key={station.id}>
                      <div className="station-number-badge">محطة {station.id}</div>
                      <div className="station-icon-big">{station.icon}</div>
                      <h3 className="station-name">{station.name}</h3>
                      <button
                        className="station-button"
                        onClick={() => adminToggleStation(selectedAdminTeam.id, station.id)}
                        style={{ background: completed ? "linear-gradient(#962d2d, #521818)" : undefined }}
                      >
                        {completed ? "↩️ إلغاء الإنجاز" : "✅ تعليم كمنجزة"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
        {notice && <div className="game-notice">{notice}</div>}
      </div>
    );
  }

  // ==========================================
  // RENDER: HOME PAGE
  // ==========================================

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-title">BIBLE</div>
          <div className="logo-title">SCHOOL</div>
          <div className="logo-adventure">ADVENTURE</div>
        </div>
        <nav className="menu">
          <button className={`menu-item ${page === "home" ? "active" : ""}`} onClick={() => handleSidebarNavigation("home")}>
            <span>🏠</span><span>الرئيسية</span>
          </button>
          <button className="menu-item" onClick={() => handleSidebarNavigation("team-login")}>
            <span>👥</span><span>دخول الفريق</span>
          </button>
          <button className="menu-item" onClick={() => handleSidebarNavigation("stations")}>
            <span>🗺️</span><span>المحطات</span>
          </button>
          <button className="menu-item" onClick={() => handleSidebarNavigation("parts")}>
            <span>🏕️</span><span>أجزاء الخيمة</span>
          </button>
          <button className="menu-item" onClick={() => handleSidebarNavigation("ranking")}>
            <span>🏆</span><span>الترتيب</span>
          </button>
          <button className="menu-item" onClick={() => handleSidebarNavigation("activity")}>
            <span>📜</span><span>السجل والنشاط</span>
          </button>
          <button className="menu-item" onClick={() => handleSidebarNavigation("rules")}>
            <span>❓</span><span>تعليمات اللعبة</span>
          </button>
        </nav>
        <div className="sidebar-message">
          <strong>تعاونوا مع فريقكم</strong><br />
          اكسبوا الأموال<br />
          وابنوا خيمة الاجتماع<br />
          لتمجيد اسم الرب ❤️
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar">
          <button className="admin-button" onClick={() => setPage(isAdminLoggedIn ? "admin-dashboard" : "admin-login")}>
            👑 <span>لوحة الأدمن</span>
          </button>
          <button className="admin-button" style={{ background: "linear-gradient(#4d8b2d, #254d12)" }} onClick={() => handleSidebarNavigation("team-login")}>
            👥 <span>دخول الفريق</span>
          </button>
          <button className="menu-button" onClick={() => setShowRulesModal(true)} title="تعليمات اللعبة">❓</button>
        </header>

        {/* HERO */}
        <section className="hero">
          <div className="hero-decoration">🏕️</div>
          <div className="wood-title"><h1>بناء خيمة الاجتماع</h1></div>
          <div className="subtitle">Bible School Adventure</div>
          <div className="verse">«واصنعوا لي مقدساً فأسكن في وسطهم»</div>
          <div className="reference">(خروج 25:8)</div>
          <div className="camp-fire">🔥</div>
          <div className="tent">🏕️</div>
        </section>

        {/* STATS PREVIEW */}
        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div><div className="stat-label">عدد الفرق</div><div className="stat-value">{teams.length} فرق</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🗺️</div>
            <div><div className="stat-label">محطات المغامرة</div><div className="stat-value">8 محطات</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏕️</div>
            <div><div className="stat-label">أجزاء الخيمة</div><div className="stat-value">13 جزء</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div><div className="stat-label">المتصدر حالياً</div><div className="stat-value" style={{ fontSize: "18px" }}>{sortedTeams[0]?.name || "فريق 1"}</div></div>
          </div>
        </section>

        {/* FEATURE TILES */}
        <section className="feature-grid">
          <div className="feature-card green">
            <div className="feature-image">🗺️</div>
            <div className="feature-content">
              <h2>المحطات</h2>
              <p>8 محطات مغامرة مميزة — اجمعوا الأموال وابنوا الخيمة</p>
              <button onClick={() => handleSidebarNavigation("stations")}>اذهب إلى المحطات</button>
            </div>
          </div>
          <div className="feature-card blue">
            <div className="feature-image">🏕️</div>
            <div className="feature-content">
              <h2>أجزاء الخيمة</h2>
              <p>اشترِ وابنِ أجزاء خيمة الاجتماع الـ 13</p>
              <button onClick={() => handleSidebarNavigation("parts")}>استكشف الخيمة</button>
            </div>
          </div>
          <div className="feature-card orange">
            <div className="feature-image">🏛️</div>
            <div className="feature-content">
              <h2>خيمة الاجتماع</h2>
              <p>شوف الخيمة اللي بتبنيها بشكل مرئي حقيقي</p>
              <button onClick={() => handleSidebarNavigation("parts")}>شوف الخيمة</button>
            </div>
          </div>
          <div className="feature-card purple">
            <div className="feature-image">🏆</div>
            <div className="feature-content">
              <h2>الترتيب</h2>
              <p>تابع ترتيب فريقك ونسبة إنجاز الخيمة</p>
              <button onClick={() => handleSidebarNavigation("ranking")}>عرض الترتيب</button>
            </div>
          </div>
        </section>

        {/* BOTTOM PANELS */}
        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-title">🏆 ترتيب الفرق</div>
            {sortedTeams.map((team, index) => (
              <div className="ranking-row" key={team.id}>
                <span>
                  {index === 0 && "🥇"}{index === 1 && "🥈"}{index === 2 && "🥉"}{index === 3 && "🏅"}{" "}
                  {team.name}
                </span>
                <strong>{team.progress}% ({team.completedParts}/13)</strong>
              </div>
            ))}
            <button className="panel-button" onClick={() => handleSidebarNavigation("team-login")}>دخول الفريق والمنافسة</button>
          </div>

          <div className="panel map-panel">
            <div className="panel-title">🗺️ محطات المغامرة</div>
            <div className="map">
              {INITIAL_STATIONS.map((station) => (
                <div className={`station station-${station.id}`} key={station.id} title={station.name}>
                  {station.id}
                </div>
              ))}
            </div>
            <button className="panel-button" onClick={() => handleSidebarNavigation("stations")}>اذهب إلى المحطات</button>
          </div>

          <div className="panel">
            <div className="panel-title">📜 آخر النشاطات</div>
            <div className="activity-list">
              {activities.slice(0, 5).map((act) => (
                <div className="activity-item" key={act.id}>
                  <span>{act.text}</span><span className="activity-time">{act.time}</span>
                </div>
              ))}
            </div>
            <button className="panel-button" onClick={() => setShowActivityModal(true)}>عرض السجل الكامل</button>
          </div>
        </section>
      </main>

      {/* RULES MODAL */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📖 تعليمات وقواعد لعبة خيمة الاجتماع</h2>
              <button className="modal-close-btn" onClick={() => setShowRulesModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>الهدف من اللعبة:</strong> التعاون كفريق لبناء خيمة الاجتماع كاملة (13 جزء) بأعلى دقة وأسرع وقت لتمجيد اسم الرب.</p>
              <ol>
                <li><strong>إنجاز المحطات:</strong> توجد 8 محطات مختلفة، الخدام هيسجلوا الإنجاز وتُضاف مكافأة لرصيدكم.</li>
                <li><strong>شراء وبناء الأجزاء:</strong> الخيمة من 13 جزءاً — كل جزء له سعر ووقت للبناء (بالدقائق).</li>
                <li><strong>اكتمال البناء:</strong> بمجرد انتهاء وقت بناء الجزء، يكتمل تلقائياً وتزداد نسبة إنجاز فريقكم!</li>
              </ol>
              <p style={{ textAlign: "center", marginTop: "15px", color: "#ffd770", fontWeight: "bold" }}>
                «اصنعوا لي مقدساً فأسكن في وسطهم» — بالتوفيق لجميع الفرق! 🎉
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY MODAL */}
      {showActivityModal && (
        <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📜 سجل أحداث ونشاط اللعبة</h2>
              <button className="modal-close-btn" onClick={() => setShowActivityModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="activity-list" style={{ maxHeight: "400px" }}>
                {activities.map((act) => (
                  <div className="activity-item" key={act.id}>
                    <span>{act.text}</span><span className="activity-time">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {notice && <div className="game-notice">{notice}</div>}
    </div>
  );
}

export default App;