import { describe, expect, it } from 'vitest';
import { CreateTicketSchema } from '@/validations/ticket.schema';

describe('CreateTicketSchema', () => {
  const validPayload = {
    schedule_id: 1,
    pickup_date: '2026-09-12',
    address_id: '123e4567-e89b-12d3-a456-426614174000',
  };

  it('validates a correct payload with YYYY-MM-DD pickup_date', () => {
    const result = CreateTicketSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pickup_date).toBe('2026-09-12');
    }
  });

  it('rejects an invalid pickup_date format', () => {
    const invalidFormats = [
      '12-09-2026',
      '2026/09/12',
      '2026-9-12',
      'September 12, 2026',
      '2026-09-12T00:00:00.000Z',
    ];

    for (const badDate of invalidFormats) {
      const result = CreateTicketSchema.safeParse({
        ...validPayload,
        pickup_date: badDate,
      });
      expect(result.success).toBe(false);
    }
  });

  it('rejects missing or invalid address_id', () => {
    const result = CreateTicketSchema.safeParse({
      ...validPayload,
      address_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
