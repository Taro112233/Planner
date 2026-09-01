// components/BoardPage/TemplateSubtaskEditor.tsx
// The checklist editor inside the template dialog.
//
// It renders the *same* components the real task detail uses
// (RecursiveSubtaskList / SubtaskRowMenu / AddSubtaskForm), so building a
// template looks and behaves exactly like editing a task. The blueprint is
// widened into SubtaskNodeDto shapes with local ids to make that possible, and
// narrowed back on save — nothing here talks to the API.
'use client';

import React from 'react';
import { RecursiveSubtaskList, SubtaskRowMenu, AddSubtaskForm } from '@/components/TaskDetail';
import type { SubtaskNodeDto, TaskTemplateNode } from '@/types/planner';

interface TemplateSubtaskEditorProps {
  nodes: TaskTemplateNode[];
  onChange: (nodes: TaskTemplateNode[]) => void;
}

/** Blueprint → the shape the task components render. */
function toDisplayNodes(nodes: TaskTemplateNode[], depth = 0, path = ''): SubtaskNodeDto[] {
  return nodes.map((node, index) => {
    const id = `${path}${index}`;
    return {
      id,
      title: node.title,
      // A template records structure, not progress: nothing is ticked and
      // nobody has ticked it.
      isDone: false,
      depth,
      childTotal: node.children.length,
      childDone: 0,
      checkedByName: null,
      checkedByAvatarUrl: null,
      checkedAt: null,
      children: toDisplayNodes(node.children, depth + 1, `${id}.`),
    };
  });
}

/** Apply `mutate` to the node at a dotted index path, rebuilding the tree. */
function updateAt(
  nodes: TaskTemplateNode[],
  path: number[],
  mutate: (siblings: TaskTemplateNode[], index: number) => TaskTemplateNode[]
): TaskTemplateNode[] {
  const [head, ...rest] = path;
  if (rest.length === 0) return mutate(nodes, head);

  return nodes.map((node, index) =>
    index === head ? { ...node, children: updateAt(node.children, rest, mutate) } : node
  );
}

function parsePath(id: string): number[] {
  return id.split('.').map(Number);
}

export function TemplateSubtaskEditor({ nodes, onChange }: TemplateSubtaskEditorProps) {
  const display = toDisplayNodes(nodes);

  const handleAddRoot = async (title: string) => {
    onChange([...nodes, { title, children: [] }]);
    return true;
  };

  const handleAddChild = async (id: string, title: string) => {
    onChange(
      updateAt(nodes, parsePath(id), (siblings, index) =>
        siblings.map((node, position) =>
          position === index
            ? { ...node, children: [...node.children, { title, children: [] }] }
            : node
        )
      )
    );
    return true;
  };

  const handleRename = async (id: string, title: string) => {
    onChange(
      updateAt(nodes, parsePath(id), (siblings, index) =>
        siblings.map((node, position) => (position === index ? { ...node, title } : node))
      )
    );
    return true;
  };

  const handleDelete = async (id: string) => {
    onChange(
      updateAt(nodes, parsePath(id), (siblings, index) =>
        siblings.filter((_, position) => position !== index)
      )
    );
    return true;
  };

  return (
    <div>
      {display.length > 0 ? (
        <RecursiveSubtaskList
          subtasks={display}
          // Ticking is meaningless in a blueprint; the boxes are shape only.
          onToggle={() => {}}
          showCheckedBy={false}
          renderNodeExtra={(subtask, depth) => (
            <SubtaskRowMenu
              subtask={subtask}
              depth={depth}
              disabled={false}
              onAddChild={(title) => handleAddChild(subtask.id, title)}
              onRename={(title) => handleRename(subtask.id, title)}
              onDeleteRequest={() => void handleDelete(subtask.id)}
            />
          )}
        />
      ) : (
        <p className="mb-2 text-sm text-content-tertiary">ยังไม่มีงานย่อยในเทมเพลตนี้</p>
      )}

      <div className="mt-2">
        <AddSubtaskForm onSubmit={handleAddRoot} />
      </div>
    </div>
  );
}
