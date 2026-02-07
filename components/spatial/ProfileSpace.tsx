"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  Plus,
  ExternalLink,
  User,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Rss,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { useWidgets, useContent } from "@/hooks/use-spatial";
import type { Widget, WidgetType, WidgetVisibility, ContentObject } from "@/types/spatial";
import { cn } from "@/lib/utils";

interface ProfileSpaceProps {
  userId: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isOwner: boolean;
  onSwitchToHome?: () => void;
}

const asString = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const asNumber = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

const asLinks = (v: unknown): Array<{ title: string; url: string }> => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const obj = x as Record<string, unknown>;
      const title = asString(obj.title);
      const url = asString(obj.url);
      if (!title || !url) return null;
      return { title, url };
    })
    .filter(Boolean) as Array<{ title: string; url: string }>;
};

export default function ProfileSpace({
  userId,
  handle,
  displayName,
  avatarUrl,
  bio,
  isOwner,
  onSwitchToHome,
}: ProfileSpaceProps) {
  const { widgets, createWidget, updateWidget, deleteWidget } = useWidgets(userId, "profile");
  const { content } = useContent(userId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const sortedWidgets = useMemo(() => [...widgets].sort((a, b) => a.order - b.order), [widgets]);
  const currentWidget = sortedWidgets[currentIndex];

  useEffect(() => {
    if (sortedWidgets.length === 0) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((i) => Math.max(0, Math.min(i, sortedWidgets.length - 1)));
  }, [sortedWidgets.length]);

  const navigateLeft = useCallback(() => {
    setCurrentIndex((prev) =>
      sortedWidgets.length === 0 ? 0 : prev === 0 ? sortedWidgets.length - 1 : prev - 1
    );
  }, [sortedWidgets.length]);

  const navigateRight = useCallback(() => {
    setCurrentIndex((prev) =>
      sortedWidgets.length === 0 ? 0 : prev === sortedWidgets.length - 1 ? 0 : prev + 1
    );
  }, [sortedWidgets.length]);

  const getWidgetContent = useCallback(
    (widget: Widget) => {
      const ids = widget.overlap?.source_content_ids;
      if (!ids || ids.length === 0) return [];
      const set = new Set(ids);
      return content.filter((c) => set.has(c.id));
    },
    [content]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigateLeft();
      if (e.key === "ArrowRight") navigateRight();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateLeft, navigateRight]);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) diff > 0 ? navigateRight() : navigateLeft();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOwner && onSwitchToHome && (
                <button
                  onClick={onSwitchToHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  HOME
                </button>
              )}
              <h1 className="text-xl font-bold text-foreground">PROFILE</h1>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Public
              </span>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    isEditing ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {isEditing ? "Done" : "Edit"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName || handle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{displayName || handle}</h2>
            <p className="text-sm text-muted-foreground">@{handle}</p>
          </div>

          <div className="text-sm text-muted-foreground">
            {sortedWidgets.length} widget{sortedWidgets.length !== 1 ? "s" : ""}
          </div>
        </div>
      </header>

      <main
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {sortedWidgets.length === 0 ? (
          <EmptyProfileState isOwner={isOwner} onAddWidget={() => setShowAddWidget(true)} />
        ) : (
          <>
            <div className="h-full p-4 overflow-y-auto">
              {currentWidget && (
                <WidgetRenderer
                  widget={currentWidget}
                  content={getWidgetContent(currentWidget)}
                  isEditing={isEditing}
                  onUpdate={(updates) => updateWidget(currentWidget.id, updates)}
                  onDelete={async () => {
                    await deleteWidget(currentWidget.id);
                    setCurrentIndex((i) => Math.max(0, i - 1));
                  }}
                />
              )}
            </div>

            {sortedWidgets.length > 1 && (
              <>
                <button
                  onClick={navigateLeft}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={navigateRight}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {sortedWidgets.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {sortedWidgets.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex ? "w-6 bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {isOwner && isEditing && (
          <button
            onClick={() => setShowAddWidget(true)}
            className="absolute bottom-20 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </main>

      {sortedWidgets.length > 1 && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {sortedWidgets.map((widget, index) => (
              <button
                key={widget.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  index === currentIndex ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <WidgetTypeIcon type={widget.type} className="w-4 h-4" />
                <span className="text-sm font-medium truncate max-w-[100px]">
                  {widget.title || widget.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showAddWidget && (
        <AddWidgetModal
          userId={userId}
          onClose={() => setShowAddWidget(false)}
          onCreate={async (type) => {
            await createWidget({
              user_id: userId,
              space: "profile",
              type,
              title: undefined,
              description: undefined,
              order: sortedWidgets.length,
              config: {},
              visibility: "public",
              overlap: undefined,
            });
          }}
        />
      )}
    </div>
  );
}

function EmptyProfileState({ isOwner, onAddWidget }: { isOwner: boolean; onAddWidget: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Globe className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{isOwner ? "No widgets yet" : "Nothing to see here"}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        {isOwner
          ? "Add widgets to your profile to share content with the world. Everything starts private in HOME."
          : "This user hasn't shared any content yet."}
      </p>
      {isOwner && (
        <button
          onClick={onAddWidget}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Your First Widget
        </button>
      )}
    </div>
  );
}

function WidgetRenderer({
  widget,
  content,
  isEditing,
  onUpdate,
  onDelete,
}: {
  widget: Widget;
  content: ContentObject[];
  isEditing: boolean;
  onUpdate: (updates: Partial<Widget>) => void;
  onDelete: () => void;
}) {
  const [showSettings, setShowSettings] = useState(false);

  const visibilityIcon = () => {
    switch (widget.visibility) {
      case "public":
        return <Globe className="w-3 h-3" />;
      case "followers":
        return <Users className="w-3 h-3" />;
      default:
        return <Lock className="w-3 h-3" />;
    }
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WidgetTypeIcon type={widget.type} className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{widget.title || widget.type}</h3>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {visibilityIcon()}
            {widget.visibility}
          </span>
        </div>

        {isEditing && (
          <div className="flex items-center gap-1">
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {widget.type === "gallery" && <GalleryWidget content={content} config={widget.config} />}
        {widget.type === "media" && <MediaWidget content={content[0]} />}
        {widget.type === "text" && <TextWidget config={widget.config} />}
        {widget.type === "profile_info" && <ProfileInfoWidget config={widget.config} />}
        {widget.type === "link_tree" && <LinkTreeWidget config={widget.config} />}
        {widget.type === "embed" && <EmbedWidget config={widget.config} />}
        {widget.type === "feed" && <FeedWidget config={widget.config} />}
        {widget.type === "album" && <AlbumWidget content={content} />}
      </div>

      {widget.overlap && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <LinkIcon className="w-3 h-3" />
          {widget.overlap.link_type === "linked"
            ? "Linked to HOME (updates live)"
            : widget.overlap.link_type === "snapshot"
            ? "Snapshot from HOME"
            : "Copy from HOME"}
        </div>
      )}

      {showSettings && (
        <WidgetSettingsModal widget={widget} onClose={() => setShowSettings(false)} onUpdate={onUpdate} />
      )}
    </div>
  );
}

function GalleryWidget({ content, config }: { content: ContentObject[]; config: Widget["config"] }) {
  const layout = asString((config as any).layout, "grid");
  const columns = Math.min(Math.max(asNumber((config as any).columns, 3), 1), 4);

  if (content.length === 0) return <div className="p-8 text-center text-muted-foreground">No content in this gallery</div>;

  return (
    <div
      className={cn("p-2", layout === "grid" ? "grid gap-2" : "space-y-2")}
      style={layout === "grid" ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {content.map((item) => (
        <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
          {item.type === "image" && item.storage_url ? (
            <img src={item.storage_url} alt={item.title || ""} className="w-full h-full object-cover" />
          ) : item.type === "video" && item.storage_url ? (
            <video src={item.storage_url} className="w-full h-full object-cover" />
          ) : item.type === "audio" && item.storage_url ? (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MediaWidget({ content }: { content?: ContentObject }) {
  if (!content) return <div className="p-8 text-center text-muted-foreground">No media selected</div>;

  return (
    <div className="aspect-video">
      {content.type === "image" && content.storage_url ? (
        <img src={content.storage_url} alt={content.title || ""} className="w-full h-full object-contain" />
      ) : content.type === "video" && content.storage_url ? (
        <video src={content.storage_url} controls className="w-full h-full object-contain" />
      ) : content.type === "audio" && content.storage_url ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <audio src={content.storage_url} controls />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function TextWidget({ config }: { config: Widget["config"] }) {
  const title = asString((config as any).title, "");
  const text = asString((config as any).text, "");
  return (
    <div className="p-6">
      {title ? <h4 className="text-lg font-semibold mb-2">{title}</h4> : null}
      <p className="text-foreground/80 whitespace-pre-wrap">{text || "No text content"}</p>
    </div>
  );
}

function ProfileInfoWidget({ config }: { config: Widget["config"] }) {
  const bioText = asString((config as any).bio, "");
  const location = asString((config as any).location, "");
  return (
    <div className="p-6">
      <p className="text-foreground/80">{bioText || "No bio provided"}</p>
      {location ? <p className="text-sm text-muted-foreground mt-2">{location}</p> : null}
    </div>
  );
}

function LinkTreeWidget({ config }: { config: Widget["config"] }) {
  const links = asLinks((config as any).links);
  return (
    <div className="p-4 space-y-2">
      {links.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No links added</p>
      ) : (
        links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="font-medium">{link.title}</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        ))
      )}
    </div>
  );
}

function EmbedWidget({ config }: { config: Widget["config"] }) {
  const embedUrl = asString((config as any).embedUrl, "");
  if (!embedUrl) return <div className="p-8 text-center text-muted-foreground">No embed URL provided</div>;
  return (
    <div className="aspect-video">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function FeedWidget({ config }: { config: Widget["config"] }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <select
          className="h-8 rounded-md border bg-background px-2 text-sm"
          defaultValue="24h"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>
      <div className="text-center text-muted-foreground py-8">
        <Rss className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Feed content appears here</p>
      </div>
    </div>
  );
}


function AlbumWidget({ content }: { content: ContentObject[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (content.length === 0) setCurrentIndex(0);
    else setCurrentIndex((i) => Math.max(0, Math.min(i, content.length - 1)));
  }, [content.length]);

  if (content.length === 0) return <div className="p-8 text-center text-muted-foreground">No content in this album</div>;

  const currentItem = content[currentIndex];

  return (
    <div>
      <div className="aspect-video relative">
        {currentItem.type === "image" && currentItem.storage_url ? (
          <img src={currentItem.storage_url} alt={currentItem.title || ""} className="w-full h-full object-contain" />
        ) : currentItem.type === "video" && currentItem.storage_url ? (
          <video src={currentItem.storage_url} controls className="w-full h-full object-contain" />
        ) : currentItem.type === "audio" && currentItem.storage_url ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <audio src={currentItem.storage_url} controls />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {content.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? content.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev === content.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>

      {content.length > 1 && (
        <div className="p-2 flex gap-1 overflow-x-auto">
          {content.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-12 h-12 rounded overflow-hidden flex-shrink-0 border-2 transition-colors",
                index === currentIndex ? "border-primary" : "border-transparent"
              )}
            >
              {item.type === "image" && item.storage_url ? (
                <img src={item.storage_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </button>
          ))}
        </div>
      )}

      {currentItem.title ? (
        <div className="p-3 border-t border-border">
          <p className="text-sm font-medium">{currentItem.title}</p>
          {currentItem.description ? <p className="text-sm text-muted-foreground mt-1">{currentItem.description}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function WidgetTypeIcon({ type, className }: { type: WidgetType; className?: string }) {
  switch (type) {
    case "gallery":
      return <ImageIcon className={className} />;
    case "media":
      return <Video className={className} />;
    case "text":
      return <FileText className={className} />;
    case "profile_info":
      return <User className={className} />;
    case "link_tree":
      return <LinkIcon className={className} />;
    case "embed":
      return <ExternalLink className={className} />;
    case "feed":
      return <Rss className={className} />;
    case "album":
      return <ImageIcon className={className} />;
    default:
      return <FileText className={className} />;
  }
}

function WidgetSettingsModal({
  widget,
  onClose,
  onUpdate,
}: {
  widget: Widget;
  onClose: () => void;
  onUpdate: (updates: Partial<Widget>) => void;
}) {
  const [title, setTitle] = useState(widget.title || "");
  const [visibility, setVisibility] = useState(widget.visibility);

  const handleSave = () => {
    onUpdate({ title: title || undefined, visibility });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Widget Settings</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Widget title"
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Visibility</label>
            <div className="flex gap-2">
              {[
                { value: "public", label: "Public", icon: Globe },
                { value: "followers", label: "Followers", icon: Users },
                { value: "private", label: "Private", icon: Lock },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVisibility(option.value as WidgetVisibility)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    visibility === option.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <option.icon className="w-4 h-4" />
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
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AddWidgetModal({
  userId,
  onClose,
  onCreate,
}: {
  userId: string;
  onClose: () => void;
  onCreate: (type: WidgetType) => Promise<void>;
}) {
  const widgetTypes: Array<{
    type: WidgetType;
    label: string;
    description: string;
    icon: typeof ImageIcon;
  }> = [
    { type: "gallery", label: "Gallery", description: "Display a grid of media", icon: ImageIcon },
    { type: "album", label: "Album", description: "Carousel of content", icon: ImageIcon },
    { type: "text", label: "Text", description: "Bio or notes", icon: FileText },
    { type: "link_tree", label: "Links", description: "Collection of links", icon: LinkIcon },
    { type: "embed", label: "Embed", description: "YouTube, Spotify, etc.", icon: ExternalLink },
    { type: "feed", label: "Feed", description: "Recent activity", icon: Rss },
  ];

  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add Widget</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Choose a widget type to add to your profile</p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {widgetTypes.map((widget) => (
            <button
              key={widget.type}
              disabled={isCreating}
              onClick={async () => {
                setIsCreating(true);
                try {
                  await onCreate(widget.type);
                  onClose();
                } finally {
                  setIsCreating(false);
                }
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <widget.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{widget.label}</p>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Add content from HOME to populate your widgets</p>
        </div>
      </div>
    </div>
  );
}