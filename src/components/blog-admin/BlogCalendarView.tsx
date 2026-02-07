import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, LayoutGrid,
  Clock, FileText, Eye, Edit, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameDay, isToday,
  parseISO, getDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { BlogPost } from '@/services/blogService';

type ViewMode = 'month' | 'week' | 'list';

interface BlogCalendarViewProps {
  posts: BlogPost[];
  onEditPost: (post: BlogPost) => void;
  onSchedulePost: (postId: string, date: string) => Promise<void>;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const statusColor: Record<string, string> = {
  published: 'bg-green-500',
  draft: 'bg-muted-foreground/40',
  scheduled: 'bg-blue-500',
  archived: 'bg-orange-400',
};

const statusLabel: Record<string, string> = {
  published: 'Publié',
  draft: 'Brouillon',
  scheduled: 'Programmé',
  archived: 'Archivé',
};

const PostDot = ({ post, onEdit }: { post: BlogPost; onEdit: () => void }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-full text-left group"
        >
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-primary/10 transition-colors">
            <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor[post.status] || 'bg-muted-foreground'}`} />
            <span className="text-[11px] font-medium truncate leading-tight">
              {post.title}
            </span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold text-sm">{post.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] h-5">
              {statusLabel[post.status] || post.status}
            </Badge>
            {post.category?.name && (
              <span>{post.category.name}</span>
            )}
          </div>
          {post.excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const BlogCalendarView: React.FC<BlogCalendarViewProps> = ({
  posts,
  onEditPost,
  onSchedulePost
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Map posts to dates
  const postsByDate = useMemo(() => {
    const map = new Map<string, BlogPost[]>();
    posts.forEach(post => {
      const dateStr = post.scheduled_for
        ? format(parseISO(post.scheduled_for), 'yyyy-MM-dd')
        : post.published_at
          ? format(parseISO(post.published_at), 'yyyy-MM-dd')
          : format(parseISO(post.created_at), 'yyyy-MM-dd');
      const existing = map.get(dateStr) || [];
      existing.push(post);
      map.set(dateStr, existing);
    });
    return map;
  }, [posts]);

  // Navigation
  const navigatePrev = () => {
    setCurrentDate(prev => viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  };
  const navigateNext = () => {
    setCurrentDate(prev => viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  };
  const navigateToday = () => setCurrentDate(new Date());

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // Generate week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  // List view: sorted posts for the current month
  const monthPosts = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return posts
      .filter(p => {
        const d = p.scheduled_for || p.published_at || p.created_at;
        if (!d) return false;
        const date = parseISO(d);
        return date >= start && date <= end;
      })
      .sort((a, b) => {
        const da = a.scheduled_for || a.published_at || a.created_at;
        const db = b.scheduled_for || b.published_at || b.created_at;
        return new Date(da).getTime() - new Date(db).getTime();
      });
  }, [posts, currentDate]);

  const renderMonthView = () => (
    <div className="border rounded-xl overflow-hidden bg-background">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {DAY_NAMES.map(d => (
          <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">
        {monthDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDate.get(dateKey) || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={`min-h-[100px] border-b border-r p-1.5 transition-colors
                ${!inMonth ? 'bg-muted/20 opacity-50' : 'hover:bg-primary/5'}
                ${today ? 'bg-primary/5' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full
                  ${today ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                `}>
                  {format(day, 'd')}
                </span>
                {dayPosts.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{dayPosts.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map(post => (
                  <PostDot key={post.id} post={post} onEdit={() => onEditPost(post)} />
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1.5">+{dayPosts.length - 3} de plus</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="border rounded-xl overflow-hidden bg-background">
      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDate.get(dateKey) || [];
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={`min-h-[300px] border-r p-2 ${today ? 'bg-primary/5' : ''}`}
            >
              <div className="text-center mb-3">
                <p className="text-xs text-muted-foreground uppercase">
                  {format(day, 'EEE', { locale: fr })}
                </p>
                <p className={`text-lg font-bold mt-0.5 h-9 w-9 mx-auto flex items-center justify-center rounded-full
                  ${today ? 'bg-primary text-primary-foreground' : ''}
                `}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="space-y-1.5">
                {dayPosts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => onEditPost(post)}
                    className={`w-full text-left p-2 rounded-lg border transition-all hover:shadow-md
                      ${post.status === 'published' ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800' :
                        post.status === 'scheduled' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800' :
                        'border-border bg-muted/30'}
                    `}
                  >
                    <p className="text-xs font-semibold line-clamp-2 leading-tight">{post.title}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusColor[post.status]}`} />
                      <span className="text-[10px] text-muted-foreground">{statusLabel[post.status]}</span>
                    </div>
                    {post.scheduled_for && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {format(parseISO(post.scheduled_for), 'HH:mm')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {monthPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucun article ce mois-ci</p>
          </CardContent>
        </Card>
      ) : (
        monthPosts.map(post => {
          const dateStr = post.scheduled_for || post.published_at || post.created_at;
          return (
            <div
              key={post.id}
              className="flex items-center gap-4 p-4 bg-background rounded-xl border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onEditPost(post)}
            >
              <div className="text-center shrink-0 w-14">
                <p className="text-xs text-muted-foreground uppercase">
                  {format(parseISO(dateStr), 'MMM', { locale: fr })}
                </p>
                <p className="text-2xl font-bold">{format(parseISO(dateStr), 'd')}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] h-5">
                    {statusLabel[post.status]}
                  </Badge>
                  {post.category?.name && (
                    <span className="text-xs text-muted-foreground">{post.category.name}</span>
                  )}
                  {post.scheduled_for && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(post.scheduled_for), 'HH:mm')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEditPost(post); }}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                {post.status === 'published' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); window.open(`/blog/${post.slug}`, '_blank'); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-bold min-w-[200px] text-center capitalize">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy', { locale: fr })
              : viewMode === 'week'
                ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: fr })}`
                : format(currentDate, 'MMMM yyyy', { locale: fr })
            }
          </h2>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={navigateToday}>
            Aujourd'hui
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="h-8"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
            Mois
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="h-8"
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            Semaine
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8"
          >
            <List className="h-3.5 w-3.5 mr-1.5" />
            Liste
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {Object.entries(statusLabel).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${statusColor[key]}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Views */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'list' && renderListView()}
    </div>
  );
};
