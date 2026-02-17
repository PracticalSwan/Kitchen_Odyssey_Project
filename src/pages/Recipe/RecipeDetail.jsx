import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Heart, Bookmark, Trash2, Edit, Check, Share2, Star, Clock } from 'lucide-react';
import { cn, normalizeCategories } from '../../lib/utils';

export function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, canInteract, isPending, isSuspended, isAdmin, isGuest } = useAuth();
    const [recipe, setRecipe] = useState(null);
    const [author, setAuthor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [isLiked, setIsLiked] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteReviewId, setDeleteReviewId] = useState(null);
    const [checkedIngredients, setCheckedIngredients] = useState({});
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const toggleIngredient = (index) => {
        setCheckedIngredients(prev => ({ ...prev, [index]: !prev[index] }));
    };

    useEffect(() => {
        const recipes = storage.getRecipes();
        const found = recipes.find(r => r.id === id);
        let frameId = null;

        if (!found) { navigate('/'); return; }
        if (found.status !== 'published' && !isAdmin) { navigate('/'); return; }

        const users = storage.getUsers();
        frameId = window.requestAnimationFrame(() => {
            setRecipe(found);
            setLikeCount(found.likedBy?.length || 0);
            setReviews(storage.getReviews(id));
            setAuthor(users.find(u => u.id === found.authorId));
            if (user) {
                setIsLiked(storage.hasUserLiked(user.id, id));
                setIsFavorited(storage.hasUserFavorited(user.id, id));
            }
        });

        if (user) {
            storage.recordView({ viewerId: user.id, recipeId: id, viewerType: 'user' });
        } else {
            const guestId = storage.getOrCreateGuestId();
            storage.recordView({ viewerId: guestId, recipeId: id, viewerType: 'guest' });
        }

        return () => {
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, [id, navigate, user, isAdmin]);

    const handleToggleLike = () => {
        if (!user || !canInteract) return;
        const result = storage.toggleLike(user.id, id);
        setIsLiked(result.liked);
        setLikeCount(result.count);
        window.dispatchEvent(new CustomEvent('recipeUpdated'));
    };

    const handleToggleFavorite = () => {
        if (!user || !canInteract) return;
        const nowFavorited = storage.toggleFavorite(user.id, id);
        setIsFavorited(nowFavorited);
        window.dispatchEvent(new CustomEvent('favoriteToggled'));
    };

    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (!canInteract || !newComment.trim()) return;
        storage.addReview({
            recipeId: id, userId: user.id, username: user.username,
            avatar: user.avatar, rating, comment: newComment
        });
        setReviews(storage.getReviews(id));
        setNewComment('');
    };

    const handleDeleteReview = (reviewId) => setDeleteReviewId(reviewId);

    const confirmDeleteReview = () => {
        if (!deleteReviewId) return;
        storage.deleteReview(deleteReviewId);
        setReviews(storage.getReviews(id));
        setDeleteReviewId(null);
    };

    const handleEditRecipe = () => navigate(`/recipes/edit/${id}`);

    const handleDeleteRecipe = () => setIsDeleteConfirmOpen(true);

    const confirmDeleteRecipe = () => {
        storage.deleteRecipe(id);
        window.dispatchEvent(new CustomEvent('recipeUpdated'));
        setIsDeleteConfirmOpen(false);
        navigate('/profile?tab=recipes');
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShareCopied(true);
            window.setTimeout(() => setShareCopied(false), 1500);
        } catch { setShareCopied(false); }
    };

    const isOwner = user && recipe?.authorId === user.id;
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
    const totalTime = recipe ? (recipe.prepTime || 0) + (recipe.cookTime || 0) : 0;

    if (!recipe) return <div className="p-10 text-center text-cool-gray-60">Loading...</div>;

    const categories = normalizeCategories(recipe.categories ?? recipe.category);
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

    return (
        <div className="mx-auto max-w-[960px] space-y-6 animate-page-in px-6">
            {/* Breadcrumbs */}
            <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
                <Link to="/" className="font-medium text-cool-gray-40 hover:text-brand-accent hover:underline transition-colors">Home</Link>
                <span className="text-cool-gray-30">/</span>
                <Link to="/search" className="font-medium text-cool-gray-40 hover:text-brand-accent hover:underline transition-colors">Recipes</Link>
                <span className="text-cool-gray-30">/</span>
                <span className="font-medium text-cool-gray-70">{categories[0] || 'Recipe'}</span>
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{recipe.title}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                                {author ? (
                                    <Link to={`/users/${author.id}`} className="flex items-center gap-1.5">
                                        {author.avatar ? (
                                            <img src={author.avatar} className="h-6 w-6 rounded-full border border-white/50 object-cover" alt="" />
                                        ) : (
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/20 text-[10px] font-bold text-white">
                                                {author.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <span className="font-medium">By {author.username}</span>
                                    </Link>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/20 text-[10px] font-bold text-white">
                                            ?
                                        </span>
                                        <span className="font-medium">By Unknown</span>
                                    </span>
                                )}
                                <span className="h-1 w-1 rounded-full bg-white/60"></span>
                                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {totalTime} min</span>
                                {recipe.difficulty && (
                                    <>
                                        <span className="h-1 w-1 rounded-full bg-white/60"></span>
                                        <span className="capitalize">{recipe.difficulty}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleToggleLike}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-all",
                                    isLiked
                                        ? 'bg-white/25 text-white ring-1 ring-white/40'
                                        : 'bg-white/10 text-white/80 ring-1 ring-white/20 hover:bg-white/20',
                                    !canInteract && 'cursor-not-allowed opacity-60'
                                )}
                                disabled={!canInteract}
                            >
                                <Heart className={cn('h-5 w-5', isLiked && 'fill-white')} />
                                {likeCount > 0 && <span>{likeCount}</span>} Like
                            </button>
                            <button
                                type="button"
                                onClick={handleToggleFavorite}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-all",
                                    isFavorited
                                        ? 'bg-white/25 text-white ring-1 ring-white/40'
                                        : 'bg-white/10 text-white/80 ring-1 ring-white/20 hover:bg-white/20',
                                    !canInteract && 'cursor-not-allowed opacity-60'
                                )}
                                disabled={!canInteract}
                            >
                                <Bookmark className={cn('h-5 w-5', isFavorited && 'fill-white')} />
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={handleShare}
                                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-white/20"
                            >
                                <Share2 className="h-5 w-5" />
                                {shareCopied && <span>Copied!</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Restriction notice */}
            {(isPending || isSuspended || isGuest) && (
                <div className={cn(
                    "rounded-lg border p-3 text-sm",
                    isSuspended ? "border-red-200 bg-red-50 text-red-600" : "border-cool-gray-20 bg-cool-gray-10 text-cool-gray-60"
                )}>
                    {isSuspended
                        ? "Your account is suspended. You can browse recipes, but you can't like, save, or submit reviews."
                        : isGuest
                            ? "You're browsing as a guest. Login or sign up to like, save, and review recipes."
                            : "Your account is pending approval. You can browse but cannot interact yet."}
                </div>
            )}

            {/* Owner Controls */}
            {isOwner && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleEditRecipe} className="gap-1.5">
                        <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeleteRecipe} className="gap-1.5 border-red-200 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
                {/* Left Column */}
                <div className="space-y-10">
                    {/* Description */}
                    <section>
                        <h3 className="mb-4 text-xl font-bold text-cool-gray-90">Description</h3>
                        <p className="leading-relaxed text-cool-gray-60">{recipe.description}</p>
                    </section>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-cool-gray-60">Categories:</span>
                            {categories.map((cat) => (
                                <Badge key={cat} variant="outline" className="rounded-full text-xs capitalize">
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Instructions - Timeline */}
                    <section>
                        <h3 className="mb-6 text-2xl font-bold text-cool-gray-90">Instructions</h3>
                        <ol className="relative ml-3 space-y-8 border-l border-cool-gray-20 pl-8">
                            {(recipe.instructions || []).map((step, i) => (
                                <li key={i} className="relative">
                                    <span className="absolute -left-[41px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white ring-4 ring-white">
                                        {i + 1}
                                    </span>
                                    <h4 className="mb-2 text-lg font-semibold text-cool-gray-90">Step {i + 1}</h4>
                                    <p className="leading-relaxed text-cool-gray-60">{step}</p>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-8">
                    {/* Ingredients */}
                    <div className="rounded-xl border border-cool-gray-20 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-cool-gray-90">Ingredients</h3>
                            <span className="text-sm text-cool-gray-40">{(recipe.ingredients || []).length} items</span>
                        </div>
                        <ul className="space-y-3">
                            {(recipe.ingredients || []).map((ing, i) => (
                                <li key={i} role="checkbox" aria-checked={!!checkedIngredients[i]} tabIndex="0"
                                    className={cn(
                                        "flex items-start gap-3 rounded-lg bg-white p-3 text-sm shadow-sm ring-1 ring-cool-gray-20 outline-none transition-colors hover:ring-brand-accent/30 cursor-pointer",
                                        checkedIngredients[i] && "opacity-50"
                                    )}
                                    onClick={() => toggleIngredient(i)}
                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleIngredient(i); } }}
                                >
                                    <span className={cn(
                                        "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded border transition-colors",
                                        checkedIngredients[i] ? 'border-brand-accent bg-brand-accent' : 'border-cool-gray-30'
                                    )}>
                                        {checkedIngredients[i] && <Check className="h-3 w-3 text-white" />}
                                    </span>
                                    <span className={cn("text-cool-gray-70", checkedIngredients[i] && 'line-through text-cool-gray-40')}>{ing.quantity} {ing.unit} {ing.name}</span>
                                </li>
                            ))}
                        </ul>
                        {Object.values(checkedIngredients).some(Boolean) && (
                            <button type="button" onClick={() => setCheckedIngredients({})}
                                className="mt-3 text-xs text-cool-gray-50 underline hover:text-cool-gray-90">Reset checks</button>
                        )}
                    </div>

                </div>
            </div>


            {/* Reviews */}
            <div className="rounded-xl border border-cool-gray-20 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-cool-gray-90">Reviews ({reviews.length})</h3>
                    <div className="flex items-center gap-1 text-sm font-semibold text-cool-gray-90">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                    </div>
                </div>

                <form onSubmit={handleSubmitReview} className="mb-6 space-y-2">
                    <textarea
                        className="w-full rounded-lg border border-cool-gray-20 bg-cool-gray-10/50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
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
                                    className={`text-lg transition-colors ${rating >= star ? 'text-amber-400' : 'text-cool-gray-30 hover:text-amber-300'}`}
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
                        <div key={review.id} className="border-b border-cool-gray-20 pb-6 last:border-0 last:pb-0">
                            <div className="mb-2 flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {review.avatar ? (
                                        <img src={review.avatar} className="h-8 w-8 rounded-full object-cover" alt="" />
                                    ) : (
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cool-gray-10 text-[10px] font-bold text-cool-gray-60">
                                            {(review.username || '?').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                    <div>
                                        <Link to={`/users/${review.userId}`} className="text-sm font-semibold text-cool-gray-90 hover:text-brand-accent transition-colors">{review.username}</Link>
                                        <div className="flex text-[12px]">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} className={review.rating >= star ? 'text-amber-400' : 'text-cool-gray-30'}>&#9733;</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-cool-gray-40">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    {user && user.id === review.userId && (
                                        <button type="button" onClick={() => handleDeleteReview(review.id)}
                                            className="text-cool-gray-40 hover:text-red-500 transition-colors" aria-label="Delete Review">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="ml-10 text-sm leading-relaxed text-cool-gray-60">{review.comment}</p>
                        </div>
                    ))}

                    {reviews.length === 0 && (
                        <p className="text-sm text-cool-gray-50 text-center py-4">No reviews yet. Be the first!</p>
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
                    <p className="text-cool-gray-60">Are you sure you want to delete this recipe? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteRecipe}>Delete Recipe</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!deleteReviewId} onClose={() => setDeleteReviewId(null)} title="Delete Review">
                <div className="space-y-4">
                    <p className="text-cool-gray-60">Are you sure you want to delete your review? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteReviewId(null)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteReview}>Delete Review</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
