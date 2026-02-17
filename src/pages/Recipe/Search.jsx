import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search as SearchIcon, X, Clock, SearchX } from 'lucide-react';
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES, normalizeCategories } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || 'All';
    const urlDifficulty = searchParams.get('difficulty') || 'All';
    const urlSort = searchParams.get('sort') || 'rating';

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

    const [searchHistory, setSearchHistory] = useState(() => {
        const userId = getCurrentUserId();
        return userId ? storage.getSearchHistory(userId).slice(0, 5) : [];
    });
    const [debouncedKeyword, setDebouncedKeyword] = useState(query);

    const hasMountedRef = useRef(false);
    const lastLoggedKeywordRef = useRef('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword);
        }, 1500);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        const nextFilters = {
            keyword: query,
            category: urlCategory === 'All' ? [] : urlCategory.split(',').filter(Boolean),
            difficulty: urlDifficulty,
            sort: urlSort
        };
        setTimeout(() => setFilters(nextFilters), 0);
    }, [query, urlCategory, urlDifficulty, urlSort]);

    useEffect(() => {
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
            setRecipes(storage.getRecipes().filter(r => r.status === 'published'));
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

        storage.addSearchHistory({ query: trimmedKeyword });
        lastLoggedKeywordRef.current = trimmedKeyword;

        setTimeout(() => {
            const userId = getCurrentUserId();
            if (userId) setSearchHistory(storage.getSearchHistory(userId).slice(0, 5));
        }, 0);
    }, [debouncedKeyword]);

    const filteredRecipes = useMemo(() => {
        let result = [...recipes];

        if (filters.keyword) {
            const lower = filters.keyword.toLowerCase();
            result = result.filter(r => r.title.toLowerCase().includes(lower));
        }

        if (Array.isArray(filters.category) && filters.category.length > 0) {
            result = result.filter(r => {
                const recipeCategories = normalizeCategories(r.categories ?? r.category);
                return filters.category.some(cat => recipeCategories.includes(cat));
            });
        }

        if (filters.difficulty !== 'All') {
            result = result.filter(r => r.difficulty === filters.difficulty);
        }

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
            const next = current.includes(category)
                ? current.filter(c => c !== category)
                : [...current, category];
            return { ...prev, category: next };
        });
    };

    const resetFilters = () => {
        setFilters(prev => ({ ...prev, category: [], difficulty: 'All', sort: 'rating' }));
    };

    const clearHistory = () => {
        const userId = getCurrentUserId();
        if (userId && storage.clearSearchHistory) storage.clearSearchHistory(userId);
        else if (storage.clearSearchHistory) storage.clearSearchHistory();
        setSearchHistory([]);
    };

    const hasActiveFilters = (filters.category?.length > 0) || filters.difficulty !== 'All';

    return (
        <div className="space-y-8 animate-page-in">
            {/* Header */}
            <section className="text-center space-y-2 pt-2">
                <h1 className="text-2xl font-bold text-cool-gray-90 sm:text-3xl">Find your next favorite meal</h1>
                <p className="text-cool-gray-60">Browse thousands of recipes by ingredient, dish, or chef.</p>
            </section>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto">
                <div className="relative">
                    <SearchIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-cool-gray-40" />
                    <Input
                        placeholder="Search recipes..."
                        className="pl-11 pr-10 h-12 text-base rounded-xl border-cool-gray-20 shadow-sm"
                        value={filters.keyword}
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    />
                    {filters.keyword && (
                        <button
                            onClick={() => handleFilterChange('keyword', '')}
                            className="absolute right-3.5 top-3.5 p-0.5 rounded text-cool-gray-40 hover:text-cool-gray-90 transition-colors"
                            aria-label="Clear keyword"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Search History */}
                {searchHistory.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="flex items-center text-xs font-medium text-cool-gray-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Recent:
                        </span>
                        {searchHistory.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilters({ keyword: item.query || '', category: [], difficulty: 'All', sort: 'rating' })}
                                className="px-3 py-1 bg-cool-gray-10 hover:bg-cool-gray-20 text-cool-gray-70 text-xs rounded-full transition-colors truncate max-w-[200px]"
                                title={`Search: ${item.query}`}
                            >
                                {item.query}
                            </button>
                        ))}
                        <button onClick={clearHistory} className="text-xs text-cool-gray-40 hover:text-brand ml-1">Clear</button>
                    </div>
                )}
            </div>

            {/* Filter Pills */}
            <div className="space-y-3">
                {/* Category pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-cool-gray-60 uppercase tracking-wide mr-1">Type</span>
                    <button
                        onClick={() => handleFilterChange('category', [])}
                        className={cn(
                            "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                            (!filters.category?.length) ? "bg-brand text-white border-brand" : "bg-white text-cool-gray-60 border-cool-gray-20 hover:border-brand hover:text-brand"
                        )}
                    >
                        All
                    </button>
                    {RECIPE_CATEGORIES.map(cat => {
                        const isSelected = filters.category?.includes(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                    isSelected ? "bg-brand text-white border-brand" : "bg-white text-cool-gray-60 border-cool-gray-20 hover:border-brand hover:text-brand"
                                )}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Difficulty pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-cool-gray-60 uppercase tracking-wide mr-1">Level</span>
                    <button
                        onClick={() => handleFilterChange('difficulty', 'All')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                            filters.difficulty === 'All' ? "bg-brand text-white border-brand" : "bg-white text-cool-gray-60 border-cool-gray-20 hover:border-brand hover:text-brand"
                        )}
                    >
                        All
                    </button>
                    {RECIPE_DIFFICULTIES.map(level => (
                        <button
                            key={level}
                            onClick={() => handleFilterChange('difficulty', filters.difficulty === level ? 'All' : level)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                filters.difficulty === level ? "bg-brand text-white border-brand" : "bg-white text-cool-gray-60 border-cool-gray-20 hover:border-brand hover:text-brand"
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                {/* Sort + result count */}
                <div className="flex items-center justify-between pt-1">
                    <p className="text-sm text-cool-gray-60">
                        Showing <span className="font-semibold text-cool-gray-90">{filteredRecipes.length}</span> {filteredRecipes.length === 1 ? 'result' : 'results'}
                    </p>
                    <div className="flex items-center gap-3">
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-cool-gray-50 text-xs">
                                Clear Filters
                            </Button>
                        )}
                        <select
                            className="appearance-none rounded-lg border border-cool-gray-20 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-cool-gray-70 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            value={filters.sort}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                            aria-label="Sort by"
                        >
                            <option value="rating">Most Popular</option>
                            <option value="newest">Newest First</option>
                            <option value="difficulty-asc">Difficulty: Low → High</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.map(r => <RecipeCard key={r.id} recipe={r} />)
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4 text-center">
                        <SearchX className="h-12 w-12 text-cool-gray-30" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-cool-gray-90">No recipes found</h3>
                            <p className="text-sm text-cool-gray-60 max-w-md">
                                {filters.keyword
                                    ? `We couldn't find any recipes matching "${filters.keyword}". Try adjusting your filters or search terms.`
                                    : 'Try adjusting your filters to see results.'}
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={resetFilters}>Clear Filters</Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
