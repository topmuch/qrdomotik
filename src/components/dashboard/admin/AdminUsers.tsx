'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Users, Search, ChevronLeft, ChevronRight,
  Shield, UserCircle, Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ─── Types ────────────────────────────────────────────────────────────────

interface UserItem {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    homes: number;
    qrCodes: number;
    activatedPhysicalQr: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  superadmin: { label: 'Superadmin', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  user: { label: 'Utilisateur', className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

// ─── Animation ───────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────

export function AdminUsers() {
  const { data: session } = useSession();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.error || 'Erreur de chargement');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    if (session) fetchUsers();
  }, [session, fetchUsers]);

  useEffect(() => { setPage(1); }, [search]);

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-600" />
          Utilisateurs
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestion des comptes et permissions
        </p>
      </div>

      {/* Search */}
      <motion.div className="relative max-w-sm" variants={containerVariants} initial="hidden" animate="show">
        <motion.div className="relative" variants={itemVariants}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </motion.div>
      </motion.div>

      {!loading && total > 0 && (
        <p className="text-xs text-gray-400">
          {total} utilisateur{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''} • Page {page} sur {totalPages}
        </p>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Aucun utilisateur trouvé</p>
                <p className="text-xs text-gray-400 mt-1">
                  {search ? 'Essayez de modifier votre recherche' : 'Aucun utilisateur inscrit'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80 sticky top-0">
                    <TableRow>
                      <TableHead className="pl-4 w-10"></TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="text-center">Maisons</TableHead>
                      <TableHead className="text-center">QR Codes</TableHead>
                      <TableHead className="text-center">QR Phys.</TableHead>
                      <TableHead>Inscription</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const initial = (user.fullName || user.email || 'U')[0].toUpperCase();
                      const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.user;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="pl-4">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-semibold">
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-gray-900">{user.fullName || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] gap-1 ${roleBadge.className}`}>
                              {user.role === 'superadmin' && <Shield className="w-3 h-3" />}
                              {user.role !== 'superadmin' && <UserCircle className="w-3 h-3" />}
                              {roleBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-gray-700 tabular-nums">{user._count.homes}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-gray-700 tabular-nums">{user._count.qrCodes}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-gray-700 tabular-nums">{user._count.activatedPhysicalQr}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">{formatDateTime(user.createdAt)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Affichage {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Préc.
                    </Button>
                    <span className="text-xs text-gray-600 px-2">{page}/{totalPages}</span>
                    <Button variant="outline" size="sm" className="h-8 px-3" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Suiv. <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
