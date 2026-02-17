/**
 * RecipeCard - Display card for recipe grid/list views
 *
 * Shows recipe image, title, description, author, rating, likes, and difficulty.
 * Like and Save (favorite) buttons update optimistically for instant feedback.
 * Syncs state via window events (recipeUpdated, favoriteToggled) for cross-component updates.
 * actionOverlay prop allows injecting additional actions (edit/delete) for admin/my-recipes views.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, Star, Bookmark } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { storageApi as storage } from '../../lib/storageApiAdapter';
import { useToast, formatError } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { cn, normalizeCategories } from '../../lib/utils';

export function RecipeCard({ recipe, onFavoriteToggle, actionOverlay }) {
    const { user, canInteract, isGuest } = useAuth();
    const toast = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [optimisticLikeCount, setOptimisticLikeCount] = useState(null);
    const [displayRating, setDisplayRating] = useState(null);
    const [author, setAuthor] = useState(null);

    const recipeId = recipe._id || recipe.id;
    const categories = normalizeCategories(recipe.categories ?? recipe.category);
    const authorName = author ? author.username : `User ${recipe.authorId}`;
    const likeCount = optimisticLikeCount ?? (recipe.likedBy?.length || 0);

    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    const timeLabel = totalTime >= 60 ? `${Math.round(totalTime / 60)} hr` : `${totalTime} min`;

    // Load author and rating data
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [users, avg] = await Promise.all([
                    storage.getUsers(),
                    storage.getAverageRating(recipeId),
                ]);
                if (cancelled) return;
                setAuthor(users.find(u => (u._id || u.id) === recipe.authorId) || null);
                setDisplayRating(avg > 0 ? avg.toFixed(1) : null);
            } catch (err) { toast.error(formatError(err)); }
        })();
        return () => { cancelled = true; };
    }, [recipeId, recipe.authorId]);

    // Sync like/favorite state with API and window events
    useEffect(() => {
        const syncState = () => {
            if (!user) { setIsLiked(false); setIsFavorited(false); return; }
            const uid = user._id || user.id;
            setIsLiked(recipe.likedBy?.includes(uid) || false);
            setIsFavorited(user.favorites?.includes(recipeId) || false);
        };
        syncState();
        window.addEventListener('recipeUpdated', syncState);
        window.addEventListener('favoriteToggled', syncState);
        return () => {
            window.removeEventListener('recipeUpdated', syncState);
            window.removeEventListener('favoriteToggled', syncState);
        };
    }, [recipeId, user, recipe.likedBy]);

    const handleLikeClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !canInteract) return;
        try {
            const result = await storage.toggleLike(user._id || user.id, recipeId);
            setIsLiked(result.liked);
            setOptimisticLikeCount(result.likeCount ?? likeCount);
            if (onFavoriteToggle) onFavoriteToggle();
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleSaveClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !canInteract) return;
        try {
            const result = await storage.toggleFavorite(user._id || user.id, recipeId);
            setIsFavorited(result.favorited);
            if (onFavoriteToggle) onFavoriteToggle();
            window.dispatchEvent(new CustomEvent('favoriteToggled'));
        } catch (err) { toast.error(formatError(err)); }
    };

    return (
        <Link to={`/recipes/${recipeId}`} className="group block h-full">
            <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg border-warm-gray-20 hover:border-brand-accent hover:bg-brand-pale/50 hover-lift cursor-pointer">
                {/* Recipe Image with overlays */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-warm-gray-10">
                    <img
                        src={recipe.images?.[0] || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400"}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Like button overlay - top-right */}
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

                    {/* Timer badge - bottom-right */}
                    {totalTime > 0 && (
                        <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white">
                            <Clock className="h-3 w-3" />
                            {timeLabel}
                        </div>
                    )}

                    {/* Action overlay slot for edit/delete buttons (used in admin/my-recipes) */}
                    {actionOverlay}
                </div>

                {/* Recipe Info */}
                <div className="flex flex-col flex-1 p-3 gap-2">
                    {/* Category tags - max 3 displayed */}
                    {categories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {categories.slice(0, 3).map((cat) => (
                                <Badge key={cat} variant="outline" className="text-[9px] px-1.5 py-0.5 rounded-full capitalize">
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Title with save/favorite button */}
                    <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-charcoal line-clamp-1 group-hover:text-brand-accent flex-1">
                            {recipe.title}
                        </h3>
                        <button
                            onClick={handleSaveClick}
                            className={cn(
                                "p-0.5 rounded transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
                                canInteract ? 'hover:bg-warm-gray-10' : 'opacity-60 cursor-not-allowed'
                            )}
                            title={canInteract ? (isFavorited ? 'Unsave' : 'Save') : isGuest ? 'Login to save' : 'Pending accounts cannot save recipes'}
                            aria-label={isFavorited ? 'Unsave recipe' : 'Save recipe'}
                            aria-pressed={isFavorited}
                            aria-disabled={!canInteract}
                        >
                            <Bookmark className={cn("h-4 w-4", isFavorited ? "fill-brand text-brand" : "text-warm-gray-30")} />
                        </button>
                    </div>

                    <p className="text-xs leading-5 text-warm-gray-60 line-clamp-2">
                        {recipe.description}
                    </p>

                    {/* Rating and likes */}
                    <div className="flex items-center gap-2 text-xs text-warm-gray-60">
                        {displayRating && (
                            <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${displayRating} out of 5`}>
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-semibold text-charcoal">{displayRating}</span>
                            </div>
                        )}
                        <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                        </span>
                    </div>

                    {/* Author and difficulty */}
                    <div className="mt-auto flex items-center justify-between text-[11px] text-warm-gray-60">
                        <div className="flex items-center gap-1.5 truncate">
                            {author?.avatar ? (
                                <img src={author.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-warm-gray-10 text-[9px] font-bold text-warm-gray-60">
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
