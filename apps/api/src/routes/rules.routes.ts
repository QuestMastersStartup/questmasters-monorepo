import { Elysia } from 'elysia';
import type { Container } from '../infrastructure/container';
import { ResolveAssetSchema } from '../schemas/rules.schema';

export function rulesRoutes(container: Container) {
  return new Elysia({ prefix: '/rules' }).post(
    '/resolve',
    async ({ body }) => {
      return container.resolveAssetUseCase.execute(body);
    },
    {
      body: ResolveAssetSchema,
      detail: {
        summary: 'Resolve asset features based on user selections',
        tags: ['Rules'],
        description:
          'Processes an asset within its context (selections, dependencies) to return the final list of resolved features and any warnings.',
      },
    },
  );
}
