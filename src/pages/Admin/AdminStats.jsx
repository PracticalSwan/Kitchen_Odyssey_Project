import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { storage } from '../../lib/storage';
import { Users, FileText, Activity, UserPlus, Heart, AlertTriangle, CalendarDays, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { normalizeCategories } from '../../lib/utils';

// StatCard component moved outside to prevent recreation on each render
const StatCard = ({ title, value, icon, subtext, accent = 'blue', warning = false }) => {
    const Icon = icon;

    const accentStyles = {
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        green: 'bg-emerald-50 text-emerald-600',
        pink: 'bg-pink-50 text-pink-600'
    };

    return (
        <Card className={warning ? 'border-amber-300' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-cool-gray-60">
                    {title}
                </CardTitle>
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accentStyles[accent] || accentStyles.blue}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="text-3xl font-bold text-cool-gray-90">{value}</div>
                {subtext && (
                    <p className={`mt-1 text-xs ${warning ? 'text-amber-600 font-medium' : 'text-cool-gray-60'}`}>
                        {warning && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
                        {subtext}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export function AdminStats() {
    const navigate = useNavigate();
    const todayLabel = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });

    const [stats, setStats] = useState({
        totalUsers: 0,
        activeRecipes: 0,
        publishedRecipes: 0,
        pendingRecipes: 0,
        dailyLikes: 0,
        recentActivity: []
    });
    const [categoryTrend, setCategoryTrend] = useState([]);

    const topCategory = categoryTrend[0];
    const hasPendingRecipes = stats.pendingRecipes > 0;
    const proTipMessage = hasPendingRecipes
        ? `You have ${stats.pendingRecipes} pending recipe${stats.pendingRecipes > 1 ? 's' : ''}. Reviewing them now helps keep fresh content visible on the feed.`
        : topCategory
            ? `Your strongest category is ${topCategory.category} with ${topCategory.recipes} published recipes. Feature this category to boost engagement.`
            : 'No category trends yet. Approve and publish more recipes to unlock actionable insights here.';
    const proTipActionLabel = hasPendingRecipes ? 'Review Pending Recipes' : 'Manage Recipes';

    useEffect(() => {
        const loadStats = () => {
            const users = storage.getUsers();
            const recipes = storage.getRecipes();

            const publishedRecipes = recipes.filter(r => r.status === 'published');
            const activeRecipes = publishedRecipes.filter(r => (r.viewedBy?.length || 0) > 0 || (r.likedBy?.length || 0) > 0).length;

            const dailyLikes = publishedRecipes.reduce((acc, recipe) => {
                const likedBy = recipe.likedBy || [];
                return acc + likedBy.length;
            }, 0);

            const trendMap = new Map();
            publishedRecipes.forEach((recipe) => {
                const primaryCategory = normalizeCategories(recipe.categories ?? recipe.category)[0] || 'Other';
                const previous = trendMap.get(primaryCategory) || { recipes: 0, likes: 0 };
                trendMap.set(primaryCategory, {
                    recipes: previous.recipes + 1,
                    likes: previous.likes + (recipe.likedBy?.length || 0)
                });
            });

            const trendRows = Array.from(trendMap.entries())
                .map(([category, data]) => ({
                    category,
                    recipes: data.recipes,
                    likes: data.likes,
                    score: data.recipes * 2 + data.likes
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 4);

            setStats({
                totalUsers: users.filter(u => u.role !== 'admin').length,
                activeRecipes,
                publishedRecipes: publishedRecipes.length,
                pendingRecipes: recipes.filter(r => r.status === 'pending').length,
                dailyLikes,
                recentActivity: storage.getRecentActivity(5)
            });

            setCategoryTrend(trendRows);
        };

        loadStats();
        const interval = setInterval(loadStats, 30000);
        const handleStatsUpdate = () => loadStats();
        window.addEventListener('statsUpdated', handleStatsUpdate);
        window.addEventListener('recipeUpdated', handleStatsUpdate);
        window.addEventListener('userUpdated', handleStatsUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('statsUpdated', handleStatsUpdate);
            window.removeEventListener('recipeUpdated', handleStatsUpdate);
            window.removeEventListener('userUpdated', handleStatsUpdate);
        };
    }, []);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-cool-gray-90">Dashboard Overview</h1>
                    <p className="text-sm text-cool-gray-60">Welcome back, here's what's happening with Kitchen Odyssey today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cool-gray-20 bg-white px-3 text-sm text-cool-gray-60"
                    >
                        <CalendarDays className="h-4 w-4" />
                        {todayLabel}
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} subtext="+12% vs last month" accent="blue" />
                <StatCard title="Pending Recipes" value={stats.pendingRecipes} icon={FileText} subtext="Needs attention" accent="amber" warning />
                <StatCard title="Active Recipes" value={stats.activeRecipes} icon={Activity} subtext="+3% vs last month" accent="green" />
                <StatCard title="Daily Likes" value={stats.dailyLikes} icon={Heart} subtext="+8% vs yesterday" accent="pink" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Activity</CardTitle>
                            <button type="button" className="text-xs font-medium text-brand-accent hover:underline">View All</button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            {stats.recentActivity.length ? (
                                stats.recentActivity.map((activity, index) => (
                                    <div key={`${activity.type}-${activity.time}-${index}`} className="flex items-start gap-3 rounded-lg border border-cool-gray-20 p-3">
                                        <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-cool-gray-10 text-cool-gray-60">
                                            <UserPlus className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-cool-gray-90">{formatActivityType(activity.type)}</p>
                                            <p className="mt-0.5 text-xs text-cool-gray-60">{activity.text}</p>
                                        </div>
                                        <span className="whitespace-nowrap text-[10px] text-cool-gray-30">
                                            {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-cool-gray-60">No recent activity yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Recipe Trends</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="mb-1.5 flex items-center justify-between text-xs text-cool-gray-60">
                                    <span>Top Categories</span>
                                    <TrendingUp className="h-3.5 w-3.5" />
                                </div>
                                <div className="h-2 rounded-full bg-cool-gray-10">
                                    <div className="h-2 w-4/5 rounded-full bg-brand-accent" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {categoryTrend.length ? categoryTrend.map((row, index) => (
                                    <div key={row.category} className="flex items-center gap-2">
                                        <span className="w-5 text-[11px] font-semibold text-cool-gray-60">{String(index + 1).padStart(2, '0')}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-cool-gray-90">{row.category}</p>
                                            <p className="text-[11px] text-cool-gray-60">{row.recipes} recipes</p>
                                        </div>
                                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">+{Math.max(1, Math.round(row.score / 4))}%</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-cool-gray-60">No published recipes to analyze yet.</p>
                                )}
                            </div>

                            <Button variant="outline" size="sm" className="mt-1 w-full">View Full Report</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-brand-accent text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white">Pro Tip</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs leading-5 text-white/90">{proTipMessage}</p>
                            <Button
                                size="sm"
                                className="mt-3 h-8 bg-white text-brand-accent hover:bg-white/90"
                                onClick={() => navigate('/admin/recipes')}
                            >
                                {proTipActionLabel}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="hidden">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Published Recipes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{stats.publishedRecipes}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function formatActivityType(type) {
    const typeMap = {
        'admin-user': 'User Management',
        'admin-recipe': 'Recipe Moderation',
        user: 'User Activity',
        recipe: 'Recipe Activity'
    };

    if (!type) return 'Activity';
    return typeMap[type] || type.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
