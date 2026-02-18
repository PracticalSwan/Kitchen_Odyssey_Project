/**
 * AdminStats - Admin dashboard with platform analytics
 *
 * Displays key metrics: total users/recipes, DAU, MAU, pending approvals,
 * recent activity log, and daily stats chart.
 * Data sourced from localStorage's activity tracking and storage.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { storageApi as storage } from '../../lib/storageApiAdapter';
import { useToast, formatError } from '../../components/ui/Toast';
import { Users, FileText, Activity, UserPlus, Heart, AlertTriangle, CalendarDays, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
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
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-warm-gray-60">
                    {title}
                </CardTitle>
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accentStyles[accent] || accentStyles.blue}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="text-3xl font-bold text-charcoal">{value}</div>
                {subtext && (
                    <p className={`mt-1 text-xs ${warning ? 'text-amber-600 font-medium' : 'text-warm-gray-60'}`}>
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
    const toast = useToast();
    // Format today's date as MM/DD/YYYY for daily stats lookup
    const todayLabel = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });

    // Dashboard state: metrics, trends, and UI flags
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeRecipes: 0,
        publishedRecipes: 0,
        pendingRecipes: 0,
        totalLikes: 0,
        recentActivity: [],
        allActivity: [],
        userGrowthText: '',
        activeRecipesText: '',
        likesText: ''
    });
    const [categoryTrend, setCategoryTrend] = useState([]);      // Sorted by recipe count (top categories)
    const [allCategoryTrend, setAllCategoryTrend] = useState([]); // All categories with counts
    const [showAllActivity, setShowAllActivity] = useState(false);  // Expand activity log toggle
    const [showFullReport, setShowFullReport] = useState(false); // Full stats modal toggle

    // Dynamic pro-tip based on pending recipes or top category
    const topCategory = categoryTrend[0];
    const hasPendingRecipes = stats.pendingRecipes > 0;
    const proTipMessage = hasPendingRecipes
        ? `You have ${stats.pendingRecipes} pending recipe${stats.pendingRecipes > 1 ? 's' : ''}. Reviewing them now helps keep fresh content visible on the feed.`
        : topCategory
            ? `Your strongest category is ${topCategory.category} with ${topCategory.recipes} published recipes. Feature this category to boost engagement.`
            : 'No category trends yet. Approve and publish more recipes to unlock actionable insights here.';
    const proTipActionLabel = hasPendingRecipes ? 'Review Pending Recipes' : 'Manage Recipes';

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [users, recipes, recentActivity, allActivity] = await Promise.all([
                    storage.getUsers(),
                    storage.getRecipes(),
                    storage.getRecentActivity(5),
                    storage.getRecentActivity(200),
                ]);

                const nonAdminUsers = users.filter(u => u.role !== 'admin');
                const totalUsers = nonAdminUsers.length;
                const publishedRecipes = recipes.filter(r => r.status === 'published');
                const publishedCount = publishedRecipes.length;
                const activeRecipeCount = publishedRecipes.filter(r => (r.viewedBy?.length || 0) > 0 || (r.likedBy?.length || 0) > 0).length;

                const totalLikes = publishedRecipes.reduce((acc, recipe) => acc + (recipe.likedBy?.length || 0), 0);

            // Month-over-month user growth
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
            const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

            const usersThisMonth = nonAdminUsers.filter(u => {
                const d = new Date(u.joinedDate);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            }).length;
            const usersLastMonth = nonAdminUsers.filter(u => {
                const d = new Date(u.joinedDate);
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }).length;

            let userGrowthText;
            if (usersLastMonth > 0) {
                const pct = Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100);
                userGrowthText = pct >= 0 ? `+${pct}% vs last month` : `${pct}% vs last month`;
            } else if (usersThisMonth > 0) {
                userGrowthText = `+${usersThisMonth} new this month`;
            } else {
                userGrowthText = 'No new users this month';
            }

            // Active recipes as % of published
            const activePercent = publishedCount > 0 ? Math.round((activeRecipeCount / publishedCount) * 100) : 0;
            const activeRecipesText = `${activePercent}% of published engaged`;

            // Total likes average
            const avgLikes = publishedCount > 0 ? (totalLikes / publishedCount).toFixed(1) : '0';
            const likesText = `Avg ${avgLikes} per recipe`;

            // Category trends: aggregate recipes and likes per category
            const trendMap = new Map();
            publishedRecipes.forEach((recipe) => {
                const primaryCategory = normalizeCategories(recipe.categories ?? recipe.category)[0] || 'Other';
                const previous = trendMap.get(primaryCategory) || { recipes: 0, likes: 0 };
                trendMap.set(primaryCategory, {
                    recipes: previous.recipes + 1,
                    likes: previous.likes + (recipe.likedBy?.length || 0)
                });
            });

            // Convert map to array and calculate weighted score for sorting
            // Score formula: recipes * 2 + likes (prioritizes recipe count)
            const allTrendRows = Array.from(trendMap.entries())
                .map(([category, data]) => ({
                    category,
                    recipes: data.recipes,
                    likes: data.likes,
                    score: data.recipes * 2 + data.likes,  // Weighted score: recipes count double
                    sharePercent: publishedCount > 0 ? Math.round((data.recipes / publishedCount) * 100) : 0
                }))
                .sort((a, b) => b.score - a.score);

            setStats({
                totalUsers,
                activeRecipes: activeRecipeCount,
                publishedRecipes: publishedCount,
                pendingRecipes: recipes.filter(r => r.status === 'pending').length,
                totalLikes,
                recentActivity,
                allActivity,
                userGrowthText,
                activeRecipesText,
                likesText
            });

            setCategoryTrend(allTrendRows.slice(0, 4));
            setAllCategoryTrend(allTrendRows);
            } catch (err) { toast.error(formatError(err)); }
        };

        loadStats();
        // Auto-refresh every 30 seconds and sync with storage changes
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
    }, [toast]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-charcoal">Dashboard Overview</h1>
                    <p className="text-sm text-warm-gray-60">Welcome back, here's what's happening with Kitchen Odyssey today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-warm-gray-20 bg-white px-3 text-sm text-warm-gray-60"
                    >
                        <CalendarDays className="h-4 w-4" />
                        {todayLabel}
                    </button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} subtext={stats.userGrowthText} accent="blue" />
                <StatCard title="Pending Recipes" value={stats.pendingRecipes} icon={FileText} subtext="Needs attention" accent="amber" warning />
                <StatCard title="Active Recipes" value={stats.activeRecipes} icon={Activity} subtext={stats.activeRecipesText} accent="green" />
                <StatCard title="Total Likes" value={stats.totalLikes} icon={Heart} subtext={stats.likesText} accent="pink" />
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_293px]">
                <Card>
                    <CardHeader className="pb-5">
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Activity</CardTitle>
                            <button type="button" className="text-xs font-medium text-brand-accent hover:underline" onClick={() => setShowAllActivity(true)}>View All</button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            {stats.recentActivity.length ? (
                                stats.recentActivity.map((activity, index) => (
                                    <div key={`${activity.type}-${activity.time}-${index}`} className="flex items-start gap-3 rounded-lg border border-warm-gray-20 p-3">
                                        <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-warm-gray-10 text-warm-gray-60">
                                            <UserPlus className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-charcoal">{formatActivityType(activity.type)}</p>
                                            <p className="mt-0.5 text-xs text-warm-gray-60">{activity.text}</p>
                                        </div>
                                        <span className="whitespace-nowrap text-[10px] text-warm-gray-30">
                                            {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-warm-gray-60">No recent activity yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Recipe Trends</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="mb-1.5 flex items-center justify-between text-xs text-warm-gray-60">
                                    <span>Top Categories</span>
                                    <TrendingUp className="h-3.5 w-3.5" />
                                </div>
                                <div className="h-2 rounded-full bg-warm-gray-10">
                                    <div className="h-2 rounded-full bg-brand-accent" style={{ width: `${Math.min(100, categoryTrend.reduce((sum, r) => sum + r.sharePercent, 0))}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {categoryTrend.length ? categoryTrend.map((row, index) => (
                                    <div key={row.category} className="flex items-center gap-2">
                                        <span className="w-5 text-[11px] font-semibold text-warm-gray-60">{String(index + 1).padStart(2, '0')}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-charcoal">{row.category}</p>
                                            <p className="text-[11px] text-warm-gray-60">{row.recipes} recipes</p>
                                        </div>
                                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">{row.sharePercent}%</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-warm-gray-60">No published recipes to analyze yet.</p>
                                )}
                            </div>

                            <Button variant="outline" size="sm" className="mt-1 w-full" onClick={() => setShowFullReport(true)}>View Full Report</Button>
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

            <Modal
                isOpen={showAllActivity}
                onClose={() => setShowAllActivity(false)}
                title="All Recent Activity"
                className="max-w-2xl"
                persistent
            >
                <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1">
                    {stats.allActivity.length ? (
                        stats.allActivity.map((activity, index) => (
                            <div key={`all-${activity.type}-${activity.time}-${index}`} className="flex items-start gap-3 rounded-lg border border-warm-gray-20 p-3">
                                <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-warm-gray-10 text-warm-gray-60">
                                    <UserPlus className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-charcoal">{formatActivityType(activity.type)}</p>
                                    <p className="mt-0.5 text-xs text-warm-gray-60">{activity.text}</p>
                                </div>
                                <span className="whitespace-nowrap text-[10px] text-warm-gray-30">
                                    {new Date(activity.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="py-8 text-center text-sm text-warm-gray-60">No activity recorded yet.</p>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={showFullReport}
                onClose={() => setShowFullReport(false)}
                title="Recipe Trends — Full Report"
                className="max-w-2xl"
                persistent
            >
                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                    {allCategoryTrend.length ? (
                        <>
                            <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem] gap-x-4 text-xs font-semibold text-warm-gray-60 border-b border-warm-gray-20 pb-2 mb-1">
                                <span>#</span>
                                <span>Category</span>
                                <span className="text-right">Recipes</span>
                                <span className="text-right">Likes</span>
                            </div>
                            {allCategoryTrend.map((row, index) => (
                                <div key={row.category} className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem] gap-x-4 items-center rounded-lg border border-warm-gray-20 p-3">
                                    <span className="text-[11px] font-semibold text-warm-gray-60">{String(index + 1).padStart(2, '0')}</span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-charcoal">{row.category}</p>
                                        <div className="mt-1 h-1.5 w-full rounded-full bg-warm-gray-10">
                                            <div className="h-1.5 rounded-full bg-brand-accent" style={{ width: `${row.sharePercent}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-right text-sm font-medium text-charcoal">{row.recipes}</span>
                                    <span className="text-right rounded bg-pink-50 px-1.5 py-0.5 text-[11px] font-semibold text-pink-600">{row.likes}</span>
                                </div>
                            ))}
                            <div className="mt-2 rounded-lg bg-warm-gray-10 p-3 text-xs text-warm-gray-60">
                                <span className="font-semibold">{stats.publishedRecipes}</span> published recipes across <span className="font-semibold">{allCategoryTrend.length}</span> categories — <span className="font-semibold">{stats.totalLikes}</span> total likes
                            </div>
                        </>
                    ) : (
                        <p className="py-8 text-center text-sm text-warm-gray-60">No published recipes to analyze yet.</p>
                    )}
                </div>
            </Modal>
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
