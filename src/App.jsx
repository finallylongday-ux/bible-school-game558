import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

// ==========================================
// DATA & CONSTANTS
// ==========================================

const INITIAL_TEAMS = [
  {
    id: 1,
    name: "فريق 1",
    pin: "1111",
    balance: 0,
    engineers: 0,
    progress: 0,
    completedParts: 0,
    stations: 0,
  },
  {
    id: 2,
    name: "فريق 2",
    pin: "2222",
    balance: 0,
    engineers: 0,
    progress: 0,
    completedParts: 0,
    stations: 0,
  },
  {
    id: 3,
    name: "فريق 3",
    pin: "3333",
    balance: 0,
    engineers: 0,
    progress: 0,
    completedParts: 0,
    stations: 0,
  },
  {
    id: 4,
    name: "فريق 4",
    pin: "4444",
    balance: 0,
    engineers: 0,
    progress: 0,
    completedParts: 0,
    stations: 0,
  },
];

const INITIAL_PARTS = [
  { id: 1, name: "سور الخيمة", price: 800, buildTime: 20, icon: "🪵" },
  { id: 2, name: "باب الخيمة", price: 700, buildTime: 20, icon: "🚪" },
  { id: 3, name: "مرحضة", price: 900, buildTime: 25, icon: "🪣" },
  { id: 4, name: "مذبح المحرقة", price: 1200, buildTime: 30, icon: "🔥" },
  { id: 5, name: "الأغطية", price: 1000, buildTime: 25, icon: "🧵" },
  { id: 6, name: "القدس", price: 1400, buildTime: 30, icon: "🏛️" },
  { id: 7, name: "المنارة الذهبية", price: 1800, buildTime: 35, icon: "🕎" },
  { id: 8, name: "مذبح البخور", price: 1500, buildTime: 30, icon: "🪔" },
  { id: 9, name: "مائدة خبز الوجوه", price: 1300, buildTime: 30, icon: "🍞" },
  { id: 10, name: "قدس الأقداس", price: 2000, buildTime: 40, icon: "✨" },
  { id: 11, name: "تابوت العهد", price: 2500, buildTime: 45, icon: "📦" },
  { id: 12, name: "لباس رئيس الكهنة", price: 1700, buildTime: 35, icon: "👑" },
  { id: 13, name: "مواد الخيمة", price: 1100, buildTime: 25, icon: "🧰" },
];

const STATIONS = [
  { id: 1, name: "محطة البداية", reward: 500, icon: "🌴" },
  { id: 2, name: "محطة الصحراء", reward: 700, icon: "🏜️" },
  { id: 3, name: "محطة الإيمان", reward: 900, icon: "📖" },
  { id: 4, name: "محطة الحكمة", reward: 1100, icon: "💡" },
  { id: 5, name: "محطة الفريق", reward: 1300, icon: "🤝" },
  { id: 6, name: "محطة المغامرة", reward: 1500, icon: "🧭" },
  { id: 7, name: "المحطة الأخيرة", reward: 2000, icon: "🏆" },
];

// ==========================================
// SOUND SYNTHESIZER (Native Web Audio API)
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
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "complete" || type === "success") {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

const STORAGE_KEYS = {
  TEAMS: "bsg_teams_v2",
  PARTS: "bsg_parts_v2",
  STATIONS: "bsg_stations_v2",
  TEAM_PARTS: "bsg_team_parts_v2",
  TEAM_STATIONS: "bsg_team_stations_v2",
  CURRENT_BUILD: "bsg_current_build_v2",
  ACTIVITIES: "bsg_activities_v2",
};

function getLocal(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("LocalStorage write error:", err);
  }
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  const [page, setPage] = useState("home");

  // Game data state initialized from localStorage
  const [teams, setTeams] = useState(() => getLocal(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
  const [parts, setParts] = useState(() => getLocal(STORAGE_KEYS.PARTS, INITIAL_PARTS));
  const [stations, setStations] = useState(() => getLocal(STORAGE_KEYS.STATIONS, STATIONS));
  const [teamParts, setTeamParts] = useState(() => getLocal(STORAGE_KEYS.TEAM_PARTS, {}));
  const [teamStationResults, setTeamStationResults] = useState(() =>
    getLocal(STORAGE_KEYS.TEAM_STATIONS, {})
  );
  const [currentBuild, setCurrentBuild] = useState(() =>
    getLocal(STORAGE_KEYS.CURRENT_BUILD, {})
  );
  const [activities, setActivities] = useState(() =>
    getLocal(STORAGE_KEYS.ACTIVITIES, [
      { id: 1, text: "🏕️ مرحباً بكم في لعبة بناء خيمة الاجتماع!", time: "الآن" },
      { id: 2, text: "📜 تنافسوا مع باقي الفرق واجمعوا الأموال لإتمام البناء.", time: "الآن" },
    ])
  );

  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
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
  const [customBalanceAmount, setCustomBalanceAmount] = useState("");
  const [editingPinTeamId, setEditingPinTeamId] = useState(null);
  const [newTeamPin, setNewTeamPin] = useState("");

  // Persist local state whenever it changes
  useEffect(() => {
    setLocal(STORAGE_KEYS.TEAMS, teams);
  }, [teams]);

  useEffect(() => {
    setLocal(STORAGE_KEYS.TEAM_PARTS, teamParts);
  }, [teamParts]);

  useEffect(() => {
    setLocal(STORAGE_KEYS.TEAM_STATIONS, teamStationResults);
  }, [teamStationResults]);

  useEffect(() => {
    setLocal(STORAGE_KEYS.CURRENT_BUILD, currentBuild);
  }, [currentBuild]);

  useEffect(() => {
    setLocal(STORAGE_KEYS.ACTIVITIES, activities);
  }, [activities]);

  // Load from Supabase on mount
  useEffect(() => {
    loadGameData();
  }, []);

  function addActivity(text) {
    const timeStr = new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setActivities((prev) => [{ id: Date.now(), text, time: timeStr }, ...prev.slice(0, 49)]);
  }

  function showNotice(message, isError = false) {
    setNotice(message);
    if (isError) {
      playSound("error");
    }
    setTimeout(() => {
      setNotice("");
    }, 3500);
  }

  // ==========================================
  // SYNC & DATA LOADING
  // ==========================================

  async function loadGameData() {
    try {
      setLoading(true);

      const [teamsResult, partsResult, stationsResult, teamPartsResult, teamStationsResult] =
        await Promise.all([
          supabase.from("teams").select("*").order("id"),
          supabase.from("parts").select("*").order("id"),
          supabase.from("stations").select("*").order("id"),
          supabase.from("team_parts").select("*"),
          supabase.from("team_stations").select("*"),
        ]);

      if (teamsResult.data && teamsResult.data.length > 0) {
        setTeams(
          teamsResult.data.map((team) => ({
            ...team,
            completedParts: team.completed_parts ?? team.completedParts ?? 0,
          }))
        );
      }

      if (partsResult.data && partsResult.data.length > 0) {
        setParts(
          partsResult.data.map((part) => ({
            ...part,
            buildTime: part.build_time ?? part.buildTime ?? 20,
          }))
        );
      }

      if (stationsResult.data && stationsResult.data.length > 0) {
        setStations(stationsResult.data);
      }

      if (teamPartsResult.data) {
        const partsByTeam = {};
        teamPartsResult.data.forEach((item) => {
          if (!partsByTeam[item.team_id]) partsByTeam[item.team_id] = [];
          partsByTeam[item.team_id].push({
            partId: Number(item.part_id),
            status: item.status,
            purchasedAt: new Date(item.purchased_at || Date.now()).getTime(),
            completedAt: item.completed_at ? new Date(item.completed_at).getTime() : null,
            dbId: item.id,
          });
        });
        setTeamParts(partsByTeam);

        // Check active builds
        const builds = {};
        const now = Date.now();
        const activePartsList = partsResult.data?.length ? partsResult.data : INITIAL_PARTS;

        Object.entries(partsByTeam).forEach(([teamId, items]) => {
          const building = items.find((item) => item.status === "building");
          if (!building) return;
          const part = activePartsList.find((p) => p.id === building.partId);
          if (!part) return;
          const elapsed = Math.floor((now - building.purchasedAt) / 1000);
          const duration = (part.build_time || part.buildTime || 20) * 60;
          if (elapsed < duration) {
            builds[Number(teamId)] = building.partId;
          }
        });
        setCurrentBuild(builds);
      }

      if (teamStationsResult.data) {
        const stationsByTeam = {};
        teamStationsResult.data.forEach((item) => {
          if (!stationsByTeam[item.team_id]) stationsByTeam[item.team_id] = [];
          stationsByTeam[item.team_id].push(Number(item.station_id));
        });
        setTeamStationResults(stationsByTeam);
      }
    } catch (err) {
      console.warn("Supabase connection fallback to local storage:", err);
    } finally {
      setLoading(false);
    }
  }

  // Helper to update team in local state & Supabase
  async function updateTeam(teamId, changes) {
    const updatedTeams = teams.map((t) => (t.id === teamId ? { ...t, ...changes } : t));
    setTeams(updatedTeams);

    // Background sync to Supabase
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
  // COMPUTED VARIABLES & HOOKS
  // ==========================================

  const loggedTeam = teams.find((team) => team.id === loggedTeamId);
  const purchasedParts = teamParts[loggedTeamId] || [];
  const currentPartId = currentBuild[loggedTeamId];
  const currentPart = parts.find((part) => part.id === currentPartId);
  const currentStationResults = teamStationResults[loggedTeamId] || [];

  const availableEngineers = loggedTeam
    ? Math.max(0, (loggedTeam.engineers || 0) - (currentPart ? 1 : 0))
    : 0;

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress;
      if (b.completedParts !== a.completedParts) return b.completedParts - a.completedParts;
      if (b.stations !== a.stations) return b.stations - a.stations;
      return b.balance - a.balance;
    });
  }, [teams]);

  // Timer effect for building parts
  useEffect(() => {
    if (!currentPartId || !loggedTeamId) {
      setTimeLeft(0);
      return;
    }

    const part = parts.find((p) => p.id === currentPartId);
    if (!part) return;

    const teamItems = teamParts[loggedTeamId] || [];
    const activeItem = teamItems.find(
      (item) => item.partId === currentPartId && item.status === "building"
    );

    const now = Date.now();
    const purchasedAt = activeItem?.purchasedAt || now;
    const totalDurationSec = (part.buildTime || 20) * 60;
    const elapsedSec = Math.floor((now - purchasedAt) / 1000);
    const initialTimeLeft = Math.max(1, totalDurationSec - elapsedSec);

    setTimeLeft(initialTimeLeft);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          completeBuild(loggedTeamId, currentPartId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPartId, loggedTeamId]);

  // ==========================================
  // AUTH ACTIONS
  // ==========================================

  function handleTeamLogin() {
    setLoginMessage("");
    if (!selectedTeam) {
      setLoginMessage("❌ من فضلك اختر فريقك أولاً.");
      playSound("error");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setLoginMessage("❌ الرقم السري يجب أن يتكون من 4 أرقام.");
      playSound("error");
      return;
    }

    const team = teams.find((item) => item.id === Number(selectedTeam));
    if (!team) {
      setLoginMessage("❌ الفريق غير موجود.");
      playSound("error");
      return;
    }

    if (String(team.pin).trim() !== String(pin).trim()) {
      setLoginMessage("❌ الرقم السري غير صحيح.");
      playSound("error");
      return;
    }

    setLoggedTeamId(team.id);
    setPin("");
    setLoginMessage("");
    setActiveTeamPage("dashboard");
    setPage("team-dashboard");
    playSound("click");
  }

  function logoutTeam() {
    setSelectedTeam("");
    setPin("");
    setLoggedTeamId(null);
    setActiveTeamPage("dashboard");
    setPage("home");
    playSound("click");
  }

  function handleAdminLogin() {
    setAdminMessage("");
    if (!adminPin) {
      setAdminMessage("❌ من فضلك أدخل الرقم السري للأدمن.");
      playSound("error");
      return;
    }

    if (adminPin !== "9999" && adminPin !== "admin") {
      setAdminMessage("❌ الرقم السري للأدمن غير صحيح (الافتراضي: 9999).");
      playSound("error");
      return;
    }

    setAdminPin("");
    setAdminMessage("");
    setIsAdminLoggedIn(true);
    setActiveAdminPage("overview");
    setSelectedAdminTeamId(null);
    setPage("admin-dashboard");
    playSound("click");
  }

  function logoutAdmin() {
    setAdminPin("");
    setAdminMessage("");
    setIsAdminLoggedIn(false);
    setActiveAdminPage("overview");
    setSelectedAdminTeamId(null);
    setPage("home");
    playSound("click");
  }

  function goAdminPage(nextPage, teamId = null) {
    setActiveAdminPage(nextPage);
    setSelectedAdminTeamId(teamId);
    playSound("click");
  }

  function goTeamPage(nextPage) {
    setActiveTeamPage(nextPage);
    playSound("click");
  }

  // ==========================================
  // TEAM GAMEPLAY ACTIONS
  // ==========================================

  async function buyEngineer() {
    if (!loggedTeam) return;

    const price = 500;
    if (loggedTeam.balance < price) {
      showNotice("❌ الرصيد غير كافٍ لشراء مهندس (السعر 500 جنيه).", true);
      return;
    }

    const newBalance = loggedTeam.balance - price;
    const newEngineers = (loggedTeam.engineers || 0) + 1;

    await updateTeam(loggedTeam.id, {
      balance: newBalance,
      engineers: newEngineers,
    });

    playSound("buy");
    showNotice("👷 تم توظيف مهندس جديد بنجاح!");
    addActivity(`👷 قام ${loggedTeam.name} بتوظيف مهندس جديد.`);
  }

  async function buyPart(part) {
    if (!loggedTeam) return;

    if (currentPartId) {
      showNotice("⏳ يوجد جزء قيد البناء حالياً. انتظر حتى يكتمل.", true);
      return;
    }

    const alreadyOwned = purchasedParts.some(
      (item) => Number(item.partId) === Number(part.id)
    );
    if (alreadyOwned) {
      showNotice("✅ هذا الجزء تم شراؤه بالفعل.", true);
      return;
    }

    if (Number(loggedTeam.engineers || 0) <= 0) {
      showNotice("👷 تحتاج إلى شراء مهندس أولاً من قسم المهندسين لبدء البناء!", true);
      return;
    }

    const price = Number(part.price || 0);
    const balance = Number(loggedTeam.balance || 0);

    if (balance < price) {
      showNotice(`❌ الرصيد غير كافٍ لشراء ${part.name} (السعر: ${price} جنيه).`, true);
      return;
    }

    const purchasedAt = Date.now();
    const newTeamPart = {
      partId: part.id,
      status: "building",
      purchasedAt,
      completedAt: null,
      dbId: null,
    };

    // 1. Update local state immediately
    setTeamParts((prev) => ({
      ...prev,
      [loggedTeam.id]: [...(prev[loggedTeam.id] || []), newTeamPart],
    }));

    setCurrentBuild((prev) => ({
      ...prev,
      [loggedTeam.id]: part.id,
    }));

    setTimeLeft(Math.max(1, Number(part.buildTime || 20) * 60));

    // 2. Update balance
    await updateTeam(loggedTeam.id, {
      balance: balance - price,
    });

    // 3. Background sync to Supabase
    try {
      await supabase.from("team_parts").insert({
        team_id: loggedTeam.id,
        part_id: part.id,
        status: "building",
        purchased_at: new Date(purchasedAt).toISOString(),
        completed_at: null,
      });
    } catch (err) {
      console.warn("Supabase buy part sync warning:", err);
    }

    playSound("buy");
    showNotice(`🏕️ تم شراء ${part.name} بنجاح! بدأ البناء.`);
    addActivity(`🏕️ بدأ ${loggedTeam.name} بناء "${part.name}".`);
  }

  async function completeBuild(teamId, partId) {
    const part = parts.find((item) => item.id === partId);
    if (!part) return;

    // 1. Update team parts
    setTeamParts((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] || []).map((item) =>
        item.partId === partId
          ? { ...item, status: "completed", completedAt: Date.now() }
          : item
      ),
    }));

    // 2. Clear current build
    setCurrentBuild((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });

    // 3. Update team stats
    const team = teams.find((item) => item.id === teamId);
    if (team) {
      const newCompletedParts = (team.completedParts || 0) + 1;
      const newProgress = Math.min(100, Math.round((newCompletedParts / parts.length) * 100));

      await updateTeam(teamId, {
        completedParts: newCompletedParts,
        progress: newProgress,
      });
    }

    // 4. Background sync
    try {
      await supabase
        .from("team_parts")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("team_id", teamId)
        .eq("part_id", partId);
    } catch (err) {
      console.warn("Supabase complete build sync warning:", err);
    }

    playSound("complete");
    showNotice(`🎉 اكتمل بناء ${part.name}! أصبح متاحاً لك بناء جزء جديد.`);
    addActivity(`🎉 أتم ${team?.name || "فريق"} بناء "${part.name}".`);
  }

  async function completeStation(station) {
    if (!loggedTeam) return;

    const alreadyCompleted = currentStationResults.includes(station.id);
    if (alreadyCompleted) {
      showNotice("✅ هذه المحطة تم إنجازها بالفعل من قبل فريقكم.", true);
      return;
    }

    // 1. Update local state
    setTeamStationResults((prev) => ({
      ...prev,
      [loggedTeam.id]: [...(prev[loggedTeam.id] || []), station.id],
    }));

    const newBalance = (loggedTeam.balance || 0) + station.reward;
    const newStations = (loggedTeam.stations || 0) + 1;

    await updateTeam(loggedTeam.id, {
      balance: newBalance,
      stations: newStations,
    });

    // 2. Background sync
    try {
      await supabase.from("team_stations").insert({
        team_id: loggedTeam.id,
        station_id: station.id,
      });
    } catch (err) {
      console.warn("Supabase station sync warning:", err);
    }

    playSound("success");
    showNotice(`🎉 أحسنتم! تم إنجاز ${station.name} وحصلتم على ${station.reward} جنيه.`);
    addActivity(`🗺️ أتم ${loggedTeam.name} "${station.name}" (+${station.reward} جنيه).`);
  }

  // ==========================================
  // ADMIN DASHBOARD ACTIONS
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
    if (isNaN(amount) || amount < 0) {
      showNotice("❌ من فضلك أدخل مبلغ صحيح.", true);
      return;
    }
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
    if (existing?.status === "completed") {
      showNotice("✅ هذا الجزء مكتمل بالفعل.", true);
      return;
    }

    // 1. Update local team parts
    setTeamParts((prev) => {
      const list = prev[teamId] || [];
      const exists = list.some((item) => item.partId === part.id);
      const updated = exists
        ? list.map((item) =>
            item.partId === part.id
              ? { ...item, status: "completed", completedAt: Date.now() }
              : item
          )
        : [
            ...list,
            {
              partId: part.id,
              status: "completed",
              purchasedAt: Date.now(),
              completedAt: Date.now(),
            },
          ];
      return { ...prev, [teamId]: updated };
    });

    // 2. Clear current build if active
    if (currentBuild[teamId] === part.id) {
      setCurrentBuild((prev) => {
        const next = { ...prev };
        delete next[teamId];
        return next;
      });
      if (loggedTeamId === teamId) setTimeLeft(0);
    }

    // 3. Update team stats
    const newCompleted = (team.completedParts || 0) + 1;
    const newProgress = Math.min(100, Math.round((newCompleted / parts.length) * 100));

    await updateTeam(teamId, {
      completedParts: newCompleted,
      progress: newProgress,
    });

    // 4. Background sync
    try {
      if (existing) {
        await supabase
          .from("team_parts")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("team_id", teamId)
          .eq("part_id", part.id);
      } else {
        await supabase.from("team_parts").insert({
          team_id: teamId,
          part_id: part.id,
          status: "completed",
          purchased_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("Supabase admin part complete sync warning:", err);
    }

    playSound("success");
    showNotice(`🎉 تم تعليم "${part.name}" كمكتمل لفريق ${team.name}.`);
    addActivity(`👑 الأدمن علّم "${part.name}" كمكتمل لـ ${team.name}.`);
  }

  async function adminResetPart(teamId, part) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;

    const existing = (teamParts[teamId] || []).find((item) => item.partId === part.id);
    if (!existing) {
      showNotice("ℹ️ هذا الجزء غير مشترى أصلاً.", true);
      return;
    }

    // 1. Remove from local parts
    setTeamParts((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] || []).filter((item) => item.partId !== part.id),
    }));

    // 2. Clear build if active
    if (currentBuild[teamId] === part.id) {
      setCurrentBuild((prev) => {
        const next = { ...prev };
        delete next[teamId];
        return next;
      });
      if (loggedTeamId === teamId) setTimeLeft(0);
    }

    // 3. Decrement completed if it was complete
    if (existing.status === "completed") {
      const newCompleted = Math.max(0, (team.completedParts || 0) - 1);
      const newProgress = Math.round((newCompleted / parts.length) * 100);
      await updateTeam(teamId, {
        completedParts: newCompleted,
        progress: newProgress,
      });
    }

    // 4. Background sync
    try {
      await supabase
        .from("team_parts")
        .delete()
        .eq("team_id", teamId)
        .eq("part_id", part.id);
    } catch (err) {
      console.warn("Supabase admin part reset sync warning:", err);
    }

    playSound("click");
    showNotice(`↩️ تم إلغاء "${part.name}" لفريق ${team.name}.`);
    addActivity(`👑 الأدمن ألغى "${part.name}" لـ ${team.name}.`);
  }

  async function adminToggleStation(teamId, station) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;

    const completedList = teamStationResults[teamId] || [];
    const alreadyCompleted = completedList.includes(station.id);

    if (alreadyCompleted) {
      // Remove station
      setTeamStationResults((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter((id) => id !== station.id),
      }));

      const newBalance = Math.max(0, (team.balance || 0) - station.reward);
      const newStations = Math.max(0, (team.stations || 0) - 1);

      await updateTeam(teamId, {
        balance: newBalance,
        stations: newStations,
      });

      try {
        await supabase
          .from("team_stations")
          .delete()
          .eq("team_id", teamId)
          .eq("station_id", station.id);
      } catch (err) {
        console.warn("Supabase admin toggle station delete warning:", err);
      }

      playSound("click");
      showNotice(`↩️ تم إلغاء محطة "${station.name}" لفريق ${team.name}.`);
      addActivity(`👑 الأدمن ألغى محطة "${station.name}" لـ ${team.name}.`);
    } else {
      // Add station
      setTeamStationResults((prev) => ({
        ...prev,
        [teamId]: [...(prev[teamId] || []), station.id],
      }));

      const newBalance = (team.balance || 0) + station.reward;
      const newStations = (team.stations || 0) + 1;

      await updateTeam(teamId, {
        balance: newBalance,
        stations: newStations,
      });

      try {
        await supabase.from("team_stations").insert({
          team_id: teamId,
          station_id: station.id,
        });
      } catch (err) {
        console.warn("Supabase admin toggle station insert warning:", err);
      }

      playSound("success");
      showNotice(`✅ تم تعليم محطة "${station.name}" كمكتملة لفريق ${team.name}.`);
      addActivity(`👑 الأدمن علّم محطة "${station.name}" كمكتملة لـ ${team.name}.`);
    }
  }

  async function adminSaveTeamPin(teamId) {
    if (!/^\d{4}$/.test(newTeamPin)) {
      showNotice("❌ الرقم السري يجب أن يكون 4 أرقام.", true);
      return;
    }
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    await updateTeam(teamId, { pin: newTeamPin });
    setEditingPinTeamId(null);
    setNewTeamPin("");
    playSound("buy");
    showNotice(`🔐 تم تغيير الرقم السري لـ ${team.name} بنجاح.`);
  }

  async function adminResetSingleTeam(teamId) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    if (!window.confirm(`هل أنت متأكد من تصفير بيانات ${team.name} بالكامل؟`)) return;

    setTeamParts((prev) => ({ ...prev, [teamId]: [] }));
    setTeamStationResults((prev) => ({ ...prev, [teamId]: [] }));
    setCurrentBuild((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });

    await updateTeam(teamId, {
      balance: 0,
      engineers: 0,
      progress: 0,
      completedParts: 0,
      stations: 0,
    });

    try {
      await Promise.all([
        supabase.from("team_parts").delete().eq("team_id", teamId),
        supabase.from("team_stations").delete().eq("team_id", teamId),
      ]);
    } catch (err) {
      console.warn("Supabase reset team warning:", err);
    }

    playSound("click");
    showNotice(`🔄 تم تصفير بيانات ${team.name} بالكامل.`);
    addActivity(`👑 قام الأدمن بتصفير بيانات ${team.name}.`);
  }

  async function adminResetAllTeams() {
    if (!window.confirm("⚠️ تحذير: هل أنت متأكد من تصفير بيانات جميع الفرق بالكامل لبدء لعبة جديدة؟")) {
      return;
    }

    setTeamParts({});
    setTeamStationResults({});
    setCurrentBuild({});

    const resetTeamsList = teams.map((team) => ({
      ...team,
      balance: 0,
      engineers: 0,
      progress: 0,
      completedParts: 0,
      stations: 0,
    }));
    setTeams(resetTeamsList);

    try {
      await Promise.all([
        supabase.from("team_parts").delete().neq("id", 0),
        supabase.from("team_stations").delete().neq("id", 0),
        ...resetTeamsList.map((t) =>
          supabase
            .from("teams")
            .update({
              balance: 0,
              engineers: 0,
              progress: 0,
              completed_parts: 0,
              stations: 0,
            })
            .eq("id", t.id)
        ),
      ]);
    } catch (err) {
      console.warn("Supabase reset all warning:", err);
    }

    playSound("complete");
    showNotice("🔄 تم تصفير بيانات اللعبة لجميع الفرق بنجاح!");
    addActivity("👑 قام الأدمن بتصفير بيانات اللعبة وبدء جولة جديدة.");
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function handleSidebarNavigation(target) {
    playSound("click");
    if (target === "home") {
      setPage("home");
    } else if (target === "team-login") {
      if (loggedTeamId) {
        setPage("team-dashboard");
        setActiveTeamPage("dashboard");
      } else {
        setPage("team-login");
      }
    } else if (target === "stations") {
      if (loggedTeamId) {
        setPage("team-dashboard");
        setActiveTeamPage("stations");
      } else {
        showNotice("👥 سجل دخول فريقك أولاً للوصول إلى المحطات.");
        setPage("team-login");
      }
    } else if (target === "parts") {
      if (loggedTeamId) {
        setPage("team-dashboard");
        setActiveTeamPage("parts");
      } else {
        showNotice("👥 سجل دخول فريقك أولاً للوصول إلى أجزاء الخيمة.");
        setPage("team-login");
      }
    } else if (target === "engineers") {
      if (loggedTeamId) {
        setPage("team-dashboard");
        setActiveTeamPage("engineers");
      } else {
        showNotice("👥 سجل دخول فريقك أولاً لإدارة المهندسين.");
        setPage("team-login");
      }
    } else if (target === "ranking") {
      if (loggedTeamId) {
        setPage("team-dashboard");
        setActiveTeamPage("ranking");
      } else {
        // Scroll to ranking on home
        setPage("home");
      }
    } else if (target === "rules") {
      setShowRulesModal(true);
    } else if (target === "activity") {
      setShowActivityModal(true);
    }
  }

  // ==========================================
  // RENDER: LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🏕️</div>
          <div className="login-title-board">
            <h1>جاري تحميل المغامرة</h1>
            <span>BIBLE SCHOOL ADVENTURE</span>
          </div>
          <div className="login-content">
            <p className="login-description">
              بنجهز بيانات الفرق والمحطات وأجزاء الخيمة...
            </p>
          </div>
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
          <button
            className="back-button"
            onClick={() => {
              setAdminMessage("");
              setAdminPin("");
              setPage("home");
            }}
          >
            ← العودة للرئيسية
          </button>

          <div className="login-logo">👑</div>

          <div className="login-title-board">
            <h1>دخول الأدمن</h1>
            <span>ADMIN CONTROL CENTER</span>
          </div>

          <div className="login-content">
            <p className="login-description">لوحة التحكم الرئيسية للمشرفين والخدام</p>

            <label>🔐 الرقم السري للأدمن (الافتراضي: 9999)</label>

            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              maxLength="6"
              value={adminPin}
              placeholder="••••"
              autoFocus
              onChange={(e) => {
                setAdminPin(e.target.value);
                setAdminMessage("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdminLogin();
              }}
            />

            {adminMessage && <div className="login-error">{adminMessage}</div>}

            <button className="adventure-button" onClick={handleAdminLogin}>
              دخول لوحة التحكم 👑
            </button>
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
          <button
            className="back-button"
            onClick={() => {
              setLoginMessage("");
              setSelectedTeam("");
              setPin("");
              setPage("home");
            }}
          >
            ← العودة للرئيسية
          </button>

          <div className="login-logo">🏕️</div>

          <div className="login-title-board">
            <h1>دخول الفريق</h1>
            <span>BIBLE SCHOOL ADVENTURE</span>
          </div>

          <div className="login-content">
            <p className="login-description">اختر فريقك وأدخل الرقم السري لبدء المغامرة</p>

            <label>👥 اختر الفريق</label>

            <select
              className="team-select"
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setLoginMessage("");
              }}
            >
              <option value="">اختر فريقك...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <label>🔐 الرقم السري PIN (4 أرقام)</label>

            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              maxLength="4"
              value={pin}
              placeholder="••••"
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  setPin(val);
                  setLoginMessage("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTeamLogin();
              }}
            />

            {loginMessage && <div className="login-error">{loginMessage}</div>}

            <button className="adventure-button" onClick={handleTeamLogin}>
              ابدأ المغامرة 🏕️
            </button>
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
    return (
      <div className="team-dashboard">
        <header className="dashboard-top">
          <div>
            <div className="dashboard-small-title">BIBLE SCHOOL ADVENTURE</div>
            <h1>🛡️ {loggedTeam.name}</h1>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="panel-button" style={{ margin: 0 }} onClick={() => setShowRulesModal(true)}>
              ❓ التعليمات
            </button>
            <button className="logout-button" onClick={logoutTeam}>
              تسجيل الخروج
            </button>
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
              <div>💰</div>
              <span>الرصيد</span>
              <strong>{loggedTeam.balance} جنيه</strong>
            </div>

            <div className="dashboard-stat">
              <div>🏕️</div>
              <span>نسبة البناء</span>
              <strong>{loggedTeam.progress}%</strong>
            </div>

            <div className="dashboard-stat">
              <div>👷</div>
              <span>المهندسين المتاحين</span>
              <strong>{availableEngineers} / {loggedTeam.engineers}</strong>
            </div>

            <div className="dashboard-stat">
              <div>🗺️</div>
              <span>المحطات</span>
              <strong>{loggedTeam.stations} / 7</strong>
            </div>
          </section>

          <section className="building-board">
            <div className="building-header">
              <h2>🏕️ تقدم بناء خيمة الاجتماع</h2>
              <strong>{loggedTeam.progress}%</strong>
            </div>

            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${loggedTeam.progress}%` }} />
            </div>

            {currentPart ? (
              <div className="current-build-box">
                <div>
                  🔨 يتم الآن بناء:
                  <strong>
                    {" "}
                    {currentPart.icon} {currentPart.name}
                  </strong>
                </div>
                <div className="build-timer">⏱️ متبقي: {formatTime(timeLeft)}</div>
              </div>
            ) : (
              <p>
                لا يوجد جزء قيد البناء حالياً. ابدأ بإنجاز المحطات لكسب المال، ثم وظّف مهندسين وابنِ الأجزاء!
              </p>
            )}
          </section>

          {activeTeamPage === "dashboard" && (
            <section className="dashboard-actions">
              <button
                className="dashboard-action green-action"
                onClick={() => goTeamPage("stations")}
              >
                🗺️
                <span>المحطات</span>
                <small>اكسب المال</small>
              </button>

              <button
                className="dashboard-action blue-action"
                onClick={() => goTeamPage("parts")}
              >
                🏕️
                <span>أجزاء الخيمة</span>
                <small>ابدأ البناء</small>
              </button>

              <button
                className="dashboard-action orange-action"
                onClick={() => goTeamPage("engineers")}
              >
                👷
                <span>المهندسين</span>
                <small>إدارة المهندسين ({loggedTeam.engineers})</small>
              </button>

              <button
                className="dashboard-action purple-action"
                onClick={() => goTeamPage("ranking")}
              >
                🏆
                <span>الترتيب</span>
                <small>اعرف مركزك</small>
              </button>
            </section>
          )}

          {activeTeamPage !== "dashboard" && (
            <section className="team-subpage">
              <button className="back-button" onClick={() => goTeamPage("dashboard")}>
                ← رجوع للوحة الفريق
              </button>

              {/* SUBPAGE: PARTS */}
              {activeTeamPage === "parts" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🏕️ متجر أجزاء الخيمة (13 جزء)</h2>
                      <p>اشترِ أجزاء الخيمة وابدأ البناء فوراً.</p>
                    </div>
                    <div className="subpage-balance">💰 رصيدكم: {loggedTeam.balance} جنيه</div>
                  </div>

                  {currentPart && (
                    <div className="active-build-card">
                      <span>🔨 قيد البناء الآن</span>
                      <strong>
                        {currentPart.icon} {currentPart.name}
                      </strong>
                      <div>⏱️ متبقي {formatTime(timeLeft)}</div>
                    </div>
                  )}

                  <div className="parts-grid">
                    {parts.map((part) => {
                      const owned = purchasedParts.find(
                        (item) => Number(item.partId) === Number(part.id)
                      );

                      return (
                        <div
                          className={`part-card ${
                            owned?.status === "completed" ? "part-completed" : ""
                          }`}
                          key={part.id}
                        >
                          <div className="part-icon">{part.icon}</div>
                          <div className="part-number">الجزء {part.id}</div>
                          <h3>{part.name}</h3>
                          <div className="part-details">
                            <span>💰 {part.price} جنيه</span>
                            <span>⏱️ {part.buildTime} دقيقة</span>
                          </div>

                          {owned?.status === "completed" ? (
                            <button className="completed-button" disabled>
                              ✅ مكتمل
                            </button>
                          ) : owned?.status === "building" ? (
                            <button className="building-button" disabled>
                              🔨 قيد البناء ({formatTime(timeLeft)})
                            </button>
                          ) : (
                            <button
                              className="buy-button"
                              onClick={() => buyPart(part)}
                              disabled={Boolean(currentPart)}
                            >
                              شراء وبدء البناء
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* SUBPAGE: ENGINEERS */}
              {activeTeamPage === "engineers" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>👷 إدارة المهندسين</h2>
                      <p>كل جزء يحتاج إلى مهندس واحد أثناء بنائه.</p>
                    </div>
                    <div className="subpage-balance">💰 رصيدكم: {loggedTeam.balance} جنيه</div>
                  </div>

                  <div className="engineer-main-card">
                    <div className="engineer-big-icon">👷</div>
                    <h2>المهندسين المتاحين حالياً</h2>
                    <strong className="engineer-count">{availableEngineers}</strong>
                    <p>إجمالي المهندسين لديكم: {loggedTeam.engineers} مهندس</p>
                    <p style={{ marginTop: "6px", color: "#f1d17a" }}>
                      سعر توظيف المهندس: <strong>500 جنيه</strong>
                    </p>

                    <button className="buy-engineer-button" onClick={buyEngineer}>
                      👷 توظيف مهندس جديد — 500 جنيه
                    </button>

                    {currentPart && (
                      <div className="engineer-warning" style={{ marginTop: "16px" }}>
                        🔨 مهندس واحد يعمل حالياً في بناء <strong>{currentPart.name}</strong>.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SUBPAGE: STATIONS */}
              {activeTeamPage === "stations" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🗺️ محطات المغامرة (7 محطات)</h2>
                      <p>أكمل المحطات مع القائد واجمع الأموال لبناء الخيمة.</p>
                    </div>
                    <div className="subpage-balance">💰 رصيدكم: {loggedTeam.balance} جنيه</div>
                  </div>

                  <div className="stations-grid">
                    {stations.map((station) => {
                      const completed = currentStationResults.includes(station.id);

                      return (
                        <div
                          className={`station-card ${
                            completed ? "station-completed" : ""
                          }`}
                          key={station.id}
                        >
                          <div className="station-icon">{station.icon}</div>
                          <div className="station-number">محطة {station.id}</div>
                          <h3>{station.name}</h3>
                          <div className="station-reward">
                            💰 المكافأة: {station.reward} جنيه
                          </div>

                          <button
                            className="station-button"
                            disabled={completed}
                            onClick={() => completeStation(station)}
                          >
                            {completed ? "✅ مكتملة بنجاح" : "إنجاز المحطة ✨"}
                          </button>
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
                      <div
                        className={`full-ranking-row ${
                          team.id === loggedTeam.id ? "my-team" : ""
                        }`}
                        key={team.id}
                      >
                        <div className="rank-position">
                          {index === 0
                            ? "🥇 الأول"
                            : index === 1
                            ? "🥈 الثاني"
                            : index === 2
                            ? "🥉 الثالث"
                            : "🏅 الرابع"}
                        </div>

                        <div className="rank-team-name">
                          {team.name}
                          {team.id === loggedTeam.id && <small> (فريقكم)</small>}
                        </div>

                        <div>🏕️ البناء: {team.progress}%</div>
                        <div>🧱 الأجزاء: {team.completedParts}/13</div>
                        <div>🗺️ المحطات: {team.stations}/7</div>
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
    const averageProgress =
      teams.length > 0
        ? Math.round(
            teams.reduce((sum, team) => sum + (team.progress || 0), 0) / teams.length
          )
        : 0;
    const totalStations = teams.reduce((sum, team) => sum + (team.stations || 0), 0);

    const selectedAdminTeam = teams.find((team) => team.id === selectedAdminTeamId);
    const selectedTeamParts = selectedAdminTeamId ? teamParts[selectedAdminTeamId] || [] : [];
    const selectedTeamStationResults = selectedAdminTeamId
      ? teamStationResults[selectedAdminTeamId] || []
      : [];

    return (
      <div className="admin-dashboard">
        <header className="admin-topbar">
          <div>
            <div className="admin-small-title">BIBLE SCHOOL ADVENTURE</div>
            <h1>👑 لوحة تحكم الأدمن والمشرفين</h1>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="panel-button admin-danger-btn"
              style={{ margin: 0, padding: "8px 12px", fontSize: "13px" }}
              onClick={adminResetAllTeams}
            >
              🔄 تصفير كل اللعبة
            </button>
            <button className="logout-button" onClick={logoutAdmin}>
              تسجيل الخروج
            </button>
          </div>
        </header>

        <main className="admin-content">
          {activeAdminPage === "overview" && (
            <>
              <section className="admin-welcome">
                <div className="admin-welcome-icon">👑</div>
                <div>
                  <h2>مركز التحكم الرئيسي</h2>
                  <p>
                    من هنا يمكنك متابعة وإدارة حالة كل فريق، تعديل الأرصدة، المهندسين، واعتماد الأجزاء والمحطات.
                    اضغط على أي فريق للتحكم فيه بالكامل.
                  </p>
                </div>
              </section>

              <section className="admin-overview">
                <div className="admin-overview-card">
                  <span>👥</span>
                  <small>عدد الفرق</small>
                  <strong>{teams.length}</strong>
                </div>

                <div className="admin-overview-card">
                  <span>💰</span>
                  <small>إجمالي أموال الفرق</small>
                  <strong>{totalBalance} جنيه</strong>
                </div>

                <div className="admin-overview-card">
                  <span>🏕️</span>
                  <small>متوسط البناء</small>
                  <strong>{averageProgress}%</strong>
                </div>

                <div className="admin-overview-card">
                  <span>🗺️</span>
                  <small>المحطات المنجزة</small>
                  <strong>{totalStations} / 28</strong>
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-section-header">
                  <div>
                    <h2>👥 قائمة الفرق</h2>
                    <p>اضغط على أي فريق لفتح لوحة التحكم الخاصة به</p>
                  </div>
                </div>

                <div className="admin-team-grid">
                  {sortedTeams.map((team, index) => (
                    <div
                      className="admin-team-card"
                      key={team.id}
                      onClick={() => goAdminPage("team-detail", team.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="admin-team-header">
                        <div className="team-number">{index + 1}</div>
                        <div>
                          <h3>{team.name}</h3>
                          <small style={{ color: "#f1d17a" }}>PIN: {team.pin}</small>
                        </div>
                      </div>

                      <div className="admin-team-info">
                        <div>
                          <span>💰 الرصيد</span>
                          <strong>{team.balance} جنيه</strong>
                        </div>

                        <div>
                          <span>👷 المهندسين</span>
                          <strong>{team.engineers}</strong>
                        </div>

                        <div>
                          <span>🏕️ نسبة البناء</span>
                          <strong>{team.progress}%</strong>
                        </div>

                        <div>
                          <span>🗺️ المحطات</span>
                          <strong>{team.stations} / 7</strong>
                        </div>
                      </div>

                      <div className="admin-team-progress">
                        <div className="admin-progress-track">
                          <div
                            className="admin-progress-fill"
                            style={{ width: `${team.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeAdminPage === "team-detail" && selectedAdminTeam && (
            <section className="team-subpage">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button className="back-button" onClick={() => goAdminPage("overview")}>
                  ← رجوع لكل الفرق
                </button>

                <button
                  className="panel-button admin-danger-btn"
                  style={{ margin: 0, padding: "6px 12px", fontSize: "12px" }}
                  onClick={() => adminResetSingleTeam(selectedAdminTeam.id)}
                >
                  🔄 تصفير بيانات هذا الفريق
                </button>
              </div>

              <div className="subpage-header" style={{ marginTop: "12px" }}>
                <div>
                  <h2>👑 تحكم كامل في: {selectedAdminTeam.name}</h2>
                  <p>
                    الرقم السري الحالي: <span className="pin-badge">{selectedAdminTeam.pin}</span>
                    <button
                      className="panel-button"
                      style={{ margin: "0 8px", padding: "3px 10px", fontSize: "11px" }}
                      onClick={() => {
                        setEditingPinTeamId(selectedAdminTeam.id);
                        setNewTeamPin(selectedAdminTeam.pin);
                      }}
                    >
                      تغيير PIN
                    </button>
                  </p>
                </div>
                <div className="subpage-balance">💰 الرصيد: {selectedAdminTeam.balance} جنيه</div>
              </div>

              {/* PIN EDIT MODAL / INLINE */}
              {editingPinTeamId === selectedAdminTeam.id && (
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(0,0,0,0.3)",
                    border: "2px solid #d69c3a",
                    borderRadius: "10px",
                    marginBottom: "15px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <label>أدخل PIN الجديد (4 أرقام):</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={newTeamPin}
                    style={{ width: "90px", padding: "6px", textAlign: "center", fontSize: "16px" }}
                    onChange={(e) => setNewTeamPin(e.target.value)}
                  />
                  <button
                    className="panel-button"
                    style={{ margin: 0 }}
                    onClick={() => adminSaveTeamPin(selectedAdminTeam.id)}
                  >
                    حفظ
                  </button>
                  <button
                    className="panel-button"
                    style={{ margin: 0, background: "#555" }}
                    onClick={() => setEditingPinTeamId(null)}
                  >
                    إلغاء
                  </button>
                </div>
              )}

              {/* STATS OVERVIEW */}
              <div className="dashboard-stats">
                <div className="dashboard-stat">
                  <div>💰</div>
                  <span>الرصيد</span>
                  <strong>{selectedAdminTeam.balance} جنيه</strong>
                </div>

                <div className="dashboard-stat">
                  <div>🏕️</div>
                  <span>نسبة البناء</span>
                  <strong>{selectedAdminTeam.progress}%</strong>
                </div>

                <div className="dashboard-stat">
                  <div>👷</div>
                  <span>المهندسين</span>
                  <strong>{selectedAdminTeam.engineers}</strong>
                </div>

                <div className="dashboard-stat">
                  <div>🗺️</div>
                  <span>المحطات</span>
                  <strong>{selectedAdminTeam.stations} / 7</strong>
                </div>
              </div>

              {/* BALANCE CONTROL */}
              <div className="engineer-main-card" style={{ marginTop: "20px" }}>
                <h2>💰 التحكم في الرصيد</h2>
                <div className="admin-tools" style={{ marginTop: "12px" }}>
                  <button
                    className="admin-tool-card"
                    onClick={() => adminAdjustBalance(selectedAdminTeam.id, 100)}
                  >
                    <span>➕</span>
                    <strong>+100 جنيه</strong>
                  </button>

                  <button
                    className="admin-tool-card"
                    onClick={() => adminAdjustBalance(selectedAdminTeam.id, 500)}
                  >
                    <span>➕</span>
                    <strong>+500 جنيه</strong>
                  </button>

                  <button
                    className="admin-tool-card"
                    onClick={() => adminAdjustBalance(selectedAdminTeam.id, -100)}
                  >
                    <span>➖</span>
                    <strong>-100 جنيه</strong>
                  </button>

                  <button
                    className="admin-tool-card"
                    onClick={() => adminAdjustBalance(selectedAdminTeam.id, -500)}
                  >
                    <span>➖</span>
                    <strong>-500 جنيه</strong>
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "14px",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    type="number"
                    placeholder="مبلغ مخصص..."
                    value={customBalanceAmount}
                    onChange={(e) => setCustomBalanceAmount(e.target.value)}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "2px solid #b18436",
                      width: "150px",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    className="panel-button"
                    style={{ margin: 0 }}
                    onClick={() => adminSetCustomBalance(selectedAdminTeam.id)}
                  >
                    تحديد الرصيد
                  </button>
                </div>
              </div>

              {/* ENGINEERS CONTROL */}
              <div className="engineer-main-card" style={{ marginTop: "20px" }}>
                <h2>👷 التحكم في المهندسين</h2>
                <strong className="engineer-count">{selectedAdminTeam.engineers}</strong>

                <div className="admin-tools" style={{ marginTop: "12px" }}>
                  <button
                    className="admin-tool-card"
                    onClick={() => adminAdjustEngineers(selectedAdminTeam.id, 1)}
                  >
                    <span>➕</span>
                    <strong>إضافة مهندس</strong>
                  </button>

                  <button
                    className="admin-tool-card"
                    onClick={() => adminAdjustEngineers(selectedAdminTeam.id, -1)}
                  >
                    <span>➖</span>
                    <strong>إنقاص مهندس</strong>
                  </button>
                </div>
              </div>

              {/* PARTS CONTROL */}
              <div className="subpage-header" style={{ marginTop: "25px" }}>
                <div>
                  <h2>🏕️ أجزاء الخيمة (13 جزء)</h2>
                  <p>علّم أي جزء كمكتمل فوراً أو ألغِه للتعديل</p>
                </div>
              </div>

              <div className="parts-grid">
                {parts.map((part) => {
                  const owned = selectedTeamParts.find(
                    (item) => Number(item.partId) === Number(part.id)
                  );
                  const status = owned?.status;

                  return (
                    <div
                      className={`part-card ${
                        status === "completed" ? "part-completed" : ""
                      }`}
                      key={part.id}
                    >
                      <div className="part-icon">{part.icon}</div>
                      <div className="part-number">الجزء {part.id}</div>
                      <h3>{part.name}</h3>
                      <div className="part-details">
                        <span>💰 {part.price} جنيه</span>
                        <span>⏱️ {part.buildTime} دقيقة</span>
                      </div>

                      <div style={{ margin: "8px 0", fontWeight: "bold" }}>
                        {status === "completed"
                          ? "✅ مكتمل"
                          : status === "building"
                          ? "🔨 قيد البناء"
                          : "⬜ غير مشترى"}
                      </div>

                      <div className="admin-tools" style={{ marginTop: "8px" }}>
                        <button
                          className="admin-tool-card"
                          onClick={() => adminMarkPartCompleted(selectedAdminTeam.id, part)}
                          disabled={status === "completed"}
                          style={{
                            opacity: status === "completed" ? 0.5 : 1,
                            cursor: status === "completed" ? "not-allowed" : "pointer",
                          }}
                        >
                          <strong>✅ تعليم كمكتمل</strong>
                        </button>

                        <button
                          className="admin-tool-card"
                          onClick={() => adminResetPart(selectedAdminTeam.id, part)}
                          disabled={!owned}
                          style={{
                            opacity: !owned ? 0.5 : 1,
                            cursor: !owned ? "not-allowed" : "pointer",
                          }}
                        >
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
                  <h2>🗺️ المحطات (7 محطات)</h2>
                  <p>علّم أي محطة كمكتملة أو ألغِها (تُعدل الرصيد تلقائياً)</p>
                </div>
              </div>

              <div className="stations-grid">
                {stations.map((station) => {
                  const completed = selectedTeamStationResults.includes(station.id);

                  return (
                    <div
                      className={`station-card ${
                        completed ? "station-completed" : ""
                      }`}
                      key={station.id}
                    >
                      <div className="station-icon">{station.icon}</div>
                      <div className="station-number">محطة {station.id}</div>
                      <h3>{station.name}</h3>
                      <div className="station-reward">💰 المكافأة: {station.reward} جنيه</div>

                      <button
                        className="station-button"
                        onClick={() => adminToggleStation(selectedAdminTeam.id, station)}
                        style={{
                          background: completed ? "linear-gradient(#962d2d, #521818)" : undefined,
                        }}
                      >
                        {completed ? "↩️ إلغاء الإنجاز (-" + station.reward + ")" : "✅ تعليم كمنجزة (+" + station.reward + ")"}
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
          <button
            className={`menu-item ${page === "home" ? "active" : ""}`}
            onClick={() => handleSidebarNavigation("home")}
          >
            <span>🏠</span>
            <span>الرئيسية</span>
          </button>

          <button
            className="menu-item"
            onClick={() => handleSidebarNavigation("team-login")}
          >
            <span>👥</span>
            <span>دخول الفريق</span>
          </button>

          <button
            className="menu-item"
            onClick={() => handleSidebarNavigation("stations")}
          >
            <span>🗺️</span>
            <span>المحطات</span>
          </button>

          <button
            className="menu-item"
            onClick={() => handleSidebarNavigation("parts")}
          >
            <span>🏕️</span>
            <span>أجزاء الخيمة</span>
          </button>

          <button
            className="menu-item"
            onClick={() => handleSidebarNavigation("engineers")}
          >
            <span>👷</span>
            <span>المهندسين</span>
          </button>

          <button
            className="menu-item"
            onClick={() => handleSidebarNavigation("ranking")}
          >
            <span>🏆</span>
            <span>الترتيب</span>
          </button>

          <button
            className="menu-item"
            onClick={() => handleSidebarNavigation("activity")}
          >
            <span>📜</span>
            <span>السجل والنشاط</span>
          </button>

          <button
            className="menu-item"
            onClick={() => handleSidebarNavigation("rules")}
          >
            <span>❓</span>
            <span>تعليمات اللعبة</span>
          </button>
        </nav>

        <div className="sidebar-message">
          <strong>تعاونوا مع فريقكم</strong>
          <br />
          اكسبوا الأموال
          <br />
          وابنوا خيمة الاجتماع
          <br />
          لتمجيد اسم الرب ❤️
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar">
          <button
            className="admin-button"
            onClick={() =>
              setPage(isAdminLoggedIn ? "admin-dashboard" : "admin-login")
            }
          >
            👑 <span>لوحة الأدمن</span>
          </button>

          <button
            className="admin-button"
            style={{ background: "linear-gradient(#4d8b2d, #254d12)" }}
            onClick={() => handleSidebarNavigation("team-login")}
          >
            👥 <span>دخول الفريق</span>
          </button>

          <button
            className="menu-button"
            onClick={() => setShowRulesModal(true)}
            title="تعليمات اللعبة"
          >
            ❓
          </button>
        </header>

        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-decoration">🏕️</div>
          <div className="wood-title">
            <h1>بناء خيمة الاجتماع</h1>
          </div>
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
            <div>
              <div className="stat-label">عدد الفرق</div>
              <div className="stat-value">{teams.length} فرق</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🗺️</div>
            <div>
              <div className="stat-label">محطات المغامرة</div>
              <div className="stat-value">7 محطات</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏕️</div>
            <div>
              <div className="stat-label">أجزاء الخيمة</div>
              <div className="stat-value">13 جزء</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div>
              <div className="stat-label">المتصدر حالياً</div>
              <div className="stat-value" style={{ fontSize: "18px" }}>
                {sortedTeams[0]?.name || "فريق 1"}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE TILES */}
        <section className="feature-grid">
          <div className="feature-card green">
            <div className="feature-image">🗺️</div>
            <div className="feature-content">
              <h2>المحطات</h2>
              <p>أكمل المهام والتحديات واكسب المال</p>
              <button onClick={() => handleSidebarNavigation("stations")}>
                اذهب إلى المحطات
              </button>
            </div>
          </div>

          <div className="feature-card blue">
            <div className="feature-image">🏕️</div>
            <div className="feature-content">
              <h2>أجزاء الخيمة</h2>
              <p>اشترِ وابنِ أجزاء خيمة الاجتماع الـ 13</p>
              <button onClick={() => handleSidebarNavigation("parts")}>
                استكشف الخيمة
              </button>
            </div>
          </div>

          <div className="feature-card orange">
            <div className="feature-image">👷</div>
            <div className="feature-content">
              <h2>المهندسين</h2>
              <p>وظّف مهندسين لبناء الأجزاء في الوقت المحدد</p>
              <button onClick={() => handleSidebarNavigation("engineers")}>
                إدارة المهندسين
              </button>
            </div>
          </div>

          <div className="feature-card purple">
            <div className="feature-image">🏆</div>
            <div className="feature-content">
              <h2>الترتيب</h2>
              <p>تابع ترتيب فريقك ونسبة إنجاز الخيمة</p>
              <button onClick={() => handleSidebarNavigation("ranking")}>
                عرض الترتيب
              </button>
            </div>
          </div>
        </section>

        {/* BOTTOM PANELS */}
        <section className="bottom-grid">
          {/* RANKING PANEL */}
          <div className="panel">
            <div className="panel-title">🏆 ترتيب الفرق</div>
            {sortedTeams.map((team, index) => (
              <div className="ranking-row" key={team.id}>
                <span>
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index === 3 && "🏅"}{" "}
                  {team.name}
                </span>
                <strong>{team.progress}% ({team.completedParts}/13)</strong>
              </div>
            ))}
            <button className="panel-button" onClick={() => handleSidebarNavigation("team-login")}>
              دخول الفريق والمنافسة
            </button>
          </div>

          {/* MAP PANEL */}
          <div className="panel map-panel">
            <div className="panel-title">🗺️ خريطة المحطات</div>
            <div className="map">
              {stations.map((station) => (
                <div className={`station station-${station.id}`} key={station.id}>
                  {station.id}
                </div>
              ))}
            </div>
            <button className="panel-button" onClick={() => handleSidebarNavigation("stations")}>
              اذهب إلى المحطات
            </button>
          </div>

          {/* ACTIVITY LOG PANEL */}
          <div className="panel">
            <div className="panel-title">📜 آخر النشاطات</div>
            <div className="activity-list">
              {activities.slice(0, 5).map((act) => (
                <div className="activity-item" key={act.id}>
                  <span>{act.text}</span>
                  <span className="activity-time">{act.time}</span>
                </div>
              ))}
            </div>
            <button className="panel-button" onClick={() => setShowActivityModal(true)}>
              عرض السجل الكامل
            </button>
          </div>
        </section>
      </main>

      {/* RULES MODAL */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📖 تعليمات وقواعد لعبة خيمة الاجتماع</h2>
              <button className="modal-close-btn" onClick={() => setShowRulesModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>الهدف من اللعبة:</strong> التعاون كفريق لبناء خيمة الاجتماع كاملة (13 جزء) بأعلى دقة وأسرع وقت لتمجيد اسم الرب.
              </p>
              <ol>
                <li>
                  <strong>إنجاز المحطات:</strong> توجد 7 محطات مختلفة، كل محطة تنجزونها تمنحكم مكافأة مالية (من 500 إلى 2000 جنيه).
                </li>
                <li>
                  <strong>توظيف المهندسين:</strong> لبناء أي جزء، تحتاجون إلى توظيف مهندس (تكلفة المهندس 500 جنيه). المهندس يشرف على بناء جزء واحد في كل مرة.
                </li>
                <li>
                  <strong>شراء وبناء الأجزاء:</strong> تتكون الخيمة من 13 جزءاً (مثل السور، المذبح، المنارة، تابوت العهد). كل جزء له سعر ووقت محدد للبناء.
                </li>
                <li>
                  <strong>اكتمال البناء والترتيب:</strong> بمجرد انتهاء وقت بناء الجزء، يكتمل وتزداد نسبة إنجاز فريقكم نحو المركز الأول! 🥇
                </li>
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
              <button className="modal-close-btn" onClick={() => setShowActivityModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="activity-list" style={{ maxHeight: "400px" }}>
                {activities.map((act) => (
                  <div className="activity-item" key={act.id}>
                    <span>{act.text}</span>
                    <span className="activity-time">{act.time}</span>
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