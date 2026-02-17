import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Heart, Eye, Bookmark } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { cn, normalizeCategories } from '../../lib/utils';

export function RecipeCard({ recipe, onFavoriteToggle, actionOverlay }) {
    const { user, canInteract, isGuest } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [likeCount, setLikeCount] = useState(recipe.likedBy?.length || 0);
    const [viewCount, setViewCount] = useState(recipe.viewedBy?.length || 0);
    
    // Calculate rating
    const reviews = storage.getReviews(recipe.id) || [];
    const averageRating = Math.round(storage.getAverageRating(recipe.id));

    const categories = normalizeCategories(recipe.categories ?? recipe.category);

    // Fetch author name from storage
    const author = storage.getUsers().find(u => u.id === recipe.authorId);
    const authorName = author ? author.username : `User ${recipe.authorId}`;

    useEffect(() => {
        const syncState = () => {
            const latestRecipe = storage.getRecipeById(recipe.id);
            setLikeCount(latestRecipe?.likedBy?.length || 0);
            setViewCount(latestRecipe?.viewedBy?.length || 0);

            if (!user) {
                setIsLiked(false);
                setIsFavorited(false);
                return;
            }

            setIsLiked(storage.hasUserLiked(user.id, recipe.id));
            setIsFavorited(storage.hasUserFavorited(user.id, recipe.id));
        };

        syncState();
        window.addEventListener('recipeUpdated', syncState);
        window.addEventListener('favoriteToggled', syncState);
        return () => {
            window.removeEventListener('recipeUpdated', syncState);
            window.removeEventListener('favoriteToggled', syncState);
        };
    }, [recipe.id, user]);

    const handleLikeClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !canInteract) return;
        const result = storage.toggleLike(user.id, recipe.id);
        setIsLiked(result.liked);
        setLikeCount(result.count);
        if (onFavoriteToggle) onFavoriteToggle();
        window.dispatchEvent(new CustomEvent('recipeUpdated')); // Generic update event
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !canInteract) return;
        const result = storage.toggleFavorite(user.id, recipe.id);
        setIsFavorited(result);
        if (onFavoriteToggle) onFavoriteToggle();
        window.dispatchEvent(new CustomEvent('favoriteToggled'));
    };

    return (
        <Link to={`/recipes/${recipe.id}`} className="group block h-full">
            <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg border-cool-gray-20 hover:border-[#137fec]/30 hover-lift cursor-pointer">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-cool-gray-10">
                    <img
                        src={recipe.images?.[0] || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400"}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-1.5 right-1.5">
                        <Badge variant="default" className="bg-white/90 backdrop-blur-sm text-cool-gray-90 shadow-sm text-[10px] px-1.5 py-0.5">
                            {recipe.difficulty}
                        </Badge>
                    </div>
                    {/* Like Heart Overlay */}
                    <button
                        onClick={handleLikeClick}
                        className={`absolute top-1.5 left-1.5 p-1.5 rounded-md bg-white/80 backdrop-blur-sm shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#137fec] focus-visible:ring-offset-1 ${canInteract ? 'hover:bg-white' : 'opacity-60 cursor-not-allowed'}`}
                        title={canInteract ? (isLiked ? 'Unlike' : 'Like') : isGuest ? 'Login to like' : 'Pending accounts cannot like recipes'}
                        aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
                        aria-pressed={isLiked}
                        aria-disabled={!canInteract}
                    >
                        <Heart
                            className={`h-3.5 w-3.5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-cool-gray-60 hover:text-red-400'}`}
                        />
                    </button>
                    
                    {/* External Actions Overlay */}
                    {actionOverlay}
                </div>

                <CardContent className="p-2.5 flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1 flex-wrap">
                            {categories.slice(0, 2).map((category) => (
                                <Badge key={category} variant="outline" className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                    {category}
                                </Badge>
                            ))}
                            {categories.length > 2 && (
                                <Badge variant="outline" className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                    +{categories.length - 2}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-0.5 text-[10px] text-cool-gray-60">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{recipe.prepTime + recipe.cookTime}m</span>
                        </div>
                    </div>

                    <div className="mb-0.5 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-cool-gray-90 line-clamp-1 group-hover:text-black flex-1">
                            {recipe.title}
                        </h3>
                        <button
                            onClick={handleSaveClick}
                            className={`p-1 rounded-md transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-cool-gray-90 focus-visible:ring-offset-1 ${canInteract ? 'hover:bg-cool-gray-10' : 'opacity-60 cursor-not-allowed'}`}
                            title={canInteract ? (isFavorited ? 'Unsave' : 'Save') : isGuest ? 'Login to save' : 'Pending accounts cannot save recipes'}
                            aria-label={isFavorited ? 'Unsave recipe' : 'Save recipe'}
                            aria-pressed={isFavorited}
                            aria-disabled={!canInteract}
                        >
                            <Bookmark className={cn("h-4 w-4", isFavorited ? "fill-cool-gray-90 text-cool-gray-90" : "text-cool-gray-30")} />
                        </button>
                    </div>

                    {/* Rating Stars - Grey if no reviews */}
                    <div
                        className="flex items-center gap-0.5 mb-1.5"
                        role="img"
                        aria-label={`Rating: ${averageRating} out of 5 stars`}
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                                key={star} 
                                aria-hidden="true"
                                className={`text-[10px] ${averageRating >= star ? 'text-yellow-400' : 'text-cool-gray-30'}`}
                            >
                                ★
                            </span>
                        ))}
                        <span className="text-[10px] text-cool-gray-60 ml-1" aria-label={`${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`}>({reviews.length})</span>
                    </div>

                    <p className="text-[11px] text-cool-gray-60 line-clamp-2 mb-1.5 h-8">
                        {recipe.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-cool-gray-60">
                        <User className="h-2.5 w-2.5" />
                        <span
                            className="truncate hover:text-cool-gray-90 hover:underline cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.hash = `/users/${recipe.authorId}`;
                            }}
                        >
                            {authorName}
                        </span>
                    </div>
                </CardContent>

                <CardFooter className="px-2.5 pb-2.5 pt-0 flex items-center justify-between text-[10px] text-cool-gray-60">
                    <div className="inline-flex items-center gap-1 leading-none">
                        <Eye className="h-3 w-2.5" />
                        <span className="leading-none">{viewCount}</span>
                    </div>
                    <div className="inline-flex items-center gap-0.5 leading-none">
                        <Heart className="h-3 w-2.5" />
                        <span className="leading-none">{likeCount}</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
