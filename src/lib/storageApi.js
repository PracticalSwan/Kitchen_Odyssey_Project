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

function isRecoverableReadError(error) {
  // Network/server errors are recoverable for read-through fallback.
  return !error?.status || error.status >= 500;
}

async function withReadFallback(apiRead, localRead) {
  if (!featureFlags.useBackendApi) {
    return localRead();
  }
  try {
    return await apiRead();
  } catch (error) {
    if (featureFlags.enableReadFallback && isRecoverableReadError(error)) {
      return localRead();
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
    if (!featureFlags.useBackendApi) localStorageAdapter.initialize();
  },

  signup: async (payload) => {
    if (!featureFlags.useBackendApi) {
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
    }
    const result = await api.post('/auth/signup', payload);
    return normalizeUser(result?.user || result);
  },

  login: async (email, password) => {
    if (!featureFlags.useBackendApi) {
      return normalizeUser(localStorageAdapter.login(email, password));
    }
    const result = await api.post('/auth/login', { email, password });
    return normalizeUser(result?.user || result);
  },

  logout: async (userId) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.logout(userId);
      return;
    }
    await api.post('/auth/logout');
  },

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
    if (!featureFlags.useBackendApi) {
      const next = { ...user, id };
      localStorageAdapter.saveUser(next);
      return normalizeUser(next);
    }

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

  deleteUser: async (userId) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.deleteUser(userId);
      return;
    }
    await api.delete(`/users/${userId}`);
  },

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
    if (!featureFlags.useBackendApi) {
      const next = { ...recipe, id };
      localStorageAdapter.saveRecipe(next);
      return normalizeRecipe(next);
    }

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

  deleteRecipe: async (recipeId) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.deleteRecipe(recipeId);
      return;
    }
    await api.delete(`/recipes/${recipeId}`);
  },

  toggleLike: async (userId, recipeId) => {
    if (!featureFlags.useBackendApi) {
      const result = localStorageAdapter.toggleLike(userId, recipeId);
      return { liked: result.liked, likeCount: result.count };
    }
    const result = await api.post(`/recipes/${recipeId}/like`);
    return { liked: result?.liked, likeCount: result?.count ?? 0 };
  },

  toggleFavorite: async (userId, recipeId) => {
    if (!featureFlags.useBackendApi) {
      const favorited = localStorageAdapter.toggleFavorite(userId, recipeId);
      return { favorited };
    }
    const result = await api.post(`/recipes/${recipeId}/favorite`);
    return { favorited: result?.favorited };
  },

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

  recordView: async ({ recipeId, viewerId, viewerType }) => {
    if (!featureFlags.useBackendApi) {
      return localStorageAdapter.recordView({ recipeId, viewerId, viewerType });
    }

    const headers = {};
    if (viewerType === 'guest' && viewerId) {
      headers['X-Guest-ID'] = viewerId;
    }
    const result = await api.post(`/recipes/${recipeId}/view`, { viewerId, viewerType }, { headers });
    return result?.viewCount ?? 0;
  },

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

  addReview: async (review) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.addReview(review);
      return;
    }
    const result = await api.post(`/recipes/${review.recipeId}/reviews`, {
      rating: review.rating,
      comment: review.comment,
    });
    return normalizeReview(result?.review || result);
  },

  deleteReview: async (reviewId) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.deleteReview(reviewId);
      return;
    }
    await api.delete(`/reviews/${reviewId}`);
  },

  getAverageRating: async (recipeId) => {
    if (!featureFlags.useBackendApi) {
      return localStorageAdapter.getAverageRating(recipeId);
    }
    const result = await api.get(`/recipes/${recipeId}/rating`);
    return result?.average || 0;
  },

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

    if (!featureFlags.useBackendApi || userId?.startsWith?.('guest')) {
      return localStorageAdapter.addSearchHistory({ userId, query });
    }
    return api.post('/search-history', { query: query.trim() });
  },

  clearSearchHistory: async (userId) => {
    if (!featureFlags.useBackendApi || userId?.startsWith?.('guest')) {
      localStorageAdapter.clearSearchHistory(userId);
      return;
    }
    await api.delete('/search-history');
  },

  addActivity: async (activity) => {
    if (!featureFlags.useBackendApi) {
      localStorageAdapter.addActivity(activity);
      return;
    }
    await api.post('/activity', {
      type: activity.type || 'general',
      message: activity.text || activity.message || '',
      targetId: activity.targetId,
      metadata: activity.metadata,
    });
  },

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

  updateUserStatus: async (userId, status) => {
    if (!featureFlags.useBackendApi) {
      const users = localStorageAdapter.getUsers();
      const user = users.find((u) => u.id === userId);
      if (!user) return null;
      user.status = status;
      localStorageAdapter.saveUser(user);
      return normalizeUser(user);
    }
    return normalizeUser(await api.patch(`/admin/users/${userId}/status`, { status }));
  },

  updateRecipeStatus: async (recipeId, status) => {
    if (!featureFlags.useBackendApi) {
      const recipe = localStorageAdapter.getRecipeById(recipeId);
      if (!recipe) return null;
      recipe.status = status;
      localStorageAdapter.saveRecipe(recipe);
      return normalizeRecipe(recipe);
    }
    return normalizeRecipe(await api.patch(`/admin/recipes/${recipeId}/status`, { status }));
  },
};
