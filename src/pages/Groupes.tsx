import React, { useState, useEffect } from 'react';
import { MessageCircle, Users as UsersIcon, Building2, GraduationCap, Search, ChevronRight } from 'lucide-react';
import { useChatGroups } from '@/hooks/useChatGroups';
import ChatRoom from '@/components/chat/ChatRoom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

const Groupes = () => {
  const { groups, loading } = useChatGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  // Séparer les groupes par type
  const establishmentGroups = groups.filter(g => g.group_type === 'establishment');
  const formationGroups = groups.filter(g => g.group_type === 'formation');
  const privateGroups = groups.filter(g => g.group_type === 'private');

  // Filtrer par recherche
  const filterGroups = (groupsList: typeof groups) => {
    if (!searchQuery) return groupsList;
    return groupsList.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredEstablishmentGroups = filterGroups(establishmentGroups);
  const filteredFormationGroups = filterGroups(formationGroups);
  const filteredPrivateGroups = filterGroups(privateGroups);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // Sélectionner automatiquement le premier groupe si disponible
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0 && !loading) {
      // Priorité: établissement > formation > privé
      const defaultGroup = establishmentGroups[0] || formationGroups[0] || privateGroups[0];
      if (defaultGroup) {
        setSelectedGroupId(defaultGroup.id);
      }
    }
  }, [groups, loading, selectedGroupId, establishmentGroups, formationGroups, privateGroups]);

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'establishment':
        return <Building2 className="h-5 w-5" />;
      case 'formation':
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <UsersIcon className="h-5 w-5" />;
    }
  };

  const getGroupColor = (groupType: string) => {
    switch (groupType) {
      case 'establishment':
        return 'from-primary to-primary/70';
      case 'formation':
        return 'from-blue-500 to-blue-400';
      default:
        return 'from-violet-500 to-violet-400';
    }
  };

  const getGroupBadge = (groupType: string) => {
    switch (groupType) {
      case 'establishment':
        return { label: 'Établissement', variant: 'default' as const };
      case 'formation':
        return { label: 'Formation', variant: 'secondary' as const };
      default:
        return { label: 'Privé', variant: 'outline' as const };
    }
  };

  const renderGroupItem = (group: typeof groups[0]) => {
    const isSelected = selectedGroupId === group.id;
    const badge = getGroupBadge(group.group_type);

    return (
      <button
        key={group.id}
        onClick={() => setSelectedGroupId(group.id)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group",
          isSelected 
            ? "bg-primary/10 border-2 border-primary/30 shadow-sm" 
            : "hover:bg-muted/50 border-2 border-transparent"
        )}
      >
        <div className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105",
          `bg-gradient-to-br ${getGroupColor(group.group_type)}`
        )}>
          <span className="text-white">
            {getGroupIcon(group.group_type)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium truncate",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {group.name}
            </span>
            <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0 h-4">
              {badge.label}
            </Badge>
          </div>
          {group.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {group.description}
            </p>
          )}
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          isSelected ? "text-primary rotate-90" : "text-muted-foreground"
        )} />
      </button>
    );
  };

  const renderGroupSection = (title: string, icon: React.ReactNode, groupsList: typeof groups) => {
    if (groupsList.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {icon}
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
            {groupsList.length}
          </Badge>
        </div>
        <div className="space-y-1">
          {groupsList.map(renderGroupItem)}
        </div>
      </div>
    );
  };

  // Vue mobile avec liste de groupes
  const renderMobileList = () => (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <UsersIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Groupes</h1>
            <p className="text-sm text-muted-foreground">{groups.length} groupe(s) disponible(s)</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un groupe..."
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      {/* Groups List */}
      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">Chargement des groupes...</p>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-xs">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Aucun groupe</h3>
              <p className="text-sm text-muted-foreground">
                Vous n'êtes membre d'aucun groupe pour le moment.
              </p>
            </div>
          </div>
        ) : (
          <>
            {renderGroupSection("Établissement", <Building2 className="h-3 w-3" />, filteredEstablishmentGroups)}
            {renderGroupSection("Formations", <GraduationCap className="h-3 w-3" />, filteredFormationGroups)}
            {renderGroupSection("Groupes privés", <UsersIcon className="h-3 w-3" />, filteredPrivateGroups)}
          </>
        )}
      </ScrollArea>
    </div>
  );

  // Vue mobile avec chat room
  const renderMobileChat = () => (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Back button header */}
      <div className="p-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedGroupId(null)}
          className="gap-2"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Retour aux groupes
        </Button>
      </div>
      
      {selectedGroup && (
        <div className="flex-1 overflow-hidden">
          <ChatRoom
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
          />
        </div>
      )}
    </div>
  );

  // Vue desktop avec sidebar et chat
  const renderDesktop = () => (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/10">
      {/* Sidebar - Groups List */}
      <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
              <UsersIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Groupes</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {groups.length} groupe(s) disponible(s)
              </p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un groupe..."
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
        </div>

        {/* Groups List */}
        <ScrollArea className="flex-1 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">Chargement...</p>
              </div>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center px-4">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <MessageCircle className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Aucun groupe</h3>
                <p className="text-xs text-muted-foreground">
                  Vous n'êtes membre d'aucun groupe.
                </p>
              </div>
            </div>
          ) : (
            <>
              {renderGroupSection("Établissement", <Building2 className="h-3 w-3" />, filteredEstablishmentGroups)}
              {renderGroupSection("Formations", <GraduationCap className="h-3 w-3" />, filteredFormationGroups)}
              {renderGroupSection("Groupes privés", <UsersIcon className="h-3 w-3" />, filteredPrivateGroups)}
            </>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedGroup ? (
          <ChatRoom
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-transparent to-muted/10">
            <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg max-w-md">
              <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Sélectionnez un groupe
              </h3>
              <p className="text-muted-foreground">
                Choisissez un groupe dans la liste pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Rendu conditionnel mobile/desktop
  if (isMobile) {
    return selectedGroupId ? renderMobileChat() : renderMobileList();
  }

  return renderDesktop();
};

export default Groupes;
