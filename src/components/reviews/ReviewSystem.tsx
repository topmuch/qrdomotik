'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Star, ThumbsUp, MessageSquare, CalendarDays, Send,
} from 'lucide-react';
import { ReviewStars } from '@/components/reviews/ReviewStars';
import { REVIEW_MIN_RATING, REVIEW_MAX_RATING, MAX_REVIEW_LENGTH } from '@/lib/constants';

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; fullName: string; avatarUrl: string | null; avatarColor: string | null } | null;
  professional: { id: string; businessName: string; category: string } | null;
   serviceRequest: { id: string; description: string } | null;
};

type ReviewStats = {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
};

type Tab = 'write' | 'all' | 'stats';

interface ReviewSystemProps {
  /** Filter reviews by professional ID */
  professionalId?: string;
  /** Filter reviews by merchant ID */
  merchantId?: string;
  /** Service request ID for posting a review to the specific endpoint */
  serviceRequestId?: string;
  /** Pre-fill user ID for submission */
  userId?: string;
  /** Auto-show write tab */
  defaultTab?: Tab;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_GRADIENTS = [
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
];

function getAvatarGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function ReviewSystem({
  professionalId,
  merchantId,
  serviceRequestId,
  userId,
  defaultTab = 'all',
}: ReviewSystemProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Write form
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (professionalId) params.set('professionalId', professionalId);
      if (merchantId) params.set('merchantId', merchantId);
      if (serviceRequestId) params.set('serviceRequestId', serviceRequestId);

      const res = await fetch(`/api/reviews?${params}`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {
      toast.error('Erreur chargement avis');
    } finally {
      setLoading(false);
    }
  }, [professionalId, merchantId, serviceRequestId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async () => {
    if (formRating < REVIEW_MIN_RATING) {
      toast.error(`Note minimum : ${REVIEW_MIN_RATING} étoile`);
      return;
    }

    setSubmitting(true);
    try {
      let url: string;
      let body: Record<string, unknown>;

      if (serviceRequestId) {
        // Use the dedicated service-request review endpoint
        url = `/api/service-requests/${serviceRequestId}/review`;
        body = {
          userId: userId || 'demo-user',
          rating: formRating,
          comment: formComment || undefined,
        };
      } else {
        // Use the general reviews endpoint
        url = '/api/reviews';
        body = {
          userId: userId || 'demo-user',
          professionalId: professionalId || 'demo-pro',
          rating: formRating,
          comment: formComment || '',
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Avis publié !');
        setFormRating(0);
        setFormComment('');
        setTab('all');
        fetchReviews();
      } else {
        toast.error(json.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Average Rating */
      }
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          Avis & Notes
        </h2>
        <p className="text-sm text-muted-foreground">
          Évaluez les artisans et commerçants
        </p>
        {stats && stats.totalReviews > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
            <ReviewStars rating={Math.round(stats.averageRating)} size="sm" />
            <span className="text-sm text-muted-foreground">
              ({stats.totalReviews} avis)
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {(
          [
            ['all', 'Tous les avis', MessageSquare],
            ['write', 'Écrire un avis', Send],
            ['stats', 'Statistiques', ThumbsUp],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            onClick={() => setTab(value as Tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Write Review */}
      {tab === 'write' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Votre avis compte</CardTitle>
              <CardDescription>
                Aidez les autres utilisateurs en partageant votre expérience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Votre note :</span>
                <ReviewStars
                  rating={formRating}
                  onChange={setFormRating}
                  size="lg"
                  interactive
                />
                {formRating > 0 && (
                  <Badge variant="secondary">
                    {formRating}/{REVIEW_MAX_RATING}
                  </Badge>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Commentaire</span>
                  <span className="text-xs text-muted-foreground">
                    {formComment.length}/{MAX_REVIEW_LENGTH}
                  </span>
                </div>
                <Textarea
                  value={formComment}
                  onChange={(e) =>
                    setFormComment(e.target.value.slice(0, MAX_REVIEW_LENGTH))
                  }
                  placeholder="Décrivez votre expérience..."
                  rows={4}
                />
              </div>
              <Button
                className="w-full"
                onClick={submitReview}
                disabled={formRating === 0 || submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Publication...
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publier l'avis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      {tab === 'stats' && stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <ReviewStars
                    rating={Math.round(stats.averageRating)}
                    size="sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalReviews} avis
                  </p>
                </div>
                <Separator orientation="vertical" className="h-20" />
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.distribution[star] ?? 0;
                    const pct =
                      stats.totalReviews > 0
                        ? (count / stats.totalReviews) * 100
                        : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-3 text-right">{star}</span>
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="w-8 text-right text-xs text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* All Reviews */}
      {tab === 'all' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !stats || stats.reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Aucun avis pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {stats.reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar with initials */}
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                            review.user
                              ? getAvatarGradient(review.user.id)
                              : 'from-gray-300 to-gray-400'
                          } flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                        >
                          {review.user
                            ? getInitials(review.user.fullName)
                            : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm">
                                {review.user?.fullName || 'Anonyme'}
                              </span>
                              {review.professional && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  → {review.professional.businessName}
                                </span>
                              )}
                            </div>
                            <ReviewStars
                              rating={review.rating}
                              size="sm"
                            />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {review.comment}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
