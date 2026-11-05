import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [savedGuides, setSavedGuides] = useState([]);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiRequest('/api/auth/sesion');
      setUser(data.user);
      setClaims(data.claims);
      const me = await apiRequest('/api/cuenta');
      setFavorites(me.favorites || []);
      setSavedGuides(me.savedGuides || []);
      setVisitedPlaces(me.visitedPlaces || []);
    } catch {
      setUser(null);
      setClaims(null);
      setFavorites([]);
      setSavedGuides([]);
      setVisitedPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await refreshSession();
    return data.user;
  };

  const register = async (payload) => {
    const data = await apiRequest('/api/auth/registro', {
      method: 'POST',
      body: payload,
    });
    await refreshSession();
    return data.user;
  };

  const logout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setClaims(null);
    setFavorites([]);
    setSavedGuides([]);
    setVisitedPlaces([]);
  };

  const toggleFavorite = async (slug) => {
    if (!user) return { requiresAuth: true };
    const isFav = favorites.includes(slug);
    if (isFav) {
      await apiRequest(`/api/cuenta/favoritos/${slug}`, { method: 'DELETE' });
      setFavorites((prev) => prev.filter((s) => s !== slug));
    } else {
      await apiRequest(`/api/cuenta/favoritos/${slug}`, { method: 'POST' });
      setFavorites((prev) => [...prev, slug]);
    }
    return { requiresAuth: false, favored: !isFav };
  };

  const saveGuide = async (guidePayload) => {
    if (!user) return { requiresAuth: true };
    const res = await apiRequest('/api/cuenta/guias', {
      method: 'POST',
      body: guidePayload,
    });
    setSavedGuides(res.savedGuides || []);
    return res;
  };

  const deleteGuide = async (guideId) => {
    if (!user) return;
    const res = await apiRequest(`/api/cuenta/guias/${guideId}`, {
      method: 'DELETE',
    });
    setSavedGuides(res.savedGuides || []);
    return res;
  };

  const markPlacesVisited = async ({ slug, placeNames, visitedDate, notes }) => {
    if (!user) return { requiresAuth: true };
    const res = await apiRequest('/api/cuenta/visitados', {
      method: 'POST',
      body: { slug, placeNames, visitedDate, notes },
    });
    setVisitedPlaces(res.visitedPlaces || []);
    return res;
  };

  const removeVisitedPlace = async (visitId) => {
    if (!user) return;
    const res = await apiRequest(`/api/cuenta/visitados/${visitId}`, {
      method: 'DELETE',
    });
    setVisitedPlaces(res.visitedPlaces || []);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        claims,
        favorites,
        savedGuides,
        visitedPlaces,
        loading,
        login,
        register,
        logout,
        toggleFavorite,
        saveGuide,
        deleteGuide,
        markPlacesVisited,
        removeVisitedPlace,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
