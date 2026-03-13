import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, Shield, Swords, TimerReset, Zap, Sparkles, AlertTriangle, Filter, SortAsc, Brain, Sword, ShieldCheck, Flame } from 'lucide-react';
import { api } from '../services/api';
import { PROVIDERS, RARITIES } from '../data/cards';

const MAX_DECK = 5;
const MAX_TACTIC_TURNS = 16;
const ACTIONS = [
  { id: 'strike', label: 'Strike', icon: Sword, color: 'from-red-600 to-orange-500', cost: 20, desc: 'Power hit' },
  { id: 'focus', label: 'Focus', icon: Brain, color: 'from-violet-600 to-purple-500', cost: 15, desc: 'Build burst stacks' },
  { id: 'guard', label: 'Guard', icon: ShieldCheck, color: 'from-cyan-600 to-blue-500', cost: 10, desc: 'Stabilize combo' },
  { id: 'burst', label: 'Burst', icon: Flame, color: 'from-yellow-500 to-amber-400', cost: 35, desc: 'Huge payoff' },
];

function msToNextHour() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(60, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

function formatCountdown(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function hpColor(pct) {
  if (pct > 60) return '#22c55e';
  if (pct > 30) return '#f59e0b';
  return '#ef4444';
}

export function BossFight({ user, onBack, onProfileSync = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [bossRaid, setBossRaid] = useState(null);
  const [collection, setCollection] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(msToNextHour());
  const [phase, setPhase] = useState('deck'); // deck | combat

  const [filterProvider, setFilterProvider] = useState('ALL');
  const [filterRarity, setFilterRarity] = useState('ALL');
  const [sortBy, setSortBy] = useState('stats');

  const [turn, setTurn] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [focusStacks, setFocusStacks] = useState(0);
  const [previewHp, setPreviewHp] = useState(0);
  const [actionLog, setActionLog] = useState([]);
  const [combatFeed, setCombatFeed] = useState([]);
  const [floating, setFloating] = useState([]);
  const [latestRewards, setLatestRewards] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setCountdown(msToNextHour()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.getCurrentBoss(user.id);
        if (!mounted) return;
        setBossRaid(res.bossRaid);
        setCollection(res.profile?.collection || []);
        if (res.retroRewards) {
          setLatestRewards({ ...res.retroRewards, type: 'retro_exhausted' });
        }
        onProfileSync(res.profile);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load boss');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  // Intentionally keyed to user id only to avoid refetch loops from callback identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const usedIds = useMemo(() => new Set(bossRaid?.usedCardIds || []), [bossRaid]);

  const availableCards = useMemo(() => {
    const filtered = (collection || []).filter(c => !usedIds.has(c.id));
    const byProvider = filterProvider === 'ALL' ? filtered : filtered.filter(c => c.provider === filterProvider);
    const byRarity = filterRarity === 'ALL' ? byProvider : byProvider.filter(c => c.rarity === filterRarity);
    const sorted = [...byRarity];
    const rarityRank = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, MYTHIC: 5 };
    sorted.sort((a, b) => {
      const aTotal = (a.stats?.power || 0) + (a.stats?.speed || 0) + (a.stats?.intelligence || 0) + (a.stats?.creativity || 0);
      const bTotal = (b.stats?.power || 0) + (b.stats?.speed || 0) + (b.stats?.intelligence || 0) + (b.stats?.creativity || 0);
      if (sortBy === 'stats') return bTotal - aTotal;
      if (sortBy === 'rarity') return (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0);
      if (sortBy === 'power') return (b.stats?.power || 0) - (a.stats?.power || 0);
      if (sortBy === 'speed') return (b.stats?.speed || 0) - (a.stats?.speed || 0);
      if (sortBy === 'intelligence') return (b.stats?.intelligence || 0) - (a.stats?.intelligence || 0);
      if (sortBy === 'creativity') return (b.stats?.creativity || 0) - (a.stats?.creativity || 0);
      return String(a.name).localeCompare(String(b.name));
    });
    return sorted;
  }, [collection, usedIds, filterProvider, filterRarity, sortBy]);

  const selectedCards = useMemo(() => {
    const byId = new Map((collection || []).map(c => [c.id, c]));
    return selectedIds.map(id => byId.get(id)).filter(Boolean);
  }, [selectedIds, collection]);

  function toggleCard(cardId) {
    if (usedIds.has(cardId)) return;
    if (selectedIds.includes(cardId)) {
      setSelectedIds(prev => prev.filter(id => id !== cardId));
      return;
    }
    if (selectedIds.length >= MAX_DECK) return;
    setSelectedIds(prev => [...prev, cardId]);
  }

  function addFloat(value) {
    const id = Date.now() + Math.random();
    setFloating(prev => [...prev, { id, value }]);
    setTimeout(() => setFloating(prev => prev.filter(f => f.id !== id)), 800);
  }

  function beginCombat() {
    if (selectedIds.length < 2) return;
    setPhase('combat');
    setTurn(0);
    setEnergy(100);
    setFocusStacks(0);
    setPreviewHp(bossRaid?.hp || 0);
    setActionLog([]);
    setCombatFeed(['⚔️ Tactical assault started. Build your sequence carefully.']);
  }

  function applyAction(actionId) {
    if (turn >= MAX_TACTIC_TURNS || previewHp <= 0) return;
    const action = ACTIONS.find(a => a.id === actionId);
    if (!action) return;
    if (energy < action.cost) {
      setCombatFeed(prev => [...prev.slice(-8), `❌ Not enough energy for ${action.label}`]);
      return;
    }

    const activeCard = selectedCards[turn % selectedCards.length];
    const stats = activeCard?.stats || {};
    let dmg = 0;
    let nextFocus = focusStacks;

    if (actionId === 'focus') {
      nextFocus = Math.min(3, focusStacks + 1);
      dmg = Math.floor((stats.intelligence || 70) * 0.2 + (stats.creativity || 70) * 0.12);
    } else if (actionId === 'guard') {
      dmg = Math.floor((stats.speed || 70) * 0.2);
    } else if (actionId === 'strike') {
      dmg = Math.floor((stats.power || 70) * 0.95 + focusStacks * 20);
      nextFocus = Math.max(0, focusStacks - 1);
    } else if (actionId === 'burst') {
      dmg = Math.floor((stats.power || 70) * 0.7 + (stats.creativity || 70) * 0.6 + focusStacks * 26);
      nextFocus = Math.max(0, focusStacks - 2);
    }

    if ((bossRaid?.vulnerable || []).includes(activeCard.provider)) dmg = Math.floor(dmg * 1.12);
    if ((bossRaid?.resistant || []).includes(activeCard.provider)) dmg = Math.floor(dmg * 0.86);

    setFocusStacks(nextFocus);
    setEnergy(prev => Math.min(100, prev - action.cost + 14));
    setTurn(t => t + 1);
    setActionLog(prev => [...prev, actionId]);
    setPreviewHp(prev => Math.max(0, prev - dmg));
    addFloat(dmg);
    setCombatFeed(prev => [...prev.slice(-8), `${activeCard.name} used ${action.label} for ${dmg} dmg`]);
  }

  async function attack() {
    if (!user?.id || selectedIds.length < 2 || !bossRaid || bossRaid.defeated) return;
    setAttacking(true);
    setError(null);
    try {
      const res = await api.attackBoss(user.id, selectedIds, actionLog);
      setReport(res.attemptReport);
      setBossRaid(res.bossRaid);
      if (res.rewards && ((res.rewards.credits || 0) > 0 || (res.rewards.prestigeCrystals || 0) > 0 || Object.keys(res.rewards.packs || {}).length > 0)) {
        setLatestRewards(res.rewards);
      }
      setSelectedIds([]);
      setPhase('deck');
      if (res.profile) {
        setCollection(res.profile.collection || []);
        onProfileSync(res.profile);
      }
    } catch (e) {
      setError(e.message || 'Attack failed');
    } finally {
      setAttacking(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-300">Loading hourly boss…</div>;
  }

  if (!bossRaid) {
    return <div className="min-h-screen flex items-center justify-center text-red-300">No boss data.</div>;
  }

  const hpPct = Math.max(0, Math.round((bossRaid.hp / bossRaid.maxHp) * 100));
  const attemptsLeft = Math.max(0, bossRaid.maxAttempts - bossRaid.attemptsUsed);

  const rewardRows = latestRewards ? Object.entries(latestRewards.packs || {}).filter(([, v]) => Number(v) > 0) : [];

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
      <AnimatePresence>
        {latestRewards && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 right-4 z-40 w-[320px] rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-900/40 to-orange-900/30 backdrop-blur p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-black text-yellow-300">🎁 Rewards Earned</div>
              <button onClick={() => setLatestRewards(null)} className="text-xs text-gray-400 hover:text-white">Dismiss</button>
            </div>
            <div className="text-xs text-gray-300 mb-2">
              {latestRewards.type === 'defeat' && 'Boss defeated. Legendary rewards granted.'}
              {latestRewards.type === 'exhausted' && 'Attempts exhausted. Damage-based consolation rewards granted.'}
              {latestRewards.type === 'retro_exhausted' && 'Retroactive damage-based rewards were granted for your exhausted attempts.'}
            </div>
            <div className="space-y-1 text-sm">
              {(latestRewards.credits || 0) > 0 && <div className="text-yellow-300 font-bold">💰 +{latestRewards.credits.toLocaleString()} credits</div>}
              {(latestRewards.prestigeCrystals || 0) > 0 && <div className="text-indigo-300 font-bold">💎 +{latestRewards.prestigeCrystals.toLocaleString()} crystals</div>}
              {Object.entries(latestRewards.packs || {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => (
                <div key={k} className="text-green-300 font-bold">📦 +{v} {k}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-2xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
          👑 Hourly Boss Raid
        </h1>
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <TimerReset className="w-4 h-4" /> resets in {formatCountdown(countdown)}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl border p-5 overflow-hidden"
            style={{ borderColor: `${bossRaid.bossColor}60`, background: `${bossRaid.bossColor}12` }}
          >
            <motion.div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl"
              style={{ background: `${bossRaid.bossColor}35` }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-4xl mb-1">
                  <motion.span animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>{bossRaid.bossIcon}</motion.span>
                  <h2 className="text-2xl font-black" style={{ color: bossRaid.bossColor }}>{bossRaid.bossName}</h2>
                </div>
                <p className="text-sm text-gray-300 mb-2">{bossRaid.gimmick}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-gray-900/50 border border-gray-700">Mechanic: {bossRaid.mechanic}</span>
                  <span className="px-2 py-1 rounded-full bg-green-900/30 border border-green-700/40">Vulnerable: {(bossRaid.vulnerable || []).join(', ')}</span>
                  <span className="px-2 py-1 rounded-full bg-red-900/30 border border-red-700/40">Resistant: {(bossRaid.resistant || []).join(', ')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Attempts</div>
                <div className="flex gap-1 justify-end mt-1">
                  {Array.from({ length: bossRaid.maxAttempts }).map((_, i) => (
                    <span key={i} className={`w-3 h-3 rounded-full ${i < bossRaid.attemptsUsed ? 'bg-red-500' : 'bg-gray-600'}`} />
                  ))}
                </div>
                <div className="mt-1 text-sm font-bold text-gray-200">{attemptsLeft} left</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Boss HP</span>
                <span>{bossRaid.hp.toLocaleString()} / {bossRaid.maxHp.toLocaleString()} ({hpPct}%)</span>
              </div>
              <div className="h-4 rounded-full bg-black/40 overflow-hidden border border-gray-700/60">
                <motion.div
                  className="h-full"
                  style={{ background: hpColor(hpPct) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${hpPct}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
            </div>

            {bossRaid.defeated && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
                <Crown className="w-5 h-5" /> Boss defeated this hour. Come back after reset for a new target.
              </div>
            )}
          </motion.div>

            <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-200 flex items-center gap-2"><Swords className="w-4 h-4" /> Select Raid Deck ({selectedIds.length}/{MAX_DECK})</h3>
              <div className="text-xs text-gray-500">Cards used in previous attempts are locked</div>
            </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-1 text-xs text-gray-400"><Filter className="w-3 h-3" />
                  <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200">
                    <option value="ALL">All Providers</option>
                    {Object.keys(PROVIDERS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <select value={filterRarity} onChange={e => setFilterRarity(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200">
                  <option value="ALL">All Rarities</option>
                  {Object.keys(RARITIES).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex items-center gap-1 text-xs text-gray-400"><SortAsc className="w-3 h-3" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200">
                    <option value="stats">Stats (default)</option>
                    <option value="rarity">Rarity</option>
                    <option value="power">Power</option>
                    <option value="speed">Speed</option>
                    <option value="intelligence">Intelligence</option>
                    <option value="creativity">Creativity</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {availableCards.map(card => {
                const selected = selectedIds.includes(card.id);
                const providerColor = PROVIDERS[card.provider]?.color || '#6b7280';
                return (
                  <motion.button
                    key={card.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleCard(card.id)}
                    className={`text-left p-2 rounded-lg border transition-all ${selected ? 'border-blue-400 bg-blue-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}`}
                    style={selected ? { boxShadow: `0 0 10px ${providerColor}50` } : {}}
                  >
                    <div className="text-xl">{card.providerInfo?.icon || '🤖'}</div>
                    <div className="text-xs font-bold truncate">{card.name}</div>
                    <div className="text-[10px] text-gray-400">{card.provider}</div>
                    <div className="text-[10px] font-bold" style={{ color: RARITIES[card.rarity]?.color }}>{card.rarity}</div>
                    <div className="text-[10px] text-gray-500 mt-1">💥{card.stats?.power} ⚡{card.stats?.speed}</div>
                  </motion.button>
                );
              })}
            </div>

            {availableCards.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">No available cards left for this hour.</div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
              >
                Clear
              </button>
              <motion.button
                whileHover={{ scale: bossRaid.defeated ? 1 : 1.02 }}
                whileTap={{ scale: bossRaid.defeated ? 1 : 0.98 }}
                disabled={attacking || bossRaid.defeated || attemptsLeft <= 0 || selectedIds.length < 2}
                onClick={beginCombat}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${attacking || bossRaid.defeated || attemptsLeft <= 0 || selectedIds.length < 2 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-black'}`}
              >
                <Zap className="w-4 h-4" />
                Start Tactical Assault
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {phase === 'combat' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-black/50 border border-red-600/40 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-red-300">⚔️ Live Assault</h3>
                  <div className="text-xs text-gray-400">Turn {turn}/{MAX_TACTIC_TURNS} • Energy {energy} • Focus {focusStacks}</div>
                </div>

                <div className="relative mb-3 p-3 rounded-xl bg-gray-900/70 border border-gray-700/50 overflow-hidden">
                  <div className="text-xs text-gray-400 mb-1">Simulated boss pressure</div>
                  <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div className="h-full" style={{ background: hpColor(Math.round((previewHp / Math.max(1, bossRaid.hp)) * 100)) }} animate={{ width: `${Math.max(0, Math.round((previewHp / Math.max(1, bossRaid.hp)) * 100))}%` }} />
                  </div>
                  <div className="text-xs text-gray-300 mt-1">{previewHp.toLocaleString()} / {bossRaid.hp.toLocaleString()} (simulated)</div>
                  <div className="absolute right-3 top-2">
                    <AnimatePresence>
                      {floating.map(f => (
                        <motion.div
                          key={f.id}
                          initial={{ y: 0, opacity: 1, scale: 1 }}
                          animate={{ y: -30, opacity: 0, scale: 1.2 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-black text-yellow-300"
                        >
                          -{f.value}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {ACTIONS.map(a => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        onClick={() => applyAction(a.id)}
                        disabled={attacking || energy < a.cost || turn >= MAX_TACTIC_TURNS || previewHp <= 0}
                        className={`p-2 rounded-lg bg-gradient-to-r ${a.color} text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-center gap-1"><Icon className="w-4 h-4" /> {a.label}</div>
                        <div className="text-[10px] opacity-80">{a.desc} · {a.cost}⚡</div>
                      </button>
                    );
                  })}
                </div>

                <div className="max-h-28 overflow-y-auto text-xs text-gray-300 space-y-1 mb-3 pr-1">
                  {combatFeed.map((line, i) => <div key={i}>{line}</div>)}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPhase('deck')} disabled={attacking} className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm">Back to Deck</button>
                  <button
                    onClick={attack}
                    disabled={attacking || actionLog.length === 0}
                    className="flex-1 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-black disabled:opacity-40"
                  >
                    {attacking ? 'Resolving...' : `Resolve Assault (${actionLog.length} actions)`}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 p-4">
            <h3 className="font-bold text-gray-200 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Strategic Briefing</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• You get only 5 attempts per hour.</li>
              <li>• Boss HP persists between attempts.</li>
              <li>• Cards used in an attempt are locked for this hour.</li>
              <li>• Diverse provider decks perform much better.</li>
              <li>• Each boss has different resistances and mechanics.</li>
            </ul>
          </div>

          <AnimatePresence>
            {report && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gray-900/70 border border-gray-700/50 p-4"
              >
                <h3 className="font-bold mb-2 text-gray-200">Attempt #{report.attemptNumber}</h3>
                <div className="text-sm text-orange-300 font-black mb-1">Damage: {report.damage.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mb-2">HP: {report.hpBefore.toLocaleString()} → {report.hpAfter.toLocaleString()}</div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {(report.perCard || []).map(row => (
                    <div key={row.cardId} className="text-xs text-gray-300 flex justify-between gap-2">
                      <span className="truncate">{row.name}</span>
                      <span className="text-yellow-300">-{row.damage}</span>
                    </div>
                  ))}
                </div>

                {(report.tacticalNotes || []).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
                    {report.tacticalNotes.map((n, i) => (
                      <div key={i} className="text-[11px] text-cyan-300">• {n}</div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="rounded-xl bg-red-900/30 border border-red-700/40 p-3 text-sm text-red-300 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-2xl bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border border-yellow-700/30 p-4">
            <h3 className="font-bold text-yellow-300 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Rewards</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• Massive credits payout</div>
              <div>• Prestige crystals</div>
              <div>• Elite + Mythic packs</div>
              <div>• Better rewards for fewer attempts</div>
              <div>• If you fail, exhausted attempts now grant damage-based rewards</div>
            </div>
          </div>

          {latestRewards && (
            <div className="rounded-2xl bg-gray-900/70 border border-yellow-700/30 p-4">
              <h3 className="font-bold text-gray-200 mb-2">Latest Reward Breakdown</h3>
              <div className="text-xs text-gray-400 mb-2">
                {latestRewards.type === 'defeat' ? 'Boss kill rewards' : 'Damage-based non-kill payout'}
              </div>
              <div className="space-y-1 text-sm">
                {(latestRewards.credits || 0) > 0 && <div className="text-yellow-300">💰 +{latestRewards.credits.toLocaleString()}</div>}
                {(latestRewards.prestigeCrystals || 0) > 0 && <div className="text-indigo-300">💎 +{latestRewards.prestigeCrystals.toLocaleString()}</div>}
                {rewardRows.map(([k, v]) => (
                  <div key={k} className="text-emerald-300">📦 +{v} {k}</div>
                ))}
                {rewardRows.length === 0 && (latestRewards.credits || 0) === 0 && (latestRewards.prestigeCrystals || 0) === 0 && (
                  <div className="text-gray-500">No reward earned this time.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
