import { describe, expect, it } from 'bun:test';
import { CampaignMapper } from './campaign.mapper';
import { Campaign } from '../../domain/entities/campaign.entity';

describe('CampaignMapper.toResponse', () => {
  it('caso válido: mapea una campaña completa a un objeto plano serializable', () => {
    const campaign = Campaign.create({
      name: 'La Maldición de Strahd',
      description: 'Una campaña de horror gótico',
      system: 'dnd-5e-2014',
      dmId: 'dm-1',
      installedPackIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });

    const response = CampaignMapper.toResponse(campaign);

    expect(response.name).toBe('La Maldición de Strahd');
    expect(response.system).toBe('dnd-5e-2014');
    expect(response.status).toBe('active');
    expect(response.installedPackIds).toEqual(['550e8400-e29b-41d4-a716-446655440000']);
    expect(typeof response.createdAt).toBe('string');
  });

  it('caso límite: sin paquetes instalados devuelve un arreglo vacío, no null/undefined', () => {
    const campaign = Campaign.create({
      name: 'Campaña vacía',
      system: 'dnd-5e-2014',
      dmId: 'dm-1',
    });

    const response = CampaignMapper.toResponse(campaign);

    expect(response.installedPackIds).toEqual([]);
  });
});
