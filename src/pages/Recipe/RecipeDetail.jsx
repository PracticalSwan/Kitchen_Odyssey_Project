import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Clock, Heart, ArrowLeft, Eye, Bookmark, Trash2, Edit, Check } from 'lucide-react';
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

        const users = storage.getUsers();
        setAuthor(users.find(u => u.id === found.authorId));

        setReviews(storage.getReviews(id));

        // Record view (only once per user)
        if (user) {
            const newViewCount = storage.recordView({ viewerId: user.id, recipeId: id, viewerType: 'user' });
            setViewCount(newViewCount);
            setIsLiked(storage.hasUserLiked(user.id, id));
            setIsFavorited(storage.hasUserFavorited(user.id, id));
            window.dispatchEvent(new CustomEvent('statsUpdated'));
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
        } else {
            const guestId = storage.getOrCreateGuestId();
            const newViewCount = storage.recordView({ viewerId: guestId, recipeId: id, viewerType: 'guest' });
            setViewCount(newViewCount);
            window.dispatchEvent(new CustomEvent('statsUpdated'));
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
        }
        setLikeCount(found.likedBy?.length || 0);
    }, [id, navigate, user, isAdmin]);

    const handleToggleLike = () => {
        if (!user || !canInteract) return;
        const result = storage.toggleLike(user.id, id);
        setIsLiked(result.liked);
        setLikeCount(result.count);
    };

    const handleToggleFavorite = () => {
        if (!user || !canInteract) return;
        const nowFavorited = storage.toggleFavorite(user.id, id);
        setIsFavorited(nowFavorited);
        window.dispatchEvent(new CustomEvent('favoriteToggled'));
    };

    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (!canInteract) return;
        if (!newComment.trim()) return;

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

    const isOwner = user && recipe?.authorId === user.id;

    const avgRating = reviews.length > 0
        ? Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
        : 0;

    if (!recipe) return <div className="p-10 text-center">Loading...</div>;

    const categories = normalizeCategories(recipe.categories ?? recipe.category);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-page-in">
            <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-cool-gray-90" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Smaller Image */}
                <div className="w-full lg:w-2/5 aspect-[4/3] max-h-[300px] overflow-hidden rounded-lg bg-cool-gray-10 flex-shrink-0 border border-cool-gray-20 shadow-sm">
                    <img src={recipe.images?.[0]} alt={recipe.title} className="h-full w-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                            {categories.map((category) => (
                                <Badge key={category}>{category}</Badge>
                            ))}
                        </div>
                        <span className="text-sm text-cool-gray-60 shrink-0">
                            {new Date(recipe.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-cool-gray-90">{recipe.title}</h1>

                    <div className="flex items-center gap-4 text-sm text-cool-gray-60">
                        <Link to={`/users/${author?.id}`} className="flex items-center gap-2 group">
                            <img src={author?.avatar || 'https://via.placeholder.com/32'} className="h-7 w-7 rounded-full" alt={author?.username || 'Author'} />
                            <span className="font-medium text-cool-gray-90 group-hover:underline">{author?.username || 'Unknown'}</span>
                        </Link>
                        {/* Rating Display */}
                        <div
                            className="flex items-center gap-1 text-yellow-400"
                            role="img"
                            aria-label={`Rating: ${avgRating} out of 5 stars`}
                        >
                             <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} aria-hidden="true" className={avgRating >= star ? 'text-yellow-400' : 'text-cool-gray-30'}>★</span>
                                ))}
                            </div>
                            <span className="text-cool-gray-60">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{recipe.prepTime + recipe.cookTime} min</span>
                        </div>
                        {recipe.difficulty && (
                            <Badge variant="outline" className="capitalize text-cool-gray-70">
                                {recipe.difficulty}
                            </Badge>
                        )}
                    </div>

                    <p className="text-sm text-cool-gray-60 leading-relaxed line-clamp-3">
                        {recipe.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                        <Button
                            variant={isLiked ? 'primary' : 'outline'}
                            size="sm"
                            onClick={handleToggleLike}
                            className="gap-1.5"
                            disabled={!canInteract}
                            aria-pressed={isLiked}
                            aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
                        >
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-white' : ''}`} />
                            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
                        </Button>
                        <Button
                            variant={isFavorited ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={handleToggleFavorite}
                            className="gap-1.5"
                            disabled={!canInteract}
                            aria-pressed={isFavorited}
                            aria-label={isFavorited ? 'Unsave recipe' : 'Save recipe'}
                        >
                            <Bookmark className={`h-4 w-4 ${isFavorited ? 'fill-white' : ''}`} />
                            {isFavorited ? 'Saved' : 'Save'}
                        </Button>
                        
                        {/* Edit/Delete buttons for recipe owner */}
                        {isOwner && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleEditRecipe}
                                    className="gap-1.5"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteRecipe}
                                    className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                        
                        <div className="flex items-center gap-1 text-sm text-cool-gray-60 ml-auto">
                            <Eye className="h-4 w-4" />
                            <span>{viewCount} views</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
                {/* Ingredients */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold">Ingredients</h3>
                            {Object.values(checkedIngredients).some(Boolean) && (
                                <button
                                    onClick={() => setCheckedIngredients({})}
                                    className="text-[13px] text-cool-gray-40 hover:text-cool-gray-90 underline"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                        <ul className="space-y-2">
                            {(recipe.ingredients || []).map((ing, i) => (
                                <li
                                    key={i}
                                    role="checkbox"
                                    aria-checked={!!checkedIngredients[i]}
                                    tabIndex="0"
                                    className={cn(
                                        "flex justify-between items-center text-sm border-b border-cool-gray-10 pb-2 last:border-0 cursor-pointer group/ing outline-none focus-visible:ring-2 focus-visible:ring-[#137fec] focus-visible:ring-offset-2 rounded-sm",
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
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            checkedIngredients[i] ? "bg-cool-gray-90 border-cool-gray-90" : "border-cool-gray-30 group-hover/ing:border-cool-gray-60"
                                        )}>
                                            {checkedIngredients[i] && <Check className="h-2.5 w-2.5 text-white" />}
                                        </div>
                                        <span className={cn(
                                            "font-medium transition-all",
                                            checkedIngredients[i] ? "line-through text-cool-gray-40" : "text-cool-gray-90"
                                        )}>{ing.name}</span>
                                    </div>
                                    <span className={cn(
                                        "text-cool-gray-60 text-xs transition-all",
                                        checkedIngredients[i] ? "line-through opacity-50" : ""
                                    )}>{ing.quantity} {ing.unit}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-[10px] text-cool-gray-40 italic">Tip: Click an ingredient to check it off while cooking.</p>
                    </CardContent>
                </Card>

                {/* Instructions */}
                <div className="space-y-4 rounded-lg border border-cool-gray-20 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold">Instructions</h3>
                    <div className="space-y-3">
                        {(recipe.instructions || []).map((step, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="flex-none flex items-center justify-center w-7 h-7 rounded-md bg-cool-gray-20 text-cool-gray-90 font-bold text-xs">
                                    {i + 1}
                                </div>
                                <p className="text-cool-gray-60 text-sm pt-0.5">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-6 border border-cool-gray-20 bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h3>

                {(isPending || isSuspended || isGuest) && (
                    <div
                        className={
                            isSuspended
                                ? "mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                                : "mb-4 rounded-lg border border-cool-gray-20 bg-cool-gray-10 p-3 text-sm text-cool-gray-60"
                        }
                    >
                        {isSuspended
                            ? "Your account is suspended. You can browse recipes, but you can't like, save, or submit reviews."
                            : isGuest
                                ? "You're browsing as a guest. Login or sign up to like, save, and review recipes."
                                : "Your account is pending approval. You can browse recipes as a guest, but you can't like, save, or submit reviews yet."}
                    </div>
                )}

                {/* Comment Form */}
                <div className="mb-6 flex gap-3">
                    <img src={user?.avatar} className="h-9 w-9 rounded-full" alt="" />
                    <form onSubmit={handleSubmitReview} className="flex-1 space-y-2">
                        <textarea
                            className="w-full rounded-lg border border-cool-gray-30 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cool-gray-90"
                            placeholder="Share your thoughts..."
                            rows={2}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={!canInteract}
                        />
                        <div className="flex justify-between items-center">
                            <div className="flex gap-0.5" role="group" aria-label="Rating">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-lg transition-all focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-cool-gray-90 focus-visible:ring-offset-1 rounded-sm outline-none ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed'} ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        aria-pressed={rating >= star}
                                        disabled={!canInteract}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <Button type="submit" size="sm" disabled={!newComment.trim() || !canInteract}>Post</Button>
                        </div>
                    </form>
                </div>

                {/* Review List */}
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.id} className="flex gap-3 group">
                            <img src={review.avatar || 'https://via.placeholder.com/36'} className="h-9 w-9 rounded-full" alt="" />
                            <div className="flex-1 space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Link to={`/users/${review.userId}`} className="font-semibold text-cool-gray-90 text-sm hover:underline">{review.username}</Link>
                                    <div
                                        className="flex text-xs"
                                        role="img"
                                        aria-label={`Rating: ${review.rating} out of 5 stars`}
                                    >
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} aria-hidden="true" className={review.rating >= star ? 'text-yellow-500' : 'text-cool-gray-30'}>★</span>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-cool-gray-30">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    {/* Delete button - only visible to review author */}
                                    {user && user.id === review.userId && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-50"
                                            onClick={() => handleDeleteReview(review.id)}
                                            title="Delete Review"
                                            aria-label="Delete Review"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-cool-gray-60 text-sm">{review.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
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

            {/* Delete Review Confirmation Modal */}
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
