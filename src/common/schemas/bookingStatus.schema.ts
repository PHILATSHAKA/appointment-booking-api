import { z } from 'zod';

export const bookingStatus = z.enum(['CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED']);