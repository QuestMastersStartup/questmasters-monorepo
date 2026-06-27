import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  Dices,
  Download,
  Loader2,
  Send,
  Sparkles,
  Square,
  Swords,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getSession,
  getMetrics,
  sendTurn,
  simulateTurn,
  endSession,
  retryInitialize,
  takePendingInitialStream,
  type DmModelChunk,
  type DmSessionDetail,
  type DmTurn,
  type NarrativeNote,
  type SessionMetrics,
} from "../lib/dmSessionApi";
import {
  parseSkillCheck,
  parseSkillCheckOptions,
  rollSkillCheck,
  formatRollResult,
  matchSkill,
  ALL_SKILLS,
  type SkillCheckRequest,
} from "../lib/diceRoll";
import { calculateModifier, calculateProficiencyBonus, ABILITY_ABBREVIATIONS } from "@questmasters/dnd-rules";
import type { CharacterSnapshot } from "../lib/dmSessionApi";
import { ArchitectureBadge, StatusBadge } from "./DmSessions";

// ─── Panel admin: sección colapsable ──────────────────────────────────

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
          {title}
        </span>
        {open ? (
          <ChevronDown size={14} className="text-slate-500" />
        ) : (
          <ChevronRight size={14} className="text-slate-500" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

// ─── Panel admin: visor JSON con highlighting básico ──────────────────

function JsonViewer({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-slate-500 italic">Sin datos de memoria aún</p>;
  }

  const lines = JSON.stringify(data, null, 2).split("\n");

  return (
    <pre className="text-[11px] leading-relaxed font-mono bg-slate-950/60 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
      {lines.map((line, i) => {
        const match = line.match(/^(\s*)"([^"]+)": ?(.*)$/);
        if (match) {
          return (
            <div key={i}>
              <span>{match[1]}</span>
              <span className="text-indigo-300">"{match[2]}"</span>
              <span className="text-slate-500">: </span>
              <span className="text-white">{match[3]}</span>
            </div>
          );
        }
        return (
          <div key={i} className="text-slate-400">
            {line}
          </div>
        );
      })}
    </pre>
  );
}

// ─── Panel admin: nota narrativa ──────────────────────────────────────

const NOTE_STYLES: Record<NarrativeNote["type"], { label: string; className: string }> = {
  tension: { label: "Tensión", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  coherence: { label: "Coherencia", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  plot_thread: { label: "Trama", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  warning: { label: "Aviso", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

function NoteItem({ note }: { note: NarrativeNote }) {
  const style = NOTE_STYLES[note.type] ?? NOTE_STYLES.warning;
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${style.className}`}
        >
          {style.label}
        </span>
        <span className="text-[10px] text-slate-500">Turno {note.turn}</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>
    </div>
  );
}

// ─── Panel admin: fila de métrica ─────────────────────────────────────

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  );
}

// ─── Burbuja de chat ──────────────────────────────────────────────────

// ─── Panel de stats del personaje ────────────────────────────────────

function CharacterPanel({ character }: { character: CharacterSnapshot }) {
  if (!character.stats) return null;

  const abilities = Object.entries(ABILITY_ABBREVIATIONS) as [string, string][];
  const profBonus = calculateProficiencyBonus(character.level);
  const profs = character.skillProficiencies ?? [];
  const expertise = character.expertiseSkills ?? [];

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto pb-2">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Swords size={14} className="text-emerald-400" />
          {character.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {character.race} {character.class} Nv.{character.level}
          {character.subclass && <span className="text-indigo-400"> — {character.subclass}</span>}
        </p>
        {character.background && (
          <p className="text-[10px] text-slate-500 mt-0.5">{character.background}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {character.jackOfAllTrades && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Jack of All Trades
            </span>
          )}
          {character.reliableTalent && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Reliable Talent
            </span>
          )}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Prof +{profBonus}
          </span>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Atributos</p>
        <div className="grid grid-cols-3 gap-1.5">
          {abilities.map(([key, abbr]) => {
            const score = character.stats![key as keyof typeof character.stats];
            const mod = calculateModifier(score);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            return (
              <div key={key} className="flex flex-col items-center bg-slate-800/60 border border-slate-700/40 rounded-lg py-1.5">
                <span className="text-[9px] font-bold text-slate-500">{abbr}</span>
                <span className="text-sm font-bold text-white">{score}</span>
                <span className={`text-[10px] font-bold ${mod >= 0 ? "text-emerald-400" : "text-red-400"}`}>{modStr}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Habilidades</p>
        <div className="space-y-0.5">
          {ALL_SKILLS.map((skill) => {
            const abilityMod = calculateModifier(character.stats![skill.ability]);
            const isProficient = matchSkill(skill.nameES, profs) || matchSkill(skill.nameEN, profs);
            const isExpert = matchSkill(skill.nameES, expertise) || matchSkill(skill.nameEN, expertise);
            let totalMod = abilityMod;
            if (isExpert) totalMod += profBonus * 2;
            else if (isProficient) totalMod += profBonus;
            else if (character.jackOfAllTrades) totalMod += Math.floor(profBonus / 2);
            const sign = totalMod >= 0 ? "+" : "";
            const abbr = ABILITY_ABBREVIATIONS[skill.ability];

            return (
              <div key={skill.index} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800/40">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isExpert ? "bg-amber-400" : isProficient ? "bg-indigo-400" : "bg-slate-700"
                }`} />
                <span className="flex-1 text-[11px] text-slate-300 truncate">{skill.nameES}</span>
                <span className="text-[9px] text-slate-600 w-7 text-center">{abbr}</span>
                <span className={`text-[11px] font-bold font-mono w-7 text-right ${
                  totalMod >= 0 ? "text-emerald-400" : "text-red-400"
                }`}>{sign}{totalMod}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/40 text-[9px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Proficiente</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Expertise</span>
        </div>
      </div>
    </div>
  );
}

// ─── Burbuja de tirada de dado ──────────────────────────────────────

const DICE_ROLL_REGEX = /^\[Tirada de (.+?):\s*(.+?)\s*=\s*(\d+)\s*vs\s*CD\s*(\d+)\s*—\s*(Éxito|Fallo)\]$/;

function DiceRollBubble({ text }: { text: string }) {
  const match = text.match(DICE_ROLL_REGEX);
  if (!match) return null;
  const [, skill, breakdown, total, dc, result] = match;
  const isSuccess = result === "Éxito";

  return (
    <div className="flex justify-end">
      <div className={`max-w-[80%] border rounded-2xl rounded-br-sm px-4 py-3 ${
        isSuccess
          ? "bg-emerald-900/30 border-emerald-500/30"
          : "bg-red-900/30 border-red-500/30"
      }`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Dices size={13} className={isSuccess ? "text-emerald-400" : "text-red-400"} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${
            isSuccess ? "text-emerald-400" : "text-red-400"
          }`}>
            Tirada de {skill}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black ${isSuccess ? "text-emerald-300" : "text-red-300"}`}>
            {total}
          </span>
          <div className="text-xs text-slate-400 leading-snug">
            <div>{breakdown}</div>
            <div>vs CD {dc}</div>
          </div>
          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${
            isSuccess
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}>
            {result}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlayerBubble({
  text,
  characterName,
  isAuto = false,
}: {
  text: string;
  characterName?: string;
  isAuto?: boolean;
}) {
  if (DICE_ROLL_REGEX.test(text)) {
    return <DiceRollBubble text={text} />;
  }

  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[80%] border rounded-2xl rounded-br-sm px-4 py-3 ${isAuto
            ? "bg-amber-900/20 border-amber-600/30"
            : "bg-slate-700/60 border-slate-600/40"
          }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          {isAuto ? (
            <>
              <Bot size={11} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Auto-jugador
              </span>
            </>
          ) : (
            <>
              <Swords size={11} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                {characterName ?? "Jugador"}
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function formatLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function ElapsedTimer({ since }: { since: number }) {
  const [elapsed, setElapsed] = useState(Date.now() - since);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - since), 100);
    return () => clearInterval(id);
  }, [since]);

  return <span>{(elapsed / 1000).toFixed(1)}s</span>;
}

function DmBubble({
  text,
  streaming = false,
  streamStartedAt,
  latencyMs,
  inputTokens,
  outputTokens,
}: {
  text: string;
  streaming?: boolean;
  streamStartedAt?: number;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}) {
  const hasMetrics = latencyMs !== undefined && latencyMs > 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="bg-purple-950/50 border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={11} className="text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
              Dungeon Master
            </span>
          </div>
          <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
            {text}
            {streaming && <span className="animate-pulse text-purple-300">▊</span>}
          </p>
        </div>
        {streaming && streamStartedAt && (
          <div className="flex items-center gap-2 mt-1 pl-2 text-[10px] text-slate-500">
            <Loader2 size={9} className="animate-spin" />
            <ElapsedTimer since={streamStartedAt} />
          </div>
        )}
        {!streaming && hasMetrics && (
          <div className="flex items-center gap-3 mt-1 pl-2 text-[10px] text-slate-500">
            <span>{formatLatency(latencyMs)}</span>
            {(inputTokens !== undefined && outputTokens !== undefined && (inputTokens > 0 || outputTokens > 0)) && (
              <span>{inputTokens.toLocaleString("es")} + {outputTokens.toLocaleString("es")} tokens</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Exportar chat como Markdown ─────────────────────────────────────

function formatSessionAsMarkdown(session: DmSessionDetail): string {
  const date = new Date(session.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const characterList = session.characters
    .map((ch) => `- **${ch.name}** — ${ch.race} ${ch.class} (Nivel ${ch.level})`)
    .join("\n");

  const lines: string[] = [
    `# ${session.title}`,
    "",
    `**Fecha:** ${date}`,
    `**Estado:** ${session.status}`,
    `**Arquitectura:** ${session.architectureType === "mas" ? "MAS" : "Monolítico"}`,
    `**Turnos:** ${session.turnCount}`,
    "",
    "## Personajes",
    "",
    characterList,
    "",
    "---",
    "",
    "## Transcripción",
    "",
  ];

  for (const turn of session.turns) {
    if (turn.playerInput) {
      const name = session.characters[0]?.name ?? "Jugador";
      lines.push(`**${name}:**`);
      lines.push(`> ${turn.playerInput.replace(/\n/g, "\n> ")}`);
      lines.push("");
    }

    if (turn.dmResponse) {
      lines.push("**Dungeon Master:**");
      lines.push(`> ${turn.dmResponse.replace(/\n/g, "\n> ")}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function downloadMarkdown(session: DmSessionDetail): void {
  const content = formatSessionAsMarkdown(session);
  const slug = session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Barra de progreso de inicialización ─────────────────────────────

const INIT_STEPS = [
  "Conectando con el modelo de IA...",
  "Cargando el router de intenciones...",
  "Preparando la escena inicial...",
  "Generando narración...",
  "El modelo sigue trabajando...",
];

function SessionProgressBar() {
  const [progress, setProgress] = useState(5);
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startRef.current), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => { setProgress(15); setStepIdx(0); }, 400),
      setTimeout(() => { setProgress(30); setStepIdx(1); }, 3000),
      setTimeout(() => { setProgress(50); setStepIdx(2); }, 6000),
      setTimeout(() => { setProgress(70); setStepIdx(3); }, 10000),
      setTimeout(() => { setProgress(80); setStepIdx(4); }, 20000),
      setTimeout(() => { setProgress(88); }, 30000),
      setTimeout(() => { setProgress(93); }, 45000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 px-4">
      <div className="relative">
        <Sparkles size={28} className="text-purple-400" />
        <div className="absolute inset-0 animate-ping">
          <Sparkles size={28} className="text-purple-400/30" />
        </div>
      </div>
      <p className="text-sm text-purple-300 font-medium text-center transition-opacity duration-500">
        {INIT_STEPS[stepIdx]}
      </p>
      <div className="w-72 max-w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-[1500ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span>{Math.floor(elapsed / 1000)}s — conexión activa</span>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────

export const DmSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.isAdmin === true;

  const [session, setSession] = useState<DmSessionDetail | null>(null);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [pendingPlayerInput, setPendingPlayerInput] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [expandedTurnId, setExpandedTurnId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreaming = streamingText !== null;

  const simulationActiveRef = useRef(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [pendingIsAuto, setPendingIsAuto] = useState(false);
  const [showSimConfig, setShowSimConfig] = useState(false);
  const simTurnsLeftRef = useRef(0);
  const [simTurnsLeft, setSimTurnsLeft] = useState(0);
  const [simTurnsTotal, setSimTurnsTotal] = useState(0);
  const [initializing, setInitializing] = useState(false);
  const [incompleteTurn, setIncompleteTurn] = useState<string | null>(null);
  const [pendingCheckOptions, setPendingCheckOptions] = useState<SkillCheckRequest[]>([]);
  const [streamStartedAt, setStreamStartedAt] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const simConfigRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    const detail = await getSession(id);
    setSession(detail);
    if (isAdmin) {
      getMetrics(id).then(setMetrics).catch(() => { });
    }
  }, [id, isAdmin]);

  const consumeStream = useCallback(
    async (stream: AsyncGenerator<DmModelChunk>, playerInput: string | null, isAuto = false) => {
      setPendingPlayerInput(playerInput);
      setPendingIsAuto(isAuto);
      setPendingCheckOptions([]);
      setStreamStartedAt(Date.now());
      setStreamingText("");
      let aborted = false;
      let accumulated = "";
      try {
        for await (const chunk of stream) {
          if (chunk.type === "player_input" && chunk.input) {
            setPendingPlayerInput(chunk.input);
            setPendingIsAuto(true);
          } else if (chunk.type === "delta" && chunk.delta) {
            setInitializing(false);
            accumulated += chunk.delta;
            setStreamingText((prev) => (prev ?? "") + chunk.delta);
          } else if (chunk.type === "error") {
            if (chunk.error === "MODEL_OFFLINE") {
              setError("MODEL_OFFLINE");
            } else {
              setError(chunk.error ?? "El DM no pudo generar la respuesta");
            }
          }
        }
        await refresh();
        const options = parseSkillCheckOptions(accumulated);
        if (options.length > 0) setPendingCheckOptions(options);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          aborted = true;
          await refresh();
        } else {
          setError("Se perdió la conexión con el DM");
        }
      } finally {
        setStreamingText(null);
        setStreamStartedAt(null);
        setPendingPlayerInput(null);
        setPendingIsAuto(false);
        setInitializing(false);
        abortControllerRef.current = null;
        if (aborted) {
          setError(null);
        }
      }
    },
    [refresh],
  );

  // Carga inicial + stream pendiente del turno de apertura (viene del modal)
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const detail = await getSession(id);
        if (cancelled) return;
        setSession(detail);
        setLoading(false);
        if (isAdmin) {
          getMetrics(id).then((m) => !cancelled && setMetrics(m)).catch(() => { });
        }

        const pendingStream = takePendingInitialStream(id);
        if (pendingStream) {
          setInitializing(true);
          await consumeStream(pendingStream, null);
        } else if (detail.status === "active" && detail.turns.length > 0) {
          const lastTurn = detail.turns[detail.turns.length - 1];
          if (lastTurn.role === "player" && lastTurn.playerInput && !lastTurn.dmResponse) {
            setIncompleteTurn(lastTurn.playerInput);
            setInput(lastTurn.playerInput);
          }
          const options = parseSkillCheckOptions(lastTurn.dmResponse);
          if (options.length > 0) setPendingCheckOptions(options);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar la sesión");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cerrar popover de simulación al hacer click fuera
  useEffect(() => {
    if (!showSimConfig) return;
    const handler = (e: MouseEvent) => {
      if (simConfigRef.current && !simConfigRef.current.contains(e.target as Node)) {
        setShowSimConfig(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSimConfig]);

  // Auto-scroll del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.turns.length, streamingText]);

  // Auto-simulación: dispara un turno automático cuando está activa y no hay streaming en curso
  useEffect(() => {
    if (!simulationActive || isStreaming || !id || !session || session.status !== "active") return;

    if (simTurnsLeftRef.current <= 0) {
      simulationActiveRef.current = false;
      setSimulationActive(false);
      setSimTurnsLeft(0);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled || !simulationActiveRef.current) return;
      setError(null);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const stream = await simulateTurn(id, controller.signal);
        if (cancelled || !simulationActiveRef.current) return;
        await consumeStream(stream, null, true);
        simTurnsLeftRef.current -= 1;
        setSimTurnsLeft(simTurnsLeftRef.current);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error en simulación automática");
          simulationActiveRef.current = false;
          setSimulationActive(false);
          setSimTurnsLeft(0);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [simulationActive, isStreaming, id, session?.status, consumeStream]);

  const startSimulation = (turns: number) => {
    simTurnsLeftRef.current = turns;
    setSimTurnsLeft(turns);
    setSimTurnsTotal(turns);
    simulationActiveRef.current = true;
    setSimulationActive(true);
    setShowSimConfig(false);
  };

  const stopSimulation = () => {
    simulationActiveRef.current = false;
    setSimulationActive(false);
    setSimTurnsLeft(0);
    simTurnsLeftRef.current = 0;
    setSimTurnsTotal(0);
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput ?? input.trim();
    if (!id || !session || text === "" || isStreaming || simulationActive) return;
    if (!overrideInput) setInput("");
    setError(null);
    setIncompleteTurn(null);
    setPendingCheckOptions([]);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const stream = await sendTurn(id, text, controller.signal);
      await consumeStream(stream, text);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Error al enviar el turno");
      setPendingPlayerInput(null);
      setStreamingText(null);
    }
  };

  const handleDiceRoll = (check: SkillCheckRequest) => {
    if (!session) return;
    const ch = session.characters[0];
    if (!ch?.stats) return;
    const ctx = {
      stats: ch.stats,
      level: ch.level,
      skillProficiencies: ch.skillProficiencies ?? [],
      expertiseSkills: ch.expertiseSkills ?? [],
      jackOfAllTrades: ch.jackOfAllTrades ?? false,
      reliableTalent: ch.reliableTalent ?? false,
    };
    const roll = rollSkillCheck(check.ability, ctx, check.skillName);
    const result = formatRollResult(check, roll);
    handleSend(result);
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const handleEnd = async () => {
    if (!id || !window.confirm("¿Terminar esta sesión? No podrás continuar jugándola.")) return;
    try {
      await endSession(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al terminar la sesión");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-8">
        <Loader2 size={18} className="animate-spin text-purple-400" />
        <span className="text-slate-400">Cargando sesión...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error ?? "Sesión no encontrada"}
        </div>
        <Link
          to="/dm-sessions"
          className="inline-flex items-center gap-2 mt-4 text-sm text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft size={14} />
          Volver a sesiones
        </Link>
      </div>
    );
  }

  const isEnded = session.status === "ended";
  const isInitializing = session.status === "initializing" && !isStreaming;
  const characterName = session.characters[0]?.name;
  const totals = {
    inputTokens: metrics?.totalInputTokens ?? session.totalInputTokens,
    outputTokens: metrics?.totalOutputTokens ?? session.totalOutputTokens,
    turnCount: metrics?.turnCount ?? session.turnCount,
    avgLatencyMs:
      metrics?.avgLatencyMs ??
      (session.turnCount > 0 ? Math.round(session.totalLatencyMs / session.turnCount) : 0),
  };
  const notes = metrics?.narrativeNotes ?? session.narrativeNotes;

  return (
    <div className="container mx-auto p-4 md:p-6 h-[calc(100vh-4rem)]">
      {/* Chat + panel personaje (siempre) + panel admin (si admin) */}
      <div
        className={`grid gap-4 h-full ${
          isAdmin
            ? "grid-cols-1 lg:grid-cols-[3fr_minmax(200px,240px)_minmax(280px,2fr)]"
            : "grid-cols-1 lg:grid-cols-[3fr_minmax(200px,260px)]"
        }`}
      >
        {/* ─── COLUMNA IZQUIERDA: Chat ─────────────────────────────── */}
        <div className="flex flex-col h-full min-h-0 bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/dm-sessions"
                className="text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-lg font-bold text-white truncate">{session.title}</h1>
              <ArchitectureBadge type={session.architectureType} />
              <StatusBadge status={session.status} />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {session.turns.length > 0 && (
                <button
                  onClick={() => downloadMarkdown(session)}
                  title="Exportar chat"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <Download size={12} />
                  Exportar
                </button>
              )}
              {!isEnded && (
                <>
                  <div className="relative" ref={simConfigRef}>
                    <button
                      onClick={simulationActive ? stopSimulation : () => setShowSimConfig((v) => !v)}
                      disabled={isStreaming}
                      title={simulationActive ? "Detener simulación" : "Configurar simulación"}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${simulationActive
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-slate-400 hover:text-amber-400"
                        }`}
                    >
                      <Bot size={12} />
                      {simulationActive ? `Detener (${simTurnsTotal - simTurnsLeft + 1}/${simTurnsTotal})` : "Simular"}
                    </button>
                    {showSimConfig && !simulationActive && (
                      <div className="absolute right-0 top-full mt-2 z-50 bg-slate-800 border border-slate-600 rounded-xl p-3 shadow-xl min-w-[180px]">
                        <p className="text-xs font-semibold text-slate-300 mb-2">Turnos a simular</p>
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          {[1, 3, 5, 10].map((n) => (
                            <button
                              key={n}
                              onClick={() => startSimulation(n)}
                              className="px-2 py-1.5 text-xs font-bold rounded-lg bg-slate-700 hover:bg-amber-600 text-slate-200 hover:text-white transition-colors"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowSimConfig(false)}
                          className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleEnd}
                    disabled={isStreaming}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Square size={12} />
                    Terminar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {session.turns.map((turn) => (
              <React.Fragment key={turn.id}>
                {turn.playerInput && <PlayerBubble text={turn.playerInput} characterName={characterName} />}
                <DmBubble
                  text={turn.dmResponse}
                  latencyMs={turn.latencyMs}
                  inputTokens={turn.inputTokens}
                  outputTokens={turn.outputTokens}
                />
              </React.Fragment>
            ))}

            {/* Progreso de inicialización */}
            {initializing && !isStreaming && <SessionProgressBar />}

            {/* Turno en streaming */}
            {pendingPlayerInput && <PlayerBubble text={pendingPlayerInput} characterName={characterName} isAuto={pendingIsAuto} />}
            {isStreaming && <DmBubble text={streamingText ?? ""} streaming streamStartedAt={streamStartedAt ?? undefined} />}

            {/* Inicializando sin stream activo (recarga de página) */}
            {isInitializing && !initializing && <SessionProgressBar />}

            {/* Aviso de turno incompleto */}
            {incompleteTurn && !isStreaming && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                <Bot size={16} className="shrink-0 text-amber-400" />
                <span>Tu última acción no recibió respuesta. Puedes reenviarla.</span>
              </div>
            )}

            {error && error === "MODEL_OFFLINE" ? (
              <div className="flex flex-col items-center gap-3 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-semibold text-amber-300">Modelo no disponible</span>
                </div>
                <p className="text-xs text-slate-400 text-center max-w-sm">
                  La orquestación de IA no está conectada. Asegurate de que el servidor del modelo (Colab / RunPod) esté corriendo y que la URL esté configurada.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (!id || !session) return;
                    setError(null);
                    if (session.status === "initializing" && session.turns.length === 0) {
                      setInitializing(true);
                      try {
                        const stream = await retryInitialize(id);
                        await consumeStream(stream, null);
                      } catch {
                        setError("MODEL_OFFLINE");
                      } finally {
                        setInitializing(false);
                      }
                    } else {
                      await refresh();
                    }
                  }}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors px-3 py-1.5 border border-amber-500/30 rounded-lg hover:bg-amber-500/10"
                >
                  Reintentar conexión
                </button>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 shrink-0">
            {simulationActive && !isEnded && (
              <div className="px-5 py-2 bg-amber-900/20 border-b border-amber-600/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={13} className="text-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-300 font-semibold">
                    Simulación activa — Turno {simTurnsTotal - simTurnsLeft + 1} de {simTurnsTotal}
                  </span>
                </div>
                <button
                  onClick={stopSimulation}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  Detener
                </button>
              </div>
            )}

            {pendingCheckOptions.length > 0 && !isEnded && !isStreaming && !simulationActive && session?.characters[0]?.stats && (
              <div className="px-5 py-3 bg-indigo-900/20 border-b border-indigo-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Dices size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-sm text-indigo-300 font-semibold truncate">
                    El DM pide: Tirada de {pendingCheckOptions.map((o) => o.skillName).join(" o ")} (CD {pendingCheckOptions[0].dc})
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  {pendingCheckOptions.map((option) => (
                    <button
                      key={option.skillName}
                      type="button"
                      onClick={() => handleDiceRoll(option)}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors font-semibold text-sm"
                    >
                      <Dices size={14} />
                      {pendingCheckOptions.length > 1 ? option.skillName : "Tirar dado"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 py-4">
              {isEnded ? (
                <div className="text-center">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wide">
                    Sesión terminada
                  </span>
                </div>
              ) : simulationActive ? (
                <p className="text-center text-xs text-amber-400/60 italic py-1">
                  {isStreaming
                    ? `Turno ${simTurnsTotal - simTurnsLeft + 1}/${simTurnsTotal} — El DM está respondiendo...`
                    : `Turno ${simTurnsTotal - simTurnsLeft + 1}/${simTurnsTotal} — Preparando siguiente acción...`}
                </p>
              ) : isStreaming ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-purple-300">
                    <Loader2 size={14} className="animate-spin" />
                    <span>El DM está generando...</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="inline-flex items-center gap-2 bg-red-600/80 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl transition-colors font-semibold text-sm shrink-0"
                  >
                    <Square size={13} className="fill-current" />
                    Detener
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={isInitializing}
                    placeholder="Describe la acción de tu personaje..."
                    className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={isInitializing || input.trim() === ""}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={15} />
                    Enviar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── COLUMNA CENTRAL: Panel Personaje ─────────────────────── */}
        {session.characters[0] && (
          <div className="hidden lg:block">
            <CharacterPanel character={session.characters[0]} />
          </div>
        )}

        {/* ─── COLUMNA DERECHA: Panel Admin Observer ───────────────── */}
        {isAdmin && (
          <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pb-2">
            {/* 1. Métricas en tiempo real */}
            <CollapsibleSection title="Métricas en tiempo real">
              <MetricRow
                label="Tokens entrada"
                value={totals.inputTokens.toLocaleString("es")}
              />
              <MetricRow
                label="Tokens salida"
                value={totals.outputTokens.toLocaleString("es")}
              />
              <MetricRow label="Latencia media" value={`${totals.avgLatencyMs} ms`} />
              <MetricRow label="Costo estimado" value="—" />
              <MetricRow
                label="Arquitectura"
                value={session.architectureType === "mas" ? "MAS" : "Monolítico"}
              />
              <MetricRow label="Turnos jugados" value={totals.turnCount} />
            </CollapsibleSection>

            {/* 2. Memoria del modelo */}
            <CollapsibleSection title="Memoria del modelo (live)">
              <JsonViewer data={metrics?.memorySnapshot ?? session.memorySnapshot} />
            </CollapsibleSection>

            {/* 3. Notas narrativas */}
            <CollapsibleSection title="Notas narrativas del DM">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  El DM aún no ha generado notas
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...notes]
                    .sort((a, b) => a.turn - b.turn)
                    .map((note, i) => (
                      <NoteItem key={i} note={note} />
                    ))}
                </div>
              )}
            </CollapsibleSection>

            {/* 4. Historial de turnos */}
            <CollapsibleSection title="Historial de turnos">
              {session.turns.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Sin turnos todavía</p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-800">
                        <th className="py-1.5 pr-2 font-semibold">#</th>
                        <th className="py-1.5 pr-2 font-semibold">Rol</th>
                        <th className="py-1.5 pr-2 font-semibold text-right">In</th>
                        <th className="py-1.5 pr-2 font-semibold text-right">Out</th>
                        <th className="py-1.5 font-semibold text-right">Lat.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.turns.map((turn: DmTurn) => (
                        <tr
                          key={turn.id}
                          onClick={() =>
                            setExpandedTurnId(
                              expandedTurnId === turn.id ? null : turn.id,
                            )
                          }
                          className="text-slate-300 border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer"
                        >
                          <td className="py-1.5 pr-2 font-bold">{turn.turnNumber}</td>
                          <td className="py-1.5 pr-2">
                            {turn.role === "dm" ? "DM" : "Jugador"}
                          </td>
                          <td className="py-1.5 pr-2 text-right">{turn.inputTokens}</td>
                          <td className="py-1.5 pr-2 text-right">{turn.outputTokens}</td>
                          <td className="py-1.5 text-right">{turn.latencyMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CollapsibleSection>
          </div>
        )}
      </div>

      {/* Modal: memorySnapshotAfter del turno seleccionado */}
      {expandedTurnId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setExpandedTurnId(null)}
          onKeyDown={(e) => e.key === 'Escape' && setExpandedTurnId(null)}
          role="button"
          tabIndex={-1}
          aria-label="Cerrar"
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Memoria tras el turno{" "}
                {session.turns.find((t) => t.id === expandedTurnId)?.turnNumber}
              </h3>
              <button
                onClick={() => setExpandedTurnId(null)}
                title="Cerrar"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <JsonViewer
                data={
                  session.turns.find((t) => t.id === expandedTurnId)
                    ?.memorySnapshotAfter
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
