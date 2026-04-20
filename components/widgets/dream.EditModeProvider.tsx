'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface EditModeContextValue {
  isEditing: boolean;
  enterEdit: () => void;
  exitEdit: () => void;
  toggleEdit: () => void;
}

const EditModeContext = createContext<EditModeContextValue>({
  isEditing: false,
  enterEdit: () => {},
  exitEdit: () => {},
  toggleEdit: () => {},
});

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const enterEdit = useCallback(() => setIsEditing(true), []);
  const exitEdit = useCallback(() => setIsEditing(false), []);
  const toggleEdit = useCallback(() => setIsEditing((v) => !v), []);
  return (
    <EditModeContext.Provider value={{ isEditing, enterEdit, exitEdit, toggleEdit }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
