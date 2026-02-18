// Home - Recipe discovery page with search, filters, sorting, and Surprise Me
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { storageApi as storage } from '../../lib/storageApiAdapter';
import { useToast, formatError } from '../../components/ui/Toast';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RecipeGridSkeleton } from '../../components/ui/LoadingSkeleton';
import { Search, X, Sparkles, Flame, Clock, Leaf, Cake, Sunrise, ThumbsUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RecipeSuggestionModal } from '../../components/recipe/RecipeSuggestionModal';
import { cn, normalizeCategories } from '../../lib/utils';

const FILTER_CHIPS = [
    { key: 'trending', label: 'Trending', icon: Flame },
    { key: 'quick', label: 'Under 30min', icon: Clock },
    { key: 'vegetarian', label: 'Vegetarian', icon: Leaf },
    { key: 'desserts', label: 'Desserts', icon: Cake },
    { key: 'breakfast', label: 'Breakfast', icon: Sunrise },
    { key: 'easy', label: 'Easy', icon: ThumbsUp },
];

const SORT_OPTIONS = [
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'A–Z' },
];

const PAGE_SIZE = 30;

export function Home() {
    const toast = useToast();
    const [allPublished, setAllPublished] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);
    const [sortBy, setSortBy] = useState('trending');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [randomSuggestion, setRandomSuggestion] = useState(null);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const [usersMap, setUsersMap] = useState(null);
    const [ratingsMap, setRatingsMap] = useState(null);
    const navigate = useNavigate();

    const loadRecipes = useCallback(async () => {
        try {
            setIsLoading(true);
            const [recipes, users] = await Promise.all([
                storage.getRecipes(),
                storage.getUsers(),
            ]);
            const published = recipes.filter(r => r.status === 'published');
            setAllPublished(published);

            // Build users lookup map
            const uMap = new Map();
            users.forEach(u => uMap.set(u._id || u.id, u));
            setUsersMap(uMap);

            // Batch-fetch ratings for all published recipes
            const ratingEntries = await Promise.all(
                published.map(async (r) => {
                    const rid = r._id || r.id;
                    try {
                        const avg = await storage.getAverageRating(rid);
                        return [rid, avg];
                    } catch { return [rid, 0]; }
                })
            );
            setRatingsMap(new Map(ratingEntries));
        } catch (err) {
            toast.error(formatError(err));
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Load recipes on mount
    useEffect(() => { loadRecipes(); }, [loadRecipes]);

    // Sync recipe list when recipes are updated elsewhere
    useEffect(() => {
        const handleRefresh = () => loadRecipes();
        window.addEventListener('favoriteToggled', handleRefresh);
        window.addEventListener('recipeUpdated', handleRefresh);
        return () => {
            window.removeEventListener('favoriteToggled', handleRefresh);
            window.removeEventListener('recipeUpdated', handleRefresh);
        };
    }, [loadRecipes]);

    // Filter and sort recipes based on active filter and sort option
    // Note: sorting uses data available on recipe objects (likedBy, viewedBy, createdAt)
    // since getAverageRating/getReviews are now async API calls
    const filteredRecipes = useMemo(() => {
        let list = [...allPublished];

        if (activeFilter) {
            switch (activeFilter) {
                case 'quick':
                    list = list.filter(r => {
                        const prep = Number(r.prepTime) || 0;
                        const cook = Number(r.cookTime) || 0;
                        return prep + cook <= 30;
                    });
                    break;
                case 'vegetarian':
                    list = list.filter(r =>
                        normalizeCategories(r.categories ?? r.category)
                            .some(c => c.toLowerCase().includes('vegetarian') || c.toLowerCase().includes('vegan'))
                    );
                    break;
                case 'desserts':
                    list = list.filter(r =>
                        normalizeCategories(r.categories ?? r.category)
                            .some(c => c.toLowerCase().includes('dessert') || c.toLowerCase().includes('baking'))
                    );
                    break;
                case 'breakfast':
                    list = list.filter(r =>
                        normalizeCategories(r.categories ?? r.category)
                            .some(c => c.toLowerCase().includes('breakfast'))
                    );
                    break;
                case 'easy':
                    list = list.filter(r => r.difficulty?.toLowerCase() === 'easy');
                    break;
                // trending = no extra filter
            }
        }

        // Sort using recipe-level data (likedBy, viewedBy, createdAt)
        switch (sortBy) {
            case 'newest':
                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'rating':
                list.sort((a, b) => {
                    const likeDiff = (b.likedBy?.length || 0) - (a.likedBy?.length || 0);
                    if (likeDiff !== 0) return likeDiff;
                    return (b.viewedBy?.length || 0) - (a.viewedBy?.length || 0);
                });
                break;
            case 'title':
                list.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default: // trending - most views, then likes
                list.sort((a, b) => {
                    const viewDiff = (b.viewedBy?.length || 0) - (a.viewedBy?.length || 0);
                    if (viewDiff !== 0) return viewDiff;
                    const likeDiff = (b.likedBy?.length || 0) - (a.likedBy?.length || 0);
                    if (likeDiff !== 0) return likeDiff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
        }

        return list;
    }, [allPublished, activeFilter, sortBy]);

    const visibleRecipes = filteredRecipes.slice(0, visibleCount);
    const hasMore = filteredRecipes.length > PAGE_SIZE && visibleCount < filteredRecipes.length;

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleSurpriseMe = async () => {
        try {
            const suggestion = await storage.getRandomSuggestion();
            setRandomSuggestion(suggestion);
            setIsSuggestionModalOpen(true);
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleTryAnother = async () => {
        try {
            const suggestion = await storage.getRandomSuggestion();
            setRandomSuggestion(suggestion);
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleFilterClick = (key) => {
        setActiveFilter(prev => (prev === key ? null : key));
        setVisibleCount(PAGE_SIZE);
    };

    return (
        <div className="space-y-8 animate-page-in">
            {/* Hero Section with search and surprise me */}
            <section className="relative -mt-8 py-16 px-4 text-center bg-gradient-to-br from-brand via-brand to-brand-accent text-white rounded-b-3xl mb-4 overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[url('https://images.unsplash.com/photo-1495521841625-f46248f59218?auto=format&fit=crop&q=80')] bg-cover bg-center" />
                <div className="relative z-10 max-w-2xl mx-auto space-y-5">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Fresh from the Kitchen</h1>
                    <p className="text-base text-white/75">Discover thousands of recipes from home cooks worldwide.</p>

                    <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-warm-gray-60" />
                        <Input
                            placeholder="Search for recipes, ingredients, or chefs..."
                            className="pl-10 pr-10 h-11 text-charcoal"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-2.5 p-1 rounded-md text-warm-gray-40 hover:text-charcoal hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-1"
                                aria-label="Clear search"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </form>

                    <Button
                        variant="outline"
                        className="gap-2 bg-white/10 border-white/40 text-white hover:bg-white/20"
                        onClick={handleSurpriseMe}
                    >
                        <Sparkles className="h-4 w-4" />
                        Surprise Me!
                    </Button>
                </div>
            </section>

            {/* Filters + Sort Bar */}
            <section className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {FILTER_CHIPS.map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => handleFilterClick(key)}
                            className={cn(
                                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors border",
                                activeFilter === key
                                    ? "bg-brand text-white border-brand"
                                    : "bg-warm-white text-warm-gray-60 border-warm-gray-20 hover:border-brand hover:text-brand"
                            )}
                        >
                            {React.createElement(icon, { className: 'h-4 w-4' })}
                            {label}
                        </button>
                    ))}
                </div>

                <div className="relative shrink-0">
                    <label htmlFor="sort-select" className="sr-only">Sort recipes</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none rounded-lg border border-warm-gray-20 bg-white pl-3 pr-8 py-2 text-sm font-medium text-warm-gray-70 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>Sort by: {opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray-40" />
                </div>
            </section>

            {/* Recipe Grid */}
            <section className="space-y-6">
                {isLoading ? (
                    <RecipeGridSkeleton count={10} />
                ) : (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {visibleRecipes.length > 0 ? (
                            visibleRecipes.map(recipe => (
                                <RecipeCard key={recipe._id || recipe.id} recipe={recipe} onFavoriteToggle={loadRecipes} usersMap={usersMap} ratingsMap={ratingsMap} />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-warm-gray-60 py-10">
                                {activeFilter ? 'No recipes match this filter.' : 'No recipes published yet. Be the first!'}
                            </p>
                        )}
                    </div>
                )}

                {/* Load More pagination */}
                {hasMore && (
                    <div className="text-center pt-2">
                        <Button
                            variant="outline"
                            className="px-8"
                            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                        >
                            Load More Recipes
                        </Button>
                    </div>
                )}
            </section>

            <RecipeSuggestionModal
                isOpen={isSuggestionModalOpen}
                onClose={() => setIsSuggestionModalOpen(false)}
                suggestion={randomSuggestion}
                onTryAnother={handleTryAnother}
            />
        </div>
    );
}
