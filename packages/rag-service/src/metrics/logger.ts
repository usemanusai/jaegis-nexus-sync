export function logInfo(...args: any[]) { if (process.env.NODE_ENV !== 'test') console.log('[INFO]', ...args) }
export function logError(...args: any[]) { if (process.env.NODE_ENV !== 'test') console.error('[ERROR]', ...args) }

