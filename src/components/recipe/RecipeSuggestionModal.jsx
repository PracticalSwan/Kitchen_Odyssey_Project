// RecipeSuggestionModal - Surprise Me modal for quality-based recipe suggestions
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Heart, MessageSquare, RefreshCw, ChefHat } from 'lucide-react';
import { storageApi as storage } from '../../lib/storageApiAdapter';

export function RecipeSuggestionModal({ isOpen, onClose, suggestion, onTryAnother }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [reviews, setReviews] = useState([]);

    const suggestionId = suggestion?._id || suggestion?.id;

    // Load reviews for the suggestion
    useEffect(() => {
        if (!suggestionId) { setReviews([]); return; }
        let cancelled = false;
        (async () => {
            try {
                const data = await storage.getReviews(suggestionId);
                if (!cancelled) setReviews(data || []);
            } catch { if (!cancelled) setReviews([]); }
        })();
        return () => { cancelled = true; };
    }, [suggestionId]);

    const handleTryAnother = async () => {
        setIsLoading(true);
        setImgError(false);
        // Small delay for visual feedback during loading
        await new Promise(resolve => setTimeout(resolve, 400));
        onTryAnother();
        setIsLoading(false);
    };

    const handleViewRecipe = () => {
        onClose();
        navigate(`/recipes/${suggestionId}`);
    };

    // Empty state when no recipes meet the criteria for suggestions
    if (!suggestion) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Surprise Me!">
                <div className="text-center py-8 space-y-3">
                    <ChefHat className="h-12 w-12 text-warm-gray-30 mx-auto" />
                    <p className="text-warm-gray-60">
                        No recipes available for suggestions yet. Check back when more recipes have been published!
                    </p>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </Modal>
        );
    }

    const likeCount = suggestion.likedBy?.length || 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Surprise Me!">
            <div className="space-y-4">
                {/* Recipe Image with error fallback */}
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-warm-gray-10">
                    {!imgError ? (
                        <img
                            src={suggestion.images?.[0]}
                            alt={suggestion.title}
                            className="h-full w-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        // Fallback placeholder when image fails to load
                        <div className="h-full w-full flex items-center justify-center">
                            <ChefHat className="h-12 w-12 text-warm-gray-30" />
                        </div>
                    )}
                </div>

                {/* Recipe Info */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {suggestion.difficulty && (
                            <Badge variant="outline" className="capitalize text-xs">
                                {suggestion.difficulty}
                            </Badge>
                        )}
                    </div>
                    <h4 className="text-lg font-bold text-charcoal">{suggestion.title}</h4>
                    <p className="text-sm text-warm-gray-60 line-clamp-2">{suggestion.description}</p>

                    {/* Stats: likes and reviews */}
                    <div className="flex items-center gap-4 text-sm text-warm-gray-60">
                        <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                    <Button variant="primary" className="flex-1" onClick={handleViewRecipe}>
                        View Recipe
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-1.5"
                        onClick={handleTryAnother}
                        isLoading={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Try Another
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
