import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Heart, Eye, Bookmark, Trash2, Edit, Check, Share2, Star } from 'lucide-react';
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
    const [viewCount, setViewCount] = useState(0);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteReviewId, setDeleteReviewId] = useState(null);
    const [checkedIngredients, setCheckedIngredients] = useState({});
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const toggleIngredient = (index) => {
        setCheckedIngredients(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    useEffect(() => {
        const recipes = storage.getRecipes();
        const found = recipes.find(r => r.id === id);

        if (!found) {
            navigate('/');
            return;
        }

        if (found.status !== 'published' && !isAdmin) {
            navigate('/');
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecipe(found);
        setLikeCount(found.likedBy?.length || 0);
        setReviews(storage.getReviews(id));

        const users = storage.getUsers();
        setAuthor(users.find(u => u.id === found.authorId));

        if (user) {
            const newViewCount = storage.recordView({ viewerId: user.id, recipeId: id, viewerType: 'user' });
            setViewCount(newViewCount);
            setIsLiked(storage.hasUserLiked(user.id, id));
            setIsFavorited(storage.hasUserFavorited(user.id, id));
        } else {
            const guestId = storage.getOrCreateGuestId();
            const newViewCount = storage.recordView({ viewerId: guestId, recipeId: id, viewerType: 'guest' });
            setViewCount(newViewCount);
        }
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
            recipeId: id,
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            rating,
            comment: newComment
        });

        setReviews(storage.getReviews(id));
        setNewComment('');
    };

    const handleDeleteReview = (reviewId) => {
        setDeleteReviewId(reviewId);
    };

    const confirmDeleteReview = () => {
        if (!deleteReviewId) return;
        storage.deleteReview(deleteReviewId);
        setReviews(storage.getReviews(id));
        setDeleteReviewId(null);
    };

    const handleEditRecipe = () => {
        navigate(`/recipes/edit/${id}`);
    };

    const handleDeleteRecipe = () => {
        setIsDeleteConfirmOpen(true);
    };

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
        } catch {
            setShareCopied(false);
        }
    };

    const isOwner = user && recipe?.authorId === user.id;

    const avgRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    if (!recipe) return <div className="p-10 text-center">Loading...</div>;

    const categories = normalizeCategories(recipe.categories ?? recipe.category);
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

    return (
        <div className="mx-auto max-w-6xl space-y-6 animate-page-in">
            <div className="text-xs text-cool-gray-30">
                <span>Home</span>
                <span className="mx-2">/</span>
                <span>Recipes</span>
                <span className="mx-2">/</span>
                <span className="text-cool-gray-60">{categories[0] || 'Recipe'}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                    <div>
                        <h1 className="text-4xl font-bold leading-tight text-cool-gray-90">{recipe.title}</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-cool-gray-60">
                            <Link to={`/users/${author?.id}`} className="inline-flex items-center gap-2 group">
                                <img src={author?.avatar || 'https://via.placeholder.com/32'} className="h-8 w-8 rounded-full" alt={author?.username || 'Author'} />
                                <span className="font-semibold text-cool-gray-90 group-hover:underline">{author?.username || 'Unknown'}</span>
                            </Link>
                            <span>•</span>
                            <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{recipe.prepTime + recipe.cookTime} min prep</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {viewCount}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <button
                            type="button"
                            onClick={handleToggleLike}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-colors",
                                isLiked ? 'border-[#137fec] bg-[#137fec]/10 text-[#137fec]' : 'border-cool-gray-20 text-cool-gray-60 hover:bg-cool-gray-10',
                                !canInteract && 'opacity-60 cursor-not-allowed'
                            )}
                            disabled={!canInteract}
                        >
                            <Heart className={cn('h-4 w-4', isLiked && 'fill-[#137fec]')} />
                            {likeCount} Like
                        </button>

                        <button
                            type="button"
                            onClick={handleToggleFavorite}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-colors",
                                isFavorited ? 'border-[#137fec] bg-[#137fec]/10 text-[#137fec]' : 'border-cool-gray-20 text-cool-gray-60 hover:bg-cool-gray-10',
                                !canInteract && 'opacity-60 cursor-not-allowed'
                            )}
                            disabled={!canInteract}
                        >
                            <Bookmark className={cn('h-4 w-4', isFavorited && 'fill-[#137fec]')} />
                            Save
                        </button>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 rounded-md border border-cool-gray-20 px-3 py-1.5 text-cool-gray-60 transition-colors hover:bg-cool-gray-10"
                        >
                            <Share2 className="h-4 w-4" />
                            {shareCopied ? 'Copied' : 'Share'}
                        </button>

                        {recipe.difficulty && <Badge variant="outline" className="capitalize">{recipe.difficulty}</Badge>}

                        {isOwner && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleEditRecipe} className="gap-1.5">
                                    <Edit className="h-4 w-4" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDeleteRecipe} className="gap-1.5 border-red-200 text-red-500 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" /> Delete
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-cool-gray-20 bg-cool-gray-10">
                        <img src={recipe.images?.[0]} alt={recipe.title} className="h-full w-full object-cover" />
                    </div>

                    <p className="text-base leading-7 text-cool-gray-60">{recipe.description}</p>

                    <section className="space-y-4">
                        <h3 className="text-2xl font-bold text-cool-gray-90">Instructions</h3>
                        <div className="space-y-4">
                            {(recipe.instructions || []).map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#137fec] text-xs font-semibold text-white">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-cool-gray-90">Step {i + 1}</h4>
                                        <p className="mt-0.5 text-sm leading-6 text-cool-gray-60">{step}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="space-y-4">
                    <Card className="rounded-xl border-cool-gray-20">
                        <CardContent className="p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-cool-gray-90">Ingredients</h3>
                                <span className="text-xs text-cool-gray-60">{(recipe.ingredients || []).length} items</span>
                            </div>

                            <ul className="space-y-2">
                                {(recipe.ingredients || []).map((ing, i) => (
                                    <li
                                        key={i}
                                        role="checkbox"
                                        aria-checked={!!checkedIngredients[i]}
                                        tabIndex="0"
                                        className={cn(
                                            "flex items-start gap-2 rounded-md p-1 text-sm text-cool-gray-60 outline-none transition-colors hover:bg-cool-gray-10/60 focus-visible:ring-2 focus-visible:ring-[#137fec]",
                                            checkedIngredients[i] && "opacity-60"
                                        )}
                                        onClick={() => toggleIngredient(i)}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') {
                                                e.preventDefault();
                                                toggleIngredient(i);
                                            }
                                        }}
                                    >
                                        <span className={cn(
                                            "mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded border",
                                            checkedIngredients[i] ? 'border-cool-gray-90 bg-cool-gray-90' : 'border-cool-gray-30'
                                        )}>
                                            {checkedIngredients[i] && <Check className="h-2.5 w-2.5 text-white" />}
                                        </span>
                                        <span className={cn(checkedIngredients[i] && 'line-through')}>
                                            {ing.quantity} {ing.unit} {ing.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {Object.values(checkedIngredients).some(Boolean) && (
                                <button
                                    type="button"
                                    onClick={() => setCheckedIngredients({})}
                                    className="mt-3 text-xs text-cool-gray-60 underline hover:text-cool-gray-90"
                                >
                                    Reset checks
                                </button>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-cool-gray-20">
                        <CardContent className="p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-cool-gray-90">Reviews ({reviews.length})</h3>
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-cool-gray-90">
                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                    {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
                                </span>
                            </div>

                            {(isPending || isSuspended || isGuest) && (
                                <div
                                    className={
                                        isSuspended
                                            ? "mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600"
                                            : "mb-3 rounded-lg border border-cool-gray-20 bg-cool-gray-10 p-3 text-xs text-cool-gray-60"
                                    }
                                >
                                    {isSuspended
                                        ? "Your account is suspended. You can browse recipes, but you can't like, save, or submit reviews."
                                        : isGuest
                                            ? "You're browsing as a guest. Login or sign up to like, save, and review recipes."
                                            : "Your account is pending approval. You can browse recipes as a guest, but you can't like, save, or submit reviews yet."}
                                </div>
                            )}

                            <form onSubmit={handleSubmitReview} className="mb-4 space-y-2">
                                <textarea
                                    className="w-full rounded-lg border border-cool-gray-20 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                                    placeholder="Write a review..."
                                    rows={2}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={!canInteract}
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-0.5" role="group" aria-label="Rating">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`text-base ${rating >= star ? 'text-yellow-400' : 'text-cool-gray-30'}`}
                                                disabled={!canInteract}
                                                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <Button type="submit" size="sm" disabled={!newComment.trim() || !canInteract}>Post</Button>
                                </div>
                            </form>

                            <div className="space-y-3">
                                {displayedReviews.map(review => (
                                    <div key={review.id} className="rounded-lg border border-cool-gray-20 p-3">
                                        <div className="mb-1 flex items-center gap-2">
                                            <img src={review.avatar || 'https://via.placeholder.com/24'} className="h-6 w-6 rounded-full" alt="" />
                                            <Link to={`/users/${review.userId}`} className="text-sm font-semibold text-cool-gray-90 hover:underline">{review.username}</Link>
                                            <span className="ml-auto text-[10px] text-cool-gray-30">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            {user && user.id === review.userId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="text-red-500 hover:text-red-600"
                                                    aria-label="Delete Review"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="mb-1 text-[11px] leading-none">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} className={review.rating >= star ? 'text-yellow-500' : 'text-cool-gray-30'}>★</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-cool-gray-60">{review.comment}</p>
                                    </div>
                                ))}

                                {reviews.length === 0 && (
                                    <p className="text-sm text-cool-gray-60">No reviews yet. Be the first to review this recipe.</p>
                                )}

                                {reviews.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllReviews(prev => !prev)}
                                        className="text-sm font-medium text-[#137fec] hover:underline"
                                    >
                                        {showAllReviews ? 'Show fewer reviews' : `View all ${reviews.length} reviews`}
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <Modal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title="Delete Recipe"
            >
                <div className="space-y-4">
                    <p className="text-cool-gray-60">Are you sure you want to delete this recipe? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteRecipe}>Delete Recipe</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!deleteReviewId}
                onClose={() => setDeleteReviewId(null)}
                title="Delete Review"
            >
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
