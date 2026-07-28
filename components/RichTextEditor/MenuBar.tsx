// components/RichTextEditor/MenuBar.tsx
'use client';

import { Editor } from "@tiptap/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  ListIcon,
  ListOrdered,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MenuBarProps {
  editor: Editor | null;
}

export function MenuBar({ editor }: MenuBarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBold().run()
                }
                className={cn(
                  editor.isActive("bold") && "bg-accent"
                )}
              >
                <Bold className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>ตัวหนา</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() =>
                  editor.chain().focus().toggleItalic().run()
                }
                className={cn(
                  editor.isActive("italic") && "bg-accent"
                )}
              >
                <Italic className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>ตัวเอียง</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() =>
                  editor.chain().focus().toggleStrike().run()
                }
                className={cn(
                  editor.isActive("strike") && "bg-accent"
                )}
              >
                <Strikethrough className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>ขีดทับ</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={cn(
                  editor.isActive("heading", { level: 1 }) && "bg-accent"
                )}
              >
                <Heading1 className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>หัวข้อขนาดใหญ่</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={cn(
                  editor.isActive("heading", { level: 2 }) && "bg-accent"
                )}
              >
                <Heading2 className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>หัวข้อขนาดกลาง</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={cn(
                  editor.isActive("heading", { level: 3 }) && "bg-accent"
                )}
              >
                <Heading3 className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>หัวข้อขนาดเล็ก</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
                className={cn(
                  editor.isActive("bulletList") && "bg-accent"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>รายการแบบจุด</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
                className={cn(
                  editor.isActive("orderedList") && "bg-accent"
                )}
              >
                <ListOrdered className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>รายการแบบตัวเลข</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-2" />
        
        <div className="flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "left" })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
                className={cn(
                  editor.isActive({ textAlign: "left" }) && "bg-accent"
                )}
              >
                <AlignLeft className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>จัดซ้าย</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "center" })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                className={cn(
                  editor.isActive({ textAlign: "center" }) && "bg-accent"
                )}
              >
                <AlignCenter className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>จัดกลาง</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "right" })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
                className={cn(
                  editor.isActive({ textAlign: "right" }) && "bg-accent"
                )}
              >
                <AlignRight className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>จัดขวา</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <div className="flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ย้อนกลับ</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ทำซ้ำ</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}