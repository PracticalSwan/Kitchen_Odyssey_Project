import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES, normalizeCategories } from '../../lib/utils';

export function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || 'All';
    const urlDifficulty = searchParams.get('difficulty') || 'All';
    const urlSort = searchParams.get('sort') || 'rating';

    // Helper to get current user ID (including guest)
    const getCurrentUserId = () => {
        const user = storage.getCurrentUser();
        return user?.id || (storage.getOrCreateGuestId ? `guest:${storage.getOrCreateGuestId()}` : null);
    };

    const [recipes, setRecipes] = useState(() => storage.getRecipes().filter(r => r.status === 'published'));

    const [filters, setFilters] = useState({
        keyword: query,
        category: urlCategory === 'All' ? [] : urlCategory.split(','),
        difficulty: urlDifficulty,
        sort: urlSort
    });
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    
    const [searchHistory, setSearchHistory] = useState(() => {
        const userId = getCurrentUserId();
        return userId ? storage.getSearchHistory(userId).slice(0, 5) : [];
    });
    const [debouncedKeyword, setDebouncedKeyword] = useState(query);

    const hasMountedRef = useRef(false);
    const lastLoggedKeywordRef = useRef('');

    // Debounce keyword input so history is only saved after user finishes typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword);
        }, 1500);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        // Sync filters with URL params (back/forward/refresh)
        const nextFilters = {
            keyword: query,
            category: urlCategory === 'All' ? [] : urlCategory.split(',').filter(Boolean),
            difficulty: urlDifficulty,
            sort: urlSort
        };

        // Update filters from URL when URL params change
        // This effect intentionally only depends on URL-derived values
        // to avoid over-triggering when local `filters` changes.
        setTimeout(() => setFilters(nextFilters), 0);
    }, [query, urlCategory, urlDifficulty, urlSort]);

    useEffect(() => {
        // Persist filters to URL so back/refresh restores state
        const nextParams = {};
        if (filters.keyword) nextParams.q = filters.keyword;
        if (Array.isArray(filters.category) && filters.category.length > 0) {
            nextParams.category = filters.category.join(',');
        }
        if (filters.difficulty !== 'All') nextParams.difficulty = filters.difficulty;
        if (filters.sort !== 'rating') nextParams.sort = filters.sort;

        const current = searchParams.toString();
        const next = new URLSearchParams(nextParams).toString();
        if (current !== next) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [filters.keyword, filters.category, filters.difficulty, filters.sort, searchParams, setSearchParams]);

    useEffect(() => {
        const refreshRecipes = () => {
            const all = storage.getRecipes().filter(r => r.status === 'published');
            setRecipes(all);
        };
        window.addEventListener('recipeUpdated', refreshRecipes);
        window.addEventListener('favoriteToggled', refreshRecipes);
        return () => {
            window.removeEventListener('recipeUpdated', refreshRecipes);
            window.removeEventListener('favoriteToggled', refreshRecipes);
        };
    }, []);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        const trimmedKeyword = (debouncedKeyword || '').trim();
        if (!trimmedKeyword) return;
        if (lastLoggedKeywordRef.current === trimmedKeyword) return;

        storage.addSearchHistory({
            query: trimmedKeyword
        });
        lastLoggedKeywordRef.current = trimmedKeyword;
        
        // Refresh local history state
        setTimeout(() => {
            const userId = getCurrentUserId();
            if (userId) {
                setSearchHistory(storage.getSearchHistory(userId).slice(0, 5));
            }
        }, 0);
    }, [debouncedKeyword]);

    const filteredRecipes = useMemo(() => {
        let result = [...recipes];

        // Keyword (title only)
        if (filters.keyword) {
            const lower = filters.keyword.toLowerCase();
            result = result.filter(r => r.title.toLowerCase().includes(lower));
        }

        // Category - match recipes that have ANY of the selected categories
        if (Array.isArray(filters.category) && filters.category.length > 0) {
            result = result.filter(r => {
                const recipeCategories = normalizeCategories(r.categories ?? r.category);
                return filters.category.some(cat => recipeCategories.includes(cat));
            });
        }

        // Difficulty
        if (filters.difficulty !== 'All') {
            result = result.filter(r => r.difficulty === filters.difficulty);
        }

        // Sort
        result.sort((a, b) => {
            if (filters.sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (filters.sort === 'rating') return storage.getLikeCount(b.id) - storage.getLikeCount(a.id);
            if (filters.sort === 'difficulty-asc') return ['Easy', 'Medium', 'Hard'].indexOf(a.difficulty) - ['Easy', 'Medium', 'Hard'].indexOf(b.difficulty);
            return 0;
        });

        return result;
    }, [recipes, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleCategory = (category) => {
        setFilters(prev => {
            const current = Array.isArray(prev.category) ? prev.category : [];
            const exists = current.includes(category);
            const next = exists
                ? current.filter(c => c !== category)
                : [...current, category];
            return { ...prev, category: next };
        });
    };

    const resetFilters = () => {
        setFilters(prev => ({
            ...prev,
            category: [],
            difficulty: 'All',
            sort: 'rating'
        }));
        setShowCategoryDropdown(false);
    };

    const clearHistory = () => {
        const userId = getCurrentUserId();
        if (userId && storage.clearSearchHistory) {
            storage.clearSearchHistory(userId);
        } else if (storage.clearSearchHistory) {
            // fallback: clear for current guest
            storage.clearSearchHistory();
        }
        setSearchHistory([]);
    };

    return (
        <div className="space-y-6 animate-page-in">
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-cool-gray-20 shadow-sm">
                <div className="relative group">
                    <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-cool-gray-60" />
                    <Input
                        placeholder="Search recipes..."
                        className="pl-10 pr-10 text-lg py-6"
                        value={filters.keyword}
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    />
                    {filters.keyword && (
                        <button
                            onClick={() => handleFilterChange('keyword', '')}
                            className="absolute right-3 top-3 p-1 rounded-md text-cool-gray-40 hover:text-cool-gray-90 hover:bg-cool-gray-10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cool-gray-90 focus-visible:ring-offset-1"
                            aria-label="Clear keyword"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Search History UI */}
                {searchHistory.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                        <span className="flex items-center text-xs font-medium text-cool-gray-50 mr-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Recent:
                        </span>
                        {searchHistory.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setFilters({
                                        keyword: item.query || '',
                                        category: [],
                                        difficulty: 'All',
                                        sort: 'rating'
                                    });
                                }}
                                className="px-3 py-1 bg-cool-gray-10 hover:bg-cool-gray-20 text-cool-gray-70 text-xs rounded-full transition-colors truncate max-w-[200px] outline-none focus-visible:ring-2 focus-visible:ring-cool-gray-90 focus-visible:ring-offset-1"
                                title={item.query ? `Search: ${item.query}` : 'Search'}
                            >
                                {item.query}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                    {/* Multi-select Category Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            className="h-10 rounded-md border border-cool-gray-30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cool-gray-90 flex items-center gap-2 min-w-[160px]"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            aria-label="Filter by category"
                        >
                            <span className="flex-1 text-left">
                                {Array.isArray(filters.category) && filters.category.length > 0
                                    ? `${filters.category.length} ${filters.category.length === 1 ? 'Category' : 'Categories'}`
                                    : 'All Categories'}
                            </span>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showCategoryDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowCategoryDropdown(false)}
                                />
                                <div className="absolute z-20 mt-1 w-56 rounded-md border border-cool-gray-30 bg-white shadow-lg max-h-64 overflow-auto">
                                    <div className="p-2 space-y-1">
                                        {RECIPE_CATEGORIES.map(category => {
                                            const isSelected = Array.isArray(filters.category) && filters.category.includes(category);
                                            return (
                                                <label
                                                    key={category}
                                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-cool-gray-10 cursor-pointer text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded"
                                                        checked={isSelected}
                                                        onChange={() => toggleCategory(category)}
                                                    />
                                                    <span>{category}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <select
                        className="h-10 rounded-md border border-cool-gray-30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cool-gray-90"
                        value={filters.difficulty}
                        onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                        aria-label="Filter by difficulty"
                    >
                        <option value="All">All Difficulties</option>
                        {RECIPE_DIFFICULTIES.map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>


                    <select
                        className="h-10 rounded-md border border-cool-gray-30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cool-gray-90"
                        value={filters.sort}
                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                        aria-label="Sort by"
                    >
                        <option value="rating">Most Popular</option>
                        <option value="newest">Newest First</option>
                        <option value="difficulty-asc">Difficulty (Low to High)</option>
                    </select>

                    <Button variant="ghost" onClick={resetFilters} className="text-cool-gray-60 text-[14px]">
                        Reset filters
                    </Button>

                    <Button variant="ghost" onClick={clearHistory} className="ml-auto text-cool-gray-60 text-[14px]">
                        <X className="mr-2 h-5 w-5" /> Clear History
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-cool-gray-90">Results ({filteredRecipes.length})</h2>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredRecipes.length > 0 ? (
                        filteredRecipes.map(r => <RecipeCard key={r.id} recipe={r} />)
                    ) : (
                        <div className="col-span-full py-12 text-center text-cool-gray-60">
                            No recipes found. Try adjusting your filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
