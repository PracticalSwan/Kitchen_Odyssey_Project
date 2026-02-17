// Storage API adapter - Backend-only with minimal localStorage for guest mode
// All authenticated operations require backend. Guests use localStorage for session.

import { api } from './apiClient';
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

// Guest mode: localStorage for guest ID and session data
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

function isGuest(userId) {
  return userId?.startsWith?.('guest');
}

export const storageApi = {
  initialize: () => {
    // No-op - backend handles initialization
  },

  signup: async (payload) => {
    const result = await api.post('/auth/signup', payload);
    return normalizeUser(result?.user || result);
  },

  login: async (email, password) => {
    const result = await api.post('/auth/login', { email, password });
    return normalizeUser(result?.user || result);
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async () => {
    try {
      const result = await api.get('/auth/me', { dedupeKey: 'auth:me' });
      return normalizeUser(result?.user || result);
    } catch (error) {
      if (error?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  setCurrentUser: () => {
    // No-op - backend manages session via cookies
  },

  getOrCreateGuestId,

  getUsers: async () => {
    const result = await api.get('/users?limit=500');
    const users = result?.users || [];
    return users.map(normalizeUser);
  },

  saveUser: async (user) => {
    const id = user._id || user.id;
    if (!id) {
      return await storageApi.signup(user);
    }

    const payload = { ...user };
    if (payload.avatar && !payload.avatarUrl) {
      payload.avatarUrl = payload.avatar;
    }

    const result = await api.patch(`/users/${id}`, payload);
    return normalizeUser(result?.user || result);
  },

  deleteUser: async (userId) => {
    await api.delete(`/users/${userId}`);
  },

  updateLastActive: async () => {
    // No-op - backend tracks last active automatically
  },

  recordActiveUser: () => {
    // No-op - backend tracks activity
  },

  recordNewUser: () => {
    // No-op - backend tracks user creation
  },

  getRecipes: async () => {
    const result = await api.get('/recipes?limit=500');
    const recipes = result?.recipes || [];
    return recipes.map(normalizeRecipe);
  },

  getRecipeById: async (recipeId) => {
    const result = await api.get(`/recipes/${recipeId}`, { dedupeKey: `recipe:${recipeId}` });
    return normalizeRecipe(result?.recipe || result);
  },

  saveRecipe: async (recipe) => {
    const id = recipe._id || recipe.id;
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
    await api.delete(`/recipes/${recipeId}`);
  },

  toggleLike: async (userId, recipeId) => {
    const result = await api.post(`/recipes/${recipeId}/like`);
    return { liked: result?.liked, likeCount: result?.count ?? 0 };
  },

  toggleFavorite: async (userId, recipeId) => {
    const result = await api.post(`/recipes/${recipeId}/favorite`);
    return { favorited: result?.favorited };
  },

  hasUserLiked: (userId, recipeOrRecipeId) => {
    if (typeof recipeOrRecipeId === 'object' && recipeOrRecipeId) {
      return recipeOrRecipeId.likedBy?.includes(userId) || false;
    }
    return false; // Backend-only: need to fetch recipe to check
  },

  hasUserFavorited: () => {
    return false; // Backend-only: need to fetch user to check
  },

  recordView: async ({ recipeId, viewerId, viewerType }) => {
    if (viewerType === 'guest' && isGuest(viewerId)) {
      // Guest views: use localStorage (no backend persistence)
      try {
        localStorageAdapter.recordView({ recipeId, viewerId, viewerType });
      } catch { /* ignore */ }
      return 0;
    }

    // Authenticated views: backend tracks
    const headers = {};
    const result = await api.post(`/recipes/${recipeId}/view`, { viewerId, viewerType }, { headers });
    return result?.viewCount ?? 0;
  },

  getReviews: async (recipeId) => {
    const result = await api.get(`/recipes/${recipeId}/reviews?limit=100`);
    return (result?.reviews || []).map(normalizeReview);
  },

  addReview: async (review) => {
    const result = await api.post(`/recipes/${review.recipeId}/reviews`, {
      rating: review.rating,
      comment: review.comment,
    });
    return normalizeReview(result?.review || result);
  },

  deleteReview: async (reviewId) => {
    await api.delete(`/reviews/${reviewId}`);
  },

  getAverageRating: async (recipeId) => {
    const result = await api.get(`/recipes/${recipeId}/rating`);
    return result?.average || 0;
  },

  getRandomSuggestion: async () => {
    return normalizeRecipe(await api.get('/recipes/random-suggestion', { dedupe: false }));
  },

  getSearchHistory: async (userId) => {
    // Guest mode: use localStorage
    if (isGuest(userId)) {
      try {
        return (localStorageAdapter.getSearchHistory(userId) || []).map(normalizeSearchEntry);
      } catch { return []; }
    }

    // Authenticated: backend
    const result = await api.get('/search-history');
    const items = Array.isArray(result) ? result : (result?.items || []);
    return items.map(normalizeSearchEntry);
  },

  addSearchHistory: async ({ userId, query }) => {
    if (!query?.trim()) return null;

    // Guest mode: use localStorage
    if (isGuest(userId)) {
      return localStorageAdapter.addSearchHistory({ userId, query });
    }

    // Authenticated: backend
    return await api.post('/search-history', { query: query.trim() });
  },

  clearSearchHistory: async (userId) => {
    // Guest mode: use localStorage
    if (isGuest(userId)) {
      localStorageAdapter.clearSearchHistory(userId);
      return;
    }

    // Authenticated: backend
    await api.delete('/search-history');
  },

  addActivity: async (activity) => {
    await api.post('/activity', {
      type: activity.type || 'general',
      message: activity.text || activity.message || '',
      targetId: activity.targetId,
      metadata: activity.metadata,
    });
  },

  getRecentActivity: async (limit = 5) => {
    const result = await api.get(`/activity?limit=${limit}`);
    return (result?.items || []).map(normalizeActivity);
  },

  getDailyStats: async () => {
    return await api.get('/stats/daily');
  },

  updateUserStatus: async (userId, status) => {
    return normalizeUser(await api.patch(`/admin/users/${userId}/status`, { status }));
  },

  updateRecipeStatus: async (recipeId, status) => {
    return normalizeRecipe(await api.patch(`/admin/recipes/${recipeId}/status`, { status }));
  },
};
