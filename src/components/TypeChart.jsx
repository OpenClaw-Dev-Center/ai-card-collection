import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { TYPE_CHART, PROVIDERS } from '../data/cards';

const PROVIDER_ORDER = ['CLAUDE', 'GPT', 'GEMINI', 'LLAMA', 'MISTRAL', 'DEEPSEEK'];

function cellStyle(mult) {
  if (mult >= 1.25) return { bg: '#14532d', text: '#4ade80', border: '#16a34a' };
  if (mult >= 1.1)  return { bg: '#166534', text: '#86efac', border: '#22c55e' };
  if (mult >= 0.95) return { bg: '#1f2937', text: '#9ca3af', border: '#374151' };
  if (mult >= 0.85) return { bg: '#431407', text: '#fca5a5', border: '#dc2626' };
  return             { bg: '#450a0a', text: '#f87171', border: '#ef4444' };
}

function cellLabel(mult) {
  if (mult >= 1.25) return '🔥';
  if (mult >= 1.1)  return '✅';
  if (mult >= 0.95) return '➖';
  if (mult >= 0.85) return '⚠️';
  return '❌';
}

export function TypeChart({ onBack }) {
  return (
    <div className="min-h-screen p-4 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ x: -3 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </motion.button>
        <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          ⚔️ Type Matchup Chart
        </h1>
        <div className="w-20" />
      </header>

      <p className="text-gray-400 text-sm text-center mb-6">
        Read <span className="text-white font-semibold">row (attacker)</span> vs{' '}
        <span className="text-white font-semibold">column (defender)</span> — e.g. Claude attacking DeepSeek deals <span className="text-green-400 font-bold">130%</span> damage.
      </p>

      {/* Chart */}
      <div className="overflow-x-auto">
        <table className="mx-auto border-collapse text-sm select-none">
          <thead>
            <tr>
              {/* top-left corner */}
              <th className="p-2 text-xs text-gray-500 font-normal text-right pr-3">ATK ↓ / DEF →</th>
              {PROVIDER_ORDER.map(def => {
                const p = PROVIDERS[def];
                return (
                  <th key={def} className="p-2 text-center min-w-[80px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xl">{p.icon}</span>
                      <span className="text-xs font-bold" style={{ color: p.color }}>{p.name}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PROVIDER_ORDER.map((atk, rowIdx) => {
              const p = PROVIDERS[atk];
              return (
                <motion.tr
                  key={atk}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.05 }}
                >
                  {/* Row header */}
                  <td className="p-2 pr-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs font-bold" style={{ color: p.color }}>{p.name}</span>
                      <span className="text-xl">{p.icon}</span>
                    </div>
                  </td>
                  {PROVIDER_ORDER.map(def => {
                    const mult = TYPE_CHART[atk][def];
                    const { bg, text, border } = cellStyle(mult);
                    const isSelf = atk === def;
                    return (
                      <td key={def} className="p-1">
                        <div
                          className="rounded-lg p-2 text-center transition-transform hover:scale-110 cursor-default"
                          style={{
                            background: isSelf ? '#111827' : bg,
                            border: `1px solid ${isSelf ? '#374151' : border}`,
                            minWidth: 76,
                          }}
                          title={`${PROVIDERS[atk].name} vs ${PROVIDERS[def].name}: ${mult}×`}
                        >
                          <div className="text-base leading-none">{cellLabel(mult)}</div>
                          <div
                            className="text-sm font-black mt-0.5"
                            style={{ color: isSelf ? '#4b5563' : text }}
                          >
                            {mult.toFixed(2)}×
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs">
        {[
          { emoji: '🔥', label: 'Super Effective', value: '≥1.25×', bg: '#14532d', color: '#4ade80', border: '#16a34a' },
          { emoji: '✅', label: 'Effective',        value: '1.1–1.24×', bg: '#166534', color: '#86efac', border: '#22c55e' },
          { emoji: '➖', label: 'Neutral',          value: '0.95–1.09×', bg: '#1f2937', color: '#9ca3af', border: '#374151' },
          { emoji: '⚠️', label: 'Slightly Weak',   value: '0.85–0.94×', bg: '#431407', color: '#fca5a5', border: '#dc2626' },
          { emoji: '❌', label: 'Not Very Effective', value: '≤0.84×', bg: '#450a0a', color: '#f87171', border: '#ef4444' },
        ].map(({ emoji, label, value, bg, color, border }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <span>{emoji}</span>
            <span style={{ color }}>
              <span className="font-bold">{label}</span>{' '}
              <span className="opacity-70">({value})</span>
            </span>
          </div>
        ))}
      </div>

      {/* Provider abilities quick reference */}
      <div className="mt-8 mb-4">
        <h2 className="text-center text-base font-bold text-gray-300 mb-4">Provider Special Abilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {PROVIDER_ORDER.map(key => {
            const p = PROVIDERS[key];
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className="rounded-xl p-3 border border-gray-700/50 bg-gray-900/60"
                style={{ borderColor: `${p.color}30` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{p.icon}</span>
                  <span className="font-bold text-sm" style={{ color: p.color }}>{p.name}</span>
                </div>
                <div className="text-xs font-semibold text-gray-300">{p.ability.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.ability.description}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
