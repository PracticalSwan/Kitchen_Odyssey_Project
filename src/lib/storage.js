// Simple ID Generator
const generateId = () => Math.random().toString(36).substring(2, 11);

const STORAGE_KEYS = {
    USERS: 'cookhub_users',
    RECIPES: 'cookhub_recipes',
    CURRENT_USER: 'cookhub_current_user',
    GUEST_ID: 'cookhub_guest_id',
    REVIEWS: 'cookhub_reviews',
    SEARCH_HISTORY: 'cookhub_search_history',
    DAILY_STATS: 'cookhub_daily_stats',
    ACTIVITY: 'cookhub_activity'
};

// Helper to get today's date string (YYYY-MM-DD)
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Default avatar options
const DEFAULT_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=chef1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=chef2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=baker',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=cook',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=gourmet'
];

const SEED_DATA = {
    users: [
        {
            id: 'admin-1',
            username: 'Admin User',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@cookhub.com',
            password: 'admin',
            birthday: '1990-01-01',
            role: 'admin',
            status: 'inactive',
            joinedDate: new Date().toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            bio: 'System Administrator',
            location: 'Server Room',
            cookingLevel: 'Professional',
            favorites: [],
            viewedRecipes: []
        },
        {
            id: 'admin-2',
            username: 'Olivia Admin',
            firstName: 'Olivia',
            lastName: 'Nguyen',
            email: 'olivia@cookhub.com',
            password: 'admin',
            birthday: '1986-04-12',
            role: 'admin',
            status: 'inactive',
            joinedDate: new Date('2025-09-01').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia-admin',
            bio: 'Content moderation lead.',
            location: 'Boston',
            cookingLevel: 'Advanced',
            favorites: [],
            viewedRecipes: []
        },
        {
            id: 'admin-3',
            username: 'Marcus Admin',
            firstName: 'Marcus',
            lastName: 'Lee',
            email: 'marcus@cookhub.com',
            password: 'admin',
            birthday: '1983-11-22',
            role: 'admin',
            status: 'inactive',
            joinedDate: new Date('2025-10-05').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus-admin',
            bio: 'Operations admin.',
            location: 'Seattle',
            cookingLevel: 'Intermediate',
            favorites: [],
            viewedRecipes: []
        },
        {
            id: 'user-1',
            username: 'John Doe',
            firstName: 'John',
            lastName: 'Doe',
            email: 'user@cookhub.com',
            password: 'user',
            birthday: '1995-06-15',
            role: 'user',
            status: 'inactive',
            joinedDate: new Date('2025-06-15').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
            bio: 'Love cooking italian food!',
            location: 'New York',
            cookingLevel: 'Intermediate',
            favorites: ['recipe-3'],
            viewedRecipes: ['recipe-1', 'recipe-3']
        },
        {
            id: 'user-2',
            username: 'Maria Garcia',
            firstName: 'Maria',
            lastName: 'Garcia',
            email: 'maria@cookhub.com',
            password: 'maria123',
            birthday: '1988-03-20',
            role: 'user',
            status: 'inactive',
            joinedDate: new Date('2025-03-20').toISOString(),
            lastActive: new Date(Date.now() - 86400000 * 7).toISOString(),
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
            bio: 'Professional chef specializing in Mediterranean cuisine.',
            location: 'Los Angeles',
            cookingLevel: 'Professional',
            favorites: ['recipe-1'],
            viewedRecipes: ['recipe-1', 'recipe-4']
        },
        {
            id: 'user-3',
            username: 'Tom Baker',
            firstName: 'Tom',
            lastName: 'Baker',
            email: 'tom@cookhub.com',
            password: 'tom123',
            birthday: '1992-08-01',
            role: 'user',
            status: 'suspended',
            joinedDate: new Date('2025-08-01').toISOString(),
            lastActive: new Date(Date.now() - 86400000 * 30).toISOString(),
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom',
            bio: 'Passionate about baking and desserts!',
            location: 'Chicago',
            cookingLevel: 'Intermediate',
            favorites: ['recipe-1', 'recipe-5'],
            viewedRecipes: ['recipe-1', 'recipe-5']
        },
        {
            id: 'user-4',
            username: 'Amy Wilson',
            firstName: 'Amy',
            lastName: 'Wilson',
            email: 'amy@cookhub.com',
            password: 'amy123',
            birthday: '1998-11-10',
            role: 'user',
            status: 'pending',
            joinedDate: new Date('2025-11-10').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amy',
            bio: 'New to the platform.',
            location: 'Denver',
            cookingLevel: 'Beginner',
            favorites: [],
            viewedRecipes: []
        },
        {
            id: 'user-5',
            username: 'Kevin Tran',
            firstName: 'Kevin',
            lastName: 'Tran',
            email: 'kevin@cookhub.com',
            password: 'kevin123',
            birthday: '1996-02-18',
            role: 'user',
            status: 'pending',
            joinedDate: new Date('2026-01-20').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin',
            bio: 'Here to learn quick meals.',
            location: 'Austin',
            cookingLevel: 'Beginner',
            favorites: [],
            viewedRecipes: []
        },
        {
            id: 'user-6',
            username: 'Sarah Kim',
            firstName: 'Sarah',
            lastName: 'Kim',
            email: 'sarah@cookhub.com',
            password: 'sarah123',
            birthday: '1991-07-09',
            role: 'user',
            status: 'inactive',
            joinedDate: new Date('2025-12-28').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
            bio: 'Healthy meal prep enthusiast.',
            location: 'San Diego',
            cookingLevel: 'Intermediate',
            favorites: ['recipe-1', 'recipe-3'],
            viewedRecipes: ['recipe-1', 'recipe-3', 'recipe-8']
        },
        {
            id: 'user-7',
            username: 'Daniel Rivera',
            firstName: 'Daniel',
            lastName: 'Rivera',
            email: 'daniel@cookhub.com',
            password: 'daniel123',
            birthday: '1989-05-30',
            role: 'user',
            status: 'inactive',
            joinedDate: new Date('2025-12-05').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=daniel',
            bio: 'Street food lover.',
            location: 'Miami',
            cookingLevel: 'Advanced',
            favorites: ['recipe-5'],
            viewedRecipes: ['recipe-5', 'recipe-7']
        },
        {
            id: 'user-8',
            username: 'Lina Patel',
            firstName: 'Lina',
            lastName: 'Patel',
            email: 'lina@cookhub.com',
            password: 'lina123',
            birthday: '2000-09-14',
            role: 'user',
            status: 'inactive',
            joinedDate: new Date('2025-11-01').toISOString(),
            lastActive: new Date(Date.now() - 86400000 * 10).toISOString(),
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina',
            bio: 'Baking beginner.',
            location: 'Portland',
            cookingLevel: 'Beginner',
            favorites: [],
            viewedRecipes: ['recipe-2']
        },
        {
            id: 'user-9',
            username: 'Omar Hassan',
            firstName: 'Omar',
            lastName: 'Hassan',
            email: 'omar@cookhub.com',
            password: 'omar123',
            birthday: '1993-03-03',
            role: 'user',
            status: 'pending',
            joinedDate: new Date('2026-01-21').toISOString(),
            lastActive: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=omar',
            bio: 'Trying new cuisines.',
            location: 'Phoenix',
            cookingLevel: 'Beginner',
            favorites: [],
            viewedRecipes: []
        }
    ],
    recipes: [
        {
            id: 'recipe-1',
            title: 'Classic Spaghetti Carbonara',
            description: 'A traditional Italian pasta dish from Rome with creamy egg sauce and crispy pancetta.',
            category: 'Italian',
            prepTime: 15,
            cookTime: 20,
            servings: 4,
            difficulty: 'Medium',
            ingredients: [
                { name: 'Spaghetti', quantity: '400', unit: 'g' },
                { name: 'Eggs', quantity: '4', unit: '' },
                { name: 'Pancetta', quantity: '200', unit: 'g' },
                { name: 'Parmesan', quantity: '100', unit: 'g' }
            ],
            instructions: ['Boil water and cook pasta al dente', 'Fry pancetta until crispy', 'Mix eggs with grated parmesan', 'Combine hot pasta with egg mixture off heat', 'Add pancetta and serve immediately'],
            images: ['https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-1',
            status: 'published',
            createdAt: new Date('2025-12-01').toISOString(),
            likedBy: ['user-2', 'user-3'],
            viewedBy: ['user-1', 'user-2', 'user-3']
        },
        {
            id: 'recipe-2',
            title: 'Fluffy Pancakes',
            description: 'Light and fluffy pancakes perfect for a weekend breakfast.',
            category: 'Breakfast',
            prepTime: 10,
            cookTime: 15,
            servings: 2,
            difficulty: 'Easy',
            ingredients: [
                { name: 'Flour', quantity: '200', unit: 'g' },
                { name: 'Milk', quantity: '250', unit: 'ml' },
                { name: 'Eggs', quantity: '2', unit: '' },
                { name: 'Sugar', quantity: '2', unit: 'tbsp' }
            ],
            instructions: ['Mix dry ingredients', 'Add wet ingredients and whisk', 'Cook on medium heat until bubbles form', 'Flip and cook other side'],
            images: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-1',
            status: 'pending',
            createdAt: new Date('2026-01-15').toISOString(),
            likedBy: [],
            viewedBy: []
        },
        {
            id: 'recipe-3',
            title: 'Thai Green Curry',
            description: 'Aromatic and spicy Thai green curry with vegetables and coconut milk.',
            category: 'Asian',
            prepTime: 20,
            cookTime: 25,
            servings: 4,
            difficulty: 'Medium',
            ingredients: [
                { name: 'Green curry paste', quantity: '3', unit: 'tbsp' },
                { name: 'Coconut milk', quantity: '400', unit: 'ml' },
                { name: 'Chicken breast', quantity: '500', unit: 'g' },
                { name: 'Thai basil', quantity: '1', unit: 'bunch' }
            ],
            instructions: ['Fry curry paste in oil', 'Add coconut milk and bring to simmer', 'Add chicken and vegetables', 'Cook until chicken is done', 'Garnish with Thai basil'],
            images: ['https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-2',
            status: 'published',
            createdAt: new Date('2025-11-20').toISOString(),
            likedBy: ['user-1'],
            viewedBy: ['user-1']
        },
        {
            id: 'recipe-4',
            title: 'Avocado Toast',
            description: 'Simple yet delicious avocado toast with poached eggs and chili flakes.',
            category: 'Breakfast',
            prepTime: 5,
            cookTime: 10,
            servings: 2,
            difficulty: 'Easy',
            ingredients: [
                { name: 'Avocado', quantity: '2', unit: '' },
                { name: 'Sourdough bread', quantity: '4', unit: 'slices' },
                { name: 'Eggs', quantity: '4', unit: '' },
                { name: 'Chili flakes', quantity: '1', unit: 'tsp' }
            ],
            instructions: ['Toast the bread until golden', 'Mash avocado and season', 'Poach eggs in simmering water', 'Spread avocado on toast', 'Top with poached eggs and chili'],
            images: ['https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-2',
            status: 'published',
            createdAt: new Date('2025-10-15').toISOString(),
            likedBy: [],
            viewedBy: ['user-2']
        },
        {
            id: 'recipe-5',
            title: 'Chocolate Lava Cake',
            description: 'Decadent chocolate cake with a molten center. Perfect for dessert lovers.',
            category: 'Dessert',
            prepTime: 15,
            cookTime: 12,
            servings: 4,
            difficulty: 'Hard',
            ingredients: [
                { name: 'Dark chocolate', quantity: '200', unit: 'g' },
                { name: 'Butter', quantity: '100', unit: 'g' },
                { name: 'Eggs', quantity: '4', unit: '' },
                { name: 'Sugar', quantity: '100', unit: 'g' }
            ],
            instructions: ['Melt chocolate and butter together', 'Whisk eggs and sugar until fluffy', 'Fold chocolate into egg mixture', 'Pour into ramekins', 'Bake at 200°C for 12 minutes'],
            images: ['https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-3',
            status: 'published',
            createdAt: new Date('2025-09-05').toISOString(),
            likedBy: ['user-3'],
            viewedBy: ['user-3']
        },
        {
            id: 'recipe-7',
            title: 'Classic Beef Burger',
            description: 'Juicy homemade beef burger with all the fixings.',
            category: 'Dinner',
            prepTime: 20,
            cookTime: 15,
            servings: 4,
            difficulty: 'Medium',
            ingredients: [
                { name: 'Ground beef', quantity: '500', unit: 'g' },
                { name: 'Burger buns', quantity: '4', unit: '' },
                { name: 'Cheese slices', quantity: '4', unit: '' },
                { name: 'Lettuce', quantity: '4', unit: 'leaves' }
            ],
            instructions: ['Form beef into patties', 'Season with salt and pepper', 'Grill or pan-fry for 4-5 min per side', 'Toast buns', 'Assemble with toppings'],
            images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-3',
            status: 'published',
            createdAt: new Date('2025-08-10').toISOString(),
            likedBy: ['user-1', 'user-2', 'user-3'],
            viewedBy: ['user-1', 'user-2', 'user-3']
        },
        {
            id: 'recipe-8',
            title: 'Mango Sticky Rice',
            description: 'Traditional Thai dessert with sweet coconut sticky rice and fresh mango.',
            category: 'Dessert',
            prepTime: 30,
            cookTime: 25,
            servings: 4,
            difficulty: 'Medium',
            ingredients: [
                { name: 'Sticky rice', quantity: '300', unit: 'g' },
                { name: 'Coconut milk', quantity: '400', unit: 'ml' },
                { name: 'Ripe mango', quantity: '2', unit: '' },
                { name: 'Palm sugar', quantity: '100', unit: 'g' }
            ],
            instructions: ['Soak sticky rice overnight', 'Steam rice until tender', 'Heat coconut milk with sugar', 'Pour half over rice', 'Serve with sliced mango and remaining sauce'],
            images: ['https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-2',
            status: 'published',
            createdAt: new Date('2025-07-25').toISOString(),
            likedBy: ['user-2'],
            viewedBy: ['user-2']
        },
        {
            id: 'recipe-9',
            title: 'Lemon Garlic Salmon',
            description: 'Oven-baked salmon with lemon, garlic, and fresh herbs.',
            category: 'Dinner',
            prepTime: 10,
            cookTime: 18,
            servings: 2,
            difficulty: 'Easy',
            ingredients: [
                { name: 'Salmon fillets', quantity: '2', unit: '' },
                { name: 'Lemon', quantity: '1', unit: '' },
                { name: 'Garlic', quantity: '3', unit: 'cloves' },
                { name: 'Olive oil', quantity: '2', unit: 'tbsp' }
            ],
            instructions: ['Preheat oven to 200°C', 'Season salmon with garlic, lemon, and oil', 'Bake for 15-18 minutes', 'Serve with herbs'],
            images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-6',
            status: 'published',
            createdAt: new Date('2026-01-05').toISOString(),
            likedBy: ['user-1'],
            viewedBy: ['user-1', 'user-6']
        },
        {
            id: 'recipe-10',
            title: 'Chickpea Salad Wrap',
            description: 'Fresh and crunchy chickpea salad wrapped in a tortilla.',
            category: 'Lunch',
            prepTime: 12,
            cookTime: 0,
            servings: 2,
            difficulty: 'Easy',
            ingredients: [
                { name: 'Chickpeas', quantity: '200', unit: 'g' },
                { name: 'Greek yogurt', quantity: '3', unit: 'tbsp' },
                { name: 'Celery', quantity: '2', unit: 'stalks' },
                { name: 'Tortillas', quantity: '2', unit: '' }
            ],
            instructions: ['Mash chickpeas lightly', 'Mix with yogurt and chopped celery', 'Wrap in tortilla and serve'],
            images: ['https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-7',
            status: 'published',
            createdAt: new Date('2025-12-12').toISOString(),
            likedBy: ['user-2', 'user-6'],
            viewedBy: ['user-2', 'user-6', 'user-7']
        },
        {
            id: 'recipe-11',
            title: 'Blueberry Overnight Oats',
            description: 'No-cook breakfast with oats, yogurt, and blueberries.',
            category: 'Breakfast',
            prepTime: 8,
            cookTime: 0,
            servings: 1,
            difficulty: 'Easy',
            ingredients: [
                { name: 'Rolled oats', quantity: '50', unit: 'g' },
                { name: 'Greek yogurt', quantity: '120', unit: 'ml' },
                { name: 'Blueberries', quantity: '80', unit: 'g' },
                { name: 'Honey', quantity: '1', unit: 'tsp' }
            ],
            instructions: ['Mix oats and yogurt', 'Top with blueberries', 'Chill overnight', 'Drizzle honey before serving'],
            images: ['https://images.unsplash.com/photo-1502741126161-b048400dcca2?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-6',
            status: 'pending',
            createdAt: new Date('2026-01-18').toISOString(),
            likedBy: [],
            viewedBy: []
        },
        {
            id: 'recipe-12',
            title: 'Spicy Tofu Stir-Fry',
            description: 'Quick stir-fry with tofu, bell peppers, and spicy sauce.',
            category: 'Asian',
            prepTime: 15,
            cookTime: 10,
            servings: 3,
            difficulty: 'Medium',
            ingredients: [
                { name: 'Tofu', quantity: '400', unit: 'g' },
                { name: 'Bell peppers', quantity: '2', unit: '' },
                { name: 'Soy sauce', quantity: '2', unit: 'tbsp' },
                { name: 'Chili sauce', quantity: '1', unit: 'tbsp' }
            ],
            instructions: ['Press and cube tofu', 'Stir-fry tofu until golden', 'Add peppers and sauce', 'Serve hot'],
            images: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-7',
            status: 'rejected',
            createdAt: new Date('2025-11-22').toISOString(),
            likedBy: [],
            viewedBy: ['user-7']
        },
        {
            id: 'recipe-13',
            title: 'Tomato Basil Soup',
            description: 'Creamy tomato soup with fresh basil and croutons.',
            category: 'Dinner',
            prepTime: 10,
            cookTime: 25,
            servings: 4,
            difficulty: 'Easy',
            ingredients: [
                { name: 'Tomatoes', quantity: '800', unit: 'g' },
                { name: 'Onion', quantity: '1', unit: '' },
                { name: 'Cream', quantity: '100', unit: 'ml' },
                { name: 'Basil', quantity: '1', unit: 'bunch' }
            ],
            instructions: ['Saute onion', 'Add tomatoes and simmer', 'Blend and add cream', 'Garnish with basil'],
            images: ['https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-1',
            status: 'published',
            createdAt: new Date('2025-10-30').toISOString(),
            likedBy: ['user-3'],
            viewedBy: ['user-1', 'user-3', 'user-6']
        },
        {
            id: 'recipe-14',
            title: 'Crispy Fish Tacos',
            description: 'Crispy fish with slaw and lime crema in warm tortillas.',
            category: 'Dinner',
            prepTime: 20,
            cookTime: 15,
            servings: 3,
            difficulty: 'Medium',
            ingredients: [
                { name: 'White fish', quantity: '400', unit: 'g' },
                { name: 'Tortillas', quantity: '6', unit: '' },
                { name: 'Cabbage', quantity: '150', unit: 'g' },
                { name: 'Lime', quantity: '1', unit: '' }
            ],
            instructions: ['Season and fry fish', 'Prepare slaw', 'Assemble tacos', 'Serve with lime crema'],
            images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800'],
            authorId: 'user-7',
            status: 'published',
            createdAt: new Date('2026-01-10').toISOString(),
            likedBy: ['user-2', 'user-6'],
            viewedBy: ['user-2', 'user-6', 'user-7']
        }
    ]
};

export { DEFAULT_AVATARS };

export const storage = {
    initialize: () => {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_DATA.users));
        }
        if (!localStorage.getItem(STORAGE_KEYS.RECIPES)) {
            localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(SEED_DATA.recipes));
        }
    },

    getUsers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),

    getRecipes: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES) || '[]'),

    saveUser: (user) => {
        const users = storage.getUsers();
        const existing = users.findIndex(u => u.id === user.id);
        if (existing >= 0) {
            users[existing] = user;
        } else {
            users.push(user);
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },

    saveRecipe: (recipe) => {
        const recipes = storage.getRecipes();
        const existing = recipes.findIndex(r => r.id === recipe.id);
        if (existing >= 0) {
            recipes[existing] = recipe;
        } else {
            recipes.push(recipe);
        }
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    },

    deleteUser: (userId) => {
        const users = storage.getUsers();
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    },

    login: (email, password) => {
        const users = storage.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            // Only toggle active/inactive users; keep pending/suspended users as-is
            storage.recordActiveUser(user.id);
            user.lastActive = new Date().toISOString();
            if (user.status === 'active' || user.status === 'inactive') {
                user.status = 'active';
            }
            storage.saveUser(user);
            storage.setCurrentUser(user);
            return user;
        }
        throw new Error('Invalid credentials');
    },

    getCurrentUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null'),

    setCurrentUser: (user) => {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    },

    getOrCreateGuestId: () => {
        const existing = localStorage.getItem(STORAGE_KEYS.GUEST_ID);
        if (existing) return existing;
        const guestId = `guest-${generateId()}`;
        localStorage.setItem(STORAGE_KEYS.GUEST_ID, guestId);
        return guestId;
    },

    updateLastActive: (userId, timestamp = new Date().toISOString()) => {
        if (!userId) return;
        const users = storage.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const updatedUser = { ...user, lastActive: timestamp };
        storage.saveUser(updatedUser);

        const currentUser = storage.getCurrentUser();
        if (currentUser?.id === userId) {
            storage.setCurrentUser(updatedUser);
        }
    },

    logout: (userId) => {
        // Set user to inactive on logout (only if currently active/inactive)
        if (userId) {
            const users = storage.getUsers();
            const user = users.find(u => u.id === userId);
            if (user) {
                if (user.status === 'active' || user.status === 'inactive') {
                    user.status = 'inactive';
                }
                storage.saveUser(user);
            }
        }
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    getReviews: (recipeId) => {
        const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]');
        if (recipeId) return reviews.filter(r => r.recipeId === recipeId);
        return reviews;
    },

    getSearchHistory: (userId) => {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
        if (userId) return history.filter(h => h.userId === userId);
        return history;
    },

    // Remove all search history entries for a user (guest or user)
    clearSearchHistory: (userId) => {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
        let resolvedUserId = userId;
        if (!resolvedUserId) {
            const currentUser = storage.getCurrentUser();
            resolvedUserId = currentUser?.id || `guest:${storage.getOrCreateGuestId()}`;
        }
        const filtered = history.filter(h => h.userId !== resolvedUserId);
        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(filtered));
        return filtered;
    },

    addSearchHistory: ({ userId, query }) => {
        const trimmedQuery = (query || '').trim();
        // Don't save empty searches
        if (!trimmedQuery) {
            return null;
        }

        const history = storage.getSearchHistory();
        let resolvedUserId = userId;

        if (!resolvedUserId) {
            const currentUser = storage.getCurrentUser();
            resolvedUserId = currentUser?.id || `guest:${storage.getOrCreateGuestId()}`;
        }

        const record = {
            id: `search-${Date.now()}`,
            userId: resolvedUserId,
            query: trimmedQuery,
            createdAt: new Date().toISOString()
        };

        // Add to beginning
        history.unshift(record);

        // Remove duplicates (same query by same user) - keep newest
        const uniqueHistory = history.filter((item, index, self) => {
            return index === self.findIndex((t) => (
                t.query === item.query &&
                t.userId === item.userId
            ));
        });

        // Limit to 10 items per user (do not affect other users' history)
        let userCount = 0;
        const limitedHistory = uniqueHistory.filter(item => {
            if (item.userId !== resolvedUserId) return true;
            userCount += 1;
            return userCount <= 10;
        });

        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(limitedHistory));
        return record;
    },

    getAverageRating: (recipeId) => {
        const reviews = storage.getReviews(recipeId);
        if (!reviews.length) return 0;
        return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    },

    addReview: (review) => {
        const reviews = storage.getReviews();
        const existingIndex = reviews.findIndex(r => r.recipeId === review.recipeId && r.userId === review.userId);
        const nextReview = { ...review, id: `review-${Date.now()}`, createdAt: new Date().toISOString() };
        if (existingIndex >= 0) {
            reviews[existingIndex] = { ...reviews[existingIndex], ...nextReview };
        } else {
            reviews.push(nextReview);
        }
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    },

    // Toggle favorite: add/remove recipe from user's favorites
    toggleFavorite: (userId, recipeId) => {
        const users = storage.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return false;

        if (!user.favorites) user.favorites = [];
        const index = user.favorites.indexOf(recipeId);
        if (index >= 0) {
            user.favorites.splice(index, 1);
        } else {
            user.favorites.push(recipeId);
        }
        storage.saveUser(user);
        // Also update current user session
        const currentUser = storage.getCurrentUser();
        if (currentUser?.id === userId) {
            storage.setCurrentUser(user);
        }
        return user.favorites.includes(recipeId);
    },

    // Toggle like: add/remove user from recipe's likedBy
    toggleLike: (userId, recipeId) => {
        const recipes = storage.getRecipes();
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return { liked: false, count: 0 };

        if (!recipe.likedBy) recipe.likedBy = [];
        const index = recipe.likedBy.indexOf(userId);
        if (index >= 0) {
            recipe.likedBy.splice(index, 1);
        } else {
            recipe.likedBy.push(userId);
        }
        storage.saveRecipe(recipe);
        return { liked: recipe.likedBy.includes(userId), count: recipe.likedBy.length };
    },

    // Record view: add viewer to recipe's viewedBy if not already present
    // Guest views are excluded from all metrics (viewedBy, daily_stats)
    recordView: (viewerIdOrOptions, recipeIdMaybe) => {
        let viewerId = null;
        let recipeId = null;
        let viewerType = 'user';

        if (typeof viewerIdOrOptions === 'object' && viewerIdOrOptions !== null) {
            viewerId = viewerIdOrOptions.viewerId;
            recipeId = viewerIdOrOptions.recipeId;
            viewerType = viewerIdOrOptions.viewerType || 'user';
        } else {
            viewerId = viewerIdOrOptions;
            recipeId = recipeIdMaybe;
        }

        if (!viewerId || !recipeId) return 0;

        const recipes = storage.getRecipes();
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return 0;

        // Guest views: return current count without recording anything
        if (viewerType === 'guest' || (typeof viewerId === 'string' && viewerId.startsWith('guest-'))) {
            return recipe.viewedBy?.length || 0;
        }

        const viewerKey = viewerId;
        if (!recipe.viewedBy) recipe.viewedBy = [];
        if (!recipe.viewedBy.includes(viewerKey)) {
            recipe.viewedBy.push(viewerKey);
            storage.saveRecipe(recipe);
        }
        const allStats = storage.getDailyStats();
        const today = getTodayKey();
        if (!allStats[today]) {
            allStats[today] = { newUsers: [], newContributors: [], activeUsers: [], views: [] };
        }
        if (!allStats[today].views) {
            allStats[today].views = [];
        }
        const alreadyViewedToday = allStats[today].views.some(v => v.viewerKey === viewerKey && v.recipeId === recipeId);
        if (!alreadyViewedToday) {
            allStats[today].views.push({ viewerKey, viewerType, recipeId, viewedAt: new Date().toISOString() });
            localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(allStats));
        }
        return recipe.viewedBy.length;
    },

    // Get like count for a recipe
    getLikeCount: (recipeId) => {
        const recipes = storage.getRecipes();
        const recipe = recipes.find(r => r.id === recipeId);
        return recipe?.likedBy?.length || 0;
    },

    // Check if user has liked a recipe
    hasUserLiked: (userId, recipeId) => {
        const recipes = storage.getRecipes();
        const recipe = recipes.find(r => r.id === recipeId);
        return recipe?.likedBy?.includes(userId) || false;
    },

    // Check if user has favorited a recipe
    hasUserFavorited: (userId, recipeId) => {
        const users = storage.getUsers();
        const user = users.find(u => u.id === userId);
        return user?.favorites?.includes(recipeId) || false;
    },

    // Get view count for a recipe
    getViewCount: (recipeId) => {
        const recipes = storage.getRecipes();
        const recipe = recipes.find(r => r.id === recipeId);
        return recipe?.viewedBy?.length || 0;
    },

    // Delete a recipe by ID
    deleteRecipe: (recipeId) => {
        const recipes = storage.getRecipes().filter(r => r.id !== recipeId);
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
        // Also clean up any reviews for this recipe
        const reviews = storage.getReviews().filter(r => r.recipeId !== recipeId);
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
        // Remove deleted recipe from user favorites
        const users = storage.getUsers().map(user => ({
            ...user,
            favorites: (user.favorites || []).filter(id => id !== recipeId)
        }));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },

    // Delete a review by ID
    deleteReview: (reviewId) => {
        const reviews = storage.getReviews().filter(r => r.id !== reviewId);
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    },

    // Get a single recipe by ID
    getRecipeById: (recipeId) => {
        const recipes = storage.getRecipes();
        return recipes.find(r => r.id === recipeId) || null;
    },

    // Clear all data and re-seed (for testing)
    resetData: () => {
        localStorage.removeItem(STORAGE_KEYS.USERS);
        localStorage.removeItem(STORAGE_KEYS.RECIPES);
        localStorage.removeItem(STORAGE_KEYS.REVIEWS);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.DAILY_STATS);
        localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
        storage.initialize();
    },

    // Get daily stats object (keyed by date)
    getDailyStats: () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_STATS) || '{}');
    },

    // Record a new user registration (no-op for guest IDs)
    recordNewUser: (userId, role = 'user') => {
        if (!userId || (typeof userId === 'string' && userId.startsWith('guest-'))) return;
        const allStats = storage.getDailyStats();
        const today = getTodayKey();

        if (!allStats[today]) {
            allStats[today] = { newUsers: [], newContributors: [], activeUsers: [], views: [] };
        }

        if (!allStats[today].newUsers.includes(userId)) {
            allStats[today].newUsers.push(userId);
        }

        // If user is a contributor (non-admin role that can create recipes)
        if (role === 'user' && !allStats[today].newContributors.includes(userId)) {
            allStats[today].newContributors.push(userId);
        }

        localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(allStats));
    },

    // Record an active user (DAU tracking, no-op for guest IDs)
    recordActiveUser: (userId) => {
        if (!userId || (typeof userId === 'string' && userId.startsWith('guest-'))) return;
        const allStats = storage.getDailyStats();
        const today = getTodayKey();

        if (!allStats[today]) {
            allStats[today] = { newUsers: [], newContributors: [], activeUsers: [], views: [] };
        }

        if (!allStats[today].activeUsers.includes(userId)) {
            allStats[today].activeUsers.push(userId);
        }

        localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(allStats));
    },

    // Get new users count for today (using date comparison against joinedDate)
    getNewUsersToday: () => {
        const users = storage.getUsers();
        const today = getTodayKey();
        return users.filter(u => u.joinedDate && u.joinedDate.startsWith(today));
    },

    // Get new contributors today (non-admin users joined today)
    getNewContributorsToday: () => {
        const users = storage.getUsers();
        const today = getTodayKey();
        return users.filter(u => u.role === 'user' && u.joinedDate && u.joinedDate.startsWith(today));
    },

    // Get daily active users (users who logged in today)
    getDailyActiveUsers: () => {
        const users = storage.getUsers();
        const today = getTodayKey();
        return users.filter(u => u.lastActive && u.lastActive.startsWith(today));
    },

    // Get daily views (recipes viewed today - sum of all recipe viewedBy where view was today)
    getDailyViews: () => {
        const allStats = storage.getDailyStats();
        const today = getTodayKey();
        const todayStats = allStats[today];
        return todayStats?.views?.length || 0;
    },

    // Activity log helpers
    addActivity: (activity) => {
        const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
        const entry = {
            id: `activity-${Date.now()}-${generateId()}`,
            time: new Date().toISOString(),
            ...activity
        };
        entries.unshift(entry);
        localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(entries.slice(0, 200)));
        return entry;
    },

    getRecentActivity: (limit = 5) => {
        const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
        return entries
            .filter(activity => activity.time)
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, Math.max(1, limit));
    },

    // Random recipe suggestion with quality constraints
    getRandomSuggestion: () => {
        const recipes = storage.getRecipes().filter(r => r.status === 'published');
        if (recipes.length === 0) return null;

        // Filter by quality constraints: >= 5 likes AND >= 1 review
        const qualityRecipes = recipes.filter(r => {
            const likeCount = r.likedBy?.length || 0;
            const reviewCount = storage.getReviews(r.id)?.length || 0;
            return likeCount >= 5 && reviewCount >= 1;
        });

        const pool = qualityRecipes.length > 0 ? qualityRecipes : recipes;
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    }
};
