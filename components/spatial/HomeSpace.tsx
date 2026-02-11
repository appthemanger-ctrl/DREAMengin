"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  FolderPlus,
  Upload,
  Grid3X3,
  List,
  Search,
  Check,
  Share2,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Link as LinkIcon,
  ChevronRight,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { useContent, useAlbums, useShareToProfile } from "@/hooks/use-spatial";
import type { ContentObject, ContentType, ShareIntent, WidgetType } from "@/types/spatial";
import { cn } from "@/lib/utils";

interface HomeSpaceProps {
  userId: string;
  onSwitchToProfile: () => void;
}

type ViewMode = "grid" | "list";
type ContentFilter = "all" | ContentType;

export default function HomeSpace({ userId, onSwitchToProfile }: HomeSpaceProps) {
  const { content, privateContent, sharedContent, createContent, deleteContent } = useContent(userId);
  const { albums, createAlbum } = useAlbums(userId);
  const { isSharing, shareContent } = useShareToProfile(userId);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);

  const activeAlbumContentIds = useMemo(() => {
    if (!activeAlbumId) return null;
    const album = albums.find((a) => a.id === activeAlbumId) as any;
    const rows: Array<{ content_id: string }> = album?.album_content ?? [];
    return new Set(rows.map((r) => r.content_id).filter(Boolean));
  }, [albums, activeAlbumId]);

  const filteredContent = useMemo(() => {
    let filtered = content;

    if (activeAlbumContentIds) {
      filtered = filtered.filter((c) => activeAlbumContentIds.has(c.id));
    }

    if (filter !== "all") {
      filtered = filtered.filter((c) => c.type === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.title?.toLowerCase().includes(query) ?? false) ||
          (c.description?.toLowerCase().includes(query) ?? false)
      );
    }

    return filtered;
  }, [content, filter, searchQuery, activeAlbumContentIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(filteredContent.map((c) => c.id));
  }, [filteredContent]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, []);

  const handleShare = useCallback(
    async (intent: Omit<ShareIntent, "content_ids">) => {
      if (selectedIds.length === 0) return;
      await shareContent({ ...intent, content_ids: selectedIds });
      clearSelection();
      setShowShareModal(false);
    },
    [selectedIds, shareContent, clearSelection]
  );

  const handleDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await deleteContent(id);
    }
    clearSelection();
  }, [selectedIds, deleteContent, clearSelection]);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">HOME</h1>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Private
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchToProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                PROFILE
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ContentFilter)}
              className="px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="text">Text</option>
              <option value="file">Files</option>
              <option value="link">Links</option>
              <option value="embed">Embeds</option>
            </select>

            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isSelectionMode && (
            <div className="mt-3 flex items-center justify-between bg-primary/10 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <button onClick={clearSelection} className="p-1 hover:bg-primary/20 rounded">
                  <X className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium">{selectedIds.length} selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="px-3 py-1 text-xs font-medium hover:bg-primary/20 rounded">
                  Select All
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded disabled:opacity-50"
                >
                  <Share2 className="w-3 h-3" />
                  Share to Profile
                </button>
                <button
                  onClick={handleDelete}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-destructive text-destructive-foreground rounded disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Albums</h2>
            <button onClick={() => setShowAlbumModal(true)} className="p-1 hover:bg-muted rounded">
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveAlbumId(null)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                activeAlbumId === null ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              All Content
            </button>

            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => setActiveAlbumId(album.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between",
                  activeAlbumId === album.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <span className="truncate">{album.title}</span>
                {album.is_shared && <Eye className="w-3 h-3 text-muted-foreground" />}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>

            <button
              onClick={() => setIsSelectionMode((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors active:scale-95",
                isSelectionMode ? "bg-primary/10 text-primary" : "bg-muted hover:bg-muted/80"
              )}
            >
              <Check className="w-4 h-4" />
              Select
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span>{filteredContent.length} items</span>
            <span className="flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              {privateContent.length} private
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {sharedContent.length} shared
            </span>
          </div>

          {filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No content yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                Upload your first content to start building your private archive. Everything is private by default.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Content
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredContent.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                  isSelected={selectedIds.includes(item.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={() => toggleSelection(item.id)}
                  onLongPress={() => {
                    setIsSelectionMode(true);
                    toggleSelection(item.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContent.map((item) => (
                <ContentListItem
                  key={item.id}
                  content={item}
                  isSelected={selectedIds.includes(item.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={() => toggleSelection(item.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {showShareModal && (
        <ShareModal
          selectedCount={selectedIds.length}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
          isSharing={isSharing}
        />
      )}

      {showUploadModal && (
        <UploadModal userId={userId} onClose={() => setShowUploadModal(false)} onUpload={createContent} />
      )}

      {showAlbumModal && (
        <AlbumModal userId={userId} onClose={() => setShowAlbumModal(false)} onCreate={createAlbum} />
      )}
    </div>
  );
}

function ContentCard({
  content,
  isSelected,
  isSelectionMode,
  onSelect,
  onLongPress,
}: {
  content: ContentObject;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: () => void;
  onLongPress: () => void;
}) {
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressStart = () => {
    setIsPressing(true);
    pressTimer.current = setTimeout(() => {
      onLongPress();
      setIsPressing(false);
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    setIsPressing(false);
  };

  return (
    <div
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isPressing && "scale-95"
      )}
      onClick={isSelectionMode ? onSelect : undefined}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
    >
      {content.type === "image" && content.storage_url ? (
        <img src={content.storage_url} alt={content.title || ""} className="w-full h-full object-cover" />
      ) : content.type === "video" && content.storage_url ? (
        <video src={content.storage_url} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <ContentTypeIcon type={content.type} className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-xs font-medium truncate">{content.title || "Untitled"}</p>
        </div>
      </div>

      {isSelectionMode && (
        <div
          className={cn(
            "absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected ? "bg-primary border-primary" : "bg-white/80 border-white/60"
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {content.visibility === "shared" && (
        <div className="absolute top-2 right-2 p-1 rounded-full bg-primary/80">
          <Eye className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

function ContentListItem({
  content,
  isSelected,
  isSelectionMode,
  onSelect,
}: {
  content: ContentObject;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-card border border-border transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary",
        "hover:bg-muted/50"
      )}
      onClick={isSelectionMode ? onSelect : undefined}
    >
      {isSelectionMode && (
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {content.type === "image" && content.storage_url ? (
          <img src={content.storage_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ContentTypeIcon type={content.type} className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{content.title || "Untitled"}</p>
        <p className="text-xs text-muted-foreground">
          {content.type} • {new Date(content.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {content.visibility === "shared" ? (
          <span className="flex items-center gap-1 text-xs text-primary">
            <Eye className="w-3 h-3" />
            Shared
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <EyeOff className="w-3 h-3" />
            Private
          </span>
        )}
        <button className="p-1 hover:bg-muted rounded">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function ContentTypeIcon({ type, className }: { type: ContentType; className?: string }) {
  switch (type) {
    case "image":
      return <ImageIcon className={className} />;
    case "video":
      return <Video className={className} />;
    case "audio":
      return <Music className={className} />;
    case "text":
    case "file":
      return <FileText className={className} />;
    case "link":
    case "embed":
      return <LinkIcon className={className} />;
    default:
      return <FileText className={className} />;
  }
}

function ShareModal({
  selectedCount,
  onClose,
  onShare,
  isSharing,
}: {
  selectedCount: number;
  onClose: () => void;
  onShare: (intent: Omit<ShareIntent, "content_ids">) => void;
  isSharing: boolean;
}) {
  const [linkType, setLinkType] = useState<"copy" | "linked" | "snapshot">("snapshot");
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [widgetType, setWidgetType] = useState<WidgetType>("gallery");
  const [widgetTitle, setWidgetTitle] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Share to Profile</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Sharing {selectedCount} item{selectedCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">How should it appear?</label>
            <div className="space-y-2">
              {[
                { value: "snapshot", label: "Snapshot", desc: "One-time copy, won't update" },
                { value: "linked", label: "Linked", desc: "Updates when you edit in HOME" },
                { value: "copy", label: "Copy", desc: "Independent copy in PROFILE" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    linkType === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                >
                  <input
                    type="radio"
                    name="linkType"
                    value={option.value}
                    checked={linkType === option.value}
                    onChange={(e) => setLinkType(e.target.value as typeof linkType)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      linkType === option.value ? "border-primary" : "border-muted-foreground"
                    )}
                  >
                    {linkType === option.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Display as</label>
            <select
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value as WidgetType)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
            >
              <option value="gallery">Gallery Widget</option>
              <option value="media">Single Media Widget</option>
              <option value="album">Album Widget</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Widget Title (optional)</label>
            <input
              type="text"
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
              placeholder="My Gallery"
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Who can see this?</label>
            <div className="flex gap-2">
              {[
                { value: "public", label: "Everyone" },
                { value: "followers", label: "Followers only" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVisibility(option.value as typeof visibility)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    visibility === option.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onShare({
                link_type: linkType,
                visibility,
                create_new_widget: { type: widgetType, title: widgetTitle || undefined },
              })
            }
            disabled={isSharing}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSharing ? "Sharing..." : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadModal({
  userId,
  onClose,
  onUpload,
}: {
  userId: string;
  onClose: () => void;
  onUpload: (input: unknown) => Promise<unknown>;
}) {
  const [contentType, setContentType] = useState<ContentType>("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      await onUpload({
        user_id: userId,
        type: contentType,
        title: title || undefined,
        description: description || undefined,
        text_content: contentType === "text" ? textContent : undefined,
        external_url: contentType === "link" || contentType === "embed" ? externalUrl : undefined,
        metadata: {},
      });
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add Content</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Content is private by default</p>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "image", icon: ImageIcon, label: "Image" },
                { value: "video", icon: Video, label: "Video" },
                { value: "audio", icon: Music, label: "Audio" },
                { value: "text", icon: FileText, label: "Text" },
                { value: "link", icon: LinkIcon, label: "Link" },
                { value: "embed", icon: LinkIcon, label: "Embed" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setContentType(option.value as ContentType)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors",
                    contentType === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                >
                  <option.icon className="w-5 h-5" />
                  <span className="text-xs">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a name..."
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
            />
          </div>

          {contentType === "text" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Write something..."
                rows={4}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-none"
              />
            </div>
          )}

          {(contentType === "link" || contentType === "embed") && (
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
              />
            </div>
          )}

          {(contentType === "image" || contentType === "video" || contentType === "audio" || contentType === "file") && (
            <div>
              <label className="text-sm font-medium mb-2 block">File</label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={2}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isUploading ? "Adding..." : "Add to HOME"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlbumModal({
  userId,
  onClose,
  onCreate,
}: {
  userId: string;
  onClose: () => void;
  onCreate: (input: unknown) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      await onCreate({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">New Album</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Album Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Album"
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this album about?"
              rows={2}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !title.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
