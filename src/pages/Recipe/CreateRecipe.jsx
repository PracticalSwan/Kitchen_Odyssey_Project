// CreateRecipe - Recipe creation and editing form with validation
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storageApi as storage } from '../../lib/storageApiAdapter';
import { useToast, formatError } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Card, CardContent } from '../../components/ui/Card';
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES } from '../../lib/utils';
import { Plus, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CreateRecipe() {
    const navigate = useNavigate();
    const { id } = useParams(); // If id exists, we're in edit mode
    const { user, canInteract, isPending, isSuspended, isGuest } = useAuth();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = Boolean(id);
    const isBlocked = isSuspended || isPending;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categories: ['Breakfast'],
        prepTime: 15,
        cookTime: 15,
        servings: 2,
        difficulty: 'Medium',
        image: '',
    });

    const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);
    const [instructions, setInstructions] = useState(['']);
    const [originalRecipe, setOriginalRecipe] = useState(null);
    const [errors, setErrors] = useState({});
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Load recipe data if in edit mode
    useEffect(() => {
        if (!canInteract || isBlocked) return;
        if (isEditMode) {
            const loadRecipe = async () => {
                try {
                    const recipe = await storage.getRecipeById(id);
                    if (recipe) {
                        const recipeUserId = recipe.authorId;
                        const currentUserId = user?._id || user?.id;
                        if (recipeUserId !== currentUserId) {
                            navigate('/profile?tab=recipes');
                            return;
                        }
                        setOriginalRecipe(recipe);
                        const nextCategories = Array.isArray(recipe.categories)
                            ? recipe.categories
                            : recipe.category
                                ? [recipe.category]
                                : ['Breakfast'];
                        setFormData({
                            title: recipe.title || '',
                            description: recipe.description || '',
                            categories: nextCategories.length ? nextCategories : ['Breakfast'],
                            prepTime: recipe.prepTime || 15,
                            cookTime: recipe.cookTime || 15,
                            servings: recipe.servings || 2,
                            difficulty: recipe.difficulty || 'Medium',
                            image: recipe.images?.[0] || '',
                        });
                        setIngredients(recipe.ingredients?.length ? recipe.ingredients : [{ name: '', quantity: '', unit: '' }]);
                        setInstructions(recipe.instructions?.length ? recipe.instructions : ['']);
                    } else {
                        navigate('/profile?tab=recipes');
                    }
                } catch (err) {
                    toast.error(formatError(err));
                    navigate('/profile?tab=recipes');
                }
            };
            loadRecipe();
        }
    }, [id, isEditMode, user, navigate, canInteract, isBlocked, toast]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const toggleCategory = (category) => {
        setFormData(prev => {
            const current = prev.categories || [];
            const exists = current.includes(category);
            const next = exists
                ? current.filter(c => c !== category)
                : current.length < 3
                    ? [...current, category]
                    : current;
            return { ...prev, categories: next };
        });
    };

    // Ingredients Logic
    const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
    const removeIngredient = (index) => setIngredients(ingredients.filter((_, i) => i !== index));
    const updateIngredient = (index, field, value) => {
        const newIngs = [...ingredients];
        newIngs[index][field] = value;
        setIngredients(newIngs);
    };

    // Instructions Logic
    const addInstruction = () => setInstructions([...instructions, '']);
    const removeInstruction = (index) => setInstructions(instructions.filter((_, i) => i !== index));
    const updateInstruction = (index, value) => {
        const newInst = [...instructions];
        newInst[index] = value;
        setInstructions(newInst);
    };

    // Validation function
    const validateForm = () => {
        const newErrors = {};

        // Title validation: 3-100 characters
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = 'Title must be less than 100 characters';
        }

        // Description validation: 10-500 characters
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        } else if (formData.description.trim().length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        // Categories validation: 1-3 selections
        const selectedCategories = formData.categories || [];
        if (selectedCategories.length < 1) {
            newErrors.categories = 'Select at least 1 category';
        } else if (selectedCategories.length > 3) {
            newErrors.categories = 'Select up to 3 categories';
        }

        // Prep time validation: 1-1440 minutes (max 24 hours)
        const prepTime = Number(formData.prepTime);
        if (prepTime < 1) {
            newErrors.prepTime = 'Prep time must be at least 1 minute';
        } else if (prepTime > 1440) {
            newErrors.prepTime = 'Prep time cannot exceed 24 hours (1440 minutes)';
        }

        // Cook time validation: 0-1440 minutes
        const cookTime = Number(formData.cookTime);
        if (cookTime < 0) {
            newErrors.cookTime = 'Cook time cannot be negative';
        } else if (cookTime > 1440) {
            newErrors.cookTime = 'Cook time cannot exceed 24 hours (1440 minutes)';
        }

        // Servings validation: 1-100
        const servings = Number(formData.servings);
        if (servings < 1) {
            newErrors.servings = 'Servings must be at least 1';
        } else if (servings > 100) {
            newErrors.servings = 'Servings cannot exceed 100';
        }

        // Image URL validation (optional but must be valid if provided)
        if (formData.image && formData.image.trim()) {
            try {
                new URL(formData.image);
            } catch {
                newErrors.image = 'Please enter a valid URL';
            }
        }

        // Ingredients validation: at least 1 valid ingredient
        const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
        if (validIngredients.length === 0) {
            newErrors.ingredients = 'At least one ingredient with name and quantity is required';
        }

        // Check each ingredient for valid data
        ingredients.forEach((ing, idx) => {
            if (ing.name.trim() && !ing.quantity.trim()) {
                newErrors[`ingredient_${idx}`] = 'Quantity is required for each ingredient';
            }
            if (!ing.name.trim() && ing.quantity.trim()) {
                newErrors[`ingredient_${idx}`] = 'Ingredient name is required';
            }
        });

        // Instructions validation: at least 1 valid instruction
        const validInstructions = instructions.filter(inst => inst.trim());
        if (validInstructions.length === 0) {
            newErrors.instructions = 'At least one instruction step is required';
        }

        // Check instruction length
        instructions.forEach((inst, idx) => {
            if (inst.trim() && inst.trim().length < 5) {
                newErrors[`instruction_${idx}`] = 'Each instruction should be at least 5 characters';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);

        try {
            const userId = user._id || user.id;

            if (isEditMode && originalRecipe) {
                // Update existing recipe
                const updatedRecipe = {
                    ...formData,
                    prepTime: Number(formData.prepTime),
                    cookTime: Number(formData.cookTime),
                    servings: Number(formData.servings),
                    ingredients,
                    instructions,
                    images: [formData.image || originalRecipe.images?.[0] || 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&q=80'],
                    status: (originalRecipe.status === 'rejected' || originalRecipe.status === 'published') ? 'pending' : originalRecipe.status
                };
                await storage.saveRecipe({ ...updatedRecipe, id: originalRecipe._id || originalRecipe.id });
                if (originalRecipe.status === 'published') {
                    toast.info('Recipe updated — moved back to pending for admin review.');
                }
            } else {
                // Create new recipe
                const newRecipe = {
                    ...formData,
                    prepTime: Number(formData.prepTime),
                    cookTime: Number(formData.cookTime),
                    servings: Number(formData.servings),
                    ingredients,
                    instructions,
                    images: [formData.image || 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&q=80'],
                    authorId: userId,
                    category: formData.categories[0],
                };
                await storage.saveRecipe(newRecipe);
            }
            
            window.dispatchEvent(new CustomEvent('recipeUpdated'));
            navigate('/profile?tab=recipes');
        } catch (err) {
            toast.error(formatError(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (isGuest) {
        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-page-in">
                <h1 className="text-2xl font-bold text-charcoal">Login Required</h1>
                <p className="text-warm-gray-60">
                    You need an account to create and share recipes. Login or sign up to get started!
                </p>
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => navigate('/login')}>Login</Button>
                    <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
                </div>
            </div>
        );
    }

    if (!canInteract || isBlocked) {
        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-page-in">
                <h1 className="text-2xl font-bold text-charcoal">Access Restricted</h1>
                <p className={isSuspended ? "text-red-600" : "text-warm-gray-60"}>
                    {isSuspended
                        ? "Your account is suspended. You can browse recipes, but you can’t create or edit recipes."
                        : "Your account is pending approval. You can browse recipes as a guest, but you can’t create or edit recipes yet."}
                </p>
                <Button variant="outline" onClick={() => navigate('/')}>Back to Discover</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-page-in">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10" aria-label="Go back">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-charcoal">
                        {isEditMode ? 'Edit Recipe' : 'Share Your Recipe'}
                    </h1>
                    <p className="text-warm-gray-60">
                        {isEditMode ? 'Update your recipe details below.' : 'Fill in the details below. Pending approval by admin.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <Card>
                    <CardContent className="space-y-4 p-6">
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                        <div>
                            <Input id="title" label="Recipe Title" placeholder="e.g. Grandma's Apple Pie" value={formData.title} onChange={handleChange} required />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-warm-gray-60">Description</label>
                            <textarea
                                id="description"
                                className={cn('w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none', errors.description ? 'border-red-400' : 'border-warm-gray-30')}
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                            <div className="flex justify-between">
                                {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                                <span className="text-xs text-warm-gray-30 ml-auto">{formData.description.length}/500</span>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2">
                            <div>
                                <label className="text-sm font-medium text-warm-gray-60 mb-1 block">Categories (1–3)</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className={`w-full h-10 rounded-md border px-3 bg-white flex items-center justify-between text-sm focus:outline-none focus:ring-2 focus:ring-charcoal ${errors.categories ? 'border-red-400' : 'border-warm-gray-30'}`}
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    >
                                        <span className="text-left">
                                            {(formData.categories || []).length > 0
                                                ? (formData.categories || []).join(', ')
                                                : 'Select categories...'}
                                        </span>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showCategoryDropdown && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowCategoryDropdown(false)}
                                            />
                                            <div className="absolute z-20 mt-1 w-full rounded-md border border-warm-gray-30 bg-white shadow-lg max-h-64 overflow-auto">
                                                <div className="p-2 space-y-1">
                                                    {RECIPE_CATEGORIES.map(c => {
                                                        const checked = (formData.categories || []).includes(c);
                                                        const limitReached = (formData.categories || []).length >= 3 && !checked;
                                                        return (
                                                            <label
                                                                key={c}
                                                                className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-warm-gray-10 cursor-pointer text-sm ${limitReached ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded"
                                                                    checked={checked}
                                                                    disabled={limitReached}
                                                                    onChange={() => toggleCategory(c)}
                                                                />
                                                                <span>{c}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    {errors.categories && <p className="text-red-500 text-xs mt-1">{errors.categories}</p>}
                                    <span className="text-xs text-warm-gray-40 mt-1 ml-auto">{(formData.categories || []).length}/3 selected</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-warm-gray-60 mb-1 block">Difficulty</label>
                                <select id="difficulty" className="w-full h-10 rounded-lg border border-warm-gray-30 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent" value={formData.difficulty} onChange={handleChange}>
                                    {RECIPE_DIFFICULTIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <Input id="image" label="Image URL (optional)" placeholder="https://..." value={formData.image} onChange={handleChange} />
                            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                        </div>
                        <ImageUpload
                            label="Upload Recipe Image"
                            variant="recipe"
                            recipeId={isEditMode ? (originalRecipe?._id || originalRecipe?.id || id) : null}
                            value={formData.image}
                            onUploaded={(result) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    image: result?.imageUrl || prev.image,
                                }));
                            }}
                            onError={(message) => toast.error(message)}
                        />
                    </CardContent>
                </Card>

                {/* Times */}
                <Card>
                    <CardContent className="grid sm:grid-cols-3 gap-4 p-6">
                        <div>
                            <Input id="prepTime" label="Prep Time (min)" type="number" min="1" max="1440" value={formData.prepTime} onChange={handleChange} required />
                            {errors.prepTime && <p className="text-red-500 text-xs mt-1">{errors.prepTime}</p>}
                        </div>
                        <div>
                            <Input id="cookTime" label="Cook Time (min)" type="number" min="0" max="1440" value={formData.cookTime} onChange={handleChange} required />
                            {errors.cookTime && <p className="text-red-500 text-xs mt-1">{errors.cookTime}</p>}
                        </div>
                        <div>
                            <Input id="servings" label="Servings" type="number" min="1" max="100" value={formData.servings} onChange={handleChange} required />
                            {errors.servings && <p className="text-red-500 text-xs mt-1">{errors.servings}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Ingredients */}
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Ingredients</h3>
                            <Button type="button" size="sm" variant="outline" onClick={addIngredient}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                        </div>
                        {errors.ingredients && <p className="text-red-500 text-xs">{errors.ingredients}</p>}
                        {ingredients.map((ing, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex gap-2 items-start">
                                    <Input placeholder="Item (e.g. Flour)" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} className="flex" />
                                    <Input placeholder="Qty" value={ing.quantity} onChange={(e) => updateIngredient(i, 'quantity', e.target.value)} className="flex w-24" />
                                    <Input placeholder="Unit" value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} className="flex w-24" />
                                    {ingredients.length > 1 && (
                                        <Button type="button" size="icon" variant="ghost" onClick={() => removeIngredient(i)} className="text-red-500 hover:text-red-600" aria-label={`Remove ingredient ${i + 1}`}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {errors[`ingredient_${i}`] && <p className="text-red-500 text-xs">{errors[`ingredient_${i}`]}</p>}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Instructions</h3>
                            <Button type="button" size="sm" variant="outline" onClick={addInstruction}><Plus className="h-4 w-4 mr-1" /> Add Step</Button>
                        </div>
                        {errors.instructions && <p className="text-red-500 text-xs">{errors.instructions}</p>}
                        {instructions.map((step, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex gap-2 items-start">
                                    <span className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-brand-accent text-white text-xs font-bold mt-2">{i + 1}</span>
                                    <textarea
                                        className={cn('flex-1 rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none', errors[`instruction_${i}`] ? 'border-red-400' : 'border-warm-gray-30')}
                                        rows={2}
                                        placeholder={`Step ${i + 1}...`}
                                        value={step}
                                        onChange={(e) => updateInstruction(i, e.target.value)}
                                    />
                                    {instructions.length > 1 && (
                                        <Button type="button" size="icon" variant="ghost" onClick={() => removeInstruction(i)} className="text-red-500 hover:text-red-600 mt-1" aria-label={`Remove step ${i + 1}`}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {errors[`instruction_${i}`] && <p className="text-red-500 text-xs ml-8">{errors[`instruction_${i}`]}</p>}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 items-center">
                    <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button type="submit" size="lg" isLoading={isLoading}>
                        {isEditMode ? 'Update Recipe' : 'Submit Recipe'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
