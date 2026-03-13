import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, Shield, Swords, TimerReset, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { PROVIDERS, RARITIES } from '../data/cards';

const MAX_DECK = 5;

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
    return (collection || []).filter(c => !usedIds.has(c.id));
  }, [collection, usedIds]);

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

  async function attack() {
    if (!user?.id || selectedIds.length < 2 || !bossRaid || bossRaid.defeated) return;
    setAttacking(true);
    setError(null);
    try {
      const res = await api.attackBoss(user.id, selectedIds);
      setReport(res.attemptReport);
      setBossRaid(res.bossRaid);
      setSelectedIds([]);
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

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
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
                onClick={attack}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${attacking || bossRaid.defeated || attemptsLeft <= 0 || selectedIds.length < 2 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-black'}`}
              >
                <Zap className="w-4 h-4" />
                {attacking ? 'Attacking...' : `Attack Boss (${selectedIds.length} cards)`}
              </motion.button>
            </div>
          </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
