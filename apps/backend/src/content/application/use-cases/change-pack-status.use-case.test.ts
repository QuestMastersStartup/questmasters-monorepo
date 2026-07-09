import { describe, expect, it, mock } from 'bun:test';
import { ChangePackStatusUseCase } from './change-pack-status.use-case';
import { ContentPack } from '@content/domain/entities/content-pack.entity';
import { PackError } from '@content/application/errors';

function buildPack(status?: string) {
  return ContentPack.create({
    slug: 'srd-5e',
    name: 'SRD 5e',
    type: 'srd',
    system: 'dnd-5e-2014',
    creatorId: 'creator-1',
    status,
  });
}

describe('ChangePackStatusUseCase', () => {
  it('caso válido: transición permitida (draft -> under_review) guarda y devuelve el pack actualizado', async () => {
    const pack = buildPack('draft');
    const packRepository = {
      findBySlug: mock(() => Promise.resolve(pack)),
      save: mock(() => Promise.resolve()),
    };
    const useCase = new ChangePackStatusUseCase(packRepository as any);

    const result = await useCase.execute('srd-5e', 'under_review');

    expect(result.isSuccess).toBe(true);
    expect(result.value.status.toString()).toBe('under_review');
    expect(packRepository.save).toHaveBeenCalled();
  });

  it('caso inválido: pack inexistente devuelve NOT_FOUND', async () => {
    const packRepository = {
      findBySlug: mock(() => Promise.resolve(null)),
      save: mock(() => Promise.resolve()),
    };
    const useCase = new ChangePackStatusUseCase(packRepository as any);

    const result = await useCase.execute('no-existe', 'published');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(PackError.NOT_FOUND);
    expect(packRepository.save).not.toHaveBeenCalled();
  });

  it('caso inválido: valor de estado no reconocido devuelve INVALID_STATUS', async () => {
    const pack = buildPack('draft');
    const packRepository = {
      findBySlug: mock(() => Promise.resolve(pack)),
      save: mock(() => Promise.resolve()),
    };
    const useCase = new ChangePackStatusUseCase(packRepository as any);

    const result = await useCase.execute('srd-5e', 'not-a-real-status');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(PackError.INVALID_STATUS);
  });

  it('caso límite: transición válida pero no permitida desde el estado actual (draft -> published) devuelve INVALID_STATUS_TRANSITION', async () => {
    const pack = buildPack('draft'); // draft solo puede ir a under_review, no directo a published
    const packRepository = {
      findBySlug: mock(() => Promise.resolve(pack)),
      save: mock(() => Promise.resolve()),
    };
    const useCase = new ChangePackStatusUseCase(packRepository as any);

    const result = await useCase.execute('srd-5e', 'published');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(PackError.INVALID_STATUS_TRANSITION);
    expect(packRepository.save).not.toHaveBeenCalled();
  });
});
