// hooks/useTaskTemplates.ts
// Saved task shapes: list them, add one, remove one.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type { TaskPriority, TaskTemplateDto, TaskTemplateNode } from '@/types/planner';

export interface CreateTemplateInput {
  name: string;
  title: string;
  priority?: TaskPriority;
  subtasks?: TaskTemplateNode[];
}

export interface UseTaskTemplatesReturn {
  templates: TaskTemplateDto[];
  loading: boolean;
  refetch: () => Promise<void>;
  createTemplate: (input: CreateTemplateInput) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
}

export function useTaskTemplates(): UseTaskTemplatesReturn {
  const [templates, setTemplates] = useState<TaskTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { mutate } = useMutation();

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/task-templates', { credentials: 'include' });
      const json = await response.json();
      if (!response.ok || !json.success) return;
      setTemplates(json.data as TaskTemplateDto[]);
    } catch {
      // The picker simply shows no templates; creating tasks still works.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(
    async (input: CreateTemplateInput) => {
      const created = await mutate<CreateTemplateInput>('/api/task-templates', {
        method: 'POST',
        body: input,
      });
      if (!created) return false;
      await fetchTemplates();
      return true;
    },
    [mutate, fetchTemplates]
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      const result = await mutate(`/api/task-templates/${templateId}`, { method: 'DELETE' });
      if (!result) return false;
      setTemplates((prev) => prev.filter((template) => template.id !== templateId));
      return true;
    },
    [mutate]
  );

  return { templates, loading, refetch: fetchTemplates, createTemplate, deleteTemplate };
}
