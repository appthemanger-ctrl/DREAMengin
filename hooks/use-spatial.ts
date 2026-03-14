"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import type {
  SpaceType,
  Widget,
  ContentObject,
  Album,
  NavigationState,
  ShareIntent,
  CreateContentInput,
  CreateWidgetInput,
  CreateAlbumInput,
  UpdateContentInput,
  UpdateWidgetInput,
} from "@/types/spatial";

// =============================================================================
// FETCHERS
// =============================================================================

const fetcher = async (key: string) => {
  const supabase = createClient();
  const [resource, userId, space] = key.split("/");

  switch (resource) {
    case "widgets": {
      const query = supabase
        .from("widgets")
        .select("*")
        .eq("user_id", userId)
        .order("order");

      if (space) {
        query.eq("space", space);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "content": {
      const { data, error } = await supabase
        .from("content_objects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }

    case "albums": {
      const { data, error } = await supabase
        .from("albums")
        .select("*, album_content(*, content_objects(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }

    case "widget-content": {
      const { data, error } = await supabase
        .from("widget_content")
        .select("*, content_objects(*)")
        .eq("widget_id", userId) // userId is actually widget_id here
        .order("order");

      if (error) throw error;
      return data;
    }

    default:
      throw new Error(`Unknown resource: ${resource}`);
  }
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for managing spatial navigation state
 */
export function useSpatialNavigation(initialSpace: SpaceType = "home") {
  const [navigation, setNavigation] = useState<NavigationState>({
    space: initialSpace,
    currentIndex: 0,
    totalWidgets: 0,
  });

  const navigateLeft = useCallback(() => {
    setNavigation((prev) => ({
      ...prev,
      currentIndex:
        prev.currentIndex === 0
          ? prev.totalWidgets - 1
          : prev.currentIndex - 1,
      lastDirection: "left",
    }));
  }, []);

  const navigateRight = useCallback(() => {
    setNavigation((prev) => ({
      ...prev,
      currentIndex:
        prev.currentIndex === prev.totalWidgets - 1
          ? 0
          : prev.currentIndex + 1,
      lastDirection: "right",
    }));
  }, []);

  const navigateToIndex = useCallback((index: number) => {
    setNavigation((prev) => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.totalWidgets - 1)),
    }));
  }, []);

  const switchSpace = useCallback((space: SpaceType) => {
    setNavigation((prev) => ({
      ...prev,
      space,
      currentIndex: 0,
    }));
  }, []);

  const setTotalWidgets = useCallback((total: number) => {
    setNavigation((prev) => ({
      ...prev,
      totalWidgets: total,
      currentIndex: Math.min(prev.currentIndex, Math.max(0, total - 1)),
    }));
  }, []);

  return {
    navigation,
    navigateLeft,
    navigateRight,
    navigateToIndex,
    switchSpace,
    setTotalWidgets,
  };
}

/**
 * Hook for managing widgets
 */
export function useWidgets(userId: string, space?: SpaceType) {
  const key = space ? `widgets/${userId}/${space}` : `widgets/${userId}`;
  const { data: widgets, error, isLoading } = useSWR<Widget[]>(key, fetcher);

  const createWidget = useCallback(
    async (input: CreateWidgetInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("widgets")
        .insert({
          ...input,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      mutate(key);
      return data;
    },
    [key]
  );

  const updateWidget = useCallback(
    async (widgetId: string, input: UpdateWidgetInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("widgets")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      mutate(key);
      return data;
    },
    [key]
  );

  const deleteWidget = useCallback(
    async (widgetId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("widgets")
        .delete()
        .eq("id", widgetId);

      if (error) throw error;
      mutate(key);
    },
    [key]
  );

  const reorderWidgets = useCallback(
    async (widgetIds: string[]) => {
      const supabase = createClient();
      const updates = widgetIds.map((id, index) => ({
        id,
        order: index,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("widgets")
          .update({ order: update.order, updated_at: update.updated_at })
          .eq("id", update.id);

        if (error) throw error;
      }

      mutate(key);
    },
    [key]
  );

  return {
    widgets: widgets || [],
    isLoading,
    error,
    createWidget,
    updateWidget,
    deleteWidget,
    reorderWidgets,
  };
}

/**
 * Hook for managing content objects (HOME content archive)
 */
export function useContent(userId: string) {
  const key = `content/${userId}`;
  const { data: content, error, isLoading } = useSWR<ContentObject[]>(key, fetcher);

  const createContent = useCallback(
    async (input: CreateContentInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_objects")
        .insert({
          ...input,
          visibility: input.visibility || "private", // Always private by default
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      mutate(key);
      return data;
    },
    [key]
  );

  const updateContent = useCallback(
    async (contentId: string, input: UpdateContentInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_objects")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentId)
        .select()
        .single();

      if (error) throw error;
      mutate(key);
      return data;
    },
    [key]
  );

  const deleteContent = useCallback(
    async (contentId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_objects")
        .delete()
        .eq("id", contentId);

      if (error) throw error;
      mutate(key);
    },
    [key]
  );

  // Separate private and shared content
  const privateContent = useMemo(
    () => content?.filter((c: ContentObject) => c.visibility === "private") || [],
    [content]
  );

  const sharedContent = useMemo(
    () => content?.filter((c: ContentObject) => c.visibility === "shared") || [],
    [content]
  );

  return {
    content: content || [],
    privateContent,
    sharedContent,
    isLoading,
    error,
    createContent,
    updateContent,
    deleteContent,
  };
}

/**
 * Hook for managing albums
 */
export function useAlbums(userId: string) {
  const key = `albums/${userId}`;
  const { data: albums, error, isLoading } = useSWR<Album[]>(key, fetcher);

  const createAlbum = useCallback(
    async (input: CreateAlbumInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("albums")
        .insert({
          ...input,
          is_shared: input.is_shared || false, // Never shared by default
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      mutate(key);
      return data;
    },
    [key]
  );

  const addContentToAlbum = useCallback(
    async (albumId: string, contentIds: string[]) => {
      const supabase = createClient();

      // Get current max order
      const { data: existing } = await supabase
        .from("album_content")
        .select("order")
        .eq("album_id", albumId)
        .order("order", { ascending: false })
        .limit(1);

      const startOrder = existing?.[0]?.order ?? -1;

      const inserts = contentIds.map((contentId, index) => ({
        album_id: albumId,
        content_id: contentId,
        order: startOrder + index + 1,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("album_content").insert(inserts);

      if (error) throw error;
      mutate(key);
    },
    [key]
  );

  const removeContentFromAlbum = useCallback(
    async (albumId: string, contentId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("album_content")
        .delete()
        .eq("album_id", albumId)
        .eq("content_id", contentId);

      if (error) throw error;
      mutate(key);
    },
    [key]
  );

  return {
    albums: albums || [],
    isLoading,
    error,
    createAlbum,
    addContentToAlbum,
    removeContentFromAlbum,
  };
}

/**
 * Hook for sharing content from HOME to PROFILE
 */
export function useShareToProfile(userId: string) {
  const [isSharing, setIsSharing] = useState(false);

  const shareContent = useCallback(
    async (intent: ShareIntent) => {
      setIsSharing(true);
      try {
        const supabase = createClient();

        // Mark content as shared
        if (intent.content_ids?.length) {
          const { error: contentError } = await supabase
            .from("content_objects")
            .update({
              visibility: "shared",
              updated_at: new Date().toISOString(),
            })
            .in("id", intent.content_ids);

          if (contentError) throw contentError;
        }

        // Mark album as shared if applicable
        if (intent.album_id) {
          const { error: albumError } = await supabase
            .from("albums")
            .update({
              is_shared: true,
              shared_content_ids: intent.content_ids || [],
              updated_at: new Date().toISOString(),
            })
            .eq("id", intent.album_id);

          if (albumError) throw albumError;
        }

        // Create or update PROFILE widget
        let widgetId = intent.target_widget_id;

        if (intent.create_new_widget) {
          const { data: newWidget, error: widgetError } = await supabase
            .from("widgets")
            .insert({
              user_id: userId,
              space: "profile",
              type: intent.create_new_widget.type,
              title: intent.create_new_widget.title,
              config: intent.create_new_widget.config || {},
              visibility: intent.visibility,
              overlap: {
                link_type: intent.link_type,
                source_content_ids: intent.content_ids,
                source_album_id: intent.album_id,
                created_at: new Date().toISOString(),
              },
              order: 999, // Will be reordered
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (widgetError) throw widgetError;
          widgetId = newWidget.id;
        } else if (widgetId) {
          // Update existing widget's overlap
          const { error: updateError } = await supabase
            .from("widgets")
            .update({
              overlap: {
                link_type: intent.link_type,
                source_content_ids: intent.content_ids,
                source_album_id: intent.album_id,
                created_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", widgetId);

          if (updateError) throw updateError;
        }

        // Add content references to widget
        if (widgetId && intent.content_ids?.length) {
          const contentRefs = intent.content_ids.map((contentId, index) => ({
            widget_id: widgetId,
            content_id: contentId,
            order: index,
            created_at: new Date().toISOString(),
          }));

          const { error: refError } = await supabase
            .from("widget_content")
            .insert(contentRefs);

          if (refError) throw refError;
        }

        // Invalidate caches
        mutate(`widgets/${userId}/profile`);
        mutate(`content/${userId}`);
        mutate(`albums/${userId}`);

        return { success: true, widgetId };
      } catch (error) {
        console.error("Error sharing content:", error);
        throw error;
      } finally {
        setIsSharing(false);
      }
    },
    [userId]
  );

  const unshareContent = useCallback(
    async (contentIds: string[]) => {
      const supabase = createClient();

      // Mark content as private again
      const { error } = await supabase
        .from("content_objects")
        .update({
          visibility: "private",
          updated_at: new Date().toISOString(),
        })
        .in("id", contentIds);

      if (error) throw error;

      // Remove from widget_content
      const { error: refError } = await supabase
        .from("widget_content")
        .delete()
        .in("content_id", contentIds);

      if (refError) throw refError;

      // Invalidate caches
      mutate(`content/${userId}`);
      mutate(`widgets/${userId}/profile`);
    },
    [userId]
  );

  return {
    isSharing,
    shareContent,
    unshareContent,
  };
}
