import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getSession,
  getMetrics,
  sendTurn,
  simulateTurn,
  endSession,
  takePendingInitialStream,
  type DmModelChunk,
  type DmSessionDetail,
  type DmTurn,
  type NarrativeNote,
  type SessionMetrics,
} from "../lib/dmSessionApi";
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

function JsonViewer({ data }: { data: Record<string, any> | null | undefined }) {
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

function PlayerBubble({ text, isAuto = false }: { text: string; isAuto?: boolean }) {
  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[80%] border rounded-2xl rounded-br-sm px-4 py-3 ${
          isAuto
            ? "bg-amber-900/20 border-amber-600/30"
            : "bg-slate-700/60 border-slate-600/40"
        }`}
      >
        {isAuto && (
          <div className="flex items-center gap-1.5 mb-1">
            <Bot size={11} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Auto-jugador
            </span>
          </div>
        )}
        <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function DmBubble({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-purple-950/50 border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
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

  const refresh = useCallback(async () => {
    if (!id) return;
    const detail = await getSession(id);
    setSession(detail);
    if (isAdmin) {
      getMetrics(id).then(setMetrics).catch(() => {});
    }
  }, [id, isAdmin]);

  const consumeStream = useCallback(
    async (stream: AsyncGenerator<DmModelChunk>, playerInput: string | null, isAuto = false) => {
      setPendingPlayerInput(playerInput);
      setPendingIsAuto(isAuto);
      setStreamingText("");
      try {
        for await (const chunk of stream) {
          if (chunk.type === "player_input" && chunk.input) {
            setPendingPlayerInput(chunk.input);
            setPendingIsAuto(true);
          } else if (chunk.type === "delta" && chunk.delta) {
            setStreamingText((prev) => (prev ?? "") + chunk.delta);
          } else if (chunk.type === "error") {
            setError(chunk.error ?? "El DM no pudo generar la respuesta");
          }
        }
        await refresh();
      } catch {
        setError("Se perdió la conexión con el DM");
      } finally {
        setStreamingText(null);
        setPendingPlayerInput(null);
        setPendingIsAuto(false);
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
        if (isAdmin) {
          getMetrics(id).then((m) => !cancelled && setMetrics(m)).catch(() => {});
        }

        const pendingStream = takePendingInitialStream(id);
        if (pendingStream) await consumeStream(pendingStream, null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar la sesión");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-scroll del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.turns.length, streamingText]);

  // Auto-simulación: dispara un turno automático cuando está activa y no hay streaming en curso
  useEffect(() => {
    if (!simulationActive || isStreaming || !id || !session || session.status !== "active") return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled || !simulationActiveRef.current) return;
      setError(null);
      try {
        const stream = await simulateTurn(id);
        if (cancelled || !simulationActiveRef.current) return;
        await consumeStream(stream, null, true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error en simulación automática");
          simulationActiveRef.current = false;
          setSimulationActive(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [simulationActive, isStreaming, id, session?.status, consumeStream]);

  const toggleSimulation = () => {
    const next = !simulationActive;
    simulationActiveRef.current = next;
    setSimulationActive(next);
  };

  const handleSend = async () => {
    if (!id || !session || input.trim() === "" || isStreaming || simulationActive) return;
    const playerInput = input.trim();
    setInput("");
    setError(null);
    try {
      const stream = await sendTurn(id, playerInput);
      await consumeStream(stream, playerInput);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el turno");
      setPendingPlayerInput(null);
      setStreamingText(null);
    }
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
    return <div className="p-8 text-center text-slate-400">Cargando sesión...</div>;
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
      {/* 60/40 cuando hay panel admin; sin columna fantasma para no-admins */}
      <div
        className={`grid gap-6 h-full ${
          isAdmin ? "grid-cols-1 lg:grid-cols-[3fr_2fr]" : "grid-cols-1"
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
            {!isEnded && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={toggleSimulation}
                  disabled={isStreaming}
                  title={simulationActive ? "Detener simulación" : "Simular campaña con IA"}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    simulationActive
                      ? "text-amber-400 hover:text-amber-300"
                      : "text-slate-400 hover:text-amber-400"
                  }`}
                >
                  <Bot size={12} />
                  {simulationActive ? "Detener sim." : "Simular"}
                </button>
                <button
                  onClick={handleEnd}
                  disabled={isStreaming}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <Square size={12} />
                  Terminar
                </button>
              </div>
            )}
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {session.turns.map((turn) => (
              <React.Fragment key={turn.id}>
                {turn.playerInput && <PlayerBubble text={turn.playerInput} />}
                <DmBubble text={turn.dmResponse} />
              </React.Fragment>
            ))}

            {/* Turno en streaming */}
            {pendingPlayerInput && <PlayerBubble text={pendingPlayerInput} isAuto={pendingIsAuto} />}
            {isStreaming && <DmBubble text={streamingText ?? ""} streaming />}

            {/* Inicializando sin stream activo */}
            {isInitializing && (
              <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
                <Loader2 size={18} className="animate-spin text-purple-400" />
                <span className="text-sm">El DM está preparando la escena...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 shrink-0">
            {simulationActive && !isEnded && (
              <div className="px-5 py-2 bg-amber-900/20 border-b border-amber-600/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={13} className="text-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-300 font-semibold">
                    Simulación activa — IA controlando al jugador
                  </span>
                </div>
                <button
                  onClick={toggleSimulation}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  Detener
                </button>
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
                  {isStreaming ? "El DM está respondiendo..." : "Preparando siguiente acción..."}
                </p>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={isStreaming || isInitializing}
                    placeholder="Describe la acción de tu grupo..."
                    className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isStreaming || isInitializing || input.trim() === ""}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isStreaming ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    Enviar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
