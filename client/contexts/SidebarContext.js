"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // Use useCallback to ensure stable function references
  const handleSetIsCollapsed = useCallback((value) => {
    setIsCollapsed(value);
  }, []);

  const handleSetIsPinned = useCallback((value) => {
    setIsPinned(value);
  }, []);

  const handleSetIsMobileOpen = useCallback((value) => {
    setIsMobileOpen(value);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const contextValue = {
    isCollapsed,
    setIsCollapsed: handleSetIsCollapsed,
    isPinned,
    setIsPinned: handleSetIsPinned,
    isMobileOpen,
    setIsMobileOpen: handleSetIsMobileOpen,
    toggleMobileSidebar,
    isMobile,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useCustomSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useCustomSidebar must be used within a SidebarProvider");
  }
  return context;
};
