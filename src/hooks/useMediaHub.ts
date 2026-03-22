'use client';

import { useState, useCallback } from 'react';

interface UseMediaHubOptions<T> {
  searchFn: (query: string) => Promise<T[]>;
  genreFn: (genre: string) => Promise<T[]>;
}

/**
 * Standardizes the logic for Manga, Anime, and Donghua hub pages.
 * Separates API/State logic from the View.
 */
export function useMediaHub<T>({ searchFn, genreFn }: UseMediaHubOptions<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setSearching(true);
    setError(null);
    setActiveGenre(null);
    
    try {
      const data = await searchFn(query);
      setResults(data);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setSearching(false);
    }
  }, [query, searchFn]);

  const handleGenreClick = useCallback(async (genre: string) => {
    if (!genre) {
      setResults(null);
      setActiveGenre(null);
      return;
    }

    setSearching(true);
    setError(null);
    setActiveGenre(genre);
    setQuery('');
    
    try {
      const data = await genreFn(genre);
      setResults(data);
    } catch (err) {
      setError(`Failed to fetch genre: ${genre}`);
      console.error(err);
    } finally {
      setSearching(false);
    }
  }, [genreFn]);

  const clearResults = useCallback(() => {
    setResults(null);
    setQuery('');
    setActiveGenre(null);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    searching,
    error,
    activeGenre,
    handleSearch,
    handleGenreClick,
    clearResults
  };
}
