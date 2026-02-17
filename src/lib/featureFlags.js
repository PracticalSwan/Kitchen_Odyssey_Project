function parseBoolean(input, fallback = false) {
  if (input === undefined || input === null || input === '') return fallback;
  const normalized = `${input}`.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export const featureFlags = {
  useBackendApi: parseBoolean(import.meta.env.VITE_USE_BACKEND_API, false),
  enableReadFallback: parseBoolean(import.meta.env.VITE_ENABLE_READ_FALLBACK, true),
};
