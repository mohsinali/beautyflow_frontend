const enabled = process.env.NODE_ENV === 'development';

export const logger = {
  error(message: string, context?: Record<string, string | number | undefined>) {
    if (enabled) console.error(`[BeautyFlow] ${message}`, context);
  },
  warn(message: string, context?: Record<string, string | number | undefined>) {
    if (enabled) console.warn(`[BeautyFlow] ${message}`, context);
  },
};
