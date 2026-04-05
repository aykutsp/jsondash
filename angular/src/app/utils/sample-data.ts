import { JsonValue } from '../models/dashboard';

export const sampleData: JsonValue = {
  sales: [
    { date: '2025-01-01', region: 'EU', revenue: 1200, orders: 24, channel: 'Direct' },
    { date: '2025-01-02', region: 'US', revenue: 1800, orders: 31, channel: 'Partner' },
    { date: '2025-01-03', region: 'EU', revenue: 1420, orders: 26, channel: 'Direct' },
    { date: '2025-01-04', region: 'APAC', revenue: 1660, orders: 29, channel: 'Partner' },
    { date: '2025-01-05', region: 'US', revenue: 1940, orders: 35, channel: 'Direct' },
    { date: '2025-01-06', region: 'APAC', revenue: 1510, orders: 28, channel: 'Partner' },
    { date: '2025-01-07', region: 'EU', revenue: 1730, orders: 33, channel: 'Direct' }
  ]
};

