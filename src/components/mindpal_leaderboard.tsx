import React from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Timer, Flame, Star, ChevronUp, ChevronDown } from "lucide-react";

const palette = {
  bg: "#F7F8FF",
  card: "#ffffff",
  text: "#0f172a",
  subtext: "#64748b",
  gradBlue: "bg-gradient-to-r from-[#4F7CFB] via-[#5AB9F6] to-[#7BE3F2]",
  gradGreen: "bg-gradient-to-r from-[#3bd3a4] via-[#1ec8a2] to-[#1aa38e]",
  gradPurple: "bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#f0abfc]",
  gold: "#fbbf24",
  silver: "#cbd5e1",
  bronze: "#f59e0b",
};

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export type Player = {
  id: number | string;
  name: string;
  country?: string;
  xp: number;
  streak?: number;
  avatar?: string;
  delta?: number;
  me?: boolean;
};

type Props = {
  league?: string;
  timeRemaining?: string;
  players?: Player[];
  onNavigate?: (screen: string) => void;
};

const Avatar: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-lg font-semibold text-slate-700">
    {label}
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; variant?: "blue" | "green" | "purple" }> = ({ children, variant = "blue" }) => (
  <div
    className={cx(
      "px-2.5 py-1 rounded-full text-white text-xs font-medium shadow-sm",
      variant === "blue" && palette.gradBlue,
      variant === "green" && palette.gradGreen,
      variant === "purple" && palette.gradPurple
    )}
  >
    {children}
  </div>
);

const RankMovement: React.FC<{ delta?: number }> = ({ delta }) => {
  if (delta === undefined || delta === 0) return null;
  const up = (delta ?? 0) > 0;
  return (
    <span
      className={cx("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-emerald-600" : "text-rose-600")}
      title={up ? `Up ${delta}` : `Down ${Math.abs(delta!)}`}
    >
      {up ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {Math.abs(delta!)}
    </span>
  );
};

const Row: React.FC<{ index: number; p: Player }> = ({ index, p }) => {
  const rank = index + 1;
  const bg = p.me ? "bg-[#eef2ff]" : "bg-white";
  const border = p.me ? "border-indigo-200" : "border-slate-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cx("flex items-center gap-3 px-3 py-3 rounded-xl border", bg, border)}
    >
      <div className="w-6 text-center text-slate-500 font-semibold">{rank}</div>
      <div className="w-6 flex justify-center">
        {rank === 1 && <Crown size={18} color={palette.gold} />}
        {rank === 2 && <Trophy size={18} color={palette.silver} />}
        {rank === 3 && <Trophy size={18} color={palette.bronze} />}
      </div>
      <Avatar label={p.avatar ?? p.name[0].toUpperCase()} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-slate-800">{p.name}</span>
          {p.country && <span className="text-base leading-none">{p.country}</span>}
          {p.streak && (
            <div className="ml-1 inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
              <Flame size={14} /> {p.streak}
            </div>
          )}
          <RankMovement delta={p.delta} />
        </div>
        <div className="text-xs text-slate-500">MindPal XP</div>
      </div>
      <Chip variant="green">{p.xp} XP</Chip>
    </motion.div>
  );
};

const EmptyState: React.FC = () => (
  <div className="rounded-xl border border-slate-100 bg-white p-6 text-center text-slate-500">
    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
      <Trophy className="text-slate-400" size={18} />
    </div>
    No players yet. Complete quests to appear on the leaderboard!
  </div>
);

export default function MindPalLeaderboard({
  league = "Gold League",
  timeRemaining = "3 days",
  players = [],
  onNavigate,
}: Props) {
  const safePlayers = Array.isArray(players) ? players : [];

  return (
    <div className="min-h-screen w-full flex items-start justify-center" style={{ background: palette.bg }}>
      <div className="max-w-xl w-full p-6">
        <div className="rounded-2xl shadow-sm p-4 bg-white border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cx("w-10 h-10 rounded-xl flex items-center justify-center text-white", palette.gradPurple)}>
                <Trophy size={22} />
              </div>
              <div>
                <div className="font-bold text-slate-800">{league}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Timer size={14} /> {timeRemaining} left
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip variant="blue">Weekly</Chip>
              <Chip variant="green">Top 10 advance</Chip>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 opacity-90">
            <div className="w-10 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Trophy className="text-amber-400" size={18} />
            </div>
            <div className="w-10 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <Trophy className="text-slate-400" size={18} />
            </div>
            <div className="w-10 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Crown className="text-yellow-400" size={18} />
            </div>
            <div className="w-10 h-12 rounded-lg bg-slate-200/60 flex items-center justify-center">
              <Star className="text-slate-400" size={18} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {safePlayers.length === 0 ? (
            <EmptyState />
          ) : (
            safePlayers.map((p, i) => <Row key={p.id} index={i} p={p} />)
          )}
        </div>

        {/* Footer nav with navigation + stronger hover/press effects */}
        <div className="mt-6 grid grid-cols-5 gap-2 text-center text-xs text-slate-500">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.("home")}
            className="py-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-100 hover:border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition"
          >
            Home
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.("quests")}
            className="py-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-100 hover:border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition"
          >
            Quests
          </motion.button>
          <button
            disabled
            aria-disabled
            className={cx(
              "py-2 rounded-xl text-white font-medium select-none",
              "shadow-sm",
              palette.gradPurple
            )}
          >
            Leaderboard
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.("friends")}
            className="py-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-100 hover:border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition"
          >
            Friends
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.("profile")}
            className="py-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-100 hover:border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition"
          >
            Profile
          </motion.button>
        </div>
      </div>
    </div>
  );
}
