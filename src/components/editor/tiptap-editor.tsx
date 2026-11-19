"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  ImageIcon,
  Undo2,
  Redo2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TiptapEditorProps {
  content: Record<string, unknown>;
  companyId: string;
  onChange: (json: Record<string, unknown>) => void;
}

export function TiptapEditor({
  content,
  companyId,
  onChange,
}: TiptapEditorProps) {
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [imageOpen, setImageOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ImageExtension.configure({
        inline: false,
      }),
      Placeholder.configure({
        placeholder: "Write your article...",
      }),
    ],
    content,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[420px] rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]" />
    );
  }

  function applyLink(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: trimmed })
        .run();
    }
    setLinkUrl("");
    setLinkOpen(false);
  }

  function applyImageUrl(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    const trimmed = imageUrl.trim();
    if (trimmed) {
      editor.chain().focus().setImage({ src: trimmed }).run();
    }
    setImageUrl("");
    setImageOpen(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    setImageError(null);
    setUploadingImage(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${companyId}/inline/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        setImageError(uploadError.message);
        setUploadingImage(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(filePath);

      editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
      setImageOpen(false);
    } catch {
      setImageError("Failed to upload image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const toolbarButtons = [
    {
      label: "Heading 1",
      icon: Heading1,
      active: editor.isActive("heading", { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      active: editor.isActive("heading", { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bold",
      icon: Bold,
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Bullet list",
      icon: List,
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Ordered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Blockquote",
      icon: Quote,
      active: editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Code block",
      icon: Code2,
      active: editor.isActive("codeBlock"),
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ];

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-0.5 border-b border-[#E5E7EB] bg-[#FAFAFA] px-2 py-1.5">
        {toolbarButtons.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              title={item.label}
              aria-label={item.label}
              aria-pressed={item.active}
              className={cn(
                "inline-flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded text-[#6B7280] transition-colors",
                "hover:bg-[#E5E7EB]/60 hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25",
                item.active && "bg-white text-[#1E3A8A] shadow-sm border border-[#E5E7EB]"
              )}
            >
              <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            </button>
          );
        })}

        <div className="mx-1 h-4 w-px bg-[#E5E7EB]" aria-hidden="true" />

        <button
          type="button"
          onClick={() => {
            const existing = editor.getAttributes("link").href as string | undefined;
            setLinkUrl(existing ?? "");
            setLinkOpen((prev) => !prev);
            setImageOpen(false);
          }}
          title="Insert link"
          aria-label="Insert link"
          aria-pressed={editor.isActive("link")}
          className={cn(
            "inline-flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded text-[#6B7280] transition-colors",
            "hover:bg-[#E5E7EB]/60 hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25",
            editor.isActive("link") &&
              "bg-white text-[#1E3A8A] shadow-sm border border-[#E5E7EB]"
          )}
        >
          <Link2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => {
            setImageOpen((prev) => !prev);
            setLinkOpen(false);
            setImageError(null);
          }}
          title="Insert image"
          aria-label="Insert image"
          className="inline-flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#E5E7EB]/60 hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25"
        >
          <ImageIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
            aria-label="Undo"
            className="inline-flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#E5E7EB]/60 hover:text-[#111827] disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
            aria-label="Redo"
            className="inline-flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#E5E7EB]/60 hover:text-[#111827] disabled:opacity-40"
          >
            <Redo2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Inline Link Form */}
      {linkOpen && (
        <form
          onSubmit={applyLink}
          className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2"
        >
          <Input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            aria-label="Link URL"
            className="h-8 max-w-xs text-[13px]"
          />
          <Button type="submit" size="sm" variant="primary">
            Apply
          </Button>
          {editor.isActive("link") && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setLinkOpen(false);
              }}
            >
              Remove link
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLinkOpen(false)}
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Inline Image Form */}
      {imageOpen && (
        <div className="space-y-2 border-b border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5">
          <form onSubmit={applyImageUrl} className="flex flex-wrap items-center gap-2">
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL (https://...)"
              aria-label="Image URL"
              className="h-8 max-w-xs text-[13px]"
            />
            <Button type="submit" size="sm" variant="primary">
              Insert URL
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Upload image
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setImageOpen(false)}
            >
              Cancel
            </Button>
          </form>
          {imageError && (
            <p className="text-[12px] text-[#DC2626]">{imageError}</p>
          )}
        </div>
      )}

      {/* Editor Canvas */}
      <div className="px-3.5 py-3 sm:px-5 sm:py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
