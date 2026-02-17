import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storage, DEFAULT_AVATARS } from '../../lib/storage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { MapPin, Calendar, Settings, Check, Edit, Trash2 } from 'lucide-react';

export function Profile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, updateProfile, canInteract, isPending, isSuspended, isGuest } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'recipes';

    const isOwnProfile = !userId || (currentUser && currentUser.id === userId);
    const shouldBlockGuestOwnProfile = isGuest && isOwnProfile;

    const profileUser = useMemo(() => {
        if (isOwnProfile) {
            return currentUser;
        }
        const users = storage.getUsers();
        return users.find(u => u.id === userId) || null;
    }, [userId, currentUser, isOwnProfile]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [deleteRecipeId, setDeleteRecipeId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const buildEditForm = (user) => ({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        bio: user?.bio || '',
        location: user?.location || '',
        cookingLevel: user?.cookingLevel || 'Beginner',
        avatar: user?.avatar || DEFAULT_AVATARS[0]
    });

    const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

    useEffect(() => {
        const handleFavoriteToggle = () => triggerRefresh();
        window.addEventListener('favoriteToggled', handleFavoriteToggle);
        window.addEventListener('recipeUpdated', handleFavoriteToggle);
        return () => {
            window.removeEventListener('favoriteToggled', handleFavoriteToggle);
            window.removeEventListener('recipeUpdated', handleFavoriteToggle);
        };
    }, [triggerRefresh]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const allRecipes = useMemo(() => storage.getRecipes(), [refreshKey]);

    const myRecipes = useMemo(() => {
        if (!profileUser) return [];
        const userRecipes = allRecipes.filter(r => r.authorId === profileUser.id);
        return isOwnProfile ? userRecipes : userRecipes.filter(r => r.status === 'published');
    }, [allRecipes, profileUser, isOwnProfile]);

    const favorites = useMemo(() => {
        if (!profileUser?.favorites?.length) return [];
        const favoriteRecipes = allRecipes.filter(r => profileUser.favorites.includes(r.id));
        return isOwnProfile ? favoriteRecipes : favoriteRecipes.filter(r => r.status === 'published');
    }, [allRecipes, profileUser, isOwnProfile]);

    const handleDeleteRecipe = (recipeId) => {
        setDeleteRecipeId(recipeId);
    };

    const confirmDeleteRecipe = () => {
        if (deleteRecipeId) {
            storage.deleteRecipe(deleteRecipeId);
            triggerRefresh();
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
            setDeleteRecipeId(null);
        }
    };

    const handleEditRecipe = (recipeId) => {
        navigate(`/recipes/edit/${recipeId}`);
    };

    const handleSaveProfile = () => {
        if (!isOwnProfile || !canInteract) return;
        updateProfile(editForm);
        setIsEditing(false);
    };

    const handleEditProfile = () => {
        if (!profileUser) return;
        setEditForm(buildEditForm(profileUser));
        setIsEditing(true);
    };

    const handleAvatarSelect = (avatarUrl) => {
        setEditForm(prev => ({ ...prev, avatar: avatarUrl }));
    };

    if (shouldBlockGuestOwnProfile) {
        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-page-in text-center py-16">
                <h1 className="text-2xl font-bold text-cool-gray-90">Login to View Your Profile</h1>
                <p className="text-cool-gray-60">
                    Create an account to build your profile, save recipes, and share your own creations.
                </p>
                <div className="flex justify-center gap-3">
                    <Button variant="primary" onClick={() => navigate('/login')}>Login</Button>
                    <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
                </div>
            </div>
        );
    }

    if (!profileUser) return <div className="p-10 text-center">User not found</div>;

    return (
        <div className="space-y-6 animate-page-in">
            {/* Profile Header */}
            <div className="bg-white p-6 rounded-lg border border-cool-gray-20 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                    <img src={profileUser.avatar} alt={profileUser.username} className="h-20 w-20 rounded-full border-4 border-cool-gray-10" />

                    <div className="flex-1 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h1 className="text-xl font-bold text-cool-gray-90">{profileUser.username}</h1>
                            <Badge variant="outline" className="w-fit capitalize text-xs">{profileUser.cookingLevel}</Badge>
                        </div>

                        <p className="text-sm text-cool-gray-60">{profileUser.bio || 'No bio yet.'}</p>
                        <div className="flex items-center gap-4 text-xs text-cool-gray-60">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profileUser.location || 'Unknown'}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(profileUser.joinedDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {isOwnProfile && canInteract && (
                        <Button variant="outline" size="sm" className="hover:bg-cool-gray-10" onClick={handleEditProfile}>
                            <Settings className="h-4 w-4 mr-1.5" /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            {isOwnProfile && (isPending || isSuspended) && (
                <div
                    className={
                        isSuspended
                            ? "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600"
                            : "rounded-lg border border-cool-gray-20 bg-cool-gray-10 p-4 text-sm text-cool-gray-60"
                    }
                >
                    {isSuspended
                        ? "Your account is suspended. You can browse recipes, but you can’t update your profile or interact with content."
                        : "Your account is pending approval. You can browse recipes as a guest, but you can’t update your profile yet."}
                </div>
            )}

            {/* Edit Profile Modal */}
            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile" className="max-w-lg">
                <div className="space-y-4">
                    {/* Avatar Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-cool-gray-60">Avatar</label>
                        <div className="flex items-center gap-3 flex-wrap">
                            {DEFAULT_AVATARS.map((avatar, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleAvatarSelect(avatar)}
                                    className={`relative h-12 w-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cool-gray-90 focus-visible:ring-offset-2 ${editForm.avatar === avatar ? 'border-cool-gray-90 ring-2 ring-cool-gray-90/20' : 'border-cool-gray-20 hover:border-cool-gray-40'}`}
                                    aria-label={`Select avatar ${i + 1}`}
                                    aria-pressed={editForm.avatar === avatar}
                                >
                                    <img src={avatar} alt={`Avatar ${i + 1}`} className="h-full w-full object-cover" />
                                    {editForm.avatar === avatar && (
                                        <div className="absolute inset-0 bg-cool-gray-90/30 flex items-center justify-center">
                                            <Check className="h-5 w-5 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <Input
                            placeholder="Or paste custom avatar URL..."
                            value={editForm.avatar}
                            onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                            className="mt-2"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="First Name"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                        <Input
                            label="Last Name"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Username"
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-cool-gray-60">Bio</label>
                        <textarea
                            className="w-full rounded-md border border-cool-gray-30 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cool-gray-90"
                            rows={2}
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Location"
                            value={editForm.location}
                            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g. New York"
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-cool-gray-60">Cooking Level</label>
                            <select
                                className="h-10 w-full rounded-md border border-cool-gray-30 px-3 bg-white text-sm"
                                value={editForm.cookingLevel}
                                onChange={(e) => setEditForm(prev => ({ ...prev, cookingLevel: e.target.value }))}
                            >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Professional</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 items-center">
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            {/* Tabs */}
            <Tabs value={defaultTab} onValueChange={(val) => setSearchParams({ tab: val })} className="rounded-lg border border-cool-gray-20 bg-white p-4 shadow-sm">
                <TabsList className="mb-4">
                    <TabsTrigger value="recipes">{isOwnProfile ? 'My Recipes' : 'Recipes'} ({myRecipes.length})</TabsTrigger>
                    <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="recipes" className="space-y-4">
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {myRecipes.map(recipe => (
                            <div key={recipe.id} className="h-full">
                                <RecipeCard 
                                    recipe={recipe} 
                                    onFavoriteToggle={triggerRefresh}
                                    actionOverlay={isOwnProfile && canInteract && (
                                        <>
                                            <div className="absolute top-8 left-1.5 z-10">
                                                <Badge variant={recipe.status === 'published' ? 'success' : recipe.status === 'rejected' ? 'error' : 'warning'} className="text-[9px] px-1.5 py-0.5">
                                                    {recipe.status}
                                                </Badge>
                                            </div>
                                            {/* Edit and Delete buttons */}
                                            <div className="absolute top-8 right-1.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditRecipe(recipe.id); }}
                                                    title="Edit Recipe"
                                                    aria-label="Edit recipe"
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-cool-gray-60" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 bg-white/90 hover:bg-red-50 shadow-sm"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteRecipe(recipe.id); }}
                                                    title="Delete Recipe"
                                                    aria-label="Delete recipe"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                />
                            </div>
                        ))}
                        {myRecipes.length === 0 && (
                            <div className="text-cool-gray-60 col-span-full text-center py-10 text-sm">
                                {isOwnProfile ? (
                                    <>You haven't shared any recipes yet. <Link to="/recipes/create" className="text-cool-gray-90 underline">Create one!</Link></>
                                ) : (
                                    "This user hasn't published any recipes yet."
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="favorites">
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {favorites.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} onFavoriteToggle={triggerRefresh} />
                        ))}
                        {favorites.length === 0 && (
                            <div className="text-cool-gray-60 col-span-full text-center py-10 text-sm">
                                No favorites yet. <Link to="/" className="text-cool-gray-90 underline">Go explore!</Link>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Delete Recipe Confirmation Modal */}
            <Modal
                isOpen={!!deleteRecipeId}
                onClose={() => setDeleteRecipeId(null)}
                title="Delete Recipe"
            >
                <div className="space-y-4">
                    <p className="text-cool-gray-60">Are you sure you want to delete this recipe? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteRecipeId(null)}>Cancel</Button>
                        <Button variant="danger" className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteRecipe}>Delete Recipe</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
