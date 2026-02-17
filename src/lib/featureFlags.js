// Feature flags - Backend is now required for all operations
// Guest mode uses minimal localStorage for session only

function parseBoolean(input, fallback = false) {
  if (input === undefined || input === null || input === '') return fallback;
  const normalized = `${input}`.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export const featureFlags = {
  useBackendApi: parseBoolean(import.meta.env.VITE_USE_BACKEND_API, true),
};
