// components/RichTextEditor/RichTextEditor.tsx
'use client';

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MenuBar } from "./MenuBar";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
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

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "เริ่มพิมพ์...",
  disabled = false 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
    ],
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] p-4 max-w-none focus:outline-none prose prose-sm dark:prose-invert",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    // ✅ แก้ไข: รองรับทั้ง JSON และ plain text
    content: content && isValidJSON(content) ? JSON.parse(content) : content || "",
  });

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-card">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
}