// Storage API adapter - drop-in replacement for storage.js
// Keeps legacy method signatures while using backend routes.

import { api } from './apiClient';
import { featureFlags } from './featureFlags';
import { storage as localStorageAdapter, DEFAULT_AVATARS as LOCAL_DEFAULT_AVATARS } from './storage';

export const DEFAULT_AVATARS = LOCAL_DEFAULT_AVATARS;

function normalizeUser(user) {
  if (!user) return null;
  const id = user._id || user.id;
  return {
    ...user,
    _id: id,
    id,
    avatar: user.avatar || user.avatarUrl || user.avatarThumbnailUrl || null,
    avatarUrl: user.avatarUrl || user.avatar || null,
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
    viewedRecipes: Array.isArray(user.viewedRecipes) ? user.viewedRecipes : [],
  };
}

function normalizeRecipe(recipe) {
  if (!recipe) return null;
  const id = recipe._id || recipe.id;
  return {
    ...recipe,
    _id: id,
    id,
    images: Array.isArray(recipe.images)
      ? recipe.images
      : (recipe.imageUrl ? [recipe.imageUrl] : []),
    likedBy: Array.isArray(recipe.likedBy) ? recipe.likedBy : [],
    viewedBy: Array.isArray(recipe.viewedBy) ? recipe.viewedBy : [],
  };
}

function normalizeReview(review) {
  if (!review) return null;
  const id = review._id || review.id;
  return {
    ...review,
    _id: id,
    id,
  };
}

function normalizeSearchEntry(entry) {
  if (!entry) return null;
  const id = entry._id || entry.id;
  return {
    ...entry,
    _id: id,
    id,
  };
}

function normalizeActivity(activity) {
  if (!activity) return null;
  return {
    ...activity,
    text: activity.text || activity.message || '',
  };
}

function isRecoverableApiError(error) {
  // Network/server errors are recoverable for fallback.
  return !error?.status || error.status >= 500;
}

let localInitialized = false;

function ensureLocalInitialized() {
  if (localInitialized) return;
  localStorageAdapter.initialize();
  localInitialized = true;
}

function runLocal(localOperation) {
  ensureLocalInitialized();
  return localOperation();
}

async function withReadFallback(apiRead, localRead) {
  if (!featureFlags.useBackendApi) {
    return runLocal(localRead);
  }
  try {
    return await apiRead();
  } catch (error) {
    if (featureFlags.enableReadFallback && isRecoverableApiError(error)) {
      return runLocal(localRead);
    }
    throw error;
  }
}

async function withWriteFallback(apiWrite, localWrite) {
  if (!featureFlags.useBackendApi) {
    return runLocal(localWrite);
  }
  try {
    return await apiWrite();
  } catch (error) {
    if (featureFlags.enableReadFallback && isRecoverableApiError(error)) {
      return runLocal(localWrite);
    }
    throw error;
  }
}

function getOrCreateGuestId() {
  try {
    let id = localStorage.getItem('kitchen_odyssey_guest_id');
    if (!id) {
      id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('kitchen_odyssey_guest_id', id);
    }
    return id;
  } catch {
    return `guest-${Date.now()}`;
  }
}

export const storageApi = {
  initialize: () => {
    if (!featureFlags.useBackendApi) {
      ensureLocalInitialized();
    }
  },

  signup: async (payload) => withWriteFallback(
    async () => {
      const result = await api.post('/auth/signup', payload);
      return normalizeUser(result?.user || result);
    },
    () => {
      // Local mode emulates signup with saveUser.
      const user = {
        id: `user-${Date.now().toString(36)}`,
        role: 'user',
        status: 'pending',
        joinedDate: new Date().toISOString(),
        favorites: [],
        viewedRecipes: [],
        ...payload,
      };
      localStorageAdapter.saveUser(user);
      localStorageAdapter.setCurrentUser(user);
      return normalizeUser(user);
    },
  ),

  login: async (email, password) => withWriteFallback(
    async () => {
      const result = await api.post('/auth/login', { email, password });
      return normalizeUser(result?.user || result);
    },
    () => normalizeUser(localStorageAdapter.login(email, password)),
  ),

  logout: async (userId) => withWriteFallback(
    async () => {
      await api.post('/auth/logout');
    },
    () => {
      localStorageAdapter.logout(userId);
    },
  ),

  getCurrentUser: async () => withReadFallback(
    async () => {
      const result = await api.get('/auth/me', { dedupeKey: 'auth:me' });
      return normalizeUser(result?.user || result);
    },
    () => normalizeUser(localStorageAdapter.getCurrentUser()),
  ),

  setCurrentUser: (user) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.setCurrentUser(user);
    }
  },

  getOrCreateGuestId,

  getUsers: async () => withReadFallback(
    async () => {
      const result = await api.get('/users?limit=500');
      const users = result?.users || [];
      return users.map(normalizeUser);
    },
    () => (localStorageAdapter.getUsers() || []).map(normalizeUser),
  ),

  saveUser: async (user) => {
    const id = user._id || user.id;
    return withWriteFallback(
      async () => {
        if (!id) {
          const created = await storageApi.signup(user);
          return normalizeUser(created);
        }

        const payload = { ...user };
        if (payload.avatar && !payload.avatarUrl) {
          payload.avatarUrl = payload.avatar;
        }

        const result = await api.patch(`/users/${id}`, payload);
        return normalizeUser(result?.user || result);
      },
      () => {
        const next = { ...user, id: id || `user-${Date.now().toString(36)}` };
        localStorageAdapter.saveUser(next);
        return normalizeUser(next);
      },
    );
  },

  deleteUser: async (userId) => withWriteFallback(
    async () => {
      await api.delete(`/users/${userId}`);
    },
    () => {
      localStorageAdapter.deleteUser(userId);
    },
  ),

  updateLastActive: async (userId) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.updateLastActive(userId);
    }
  },

  recordActiveUser: (userId) => {
    if (!featureFlags.useBackendApi) localStorageAdapter.recordActiveUser(userId);
  },

  recordNewUser: (userId, role) => {
    if (!featureFlags.useBackendApi) localStorageAdapter.recordNewUser(userId, role);
  },

  getRecipes: async () => withReadFallback(
    async () => {
      const result = await api.get('/recipes?limit=500');
      const recipes = result?.recipes || [];
      return recipes.map(normalizeRecipe);
    },
    () => (localStorageAdapter.getRecipes() || []).map(normalizeRecipe),
  ),

  getRecipeById: async (recipeId) => withReadFallback(
    async () => {
      const result = await api.get(`/recipes/${recipeId}`, { dedupeKey: `recipe:${recipeId}` });
      return normalizeRecipe(result?.recipe || result);
    },
    () => normalizeRecipe(localStorageAdapter.getRecipeById(recipeId)),
  ),

  saveRecipe: async (recipe) => {
    const id = recipe._id || recipe.id;
    return withWriteFallback(
      async () => {
        const payload = { ...recipe };
        if (Array.isArray(payload.categories) && !payload.category) {
          payload.category = payload.categories[0];
        }

        if (id) {
          const result = await api.patch(`/recipes/${id}`, payload);
          return normalizeRecipe(result?.recipe || result);
        }

        const result = await api.post('/recipes', payload);
        return normalizeRecipe(result?.recipe || result);
      },
      () => {
        const next = { ...recipe, id: id || `recipe-${Date.now().toString(36)}` };
        localStorageAdapter.saveRecipe(next);
        return normalizeRecipe(next);
      },
    );
  },

  deleteRecipe: async (recipeId) => withWriteFallback(
    async () => {
      await api.delete(`/recipes/${recipeId}`);
    },
    () => {
      localStorageAdapter.deleteRecipe(recipeId);
    },
  ),

  toggleLike: async (userId, recipeId) => withWriteFallback(
    async () => {
      const result = await api.post(`/recipes/${recipeId}/like`);
      return { liked: result?.liked, likeCount: result?.count ?? 0 };
    },
    () => {
      const result = localStorageAdapter.toggleLike(userId, recipeId);
      return { liked: result.liked, likeCount: result.count };
    },
  ),

  toggleFavorite: async (userId, recipeId) => withWriteFallback(
    async () => {
      const result = await api.post(`/recipes/${recipeId}/favorite`);
      return { favorited: result?.favorited };
    },
    () => {
      const favorited = localStorageAdapter.toggleFavorite(userId, recipeId);
      return { favorited };
    },
  ),

  hasUserLiked: (userId, recipeOrRecipeId) => {
    const recipeId = typeof recipeOrRecipeId === 'string'
      ? recipeOrRecipeId
      : (recipeOrRecipeId?._id || recipeOrRecipeId?.id);

    if (typeof recipeOrRecipeId === 'object' && recipeOrRecipeId) {
      return recipeOrRecipeId.likedBy?.includes(userId) || false;
    }
    return localStorageAdapter.hasUserLiked(userId, recipeId);
  },

  hasUserFavorited: (userId, recipeOrRecipeId) => {
    const recipeId = typeof recipeOrRecipeId === 'string'
      ? recipeOrRecipeId
      : (recipeOrRecipeId?._id || recipeOrRecipeId?.id);
    return localStorageAdapter.hasUserFavorited(userId, recipeId);
  },

  recordView: async ({ recipeId, viewerId, viewerType }) => withWriteFallback(
    async () => {
      const headers = {};
      if (viewerType === 'guest' && viewerId) {
        headers['X-Guest-ID'] = viewerId;
      }
      const result = await api.post(`/recipes/${recipeId}/view`, { viewerId, viewerType }, { headers });
      return result?.viewCount ?? 0;
    },
    () => localStorageAdapter.recordView({ recipeId, viewerId, viewerType }),
  ),

  getReviews: async (recipeId) => {
    if (!recipeId) {
      return withReadFallback(
        async () => [],
        () => (localStorageAdapter.getReviews() || []).map(normalizeReview),
      );
    }

    return withReadFallback(
      async () => {
        const result = await api.get(`/recipes/${recipeId}/reviews?limit=100`);
        return (result?.reviews || []).map(normalizeReview);
      },
      () => (localStorageAdapter.getReviews(recipeId) || []).map(normalizeReview),
    );
  },

  addReview: async (review) => withWriteFallback(
    async () => {
      const result = await api.post(`/recipes/${review.recipeId}/reviews`, {
        rating: review.rating,
        comment: review.comment,
      });
      return normalizeReview(result?.review || result);
    },
    () => {
      localStorageAdapter.addReview(review);
      const stored = localStorageAdapter
        .getReviews(review.recipeId)
        .find((item) => item.userId === review.userId);
      return normalizeReview(stored || review);
    },
  ),

  deleteReview: async (reviewId) => withWriteFallback(
    async () => {
      await api.delete(`/reviews/${reviewId}`);
    },
    () => {
      localStorageAdapter.deleteReview(reviewId);
    },
  ),

  getAverageRating: async (recipeId) => withReadFallback(
    async () => {
      const result = await api.get(`/recipes/${recipeId}/rating`);
      return result?.average || 0;
    },
    () => localStorageAdapter.getAverageRating(recipeId),
  ),

  getRandomSuggestion: async () => withReadFallback(
    async () => normalizeRecipe(await api.get('/recipes/random-suggestion', { dedupe: false })),
    () => normalizeRecipe(localStorageAdapter.getRandomSuggestion()),
  ),

  getSearchHistory: async (userId) => {
    if (!userId || userId.startsWith?.('guest')) {
      if (!featureFlags.useBackendApi) {
        return (localStorageAdapter.getSearchHistory(userId) || []).map(normalizeSearchEntry);
      }
      return [];
    }

    return withReadFallback(
      async () => {
        const result = await api.get('/search-history');
        const items = Array.isArray(result) ? result : (result?.items || []);
        return items.map(normalizeSearchEntry);
      },
      () => (localStorageAdapter.getSearchHistory(userId) || []).map(normalizeSearchEntry),
    );
  },

  addSearchHistory: async ({ userId, query }) => {
    if (!query?.trim()) return null;

    if (userId?.startsWith?.('guest')) {
      return localStorageAdapter.addSearchHistory({ userId, query });
    }

    return withWriteFallback(
      async () => api.post('/search-history', { query: query.trim() }),
      () => localStorageAdapter.addSearchHistory({ userId, query: query.trim() }),
    );
  },

  clearSearchHistory: async (userId) => {
    if (userId?.startsWith?.('guest')) {
      localStorageAdapter.clearSearchHistory(userId);
      return;
    }

    await withWriteFallback(
      async () => {
        await api.delete('/search-history');
      },
      () => {
        localStorageAdapter.clearSearchHistory(userId);
      },
    );
  },

  addActivity: async (activity) => withWriteFallback(
    async () => {
      await api.post('/activity', {
        type: activity.type || 'general',
        message: activity.text || activity.message || '',
        targetId: activity.targetId,
        metadata: activity.metadata,
      });
    },
    () => {
      localStorageAdapter.addActivity(activity);
    },
  ),

  getRecentActivity: async (limit = 5) => withReadFallback(
    async () => {
      const result = await api.get(`/activity?limit=${limit}`);
      return (result?.items || []).map(normalizeActivity);
    },
    () => (localStorageAdapter.getRecentActivity(limit) || []).map(normalizeActivity),
  ),

  getDailyStats: async () => {
    if (!featureFlags.useBackendApi) return localStorageAdapter.getDailyStats();
    return api.get('/stats/daily');
  },

  updateUserStatus: async (userId, status) => withWriteFallback(
    async () => normalizeUser(await api.patch(`/admin/users/${userId}/status`, { status })),
    () => {
      const users = localStorageAdapter.getUsers();
      const user = users.find((u) => u.id === userId);
      if (!user) return null;
      user.status = status;
      localStorageAdapter.saveUser(user);
      return normalizeUser(user);
    },
  ),

  updateRecipeStatus: async (recipeId, status) => withWriteFallback(
    async () => normalizeRecipe(await api.patch(`/admin/recipes/${recipeId}/status`, { status })),
    () => {
      const recipe = localStorageAdapter.getRecipeById(recipeId);
      if (!recipe) return null;
      recipe.status = status;
      localStorageAdapter.saveRecipe(recipe);
      return normalizeRecipe(recipe);
    },
  ),
};
