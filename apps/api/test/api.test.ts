import { describe, expect, it } from 'bun:test';

describe('API Health Check', () => {
  it('should return the health check message', async () => {
    const response = await fetch('http://localhost:3000/api');
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(text).toBe('QuestMasters API is running!');
  });
});
