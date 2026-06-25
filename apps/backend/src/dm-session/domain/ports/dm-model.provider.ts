import type {
  ArchitectureType,
  CharacterSnapshot,
  NarrativeNote,
} from '../entities/dm-session.entity';

/**
 * Puerto del proveedor de modelo DM.
 *
 * Único punto de integración con las orquestaciones de IA. Cuando las
 * orquestaciones reales estén listas, solo deben implementar este contrato:
 *   - MasOrchestrationAdapter implements DmModelProvider
 *   - MonolithicOrchestrationAdapter implements DmModelProvider
 *
 * El container mantiene un mapa Record<ArchitectureType, DmModelProvider>
 * y los use cases seleccionan el adapter según el architectureType de la sesión.
 */

export interface DmModelRequest {
  sessionId: string;
  architectureType: ArchitectureType;
  modelId: string;
  campaignPrompt: string;
  characters: CharacterSnapshot[];
  conversationHistory: { role: 'player' | 'dm'; content: string }[];
  /** null = arrancar sesión (primer turno del DM). */
  playerInput: string | null;
  currentMemorySnapshot: Record<string, any>;
  /** Pre-computed por Workers AI en el backend. Si viene, el orquestador lo usa directo. */
  routeDecision?: {
    needs_memory: boolean;
    needs_arbiter: boolean;
    needs_npc: boolean;
    needs_world: boolean;
  };
}

export interface DmModelChunk {
  type: 'delta' | 'metadata' | 'done' | 'error';
  /** type=delta: texto narrativo parcial. */
  delta?: string;
  /** type=metadata: datos estructurados al final del turno. */
  metadata?: {
    memorySnapshot: Record<string, any>;
    narrativeNotesDelta: NarrativeNote[];
    usage: { inputTokens: number; outputTokens: number };
    latencyMs: number;
    modelId: string;
  };
  /** type=error */
  error?: string;
}

export interface DmModelProvider {
  /** Devuelve un AsyncGenerator que emite DmModelChunks en streaming. */
  generateTurn(request: DmModelRequest): AsyncGenerator<DmModelChunk>;
}
