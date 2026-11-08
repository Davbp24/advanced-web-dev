import { vi } from 'vitest';

vi.mock('electron', () => ({
    app: {
        getVersion: vi.fn(() => '1.0.0'),
    },
    icpMain: { handle: vi.fn() },
}))

