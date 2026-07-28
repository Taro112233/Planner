// components/RichTextEditor/RichTextViewer.tsx
'use client';

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";

interface RichTextViewerProps {
  content: string;
}

// Helper function to check if content is JSON
function isValidJSON(str: string): boolean {
  if (!str) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Typography,
    ],
    immediatelyRender: false,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none",
      },
    },
    // ✅ แก้ไข: รองรับทั้ง JSON และ plain text
    content: content && isValidJSON(content) ? JSON.parse(content) : content || "",
  });

  return <EditorContent editor={editor} />;
}