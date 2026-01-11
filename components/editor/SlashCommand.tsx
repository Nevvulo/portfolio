import type { Editor } from "@tiptap/react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  SlashCommandMenu,
  SlashCommandItem,
  SlashCommandIcon,
  SlashCommandText,
  SlashCommandTitle,
  SlashCommandDescription,
} from "./styles";

interface SlashCommandProps {
  editor: Editor | null;
  onImageUpload?: () => void;
}

interface CommandItem {
  title: string;
  description: string;
  icon: JSX.Element;
  command: (editor: Editor) => void;
}

const COMMANDS: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: (
      <span style={{ fontWeight: 700, fontSize: "14px" }}>H1</span>
    ),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: (
      <span style={{ fontWeight: 700, fontSize: "14px" }}>H2</span>
    ),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: (
      <span style={{ fontWeight: 700, fontSize: "14px" }}>H3</span>
    ),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Create a bullet list",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Quote",
    description: "Create a blockquote",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Add a code block",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Add a horizontal divider",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 11h16v2H4z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Blog Post Preview",
    description: "Embed a blog post card",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
    command: (editor) => editor.commands.setBlogPostPreview({ id: "" }),
  },
  {
    title: "YouTube Video",
    description: "Embed a YouTube video",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
      </svg>
    ),
    command: (editor) => editor.commands.setYouTube({ id: "" }),
  },
  {
    title: "Info Callout",
    description: "Add an info callout box",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    ),
    command: (editor) => editor.commands.setCallout({ type: "info" }),
  },
  {
    title: "Warning Callout",
    description: "Add a warning callout box",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    ),
    command: (editor) => editor.commands.setCallout({ type: "warning" }),
  },
  {
    title: "Tip Callout",
    description: "Add a tip callout box",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
      </svg>
    ),
    command: (editor) => editor.commands.setCallout({ type: "tip" }),
  },
  {
    title: "Code Playground",
    description: "Add an interactive code playground",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
    command: (editor) => editor.commands.setCodePlayground({ language: "javascript" }),
  },
];

export function SlashCommand({ editor, onImageUpload }: SlashCommandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Add image command if handler is provided
  const commands = onImageUpload
    ? [
        ...COMMANDS.slice(0, 7),
        {
          title: "Image",
          description: "Upload an image",
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          ),
          command: () => {
            onImageUpload();
          },
        },
        ...COMMANDS.slice(7),
      ]
    : COMMANDS;

  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (filteredCommands[selectedIndex] && editor) {
            // Delete the slash and query
            const { from } = editor.state.selection;
            editor
              .chain()
              .focus()
              .deleteRange({ from: from - query.length - 1, to: from })
              .run();
            filteredCommands[selectedIndex].command(editor);
            setIsOpen(false);
            setQuery("");
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setQuery("");
          break;
      }
    },
    [isOpen, filteredCommands, selectedIndex, editor, query]
  );

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

      // Check if user typed "/"
      const slashMatch = textBefore.match(/\/(\w*)$/);

      if (slashMatch) {
        setIsOpen(true);
        setQuery(slashMatch[1] || "");
        setSelectedIndex(0);

        // Calculate position
        const coords = editor.view.coordsAtPos($from.pos);
        const editorRect = editor.view.dom.getBoundingClientRect();
        setPosition({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        });
      } else {
        setIsOpen(false);
        setQuery("");
      }
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen || !editor) return null;

  return (
    <SlashCommandMenu
      ref={menuRef}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {filteredCommands.length === 0 ? (
        <SlashCommandItem disabled>
          <SlashCommandText>
            <SlashCommandTitle>No results</SlashCommandTitle>
          </SlashCommandText>
        </SlashCommandItem>
      ) : (
        filteredCommands.map((cmd, index) => (
          <SlashCommandItem
            key={cmd.title}
            $selected={index === selectedIndex}
            onClick={() => {
              const { from } = editor.state.selection;
              editor
                .chain()
                .focus()
                .deleteRange({ from: from - query.length - 1, to: from })
                .run();
              cmd.command(editor);
              setIsOpen(false);
              setQuery("");
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <SlashCommandIcon>{cmd.icon}</SlashCommandIcon>
            <SlashCommandText>
              <SlashCommandTitle>{cmd.title}</SlashCommandTitle>
              <SlashCommandDescription>{cmd.description}</SlashCommandDescription>
            </SlashCommandText>
          </SlashCommandItem>
        ))
      )}
    </SlashCommandMenu>
  );
}

export default SlashCommand;
