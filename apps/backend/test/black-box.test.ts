/**
 * Pruebas de caja negra — golpean el servidor real (`bun run scripts/dev.ts`
 * o `wrangler dev --env preview --local`) vía HTTP, sin importar ni mockear
 * nada interno. Requiere el servidor corriendo en `http://localhost:3000`
 * con migraciones D1 locales aplicadas.
 *
 * Única excepción documentada a "sin mockear nada interno": el binding de
 * Workers AI (`env.AI`) no puede correr en modo `--local` (Miniflare no lo
 * emula) y el modo remoto falló por autenticación en este entorno — ver
 * `context/Informe_Pruebas_Caja_Negra.md`. El endpoint `/auto-turn` ya tiene
 * su propio fallback de producción (`randomFallbackAction`) para cuando el
 * proveedor de IA no responde, así que el flujo se prueba de extremo a
 * extremo igual; el texto exacto de la acción autónoma no proviene de un
 * modelo real en esta ejecución.
 */
import { describe, expect, it, beforeAll } from 'bun:test';

const API = 'http://localhost:3000/api';

interface SseEvent {
  type: string;
  [key: string]: unknown;
}

function parseSse(text: string): SseEvent[] {
  return text
    .split('\n\n')
    .map((block) =>
      block
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('\n'),
    )
    .filter(Boolean)
    .map((json) => JSON.parse(json));
}

async function registerUser(): Promise<{ token: string; userId: string; email: string }> {
  const email = `caja-negra-${crypto.randomUUID()}@example.com`;
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password123',
      username: `u${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    }),
  });
  const body = (await res.json()) as { token: string; userId: string };
  if (res.status !== 201) throw new Error(`registro falló: ${res.status} ${JSON.stringify(body)}`);
  return { token: body.token, userId: body.userId, email };
}

async function promoteToAdmin(userId: string): Promise<void> {
  // Las métricas son admin-only por diseño (GetSessionMetricsUseCase.execute,
  // línea 39) — no existe una ruta HTTP para auto-promoverse a admin, así que
  // se sembra el flag directamente en la misma base D1 local que usa el
  // servidor (no es un mock de lógica, es un fixture de datos de prueba).
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(
    'bun',
    [
      'x', 'wrangler', 'd1', 'execute', 'questmasters', '--local', '--env', 'preview',
      '--command', `UPDATE user_profiles SET is_admin = 1 WHERE id = '${userId}'`,
    ],
    { cwd: process.cwd(), encoding: 'utf-8' },
  );
  if (result.status !== 0) {
    throw new Error(`no se pudo promover a admin: ${result.stderr}`);
  }
}

function createSessionBody(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Sesión de prueba caja negra',
    campaignPrompt: 'Una cripta olvidada bajo la aldea de Portahueso',
    architectureType: 'monolithic',
    characters: [
      {
        name: 'Testigo',
        race: 'Humano',
        class: 'Guerrero',
        background: 'Soldado',
        level: 1,
        backstory: '',
        alignment: 'Neutral',
        personalityTraits: '',
        stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      },
    ],
    ...overrides,
  };
}

async function createSession(token: string): Promise<{ sessionId: string; events: SseEvent[] }> {
  const res = await fetch(`${API}/dm-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(createSessionBody()),
  });
  const text = await res.text();
  const events = parseSse(text);
  const sessionEvent = events.find((e) => e.type === 'session') as { session: { id: string } } | undefined;
  if (!sessionEvent) throw new Error(`no se encontró evento 'session' en: ${text}`);
  return { sessionId: sessionEvent.session.id, events };
}

describe('Caja negra — flujo A: crear sesión → enviar turno → persistencia', () => {
  it('TC01 (válido): crear sesión genera y persiste el turno inicial del DM', async () => {
    const { token } = await registerUser();
    const { sessionId, events } = await createSession(token);

    expect(events.some((e) => e.type === 'delta')).toBe(true);
    expect(events.some((e) => e.type === 'done')).toBe(true);

    const res = await fetch(`${API}/dm-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.turnCount).toBe(1);
    expect(body.turns).toHaveLength(1);
    expect(body.turns[0].role).toBe('dm');
    expect(body.turns[0].dmResponse.length).toBeGreaterThan(0);
  });

  it('TC02 (válido): enviar un turno de jugador se persiste y aparece en el historial', async () => {
    const { token } = await registerUser();
    const { sessionId } = await createSession(token);

    const turnRes = await fetch(`${API}/dm-sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playerInput: 'Reviso la puerta en busca de trampas.' }),
    });
    // La persistencia del turno ocurre mientras se consume el stream SSE
    // (ver stream-turn.ts) — hay que drenar el body antes de verificar estado.
    await turnRes.text();
    expect(turnRes.status).toBe(200);

    const sessionRes = await fetch(`${API}/dm-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await sessionRes.json();

    expect(body.turnCount).toBe(2);
    expect(body.turns).toHaveLength(2);
    expect(body.turns[1].playerInput).toBe('Reviso la puerta en busca de trampas.');
  });

  it('TC03 (error): enviar un turno con playerInput vacío devuelve 400 y no persiste nada nuevo', async () => {
    const { token } = await registerUser();
    const { sessionId } = await createSession(token);

    const res = await fetch(`${API}/dm-sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playerInput: '   ' }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBeTruthy();

    const sessionRes = await fetch(`${API}/dm-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect((await sessionRes.json()).turnCount).toBe(1); // sigue en 1, no se agregó el turno inválido
  });
});

describe('Caja negra — flujo B: métricas con y sin autorización', () => {
  it('TC04 (error): el dueño de la sesión (no-admin) recibe 403 al pedir métricas — son admin-only por diseño', async () => {
    const { token } = await registerUser();
    const { sessionId } = await createSession(token);

    const res = await fetch(`${API}/dm-sessions/${sessionId}/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBeTruthy();
  });

  it('TC05 (válido): un usuario admin recibe métricas coherentes con el turno persistido', async () => {
    const owner = await registerUser();
    const { sessionId } = await createSession(owner.token);
    const admin = await registerUser();
    await promoteToAdmin(admin.userId);

    const res = await fetch(`${API}/dm-sessions/${sessionId}/metrics`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.turnCount).toBe(1);
    expect(body.turnBreakdown).toHaveLength(1);
    expect(body.totalOutputTokens).toBeGreaterThan(0);
    expect(body.avgLatencyMs).toBeGreaterThan(0);
  });
});

describe('Caja negra — flujo C: exportar historial completo de una sesión', () => {
  it('TC06 (válido): GET /:id expone todo lo necesario para exportar (título, prompt, personajes, turnos)', async () => {
    const { token } = await registerUser();
    const { sessionId } = await createSession(token);
    const turnRes = await fetch(`${API}/dm-sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playerInput: 'Entro a la sala principal.' }),
    });
    await turnRes.text(); // drenar el SSE antes de leer el estado persistido

    const res = await fetch(`${API}/dm-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Sesión de prueba caja negra');
    expect(body.characters[0].name).toBe('Testigo');
    expect(body.turns).toHaveLength(2);
    // 'role' distingue quién originó el turno: 'dm' = apertura generada al
    // inicializar la sesión, 'player' = turno disparado por POST /:id/turns.
    expect(body.turns.map((t: { role: string }) => t.role)).toEqual(['dm', 'player']);
  });

  it('TC07 (límite): GET /:id de una sesión inexistente (UUID válido, no persistido) devuelve 404', async () => {
    const { token } = await registerUser();
    const fakeId = crypto.randomUUID();

    const res = await fetch(`${API}/dm-sessions/${fakeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toBeTruthy();
  });
});

describe('Caja negra — flujo E: agente autónomo end-to-end', () => {
  it('TC08 (válido): POST /:id/auto-turn genera y persiste un nuevo turno sin input humano', async () => {
    const { token } = await registerUser();
    const { sessionId } = await createSession(token);

    const res = await fetch(`${API}/dm-sessions/${sessionId}/auto-turn`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    const events = parseSse(text);

    expect(res.status).toBe(200);
    expect(events.some((e) => e.type === 'player_input')).toBe(true);
    expect(events.some((e) => e.type === 'done')).toBe(true);

    const sessionRes = await fetch(`${API}/dm-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect((await sessionRes.json()).turnCount).toBe(2);
  });
});

describe('Caja negra — límites de ciclo de vida de la sesión', () => {
  it('TC09 (límite): tras finalizar la sesión, enviar un turno nuevo devuelve 409 ALREADY_ENDED', async () => {
    const { token } = await registerUser();
    const { sessionId } = await createSession(token);

    const endRes = await fetch(`${API}/dm-sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(endRes.status).toBe(200);

    const turnRes = await fetch(`${API}/dm-sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playerInput: 'Intento seguir jugando.' }),
    });
    const body = await turnRes.json();

    expect(turnRes.status).toBe(409);
    expect(body.message).toBeTruthy();
  });
});

describe('Caja negra — autenticación transversal', () => {
  it('TC10 (error): request sin header Authorization devuelve 401', async () => {
    const res = await fetch(`${API}/dm-sessions`);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('TC11 (error): login con password incorrecta devuelve 401', async () => {
    const { email } = await registerUser();

    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password-incorrecta' }),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe('Invalid credentials');
  });

  it('TC12 (límite): registrar un email ya usado devuelve 409', async () => {
    const { email } = await registerUser();

    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'otraPassword123', username: `dup${crypto.randomUUID().slice(0, 8)}` }),
    });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.message).toBe('Email already registered');
  });
});
