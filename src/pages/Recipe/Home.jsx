import React, { useCallback, useEffect, useState } from 'react';
import { storage } from '../../lib/storage';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RecipeSuggestionModal } from '../../components/recipe/RecipeSuggestionModal';

export function Home() {
    const [recipes, setRecipes] = useState(() => {
        const allRecipes = storage.getRecipes();
        return allRecipes.filter(r => r.status === 'published');
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [randomSuggestion, setRandomSuggestion] = useState(null);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const navigate = useNavigate();

    const loadRecipes = useCallback(() => {
        const allRecipes = storage.getRecipes();
        setRecipes(allRecipes.filter(r => r.status === 'published'));
    }, []);

    useEffect(() => {
        // Listen for updates to refresh
        const handleRefresh = () => loadRecipes();
        window.addEventListener('favoriteToggled', handleRefresh);
        window.addEventListener('recipeUpdated', handleRefresh);
        return () => {
            window.removeEventListener('favoriteToggled', handleRefresh);
            window.removeEventListener('recipeUpdated', handleRefresh);
        };
    }, [loadRecipes]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleSurpriseMe = () => {
        const suggestion = storage.getRandomSuggestion();
        setRandomSuggestion(suggestion);
        setIsSuggestionModalOpen(true);
    };

    const handleTryAnother = () => {
        const suggestion = storage.getRandomSuggestion();
        setRandomSuggestion(suggestion);
    };

    return (
        <div className="space-y-8 animate-page-in">
            {/* Hero Section */}
            <section className="relative -mt-8 py-16 px-4 text-center bg-gradient-to-r from-brand to-[#137fec] text-white rounded-b-3xl mb-10 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1495521841625-f46248f59218?auto=format&fit=crop&q=80')] bg-cover bg-center" />
                <div className="relative z-10 max-w-2xl mx-auto space-y-5">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Share Your Culinary <span className="text-white/90">Masterpiece</span></h1>
                    <p className="text-base text-cool-gray-30">Join our community of home cooks and professional chefs.</p>

                    <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-cool-gray-60" />
                        <Input
                            placeholder="Search for recipes, ingredients, or chefs..."
                            className="pl-10 pr-10 h-11 text-cool-gray-90"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-2.5 p-1 rounded-md text-cool-gray-40 hover:text-cool-gray-90 hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cool-gray-90 focus-visible:ring-offset-1"
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

            {/* Featured/Feed Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-cool-gray-90">Fresh from the Kitchen</h2>
                    <Button variant="ghost" className="text-sm" onClick={() => navigate('/search')}>View All</Button>
                </div>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {recipes.length > 0 ? (
                        recipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} onFavoriteToggle={loadRecipes} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-cool-gray-60 py-10">No recipes published yet. Be the first!</p>
                    )}
                </div>
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
