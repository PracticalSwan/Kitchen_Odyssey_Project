// UserList - Admin user management with search, filters, and status actions
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState, useReducer } from 'react';
import { storageApi as storage } from '../../lib/storageApiAdapter';
import { useToast, formatError } from '../../components/ui/Toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Search, Trash2, Ban, ShieldCheck } from 'lucide-react';

// Session timeout in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

// Reducer to force re-render for time updates
const forceUpdateReducer = (x) => x + 1;

export function UserList() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [deleteId, setDeleteId] = useState(null);
    const [, forceUpdate] = useReducer(forceUpdateReducer, 0);
    const toast = useToast();

    const refreshUsers = useCallback(async () => {
        try {
            const data = await storage.getUsers();
            setUsers(data);
        } catch (err) { toast.error(formatError(err)); }
    }, [toast]);

    useEffect(() => { refreshUsers(); }, [refreshUsers]);

    // Refresh periodically to update online status display
    useEffect(() => {
        const interval = setInterval(() => {
            forceUpdate();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Check if user was active within the session timeout (session-based activity)
    const isUserOnline = (user) => {
        if (!user.lastActive) return false;
        const lastActiveTime = new Date(user.lastActive).getTime();
        const now = new Date().getTime();
        return (now - lastActiveTime) < SESSION_TIMEOUT;
    };

    // Derive display status: 'active' if online session, otherwise use stored status or 'inactive'
    const getDisplayStatus = (user) => {
        if (user.status === 'suspended') return 'suspended';
        if (user.status === 'pending') return 'pending';
        if (user.status === 'inactive') return 'inactive';
        return isUserOnline(user) ? 'active' : 'inactive';
    };

    const handleStatusChange = async (userId, newStatus) => {
        const user = users.find(u => (u._id || u.id) === userId);
        if (user) {
            try {
                await storage.saveUser({ ...user, _id: userId, status: newStatus });
            } catch (err) {
                toast.error(formatError(err));
                return;
            }
            const actionLabel = newStatus === 'active' ? 'approved' : newStatus === 'suspended' ? 'suspended' : 'updated';
            toast.success(`User "${user.username}" ${actionLabel}`);
            // Non-critical follow-ups: activity log + refresh
            try {
                const currentUser = await storage.getCurrentUser();
                const adminName = currentUser?.username || 'Admin';
                await storage.addActivity({
                    type: 'admin-user',
                    text: `${adminName} ${actionLabel} ${user.username}`
                });
            } catch { /* activity logging is non-critical */ }
            try {
                await refreshUsers();
            } catch { /* refresh failure is non-critical */ }
            window.dispatchEvent(new CustomEvent('userUpdated'));
            window.dispatchEvent(new CustomEvent('statsUpdated'));
        }
    };

    const handleDelete = (userId) => {
        setDeleteId(userId);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            const userToDelete = users.find(u => (u._id || u.id) === deleteId);
            try {
                await storage.deleteUser(deleteId);
            } catch (err) {
                toast.error(formatError(err));
                return;
            }
            toast.success(`User "${userToDelete?.username || 'Unknown'}" deleted`);
            setDeleteId(null);
            // Non-critical follow-ups
            try {
                const currentUser = await storage.getCurrentUser();
                const adminName = currentUser?.username || 'Admin';
                if (userToDelete) {
                    await storage.addActivity({
                        type: 'admin-user',
                        text: `${adminName} removed ${userToDelete.username}`
                    });
                }
            } catch { /* activity logging is non-critical */ }
            try {
                await refreshUsers();
            } catch { /* refresh failure is non-critical */ }
        }
    };

    // Filter users by search term (username/email) and role selection
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-charcoal">User Management</h1>
                <p className="text-warm-gray-60">Manage user accounts and permissions.</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-warm-gray-20 bg-white p-4 shadow-sm">
                <div className="relative w-100">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-6 text-warm-gray-60" />
                    <Input
                        className="pl-9"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="h-10 rounded-md border border-warm-gray-30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div className="rounded-lg border border-warm-gray-20 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">User</TableHead>
                            <TableHead className="w-[200px]">Email</TableHead>
                            <TableHead className="w-[100px]">Role</TableHead>
                            <TableHead className="w-[140px]">Status</TableHead>
                            <TableHead className="w-[120px]">Joined</TableHead>
                            <TableHead className="w-[180px]">Last Active</TableHead>
                            <TableHead className="w-[140px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user._id || user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar} className="h-8 w-8 rounded-full" alt="" />
                                        <div className="font-medium">{user.username}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-warm-gray-60">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        // IIFE used to compute display status inline (avoid extra variable in render)
                                        const displayStatus = getDisplayStatus(user);
                                        return (
                                            <Badge variant={displayStatus === 'active' ? 'success' : displayStatus === 'suspended' ? 'error' : displayStatus === 'pending' ? 'warning' : 'outline'}>
                                                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                                            </Badge>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                                <TableCell>{user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title="Approve"
                                            onClick={() => handleStatusChange(user._id || user.id, 'active')}
                                            disabled={user.status === 'active' || user.status === 'inactive'}
                                        >
                                            <ShieldCheck className={`h-4 w-4 ${(user.status === 'active' || user.status === 'inactive') ? 'text-warm-gray-30' : 'text-green-500'}`} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title="Suspend"
                                            onClick={() => handleStatusChange(user._id || user.id, 'suspended')}
                                            disabled={user.status === 'suspended'}
                                        >
                                            <Ban className={`h-4 w-4 ${user.status === 'suspended' ? 'text-warm-gray-30' : 'text-red-500'}`} />
                                        </Button>
                                        <Button size="icon" variant="ghost" title="Delete User" onClick={() => handleDelete(user._id || user.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Delete User"
            >
                <div className="space-y-4">
                    <p className="text-warm-gray-60">Are you sure you want to delete this user? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 focus:ring-red-500">Delete User</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
