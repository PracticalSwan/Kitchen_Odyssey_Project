/**
 * RecipeDetail - Individual recipe view page
 *
 * Shows full recipe details with ingredients (checkable), instructions,
 * reviews, and action buttons (like, favorite, share, edit, delete).
 * Access control: published recipes visible to all; pending/rejected only to author/admin.
 * Reviews: one per user, rating (1-5 stars), delete own review option.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storageApi as storage } from '../../lib/storageApiAdapter';
import { useToast, formatError } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Heart, Bookmark, Trash2, Edit, Check, Share2, Star, Clock } from 'lucide-react';
import { cn, normalizeCategories, formatCount } from '../../lib/utils';

export function RecipeDetail() {
    const { id } = useParams();                    // Recipe ID from URL
    const navigate = useNavigate();
    const { user, canInteract, isPending, isSuspended, isAdmin, isGuest } = useAuth();
    const toast = useToast();

    // Recipe state
    const [recipe, setRecipe] = useState(null);
    const [author, setAuthor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);  // Store users for review enrichment

    // Helper function to enrich reviews with user data
    const enrichReviews = (reviewsToEnrich) => {
        return reviewsToEnrich.map(review => {
            if (review.username && review.avatar) return review; // Already has user data
            const reviewUser = users.find(u => (u._id || u.id) === review.userId);
            if (!reviewUser) {
                // User not found - add fallback username
                return {
                    ...review,
                    username: 'Unknown User',
                    avatar: null,
                };
            }
            return {
                ...review,
                username: reviewUser.username,
                avatar: reviewUser.avatar || reviewUser.avatarUrl || null,
            };
        });
    };

    // Form state for review submission
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);

    // Debug: Log canInteract state
    useEffect(() => {
        console.log('RecipeDetail Debug:', {
            user: user ? { id: user._id || user.id, username: user.username, role: user.role, status: user.status } : null,
            canInteract,
            isGuest,
            isAdmin,
            isPending,
            isSuspended
        });
    }, [user, canInteract, isGuest, isAdmin, isPending, isSuspended]);

    // Interaction state
    const [isLiked, setIsLiked] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // UI state
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);  // Review delete confirmation
    const [deleteReviewId, setDeleteReviewId] = useState(null);            // Review ID to delete
    const [checkedIngredients, setCheckedIngredients] = useState({}); // Cooking checklist state
    const [showAllReviews, setShowAllReviews] = useState(false);     // Expand reviews toggle
    const [shareCopied, setShareCopied] = useState(false);             // Copy link feedback

    const toggleIngredient = (index) => {
        setCheckedIngredients(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Load recipe data with access control check
    useEffect(() => {
        let cancelled = false;

        const loadRecipe = async () => {
            try {
                const found = await storage.getRecipeById(id);
                if (cancelled) return;

                const currentUserId = user?._id || user?.id;
                const isOwnerViewing = Boolean(user && found && currentUserId === found.authorId);

                if (!found) { navigate('/'); return; }
                if (found.status !== 'published' && !isAdmin && !isOwnerViewing) { navigate('/'); return; }

                const [fetchedUsers, recipeReviews] = await Promise.all([
                    storage.getUsers().catch(() => []),
                    storage.getReviews(id).catch(() => []),
                ]);
                if (cancelled) return;

                const users = fetchedUsers;

                // Store users for enrichment after updates
                setUsers(users);

                // Enrich reviews with user data (username, avatar) for proper display
                const enrichedReviews = recipeReviews.map(review => {
                    if (review.username && review.avatar) return review; // Already has user data
                    const reviewUser = users.find(u => (u._id || u.id) === review.userId);
                    if (!reviewUser) {
                        // User not found - add fallback username
                        return {
                            ...review,
                            username: 'Unknown User',
                            avatar: null,
                        };
                    }
                    return {
                        ...review,
                        username: reviewUser.username,
                        avatar: reviewUser.avatar || reviewUser.avatarUrl || null,
                    };
                });

                setRecipe(found);
                setLikeCount(found.likedBy?.length || 0);
                setReviews(enrichedReviews);
                setAuthor(users.find(u => (u._id || u.id) === found.authorId));

                if (user) {
                    setIsLiked(found.likedBy?.includes(currentUserId) || false);
                    setIsFavorited(user.favorites?.includes(found._id || found.id) || false);
                }

                // Record view count for analytics
                if (user) {
                    storage.recordView({ viewerId: currentUserId, recipeId: id, viewerType: 'user' });
                } else {
                    const guestId = storage.getOrCreateGuestId();
                    storage.recordView({ viewerId: guestId, recipeId: id, viewerType: 'guest' });
                }
            } catch (err) {
                toast.error(formatError(err));
                if (!cancelled) navigate('/');
            }
        };

        loadRecipe();
        return () => { cancelled = true; };
    }, [id, navigate, user, isAdmin]);

    // Action handlers
    const handleToggleLike = async () => {
        if (!user || !canInteract) return;
        try {
            const result = await storage.toggleLike(user._id || user.id, id);
            setIsLiked(result.liked);
            setLikeCount(result.likeCount ?? likeCount);
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleToggleFavorite = async () => {
        if (!user || !canInteract) return;
        try {
            const result = await storage.toggleFavorite(user._id || user.id, id);
            setIsFavorited(result.favorited);
            window.dispatchEvent(new CustomEvent('favoriteToggled'));
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!canInteract || !newComment.trim()) return;
        try {
            const currentUserId = user._id || user.id;
            await storage.addReview({
                recipeId: id, userId: currentUserId, username: user.username,
                avatar: user.avatar, rating, comment: newComment
            });
            const updatedReviews = await storage.getReviews(id);
            setReviews(enrichReviews(updatedReviews));
            setNewComment('');
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleDeleteReview = (reviewId) => setDeleteReviewId(reviewId);

    const confirmDeleteReview = async () => {
        if (!deleteReviewId) return;
        try {
            await storage.deleteReview(deleteReviewId);
            const updatedReviews = await storage.getReviews(id);
            setReviews(enrichReviews(updatedReviews));
            setDeleteReviewId(null);
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleEditRecipe = () => navigate(`/recipes/edit/${id}`);

    const handleDeleteRecipe = () => setIsDeleteConfirmOpen(true);

    const confirmDeleteRecipe = async () => {
        try {
            await storage.deleteRecipe(id);
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
            setIsDeleteConfirmOpen(false);
            navigate('/profile?tab=recipes');
        } catch (err) { toast.error(formatError(err)); }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShareCopied(true);
            toast.success('Link copied to clipboard!');
            window.setTimeout(() => setShareCopied(false), 1500);
        } catch {
            toast.error('Failed to copy link');
            setShareCopied(false);
        }
    };

    const isOwner = user && recipe?.authorId === (user._id || user.id);
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
    const totalTime = recipe ? (recipe.prepTime || 0) + (recipe.cookTime || 0) : 0;

    if (!recipe) return <div className="p-10 text-center text-warm-gray-60">Loading...</div>;

    const categories = normalizeCategories(recipe.categories ?? recipe.category);
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

    return (
        <div className="mx-auto max-w-[960px] space-y-6 animate-page-in px-6">
            {/* Breadcrumbs */}
            <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
                <Link to="/" className="font-medium text-warm-gray-40 hover:text-brand-accent hover:underline transition-colors">Home</Link>
                <span className="text-warm-gray-30">/</span>
                <Link to="/search" className="font-medium text-warm-gray-40 hover:text-brand-accent hover:underline transition-colors">Recipes</Link>
                <span className="text-warm-gray-30">/</span>
                <span className="font-medium text-warm-gray-70">{categories[0] || 'Recipe'}</span>
            </nav>

            {/* Hero Image with Overlay */}
            <div className="relative overflow-hidden rounded-xl shadow-sm">
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/70 to-transparent"></div>
                <img
                    src={recipe.images?.[0]}
                    alt={recipe.title}
                    className="h-[400px] w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 z-[2] w-full p-8">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{recipe.title}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                            {author ? (
                                <Link to={`/users/${author._id || author.id}`} className="flex items-center gap-1.5">
                                    {author.avatar ? (
                                        <img src={author.avatar} className="h-6 w-6 rounded-full border border-white/50 object-cover" alt="" />
                                    ) : (
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-warm-white/20 text-[10px] font-bold text-white">
                                            {author.username.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                    <span className="font-medium">By {author.username}</span>
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-warm-white/20 text-[10px] font-bold text-white">
                                        ?
                                    </span>
                                    <span className="font-medium">By Unknown</span>
                                </span>
                            )}
                            <span className="h-1 w-1 rounded-full bg-warm-white/60"></span>
                            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {totalTime} min</span>
                            {recipe.difficulty && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-warm-white/60"></span>
                                    <span className="capitalize">{recipe.difficulty}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Restriction notice */}
            {(isPending || isSuspended || isGuest) && (
                <div className={cn(
                    "rounded-lg border p-3 text-sm",
                    isSuspended ? "border-red-200 bg-red-50 text-red-600" : "border-warm-gray-20 bg-warm-gray-10 text-warm-gray-60"
                )}>
                    {isSuspended
                        ? "Your account is suspended. You can browse recipes, but you can't like, save, or submit reviews."
                        : isGuest
                            ? "You're browsing as a guest. Login or sign up to like, save, and review recipes."
                            : "Your account is pending approval. You can browse but cannot interact yet."}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Owner Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {isOwner && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleEditRecipe} className="h-9 gap-1.5">
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDeleteRecipe} className="h-9 gap-1.5 border-red-200 text-red-500 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        </>
                    )}
                </div>

                {/* Right: Interaction Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleToggleLike}
                        className={cn(
                            "flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-all",
                            isLiked
                                ? 'bg-brand-accent text-white'
                                : 'border border-warm-gray-20 bg-warm-white text-charcoal hover:bg-warm-gray-10',
                            !canInteract && 'cursor-not-allowed opacity-60'
                        )}
                        disabled={!canInteract}
                    >
                        <Heart className={cn('h-4 w-4', isLiked && 'fill-white')} />
                        {likeCount > 0 && <span>{formatCount(likeCount)}</span>} Like
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className={cn(
                            "flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-all",
                            isFavorited
                                ? 'bg-brand-accent text-white'
                                : 'border border-warm-gray-20 bg-warm-white text-charcoal hover:bg-warm-gray-10',
                            !canInteract && 'cursor-not-allowed opacity-60'
                        )}
                        disabled={!canInteract}
                    >
                        <Bookmark className={cn('h-4 w-4', isFavorited && 'fill-white')} />
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="flex h-9 items-center gap-2 rounded-lg border border-warm-gray-20 bg-warm-white px-4 text-sm font-medium text-charcoal transition-all hover:bg-warm-gray-10"
                    >
                        <Share2 className="h-4 w-4" />
                        {shareCopied && <span>Copied!</span>}
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
                {/* Left Column */}
                <div className="space-y-10">
                    {/* Description */}
                    <section>
                        <h3 className="mb-4 text-xl font-bold text-charcoal">Description</h3>
                        <p className="leading-relaxed text-warm-gray-60">{recipe.description}</p>
                    </section>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-warm-gray-60">Categories:</span>
                            {categories.map((cat) => (
                                <Badge key={cat} variant="outline" className="rounded-full text-xs capitalize">
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Instructions - Timeline */}
                    <section>
                        <h3 className="mb-6 text-2xl font-bold text-charcoal">Instructions</h3>
                        {(recipe.instructions || []).length > 0 ? (
                        <ol className="relative ml-3 space-y-8 border-l border-warm-gray-20 pl-8">
                            {recipe.instructions.map((step, i) => (
                                <li key={i} className="relative">
                                    <span className="absolute -left-[41px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white ring-4 ring-white">
                                        {i + 1}
                                    </span>
                                    <h4 className="mb-2 text-lg font-semibold text-charcoal">Step {i + 1}</h4>
                                    <p className="leading-relaxed text-warm-gray-60">{step}</p>
                                </li>
                            ))}
                        </ol>
                        ) : (
                            <p className="text-sm text-warm-gray-50">No instructions provided.</p>
                        )}
                    </section>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-8">
                    {/* Ingredients */}
                    <div className="rounded-xl border border-warm-gray-20 bg-warm-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-charcoal">Ingredients</h3>
                            <span className="text-sm text-warm-gray-40">{(recipe.ingredients || []).length} items</span>
                        </div>
                        <ul className="space-y-3">
                            {(recipe.ingredients || []).length > 0 ? (recipe.ingredients || []).map((ing, i) => (
                                <li key={i} role="checkbox" aria-checked={!!checkedIngredients[i]} tabIndex="0"
                                    className={cn(
                                        "flex items-start gap-3 rounded-lg bg-warm-white p-3 text-sm shadow-sm ring-1 ring-warm-gray-20 outline-none transition-colors hover:ring-brand-accent/30 cursor-pointer",
                                        checkedIngredients[i] && "opacity-50"
                                    )}
                                    onClick={() => toggleIngredient(i)}
                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleIngredient(i); } }}
                                >
                                    <span className={cn(
                                        "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded border transition-colors",
                                        checkedIngredients[i] ? 'border-brand-accent bg-brand-accent' : 'border-warm-gray-30'
                                    )}>
                                        {checkedIngredients[i] && <Check className="h-3 w-3 text-white" />}
                                    </span>
                                    <span className={cn("text-warm-gray-70", checkedIngredients[i] && 'line-through text-warm-gray-40')}>{ing.quantity} {ing.unit} {ing.name}</span>
                                </li>
                            )) : (
                                <li className="text-sm text-warm-gray-50 py-2">No ingredients listed.</li>
                            )}
                        </ul>
                        {Object.values(checkedIngredients).some(Boolean) && (
                            <button type="button" onClick={() => setCheckedIngredients({})}
                                className="mt-3 text-xs text-warm-gray-50 underline hover:text-charcoal">Reset checks</button>
                        )}
                    </div>

                </div>
            </div>


            {/* Reviews */}
            <div className="rounded-xl border border-warm-gray-20 bg-warm-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-charcoal">Reviews ({reviews.length})</h3>
                    <div className="flex items-center gap-1 text-sm font-semibold text-charcoal">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                    </div>
                </div>

                <form onSubmit={handleSubmitReview} className="mb-6 space-y-2">
                    <textarea
                        className="w-full rounded-lg border border-warm-gray-20 bg-warm-gray-10/50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                        placeholder="Write a review..."
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!canInteract}
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex gap-0.5" role="group" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" onClick={() => setRating(star)}
                                    className={`text-lg transition-colors ${rating >= star ? 'text-amber-400' : 'text-warm-gray-30 hover:text-amber-300'}`}
                                    disabled={!canInteract}
                                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                >&#9733;</button>
                            ))}
                        </div>
                        <Button type="submit" size="sm" disabled={!newComment.trim() || !canInteract}>Post</Button>
                    </div>
                </form>

                <div className="space-y-6">
                    {displayedReviews.map(review => (
                        <div key={review.id} className="border-b border-warm-gray-20 pb-6 last:border-0 last:pb-0">
                            <div className="mb-2 flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {review.avatar ? (
                                        <img src={review.avatar} className="h-8 w-8 rounded-full object-cover" alt="" />
                                    ) : (
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-warm-gray-10 text-[10px] font-bold text-warm-gray-60">
                                            {(review.username || '?').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                    <div>
                                        {review.username === 'Unknown User' ? (
                                            <span className="text-sm font-semibold text-warm-gray-50">{review.username}</span>
                                        ) : (
                                            <Link to={`/users/${review.userId}`} className="text-sm font-semibold text-charcoal hover:text-brand-accent transition-colors">{review.username}</Link>
                                        )}
                                        <div className="flex text-[12px]">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} className={review.rating >= star ? 'text-amber-400' : 'text-warm-gray-30'}>&#9733;</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-warm-gray-40">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    {user && (user._id || user.id) === review.userId && (
                                        <button type="button" onClick={() => handleDeleteReview(review._id || review.id)}
                                            className="text-warm-gray-40 hover:text-red-500 transition-colors" aria-label="Delete Review">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="ml-10 text-sm leading-relaxed text-warm-gray-60">{review.comment}</p>
                        </div>
                    ))}

                    {reviews.length === 0 && (
                        <p className="text-sm text-warm-gray-50 text-center py-4">No reviews yet. Be the first!</p>
                    )}

                    {reviews.length > 2 && (
                        <button type="button" onClick={() => setShowAllReviews(prev => !prev)}
                            className="w-full mt-2 py-2 text-sm font-medium text-brand-accent hover:underline">
                            {showAllReviews ? 'Show fewer reviews' : `View all ${reviews.length} reviews`}
                        </button>
                    )}
                </div>
            </div>

            <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Delete Recipe">
                <div className="space-y-4">
                    <p className="text-warm-gray-60">Are you sure you want to delete this recipe? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteRecipe}>Delete Recipe</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!deleteReviewId} onClose={() => setDeleteReviewId(null)} title="Delete Review">
                <div className="space-y-4">
                    <p className="text-warm-gray-60">Are you sure you want to delete your review? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteReviewId(null)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteReview}>Delete Review</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
