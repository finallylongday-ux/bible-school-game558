import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

const INITIAL_TEAMS = [
  {
    id: 1,
    name: "فريق 1",
    pin: "7420",
    balance: 0,
    engineers: 0,
    progress: 0,
    completedParts: 0,
    stations: 0,
  },
  {
    id: 2,
    name: "فريق 2",
    pin: "3691",
    balance: 0,
    engineers: 0,
    progress: 0,
    completedParts: 0,
    stations: 0,
  },
  {
    id: 3,
    name: "فريق 3",
    pin: "5827",
    balance: 0,
    engineers: 0,
    progress: 0,
    completedParts: 0,
    stations: 0,
  },
  {
    id: 4,
    name: "فريق 4",
    pin: "9153",
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

function App() {
  const [page, setPage] = useState("home");

  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [parts, setParts] = useState(INITIAL_PARTS);
  const [stations, setStations] = useState(STATIONS);
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState("");
  const [pin, setPin] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [loggedTeamId, setLoggedTeamId] = useState(null);

  const [adminPin, setAdminPin] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedAdminTeamId, setSelectedAdminTeamId] = useState(null);
  const [activeAdminPage, setActiveAdminPage] = useState("overview");

  const [teamParts, setTeamParts] = useState({});
  const [currentBuild, setCurrentBuild] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const [notice, setNotice] = useState("");

  const [teamStationResults, setTeamStationResults] = useState({});

  const [activeTeamPage, setActiveTeamPage] = useState("dashboard");

  useEffect(() => {
    loadGameData();
  }, []);

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

      if (teamsResult.error) throw teamsResult.error;
      if (partsResult.error) throw partsResult.error;
      if (stationsResult.error) throw stationsResult.error;
      if (teamPartsResult.error) throw teamPartsResult.error;
      if (teamStationsResult.error) throw teamStationsResult.error;

      if (teamsResult.data?.length) {
        setTeams(
          teamsResult.data.map((team) => ({
            ...team,
            completedParts: team.completed_parts ?? 0,
          }))
        );
      }

      if (partsResult.data?.length) {
        setParts(
          partsResult.data.map((part) => ({
            ...part,
            buildTime: part.build_time,
          }))
        );
      }

      if (stationsResult.data?.length) {
        setStations(stationsResult.data);
      }

      const partsByTeam = {};
      (teamPartsResult.data || []).forEach((item) => {
        if (!partsByTeam[item.team_id]) partsByTeam[item.team_id] = [];
        partsByTeam[item.team_id].push({
          partId: item.part_id,
          status: item.status,
          purchasedAt: new Date(item.purchased_at).getTime(),
          completedAt: item.completed_at
            ? new Date(item.completed_at).getTime()
            : null,
          dbId: item.id,
        });
      });
      setTeamParts(partsByTeam);

      const stationsByTeam = {};
      (teamStationsResult.data || []).forEach((item) => {
        if (!stationsByTeam[item.team_id]) stationsByTeam[item.team_id] = [];
        stationsByTeam[item.team_id].push(item.station_id);
      });
      setTeamStationResults(stationsByTeam);

      const builds = {};
      const now = Date.now();
      Object.entries(partsByTeam).forEach(([teamId, teamItems]) => {
        const building = teamItems.find((item) => item.status === "building");
        if (!building) return;
        const part = (partsResult.data || []).find((item) => item.id === building.partId);
        if (!part) return;
        const elapsed = Math.floor((now - building.purchasedAt) / 1000);
        if (elapsed < part.build_time * 60) {
          builds[Number(teamId)] = building.partId;
        }
      });
      setCurrentBuild(builds);

      const activeTeamId = loggedTeamId;
      if (activeTeamId && builds[activeTeamId]) {
        const activeItem = partsByTeam[activeTeamId]?.find(
          (item) => item.partId === builds[activeTeamId] && item.status === "building"
        );
        const activePart = (partsResult.data || []).find(
          (item) => item.id === builds[activeTeamId]
        );
        if (activeItem && activePart) {
          const elapsed = Math.floor((now - activeItem.purchasedAt) / 1000);
          setTimeLeft(Math.max(0, activePart.build_time * 60 - elapsed));
        }
      }
    } catch (error) {
      console.error("Supabase load error:", error);
      showNotice("⚠️ تعذر تحميل البيانات من Supabase.");
    } finally {
      setLoading(false);
    }
  }

  const loggedTeam = teams.find((team) => team.id === loggedTeamId);

  const purchasedParts = teamParts[loggedTeamId] || [];

  const currentPartId = currentBuild[loggedTeamId];

  const currentPart = parts.find(
    (part) => part.id === currentPartId
  );

  const availableEngineers = loggedTeam
    ? loggedTeam.engineers - (currentPart ? 1 : 0)
    : 0;

  const completedParts = purchasedParts.filter(
    (item) => item.status === "completed"
  );

  const currentStationResults =
    teamStationResults[loggedTeamId] || [];

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.progress !== a.progress) {
        return b.progress - a.progress;
      }

      if (b.completedParts !== a.completedParts) {
        return b.completedParts - a.completedParts;
      }

      if (b.stations !== a.stations) {
        return b.stations - a.stations;
      }

      return b.balance - a.balance;
    });
  }, [teams]);

  useEffect(() => {
    if (!currentPartId || !loggedTeamId) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval);

          completeBuild(loggedTeamId, currentPartId);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPartId, loggedTeamId]);

  function showNotice(message) {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 3000);
  }

  async function updateTeam(teamId, changes) {
    setTeams((previousTeams) =>
      previousTeams.map((team) =>
        team.id === teamId
          ? { ...team, ...changes }
          : team
      )
    );

    const dbChanges = { ...changes };
    if ("completedParts" in dbChanges) {
      dbChanges.completed_parts = dbChanges.completedParts;
      delete dbChanges.completedParts;
    }

    const { error } = await supabase
      .from("teams")
      .update(dbChanges)
      .eq("id", teamId);

    if (error) {
      console.error("Supabase team update error:", error);
      showNotice("⚠️ حدث خطأ أثناء حفظ بيانات الفريق.");
    }
  }

  function handleTeamLogin() {
    setLoginMessage("");

    if (!selectedTeam) {
      setLoginMessage("❌ من فضلك اختر فريقك أولًا.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setLoginMessage("❌ الرقم السري يجب أن يكون 4 أرقام.");
      return;
    }

    const team = teams.find(
      (item) => item.id === Number(selectedTeam)
    );

    if (!team) {
      setLoginMessage("❌ الفريق غير موجود.");
      return;
    }

    if (team.pin !== pin) {
      setLoginMessage("❌ الرقم السري غير صحيح.");
      return;
    }

    setLoggedTeamId(team.id);
    setPin("");
    setLoginMessage("");
    setActiveTeamPage("dashboard");
    setPage("team-dashboard");
  }

  function logoutTeam() {
    setSelectedTeam("");
    setPin("");
    setLoggedTeamId(null);
    setActiveTeamPage("dashboard");
    setPage("home");
  }

  function handleAdminLogin() {
    setAdminMessage("");

    if (!/^\d{4}$/.test(adminPin)) {
      setAdminMessage("❌ الرقم السري يجب أن يكون 4 أرقام.");
      return;
    }

    if (adminPin !== "9999") {
      setAdminMessage("❌ الرقم السري للأدمن غير صحيح.");
      return;
    }

    setAdminPin("");
    setAdminMessage("");
    setIsAdminLoggedIn(true);
    setActiveAdminPage("overview");
    setSelectedAdminTeamId(null);
    setPage("admin-dashboard");
  }

  function logoutAdmin() {
    setAdminPin("");
    setAdminMessage("");
    setIsAdminLoggedIn(false);
    setActiveAdminPage("overview");
    setSelectedAdminTeamId(null);
    setPage("home");
  }

  function goAdminPage(nextPage, teamId = null) {
    setActiveAdminPage(nextPage);
    setSelectedAdminTeamId(teamId);
  }

  function buyEngineer() {
    if (!loggedTeam) return;

    const price = 500;

    if (loggedTeam.balance < price) {
      showNotice("❌ الرصيد غير كافٍ لشراء مهندس.");
      return;
    }

    updateTeam(loggedTeam.id, {
      balance: loggedTeam.balance - price,
      engineers: loggedTeam.engineers + 1,
    });

    showNotice("👷 تم شراء مهندس جديد بنجاح!");
  }

  async function buyPart(part) {
    if (!loggedTeam) return;

    if (currentPartId) {
      showNotice(
        "⏳ يوجد جزء قيد البناء حاليًا. انتظر حتى يكتمل."
      );
      return;
    }

    const alreadyOwned = purchasedParts.some(
      (item) => item.partId === part.id
    );

    if (alreadyOwned) {
      showNotice("✅ هذا الجزء تم شراؤه بالفعل.");
      return;
    }

    if (loggedTeam.engineers <= 0) {
      showNotice(
        "👷 تحتاج إلى مهندس متاح لبناء هذا الجزء."
      );
      return;
    }

    if (loggedTeam.balance < part.price) {
      showNotice("❌ الرصيد غير كافٍ.");
      return;
    }

    const purchasedAt = Date.now();

    const { data: insertedPart, error: insertError } = await supabase
      .from("team_parts")
      .insert({
        team_id: loggedTeam.id,
        part_id: part.id,
        status: "building",
        purchased_at: new Date(purchasedAt).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase part purchase error:", insertError);
      showNotice("⚠️ لم يتم حفظ شراء الجزء. حاول مرة أخرى.");
      return;
    }

    const newTeamPart = {
      partId: part.id,
      status: "building",
      purchasedAt,
      dbId: insertedPart.id,
    };

    setTeamParts((previous) => ({
      ...previous,
      [loggedTeam.id]: [
        ...(previous[loggedTeam.id] || []),
        newTeamPart,
      ],
    }));

    setCurrentBuild((previous) => ({
      ...previous,
      [loggedTeam.id]: part.id,
    }));

    setTimeLeft(part.buildTime * 60);

    updateTeam(loggedTeam.id, {
      balance: loggedTeam.balance - part.price,
    });

    showNotice(
      `🏕️ تم شراء ${part.name} بنجاح! بدأ البناء.`
    );
  }

  async function completeBuild(teamId, partId) {
    const part = parts.find((item) => item.id === partId);

    if (!part) return;

    const { error: completeError } = await supabase
      .from("team_parts")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("part_id", partId);

    if (completeError) {
      console.error("Supabase complete build error:", completeError);
      showNotice("⚠️ تعذر حفظ اكتمال الجزء.");
      return;
    }

    setTeamParts((previous) => ({
      ...previous,
      [teamId]: (previous[teamId] || []).map((item) =>
        item.partId === partId
          ? {
              ...item,
              status: "completed",
              completedAt: Date.now(),
            }
          : item
      ),
    }));

    setCurrentBuild((previous) => {
      const next = { ...previous };
      delete next[teamId];
      return next;
    });

    const team = teams.find((item) => item.id === teamId);

    if (!team) return;

    const newCompletedParts = team.completedParts + 1;

    updateTeam(teamId, {
      completedParts: newCompletedParts,
      progress: Math.round(
        (newCompletedParts / parts.length) * 100
      ),
    });

    showNotice(
      `🎉 اكتمل بناء ${part.name}! يمكنك الآن بناء جزء جديد.`
    );
  }

  async function completeStation(station) {
    if (!loggedTeam) return;

    const alreadyCompleted = currentStationResults.includes(
      station.id
    );

    if (alreadyCompleted) {
      showNotice("✅ هذه المحطة تم إنجازها بالفعل.");
      return;
    }

    const { error: stationError } = await supabase
      .from("team_stations")
      .insert({
        team_id: loggedTeam.id,
        station_id: station.id,
      });

    if (stationError) {
      console.error("Supabase station error:", stationError);
      showNotice("⚠️ لم يتم حفظ المحطة. حاول مرة أخرى.");
      return;
    }

    setTeamStationResults((previous) => ({
      ...previous,
      [loggedTeam.id]: [
        ...(previous[loggedTeam.id] || []),
        station.id,
      ],
    }));

    updateTeam(loggedTeam.id, {
      balance: loggedTeam.balance + station.reward,
      stations: loggedTeam.stations + 1,
    });

    showNotice(
      `🎉 أحسنت! حصلتم على ${station.reward} جنيه.`
    );
  }

  async function adminAdjustBalance(teamId, amount) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const newBalance = Math.max(0, Number(team.balance || 0) + Number(amount || 0));
    await adminUpdateTeam(teamId, { balance: newBalance });
  }

  async function adminAdjustEngineers(teamId, delta) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const newEngineers = Math.max(0, Number(team.engineers || 0) + Number(delta || 0));
    await adminUpdateTeam(teamId, { engineers: newEngineers });
  }

  async function adminUpdateTeam(teamId, changes, message = '') {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return false;

    const normalized = { ...changes };
    if ('completedParts' in normalized) normalized.completed_parts = normalized.completedParts;
    delete normalized.completedParts;

    const { error } = await supabase.from('teams').update(normalized).eq('id', teamId);
    if (error) {
      console.error('Supabase admin team update error:', error);
      showNotice('⚠️ لم يتم حفظ التعديل في قاعدة البيانات. راجع صلاحيات Supabase RLS.');
      return false;
    }

    setTeams((previous) =>
      previous.map((item) => (item.id === teamId ? { ...item, ...changes } : item))
    );

    if (message) showNotice(`✅ ${message}`);
    return true;
  }

  async function adminSaveTeamSettings(teamId, name, pin) {
    const cleanName = String(name || '').trim();
    const cleanPin = String(pin || '').trim();
    if (!cleanName) {
      showNotice('❌ اسم الفريق لا يمكن أن يكون فارغًا.');
      return;
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      showNotice('❌ PIN الفريق يجب أن يكون 4 أرقام.');
      return;
    }
    await adminUpdateTeam(teamId, { name: cleanName, pin: cleanPin }, 'تم حفظ اسم وPIN الفريق.');
  }

  async function adminSetTeamProgress(teamId, progress) {
    const value = Math.max(0, Math.min(100, Number(progress) || 0));
    await adminUpdateTeam(teamId, { progress: value }, 'تم تعديل نسبة البناء.');
  }

  async function adminSetTeamPartsCount(teamId, completedParts) {
    const value = Math.max(0, Math.min(parts.length, Number(completedParts) || 0));
    await adminUpdateTeam(teamId, {
      completedParts: value,
      progress: Math.round((value / Math.max(parts.length, 1)) * 100),
    }, 'تم تعديل عدد أجزاء الخيمة المكتملة.');
  }

  async function adminMarkPartCompleted(teamId, part) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;

    const existing = (teamParts[teamId] || []).find((item) => item.partId === part.id);

    if (existing?.status === 'completed') {
      showNotice('✅ الجزء مكتمل بالفعل.');
      return;
    }

    let result;
    if (existing?.dbId) {
      result = await supabase
        .from('team_parts')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', existing.dbId)
        .select('id')
        .single();
    } else {
      result = await supabase
        .from('team_parts')
        .insert({
          team_id: teamId,
          part_id: part.id,
          status: 'completed',
          purchased_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
    }

    if (result.error) {
      console.error('Supabase admin part update error:', result.error);
      showNotice('⚠️ تعذر حفظ حالة الجزء.');
      return;
    }

    const currentItems = teamParts[teamId] || [];
    const nextItems = existing
      ? currentItems.map((item) =>
          item.partId === part.id ? { ...item, status: 'completed', completedAt: Date.now() } : item
        )
      : [...currentItems, { partId: part.id, status: 'completed', purchasedAt: Date.now(), completedAt: Date.now(), dbId: result.data?.id }];

    setTeamParts((previous) => ({ ...previous, [teamId]: nextItems }));

    const completedCount = nextItems.filter((item) => item.status === 'completed').length;
    if (currentBuild[teamId] === part.id) {
      setCurrentBuild((previous) => {
        const next = { ...previous };
        delete next[teamId];
        return next;
      });
      if (loggedTeamId === teamId) setTimeLeft(0);
    }

    await adminUpdateTeam(teamId, {
      completedParts: completedCount,
      progress: Math.round((completedCount / Math.max(parts.length, 1)) * 100),
    }, `تم إنهاء ${part.name} لفريق ${team.name}.`);
  }

  async function adminResetPart(teamId, part) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;

    const existing = (teamParts[teamId] || []).find((item) => item.partId === part.id);
    if (!existing) {
      showNotice('ℹ️ هذا الجزء غير موجود عند الفريق.');
      return;
    }

    const { error } = await supabase
      .from('team_parts')
      .delete()
      .eq('team_id', teamId)
      .eq('part_id', part.id);
    if (error) {
      console.error('Supabase admin part reset error:', error);
      showNotice('⚠️ تعذر إلغاء الجزء.');
      return;
    }

    const nextItems = (teamParts[teamId] || []).filter((item) => item.partId !== part.id);
    setTeamParts((previous) => ({ ...previous, [teamId]: nextItems }));

    if (currentBuild[teamId] === part.id) {
      setCurrentBuild((previous) => {
        const next = { ...previous };
        delete next[teamId];
        return next;
      });
      if (loggedTeamId === teamId) setTimeLeft(0);
    }

    const completedCount = nextItems.filter((item) => item.status === 'completed').length;
    await adminUpdateTeam(teamId, {
      completedParts: completedCount,
      progress: Math.round((completedCount / Math.max(parts.length, 1)) * 100),
    }, `تم إلغاء ${part.name} لفريق ${team.name}.`);
  }

  async function adminToggleStation(teamId, station) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;

    const completedList = teamStationResults[teamId] || [];
    const alreadyCompleted = completedList.includes(station.id);

    if (alreadyCompleted) {
      const { error } = await supabase
        .from('team_stations')
        .delete()
        .eq('team_id', teamId)
        .eq('station_id', station.id);

      if (error) {
        console.error('Supabase admin station remove error:', error);
        showNotice('⚠️ تعذر إلغاء المحطة.');
        return;
      }

      const nextStations = completedList.filter((id) => id !== station.id);
      setTeamStationResults((previous) => ({ ...previous, [teamId]: nextStations }));
      await adminUpdateTeam(teamId, {
        balance: Math.max(0, Number(team.balance || 0) - Number(station.reward || 0)),
        stations: nextStations.length,
      }, `تم إلغاء ${station.name} لفريق ${team.name}.`);
    } else {
      const { error } = await supabase.from('team_stations').insert({
        team_id: teamId,
        station_id: station.id,
      });

      if (error) {
        console.error('Supabase admin station add error:', error);
        showNotice('⚠️ تعذر حفظ المحطة.');
        return;
      }

      const nextStations = [...completedList, station.id];
      setTeamStationResults((previous) => ({ ...previous, [teamId]: nextStations }));
      await adminUpdateTeam(teamId, {
        balance: Number(team.balance || 0) + Number(station.reward || 0),
        stations: nextStations.length,
      }, `تم إنهاء ${station.name} لفريق ${team.name}.`);
    }
  }

  async function adminCompleteAllParts(teamId) {
    for (const part of parts) {
      const existing = (teamParts[teamId] || []).find((item) => item.partId === part.id);
      if (existing?.status === 'completed') continue;
      const { error } = existing?.dbId
        ? await supabase.from('team_parts').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', existing.dbId)
        : await supabase.from('team_parts').insert({ team_id: teamId, part_id: part.id, status: 'completed', purchased_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      if (error) {
        console.error(error);
        showNotice('⚠️ توقف تعميم الأجزاء بسبب خطأ في قاعدة البيانات.');
        return;
      }
    }
    await loadGameData();
    await adminUpdateTeam(teamId, { completedParts: parts.length, progress: 100 }, 'تم إنهاء كل أجزاء الخيمة.');
  }

  async function adminClearAllParts(teamId) {
    const { error } = await supabase.from('team_parts').delete().eq('team_id', teamId);
    if (error) {
      console.error(error);
      showNotice('⚠️ تعذر تصفير أجزاء الفريق.');
      return;
    }
    setTeamParts((previous) => ({ ...previous, [teamId]: [] }));
    setCurrentBuild((previous) => {
      const next = { ...previous };
      delete next[teamId];
      return next;
    });
    if (loggedTeamId === teamId) setTimeLeft(0);
    await adminUpdateTeam(teamId, { completedParts: 0, progress: 0 }, 'تم تصفير أجزاء الخيمة.');
  }

  async function adminCompleteAllStations(teamId) {
    const existing = new Set(teamStationResults[teamId] || []);
    const missing = stations.filter((station) => !existing.has(station.id));
    for (const station of missing) {
      const { error } = await supabase.from('team_stations').insert({ team_id: teamId, station_id: station.id });
      if (error) {
        console.error(error);
        showNotice('⚠️ تعذر إنهاء كل المحطات.');
        return;
      }
    }
    const totalReward = missing.reduce((sum, station) => sum + Number(station.reward || 0), 0);
    const nextStations = stations.map((station) => station.id);
    setTeamStationResults((previous) => ({ ...previous, [teamId]: nextStations }));
    const team = teams.find((item) => item.id === teamId);
    await adminUpdateTeam(teamId, {
      stations: nextStations.length,
      balance: Number(team?.balance || 0) + totalReward,
    }, 'تم إنهاء كل المحطات.');
  }

  async function adminClearAllStations(teamId) {
    const completed = teamStationResults[teamId] || [];
    if (!completed.length) {
      showNotice('ℹ️ لا توجد محطات مكتملة لهذا الفريق.');
      return;
    }
    const { error } = await supabase.from('team_stations').delete().eq('team_id', teamId);
    if (error) {
      console.error(error);
      showNotice('⚠️ تعذر تصفير المحطات.');
      return;
    }
    const refund = completed.reduce((sum, id) => {
      const station = stations.find((item) => item.id === id);
      return sum + Number(station?.reward || 0);
    }, 0);
    const team = teams.find((item) => item.id === teamId);
    setTeamStationResults((previous) => ({ ...previous, [teamId]: [] }));
    await adminUpdateTeam(teamId, {
      stations: 0,
      balance: Math.max(0, Number(team?.balance || 0) - refund),
    }, 'تم تصفير المحطات وإرجاع مكافآتها من الرصيد.');
  }

  async function adminResetTeam(teamId) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    const confirmed = window.confirm(`متأكد إنك عايز تصفر كل بيانات ${team.name}؟\nسيتم حذف الأجزاء والمحطات وإرجاع الرصيد والمهندسين والتقدم للصفر.`);
    if (!confirmed) return;

    const [partsDelete, stationsDelete] = await Promise.all([
      supabase.from('team_parts').delete().eq('team_id', teamId),
      supabase.from('team_stations').delete().eq('team_id', teamId),
    ]);
    if (partsDelete.error || stationsDelete.error) {
      console.error(partsDelete.error || stationsDelete.error);
      showNotice('⚠️ تعذر تصفير الفريق بالكامل.');
      return;
    }

    const ok = await adminUpdateTeam(teamId, {
      balance: 0,
      engineers: 0,
      progress: 0,
      completedParts: 0,
      stations: 0,
    }, `تم تصفير ${team.name} بالكامل.`);
    if (!ok) return;

    setTeamParts((previous) => ({ ...previous, [teamId]: [] }));
    setTeamStationResults((previous) => ({ ...previous, [teamId]: [] }));
    setCurrentBuild((previous) => {
      const next = { ...previous };
      delete next[teamId];
      return next;
    });
    if (loggedTeamId === teamId) setTimeLeft(0);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  function goTeamPage(nextPage) {
    setActiveTeamPage(nextPage);
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🏕️</div>
          <div className="login-title-board">
            <h1>جاري تحميل المغامرة</h1>
            <span>SUPABASE CONNECTED</span>
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

  /* =========================
     ADMIN LOGIN
  ========================= */

  if (page === "admin-login") {
    return (
      <div className="login-page">

        <div className="login-background-decoration decoration-one">
          🌴
        </div>

        <div className="login-background-decoration decoration-two">
          🏕️
        </div>

        <div className="login-background-decoration decoration-three">
          🌵
        </div>

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

          <div className="login-logo">
            👑
          </div>

          <div className="login-title-board">
            <h1>دخول الأدمن</h1>
            <span>ADMIN CONTROL CENTER</span>
          </div>

          <div className="login-content">

            <p className="login-description">
              لوحة التحكم الرئيسية للعبة
            </p>

            <label>
              🔐 الرقم السري للأدمن
            </label>

            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              maxLength="4"
              value={adminPin}
              placeholder="••••"
              onChange={(event) => {
                const value = event.target.value;

                if (/^\d*$/.test(value)) {
                  setAdminPin(value);
                  setAdminMessage("");
                }
              }}
            />

            {adminMessage && (
              <div className="login-error">
                {adminMessage}
              </div>
            )}

            <button
              className="adventure-button"
              onClick={handleAdminLogin}
            >
              دخول لوحة التحكم 👑
            </button>

          </div>

          <div className="login-footer">
            تحكم كامل في أحداث ومغامرة Bible School
          </div>

        </div>

      </div>
    );
  }

  /* =========================
     TEAM LOGIN
  ========================= */

  if (page === "team-login") {
    return (
      <div className="login-page">

        <div className="login-background-decoration decoration-one">
          🌴
        </div>

        <div className="login-background-decoration decoration-two">
          🏕️
        </div>

        <div className="login-background-decoration decoration-three">
          🌵
        </div>

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

          <div className="login-logo">
            🏕️
          </div>

          <div className="login-title-board">
            <h1>دخول الفريق</h1>
            <span>Bible School Adventure</span>
          </div>

          <div className="login-content">

            <p className="login-description">
              اختر فريقك وأدخل الرقم السري لبدء المغامرة
            </p>

            <label>
              👥 اختر الفريق
            </label>

            <select
              className="team-select"
              value={selectedTeam}
              onChange={(event) => {
                setSelectedTeam(event.target.value);
                setLoginMessage("");
              }}
            >
              <option value="">
                اختر فريقك...
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name}
                </option>
              ))}
            </select>

            <label>
              🔐 الرقم السري PIN
            </label>

            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              maxLength="4"
              value={pin}
              placeholder="••••"
              onChange={(event) => {
                const value = event.target.value;

                if (/^\d*$/.test(value)) {
                  setPin(value);
                  setLoginMessage("");
                }
              }}
            />

            {loginMessage && (
              <div className="login-error">
                {loginMessage}
              </div>
            )}

            <button
              className="adventure-button"
              onClick={handleTeamLogin}
            >
              ابدأ المغامرة 🏕️
            </button>

          </div>

          <div className="login-footer">
            "اصنعوا لي مقدسًا فأسكن في وسطهم"
          </div>

        </div>

      </div>
    );
  }

  /* =========================
     TEAM DASHBOARD
  ========================= */

  if (page === "team-dashboard" && loggedTeam) {
    return (
      <div className="team-dashboard">

        <header className="dashboard-top">

          <div>
            <div className="dashboard-small-title">
              BIBLE SCHOOL ADVENTURE
            </div>

            <h1>
              🛡️ {loggedTeam.name}
            </h1>
          </div>

          <button
            className="logout-button"
            onClick={logoutTeam}
          >
            تسجيل الخروج
          </button>

        </header>

        <main className="dashboard-content">

          <section className="welcome-board">

            <div className="welcome-icon">
              🏕️
            </div>

            <div>
              <h2>
                أهلاً بكم يا {loggedTeam.name}! 🎉
              </h2>

              <p>
                حان وقت المغامرة وبناء خيمة الاجتماع.
              </p>
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
              <span>المهندسين</span>
              <strong>{loggedTeam.engineers}</strong>
            </div>

            <div className="dashboard-stat">
              <div>🗺️</div>
              <span>المحطات</span>
              <strong>{loggedTeam.stations} / 7</strong>
            </div>

          </section>

          <section className="building-board">

            <div className="building-header">

              <h2>
                🏕️ تقدم بناء خيمة الاجتماع
              </h2>

              <strong>
                {loggedTeam.progress}%
              </strong>

            </div>

            <div className="progress-container">

              <div
                className="progress-bar"
                style={{
                  width: `${loggedTeam.progress}%`,
                }}
              />

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

                <div className="build-timer">
                  ⏱️ {formatTime(timeLeft)}
                </div>

              </div>
            ) : (
              <p>
                لا يوجد جزء قيد البناء حاليًا.
                ابدأ بإنجاز المحطات للحصول على الأموال.
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
                <small>إدارة المهندسين</small>
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

              <button
                className="back-button"
                onClick={() => goTeamPage("dashboard")}
              >
                ← رجوع للوحة الفريق
              </button>

              {activeTeamPage === "parts" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🏕️ أجزاء الخيمة</h2>
                      <p>
                        اشترِ أجزاء الخيمة وابدأ البناء.
                      </p>
                    </div>

                    <div className="subpage-balance">
                      💰 {loggedTeam.balance} جنيه
                    </div>
                  </div>

                  {currentPart && (
                    <div className="active-build-card">
                      <span>🔨 قيد البناء الآن</span>

                      <strong>
                        {currentPart.icon} {currentPart.name}
                      </strong>

                      <div>
                        ⏱️ متبقي {formatTime(timeLeft)}
                      </div>
                    </div>
                  )}

                  <div className="parts-grid">

                    {parts.map((part) => {
                      const owned = purchasedParts.find(
                        (item) => item.partId === part.id
                      );

                      return (
                        <div
                          className={`part-card ${
                            owned?.status === "completed"
                              ? "part-completed"
                              : ""
                          }`}
                          key={part.id}
                        >

                          <div className="part-icon">
                            {part.icon}
                          </div>

                          <div className="part-number">
                            الجزء {part.id}
                          </div>

                          <h3>{part.name}</h3>

                          <div className="part-details">
                            <span>
                              💰 {part.price} جنيه
                            </span>

                            <span>
                              ⏱️ {part.buildTime} دقيقة
                            </span>
                          </div>

                          {owned?.status === "completed" ? (
                            <button
                              className="completed-button"
                              disabled
                            >
                              ✅ مكتمل
                            </button>
                          ) : owned?.status === "building" ? (
                            <button
                              className="building-button"
                              disabled
                            >
                              🔨 قيد البناء
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

              {activeTeamPage === "engineers" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>👷 المهندسين</h2>
                      <p>
                        كل جزء يحتاج إلى مهندس واحد فقط.
                      </p>
                    </div>
                  </div>

                  <div className="engineer-main-card">

                    <div className="engineer-big-icon">
                      👷
                    </div>

                    <h2>
                      المهندسين المتاحين
                    </h2>

                    <strong className="engineer-count">
                      {availableEngineers}
                    </strong>

                    <p>
                      سعر المهندس: 500 جنيه
                    </p>

                    <button
                      className="buy-engineer-button"
                      onClick={buyEngineer}
                    >
                      👷 شراء مهندس — 500 جنيه
                    </button>

                    {currentPart && (
                      <div className="engineer-warning">
                        🔨 مهندس واحد مستخدم حاليًا في بناء{" "}
                        {currentPart.name}
                      </div>
                    )}

                  </div>
                </>
              )}

              {activeTeamPage === "stations" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🗺️ المحطات</h2>
                      <p>
                        أكمل المحطات واجمع الأموال.
                      </p>
                    </div>

                    <div className="subpage-balance">
                      💰 {loggedTeam.balance} جنيه
                    </div>
                  </div>

                  <div className="stations-grid">

                    {stations.map((station) => {
                      const completed =
                        currentStationResults.includes(
                          station.id
                        );

                      return (
                        <div
                          className={`station-card ${
                            completed
                              ? "station-completed"
                              : ""
                          }`}
                          key={station.id}
                        >

                          <div className="station-icon">
                            {station.icon}
                          </div>

                          <div className="station-number">
                            محطة {station.id}
                          </div>

                          <h3>{station.name}</h3>

                          <div className="station-reward">
                            💰 المكافأة: {station.reward} جنيه
                          </div>

                          <button
                            className="station-button"
                            disabled={completed}
                            onClick={() =>
                              completeStation(station)
                            }
                          >
                            {completed
                              ? "✅ مكتملة"
                              : "إنجاز المحطة"}
                          </button>

                        </div>
                      );
                    })}

                  </div>
                </>
              )}

              {activeTeamPage === "ranking" && (
                <>
                  <div className="subpage-header">
                    <div>
                      <h2>🏆 ترتيب الفرق</h2>
                      <p>
                        تابعوا تقدمكم مقارنة بباقي الفرق.
                      </p>
                    </div>
                  </div>

                  <div className="full-ranking">

                    {sortedTeams.map((team, index) => (
                      <div
                        className={`full-ranking-row ${
                          team.id === loggedTeam.id
                            ? "my-team"
                            : ""
                        }`}
                        key={team.id}
                      >

                        <div className="rank-position">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : "🏅"}
                        </div>

                        <div className="rank-team-name">
                          {team.name}

                          {team.id === loggedTeam.id && (
                            <small>
                              فريقك
                            </small>
                          )}
                        </div>

                        <div>
                          🏕️ {team.progress}%
                        </div>

                        <div>
                          🧱 {team.completedParts}/13
                        </div>

                        <div>
                          🗺️ {team.stations}/7
                        </div>

                      </div>
                    ))}

                  </div>
                </>
              )}

            </section>
          )}

        </main>

        {notice && (
          <div className="game-notice">
            {notice}
          </div>
        )}

      </div>
    );
  }

  /* =========================
     ADMIN DASHBOARD
  ========================= */

  if (page === 'admin-dashboard' && isAdminLoggedIn) {
    const totalBalance = teams.reduce((sum, team) => sum + Number(team.balance || 0), 0);
    const averageProgress = teams.length
      ? Math.round(teams.reduce((sum, team) => sum + Number(team.progress || 0), 0) / teams.length)
      : 0;
    const totalStations = teams.reduce((sum, team) => sum + Number(team.stations || 0), 0);
    const totalCompletedParts = teams.reduce((sum, team) => sum + Number(team.completedParts || 0), 0);
    const selectedAdminTeam = teams.find((team) => team.id === selectedAdminTeamId);
    const selectedTeamParts = selectedAdminTeamId ? teamParts[selectedAdminTeamId] || [] : [];
    const selectedTeamStationResults = selectedAdminTeamId ? teamStationResults[selectedAdminTeamId] || [] : [];

    return (
      <div className='admin-dashboard'>
        <header className='admin-topbar'>
          <div>
            <div className='admin-small-title'>BIBLE SCHOOL ADVENTURE</div>
            <h1>👑 لوحة تحكم الأدمن</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className='back-button' onClick={() => loadGameData()}>🔄 تحديث البيانات</button>
            <button className='logout-button' onClick={logoutAdmin}>تسجيل الخروج</button>
          </div>
        </header>

        <main className='admin-content'>
          {activeAdminPage === 'overview' && (
            <>
              <section className='admin-welcome'>
                <div className='admin-welcome-icon'>👑</div>
                <div>
                  <h2>مركز التحكم الكامل</h2>
                  <p>من هنا تقدر تتحكم في الفرق، الرصيد، المهندسين، الأجزاء، المحطات، التقدم، الاسم وPIN، أو تصفر الفريق بالكامل.</p>
                </div>
              </section>

              <section className='admin-overview'>
                <div className='admin-overview-card'><span>👥</span><small>عدد الفرق</small><strong>{teams.length}</strong></div>
                <div className='admin-overview-card'><span>💰</span><small>إجمالي الأموال</small><strong>{totalBalance} جنيه</strong></div>
                <div className='admin-overview-card'><span>🏕️</span><small>متوسط البناء</small><strong>{averageProgress}%</strong></div>
                <div className='admin-overview-card'><span>🧱</span><small>الأجزاء المكتملة</small><strong>{totalCompletedParts} / {teams.length * parts.length}</strong></div>
                <div className='admin-overview-card'><span>🗺️</span><small>المحطات المكتملة</small><strong>{totalStations} / {teams.length * stations.length}</strong></div>
              </section>

              <section className='admin-section'>
                <div className='admin-section-header'>
                  <div>
                    <h2>👥 الفرق</h2>
                    <p>اضغط على أي فريق لفتح لوحة تحكم كاملة لكل بياناته.</p>
                  </div>
                </div>

                <div className='admin-team-grid'>
                  {sortedTeams.map((team, index) => (
                    <div className='admin-team-card' key={team.id} onClick={() => goAdminPage('team-detail', team.id)} style={{ cursor: 'pointer' }}>
                      <div className='admin-team-header'>
                        <div className='team-number'>{index + 1}</div>
                        <div><h3>{team.name}</h3><small>PIN: {team.pin}</small></div>
                      </div>
                      <div className='admin-team-info'>
                        <div><span>💰 الرصيد</span><strong>{team.balance} جنيه</strong></div>
                        <div><span>👷 المهندسين</span><strong>{team.engineers}</strong></div>
                        <div><span>🏕️ البناء</span><strong>{team.progress}%</strong></div>
                        <div><span>🧱 الأجزاء</span><strong>{team.completedParts}/{parts.length}</strong></div>
                        <div><span>🗺️ المحطات</span><strong>{team.stations}/{stations.length}</strong></div>
                      </div>
                      <div className='admin-team-progress'>
                        <div className='admin-progress-track'><div className='admin-progress-fill' style={{ width: `${team.progress}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeAdminPage === 'team-detail' && selectedAdminTeam && (
            <section className='team-subpage'>
              <button className='back-button' onClick={() => goAdminPage('overview')}>← رجوع لكل الفرق</button>

              <div className='subpage-header'>
                <div>
                  <h2>👑 إدارة {selectedAdminTeam.name}</h2>
                  <p>تحكم كامل في كل بيانات الفريق.</p>
                </div>
                <div className='subpage-balance'>💰 {selectedAdminTeam.balance} جنيه</div>
              </div>

              <section className='dashboard-stats'>
                <div className='dashboard-stat'><div>💰</div><span>الرصيد</span><strong>{selectedAdminTeam.balance} جنيه</strong></div>
                <div className='dashboard-stat'><div>🏕️</div><span>البناء</span><strong>{selectedAdminTeam.progress}%</strong></div>
                <div className='dashboard-stat'><div>👷</div><span>المهندسين</span><strong>{selectedAdminTeam.engineers}</strong></div>
                <div className='dashboard-stat'><div>🧱</div><span>الأجزاء</span><strong>{selectedAdminTeam.completedParts}/{parts.length}</strong></div>
                <div className='dashboard-stat'><div>🗺️</div><span>المحطات</span><strong>{selectedAdminTeam.stations}/{stations.length}</strong></div>
              </section>

              <div className='engineer-main-card'>
                <h2>⚙️ بيانات الفريق الأساسية</h2>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', marginTop: 15 }}>
                  <label>اسم الفريق<input className='team-select' defaultValue={selectedAdminTeam.name} id={`admin-name-${selectedAdminTeam.id}`} /></label>
                  <label>PIN الفريق<input className='pin-input' defaultValue={selectedAdminTeam.pin} maxLength={4} inputMode='numeric' id={`admin-pin-${selectedAdminTeam.id}`} /></label>
                </div>
                <div className='admin-tools' style={{ marginTop: 12 }}>
                  <button className='admin-tool-card' onClick={() => adminSaveTeamSettings(selectedAdminTeam.id, document.getElementById(`admin-name-${selectedAdminTeam.id}`)?.value, document.getElementById(`admin-pin-${selectedAdminTeam.id}`)?.value)}>💾 حفظ البيانات</button>
                </div>
              </div>

              <div className='engineer-main-card'>
                <h2>💰 التحكم في الرصيد</h2>
                <div className='admin-tools' style={{ marginTop: 12 }}>
                  {[100, 500, 1000].map((amount) => <button key={`plus-${amount}`} className='admin-tool-card' onClick={() => adminAdjustBalance(selectedAdminTeam.id, amount)}>➕ +{amount} جنيه</button>)}
                  {[100, 500, 1000].map((amount) => <button key={`minus-${amount}`} className='admin-tool-card' onClick={() => adminAdjustBalance(selectedAdminTeam.id, -amount)}>➖ -{amount} جنيه</button>)}
                  <button className='admin-tool-card' onClick={() => adminUpdateTeam(selectedAdminTeam.id, { balance: 0 }, 'تم تصفير الرصيد.')}>🧹 تصفير الرصيد</button>
                </div>
              </div>

              <div className='engineer-main-card'>
                <h2>👷 التحكم في المهندسين</h2>
                <strong className='engineer-count'>{selectedAdminTeam.engineers}</strong>
                <div className='admin-tools' style={{ marginTop: 12 }}>
                  <button className='admin-tool-card' onClick={() => adminAdjustEngineers(selectedAdminTeam.id, 1)}>➕ إضافة مهندس</button>
                  <button className='admin-tool-card' onClick={() => adminAdjustEngineers(selectedAdminTeam.id, -1)}>➖ إنقاص مهندس</button>
                  <button className='admin-tool-card' onClick={() => adminUpdateTeam(selectedAdminTeam.id, { engineers: 0 }, 'تم تصفير المهندسين.')}>🧹 تصفير المهندسين</button>
                </div>
              </div>

              <div className='engineer-main-card'>
                <h2>🏕️ التحكم في التقدم</h2>
                <div className='admin-tools' style={{ marginTop: 12 }}>
                  {[0, 25, 50, 75, 100].map((value) => <button key={value} className='admin-tool-card' onClick={() => adminSetTeamProgress(selectedAdminTeam.id, value)}>{value}%</button>)}
                </div>
                <div style={{ marginTop: 15 }}>
                  <input type='range' min='0' max='100' value={selectedAdminTeam.progress} onChange={(e) => adminSetTeamProgress(selectedAdminTeam.id, e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div className='engineer-main-card'>
                <h2>🧱 تحكم سريع في أجزاء الخيمة</h2>
                <div className='admin-tools' style={{ marginTop: 12 }}>
                  <button className='admin-tool-card' onClick={() => adminCompleteAllParts(selectedAdminTeam.id)}>✅ إنهاء كل الأجزاء</button>
                  <button className='admin-tool-card' onClick={() => adminClearAllParts(selectedAdminTeam.id)}>↩️ تصفير كل الأجزاء</button>
                  <button className='admin-tool-card' onClick={() => adminSetTeamPartsCount(selectedAdminTeam.id, 0)}>0 أجزاء</button>
                  <button className='admin-tool-card' onClick={() => adminSetTeamPartsCount(selectedAdminTeam.id, parts.length)}>13 أجزاء</button>
                </div>
              </div>

              <div className='subpage-header'><div><h2>🏕️ أجزاء الخيمة</h2><p>تحكم في كل جزء بشكل منفصل.</p></div></div>
              <div className='parts-grid'>
                {parts.map((part) => {
                  const owned = selectedTeamParts.find((item) => item.partId === part.id);
                  const status = owned?.status;
                  return (
                    <div className={`part-card ${status === 'completed' ? 'part-completed' : ''}`} key={part.id}>
                      <div className='part-icon'>{part.icon}</div>
                      <div className='part-number'>الجزء {part.id}</div>
                      <h3>{part.name}</h3>
                      <div className='part-details'><span>💰 {part.price} جنيه</span><span>⏱️ {part.buildTime} دقيقة</span></div>
                      <div>{status === 'completed' ? '✅ مكتمل' : status === 'building' ? '🔨 قيد البناء' : '⬜ غير مشترى'}</div>
                      <div className='admin-tools' style={{ marginTop: 8 }}>
                        <button className='admin-tool-card' onClick={() => adminMarkPartCompleted(selectedAdminTeam.id, part)} disabled={status === 'completed'}>✅ إنهاء</button>
                        <button className='admin-tool-card' onClick={() => adminResetPart(selectedAdminTeam.id, part)} disabled={!owned}>↩️ إلغاء</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className='engineer-main-card'>
                <h2>🗺️ تحكم سريع في المحطات</h2>
                <div className='admin-tools' style={{ marginTop: 12 }}>
                  <button className='admin-tool-card' onClick={() => adminCompleteAllStations(selectedAdminTeam.id)}>✅ إنهاء كل المحطات</button>
                  <button className='admin-tool-card' onClick={() => adminClearAllStations(selectedAdminTeam.id)}>↩️ تصفير المحطات</button>
                </div>
              </div>

              <div className='subpage-header'><div><h2>🗺️ المحطات</h2><p>تعليم أو إلغاء أي محطة مع تحديث الرصيد تلقائيًا.</p></div></div>
              <div className='stations-grid'>
                {stations.map((station) => {
                  const completed = selectedTeamStationResults.includes(station.id);
                  return (
                    <div className={`station-card ${completed ? 'station-completed' : ''}`} key={station.id}>
                      <div className='station-icon'>{station.icon}</div>
                      <div className='station-number'>محطة {station.id}</div>
                      <h3>{station.name}</h3>
                      <div className='station-reward'>💰 المكافأة: {station.reward} جنيه</div>
                      <button className='station-button' onClick={() => adminToggleStation(selectedAdminTeam.id, station)}>{completed ? '↩️ إلغاء الإنجاز' : '✅ تعليم كمنجزة'}</button>
                    </div>
                  );
                })}
              </div>

              <div className='engineer-main-card' style={{ border: '2px solid #b91c1c' }}>
                <h2>⚠️ منطقة الخطر</h2>
                <p>هذا الزر يمسح كل أجزاء ومحطات الفريق ويعيد الرصيد والمهندسين والتقدم للصفر.</p>
                <button className='logout-button' onClick={() => adminResetTeam(selectedAdminTeam.id)}>🗑️ تصفير الفريق بالكامل</button>
              </div>
            </section>
          )}
        </main>
        {notice && <div className='game-notice'>{notice}</div>}
      </div>
    );
  }

  /* =========================
     HOME
  ========================= */

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-title">BIBLE</div>
          <div className="logo-title">SCHOOL</div>
          <div className="logo-adventure">
            ADVENTURE
          </div>
        </div>

        <nav className="menu">

          <button
            className={`menu-item ${
              page === "home" ? "active" : ""
            }`}
            onClick={() => setPage("home")}
          >
            <span>🏠</span>
            <span>الرئيسية</span>
          </button>

          <button
            className="menu-item"
            onClick={() => setPage("team-login")}
          >
            <span>👥</span>
            <span>دخول الفريق</span>
          </button>

          <button className="menu-item">
            <span>🗺️</span>
            <span>المحطات</span>
          </button>

          <button className="menu-item">
            <span>🏕️</span>
            <span>أجزاء الخيمة</span>
          </button>

          <button className="menu-item">
            <span>👷</span>
            <span>المهندسين</span>
          </button>

          <button className="menu-item">
            <span>🏆</span>
            <span>الترتيب</span>
          </button>

          <button className="menu-item">
            <span>📜</span>
            <span>السجل</span>
          </button>

          <button className="menu-item">
            <span>❓</span>
            <span>تعليمات اللعبة</span>
          </button>

        </nav>

        <div className="sidebar-message">

          <strong>
            تعاونوا مع فريقكم
          </strong>

          <br />

          اكسبوا المال

          <br />

          وابنوا خيمة الاجتماع

          <br />

          لتمجيد اسم الرب ❤️

        </div>

      </aside>

      <main className="main-content">

        <header className="top-bar">

          <button
            className="admin-button"
            onClick={() =>
              setPage(isAdminLoggedIn ? "admin-dashboard" : "admin-login")
            }
          >
            👑
            <span>لوحة الأدمن</span>
          </button>

          <button className="menu-button">
            ☰
          </button>

        </header>

        <section className="hero">

          <div className="hero-decoration">
            🏕️
          </div>

          <div className="wood-title">
            <h1>
              بناء خيمة الاجتماع
            </h1>
          </div>

          <div className="subtitle">
            Bible School Adventure
          </div>

          <div className="verse">
            «واصنعوا لي مقدسًا فأسكن في وسطهم»
          </div>

          <div className="reference">
            (خروج 25:8)
          </div>

          <div className="camp-fire">
            🔥
          </div>

          <div className="tent">
            🏕️
          </div>

        </section>

        <section className="stats">

          <div className="stat-card">
            <div className="stat-icon">💰</div>

            <div>
              <div className="stat-label">
                رصيد فريقك
              </div>

              <div className="stat-value">
                سجل دخول الفريق
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👷</div>

            <div>
              <div className="stat-label">
                المهندسين المتاحين
              </div>

              <div className="stat-value">
                -
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏕️</div>

            <div>
              <div className="stat-label">
                الأجزاء المكتملة
              </div>

              <div className="stat-value">
                0 / 13
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>

            <div>
              <div className="stat-label">
                الأجزاء قيد التنفيذ
              </div>

              <div className="stat-value">
                0
              </div>
            </div>
          </div>

        </section>

        <section className="feature-grid">

          <div className="feature-card green">

            <div className="feature-image">
              🗺️
            </div>

            <div className="feature-content">

              <h2>المحطات</h2>

              <p>
                أكمل المهام واكسب المال
              </p>

              <button
                onClick={() => setPage("team-login")}
              >
                اذهب إلى المحطات
              </button>

            </div>

          </div>

          <div className="feature-card blue">

            <div className="feature-image">
              🏕️
            </div>

            <div className="feature-content">

              <h2>أجزاء الخيمة</h2>

              <p>
                اشترِ وابنِ أجزاء الخيمة
              </p>

              <button
                onClick={() => setPage("team-login")}
              >
                استكشف الخيمة
              </button>

            </div>

          </div>

          <div className="feature-card orange">

            <div className="feature-image">
              👷
            </div>

            <div className="feature-content">

              <h2>المهندسين</h2>

              <p>
                وظّف مهندسًا لكل جزء
              </p>

              <button
                onClick={() => setPage("team-login")}
              >
                إدارة المهندسين
              </button>

            </div>

          </div>

          <div className="feature-card purple">

            <div className="feature-image">
              🏆
            </div>

            <div className="feature-content">

              <h2>الترتيب</h2>

              <p>
                شوف ترتيب الفرق
              </p>

              <button
                onClick={() => setPage("team-login")}
              >
                عرض الترتيب
              </button>

            </div>

          </div>

        </section>

        <section className="bottom-grid">

          <div className="panel">

            <div className="panel-title">
              🏆 ترتيب الفرق
            </div>

            {sortedTeams.map((team, index) => (

              <div
                className="ranking-row"
                key={team.id}
              >

                <span>

                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index === 3 && "🏅"}

                  {" "}

                  {team.name}

                </span>

                <strong>
                  {team.progress}%
                </strong>

              </div>

            ))}

            <button
              className="panel-button"
              onClick={() => setPage("team-login")}
            >
              عرض الترتيب الكامل
            </button>

          </div>

          <div className="panel map-panel">

            <div className="panel-title">
              🗺️ خريطة المحطات
            </div>

            <div className="map">

              {stations.map((station) => (
                <div
                  className={`station station-${station.id}`}
                  key={station.id}
                >
                  {station.id}
                </div>
              ))}

            </div>

            <button
              className="panel-button"
              onClick={() => setPage("team-login")}
            >
              اذهب إلى المحطات
            </button>

          </div>

          <div className="panel">

            <div className="panel-title">
              📜 آخر النشاطات
            </div>

            <div className="activity">
              🏕️ اللعبة جاهزة للبدء
            </div>

            <div className="activity">
              👷 لا يوجد مهندسين حتى الآن
            </div>

            <div className="activity">
              💰 لم يتم الحصول على مكافآت
            </div>

            <div className="activity">
              🗺️ لم يتم إكمال أي محطة
            </div>

            <button
              className="panel-button"
              onClick={() => setPage("team-login")}
            >
              ابدأ المغامرة
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;