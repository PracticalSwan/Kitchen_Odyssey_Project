import React, { useState } from 'react';
import { storage } from '../../lib/storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Eye, Check, X, Trash2 } from 'lucide-react';
import { normalizeCategories } from '../../lib/utils';

const RecipeTable = ({ statusFilter, recipes, getAuthorName, handlePreview, updateStatus, handleDelete }) => {
    const filtered = recipes.filter(r => r.status === statusFilter);

    return (
        <div className="rounded-lg border border-cool-gray-20 bg-white mt-4 shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center h-24 text-cool-gray-60">No recipes found.</TableCell>
                        </TableRow>
                    ) : filtered.map((recipe) => (
                        <TableRow key={recipe.id}>
                            <TableCell className="font-mono text-xs text-cool-gray-60">{recipe.id}</TableCell>
                            <TableCell>
                                <img 
                                    src={recipe.images?.[0] || 'https://via.placeholder.com/40'} 
                                    alt={recipe.title} 
                                    className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80"
                                    onClick={() => handlePreview(recipe)}
                                />
                            </TableCell>
                            <TableCell className="font-medium">{recipe.title}</TableCell>
                            <TableCell>{getAuthorName(recipe.authorId)}</TableCell>
                            <TableCell>{normalizeCategories(recipe.categories ?? recipe.category).join(', ') || '-'}</TableCell>
                            <TableCell>
                                <Badge variant={recipe.status === 'published' ? 'success' : recipe.status === 'rejected' ? 'error' : 'warning'}>
                                    {recipe.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{new Date(recipe.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => handlePreview(recipe)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {statusFilter === 'pending' && (
                                        <>
                                            <Button size="icon" variant="ghost" title="Approve" onClick={() => updateStatus(recipe.id, 'published')}>
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button size="icon" variant="ghost" title="Reject" onClick={() => updateStatus(recipe.id, 'rejected')}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </>
                                    )}
                                    <Button size="icon" variant="ghost" title="Delete" onClick={() => handleDelete(recipe.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export function AdminRecipes() {
    const [recipes, setRecipes] = useState(() => storage.getRecipes());
    const [users, setUsers] = useState(() => storage.getUsers());
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [deleteRecipeId, setDeleteRecipeId] = useState(null);

    const loadRecipes = () => {
        setRecipes(storage.getRecipes());
        setUsers(storage.getUsers());
    };

    // Helper to get author username from ID
    const getAuthorName = (authorId) => {
        const author = users.find(u => u.id === authorId);
        return author?.username || authorId;
    };

    const updateStatus = (id, status) => {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
            storage.saveRecipe({ ...recipe, status });
            const adminName = storage.getCurrentUser()?.username || 'Admin';
            const actionLabel = status === 'published' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated';
            storage.addActivity({
                type: 'admin-recipe',
                text: `${adminName} ${actionLabel} "${recipe.title}"`
            });
            loadRecipes();
            setIsPreviewOpen(false);
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
            window.dispatchEvent(new CustomEvent('statsUpdated'));
        }
    };

    const handleDelete = (id) => {
        setDeleteRecipeId(id);
    };

    const confirmDelete = () => {
        if (!deleteRecipeId) return;
        const recipe = recipes.find(r => r.id === deleteRecipeId);
        storage.deleteRecipe(deleteRecipeId);
        const adminName = storage.getCurrentUser()?.username || 'Admin';
        if (recipe) {
            storage.addActivity({
                type: 'admin-recipe',
                text: `${adminName} removed "${recipe.title}"`
            });
        }
        loadRecipes();
        setDeleteRecipeId(null);
        window.dispatchEvent(new CustomEvent('recipeUpdated'));
        window.dispatchEvent(new CustomEvent('statsUpdated'));
    };

    const handlePreview = (recipe) => {
        const latest = storage.getRecipeById(recipe.id) || recipe;
        setSelectedRecipe(latest);
        setIsPreviewOpen(true);
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-cool-gray-90">Recipe Management</h1>
                <p className="text-cool-gray-60">Approve, reject, and manage user submissions.</p>
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    <RecipeTable
                        statusFilter="pending"
                        recipes={recipes}
                        getAuthorName={getAuthorName}
                        handlePreview={handlePreview}
                        updateStatus={updateStatus}
                        handleDelete={handleDelete}
                    />
                </TabsContent>
                <TabsContent value="published">
                    <RecipeTable
                        statusFilter="published"
                        recipes={recipes}
                        getAuthorName={getAuthorName}
                        handlePreview={handlePreview}
                        updateStatus={updateStatus}
                        handleDelete={handleDelete}
                    />
                </TabsContent>
                <TabsContent value="rejected">
                    <RecipeTable
                        statusFilter="rejected"
                        recipes={recipes}
                        getAuthorName={getAuthorName}
                        handlePreview={handlePreview}
                        updateStatus={updateStatus}
                        handleDelete={handleDelete}
                    />
                </TabsContent>
            </Tabs>

            <Modal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title={selectedRecipe?.title || 'Recipe Preview'}
                className="max-w-3xl"
            >
                {selectedRecipe ? (
                    <div className="space-y-4 max-h-[70vh] overflow-auto">
                        <img src={selectedRecipe.images?.[0]} alt="" className="w-full h-48 object-cover rounded-lg" />
                        <p className="text-cool-gray-60">{selectedRecipe.description}</p>

                        <div className="flex flex-wrap gap-2 text-xs text-cool-gray-70">
                            {normalizeCategories(selectedRecipe.categories ?? selectedRecipe.category).map((category) => (
                                <Badge key={category} variant="outline" className="uppercase tracking-wider">
                                    {category}
                                </Badge>
                            ))}
                            {selectedRecipe.difficulty && (
                                <Badge variant="outline" className="capitalize">
                                    {selectedRecipe.difficulty}
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Ingredients</h4>
                                <ul className="list-disc list-inside text-sm">
                                    {selectedRecipe.ingredients?.map((ing, i) => (
                                        <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Instructions</h4>
                                <ol className="list-decimal list-inside text-sm">
                                    {selectedRecipe.instructions?.map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        {selectedRecipe.status === 'pending' && (
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-cool-gray-20 items-center">
                                <Button variant="outline" onClick={() => updateStatus(selectedRecipe.id, 'rejected')}>Reject</Button>
                                <Button onClick={() => updateStatus(selectedRecipe.id, 'published')}>Approve</Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-6 text-center text-cool-gray-60">No recipe selected.</div>
                )}
            </Modal>

            <Modal
                isOpen={!!deleteRecipeId}
                onClose={() => setDeleteRecipeId(null)}
                title="Delete Recipe"
            >
                <div className="space-y-4">
                    <p className="text-cool-gray-60">Are you sure you want to delete this recipe? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteRecipeId(null)}>Cancel</Button>
                        <Button variant="danger" className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete}>Delete Recipe</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
