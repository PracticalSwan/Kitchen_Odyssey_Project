import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, Star, Bookmark } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function RecipeCard({ recipe, onFavoriteToggle, actionOverlay }) {
    const { user, canInteract, isGuest } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);

    const reviews = storage.getReviews(recipe.id) || [];
    const averageRating = storage.getAverageRating(recipe.id);
    const displayRating = averageRating > 0 ? averageRating.toFixed(1) : null;

    const author = storage.getUsers().find(u => u.id === recipe.authorId);
    const authorName = author ? author.username : `User ${recipe.authorId}`;

    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    const timeLabel = totalTime >= 60 ? `${Math.round(totalTime / 60)} hr` : `${totalTime} min`;

    useEffect(() => {
        const syncState = () => {
            if (!user) { setIsLiked(false); setIsFavorited(false); return; }
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
        if (onFavoriteToggle) onFavoriteToggle();
        window.dispatchEvent(new CustomEvent('recipeUpdated'));
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
            <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg border-cool-gray-20 hover:border-brand-accent/30 hover-lift cursor-pointer">
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-cool-gray-10">
                    <img
                        src={recipe.images?.[0] || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400"}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Favorite overlay — top-right */}
                    <button
                        onClick={handleLikeClick}
                        className={cn(
                            "absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white",
                            canInteract ? 'hover:bg-black/50' : 'opacity-60 cursor-not-allowed'
                        )}
                        title={canInteract ? (isLiked ? 'Unlike' : 'Like') : isGuest ? 'Login to like' : 'Pending accounts cannot like recipes'}
                        aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
                        aria-pressed={isLiked}
                        aria-disabled={!canInteract}
                    >
                        <Heart className={cn("h-4 w-4", isLiked ? 'fill-red-500 text-red-500' : 'text-white')} />
                    </button>

                    {/* Timer badge — bottom-right */}
                    {totalTime > 0 && (
                        <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white">
                            <Clock className="h-3 w-3" />
                            {timeLabel}
                        </div>
                    )}

                    {actionOverlay}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-3 gap-2">
                    <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-cool-gray-90 line-clamp-1 group-hover:text-brand-accent flex-1">
                            {recipe.title}
                        </h3>
                        <button
                            onClick={handleSaveClick}
                            className={cn(
                                "p-0.5 rounded transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
                                canInteract ? 'hover:bg-cool-gray-10' : 'opacity-60 cursor-not-allowed'
                            )}
                            title={canInteract ? (isFavorited ? 'Unsave' : 'Save') : isGuest ? 'Login to save' : 'Pending accounts cannot save recipes'}
                            aria-label={isFavorited ? 'Unsave recipe' : 'Save recipe'}
                            aria-pressed={isFavorited}
                            aria-disabled={!canInteract}
                        >
                            <Bookmark className={cn("h-4 w-4", isFavorited ? "fill-brand text-brand" : "text-cool-gray-30")} />
                        </button>
                    </div>

                    {/* Rating */}
                    {displayRating && (
                        <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${displayRating} out of 5`}>
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-cool-gray-90">{displayRating}</span>
                        </div>
                    )}

                    {/* Author + difficulty */}
                    <div className="mt-auto flex items-center justify-between text-[11px] text-cool-gray-60">
                        <div className="flex items-center gap-1.5 truncate">
                            {author?.avatar ? (
                                <img src={author.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-cool-gray-10 text-[9px] font-bold text-cool-gray-60">
                                    {authorName.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <span className="truncate">{authorName}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full capitalize">
                            {recipe.difficulty}
                        </Badge>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
