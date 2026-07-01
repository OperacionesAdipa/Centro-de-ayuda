'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'

interface Props {
  content: string
  onChange: (html: string) => void
}

export function RichEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Escribe el contenido del artículo...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'rich-editor-content' },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content])

  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const url = window.prompt('URL del enlace:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="rich-editor-wrap">
      <div className="rich-editor-toolbar">
        <div className="toolbar-group">
          <button className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita" type="button"><b>B</b></button>
          <button className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva" type="button"><i>I</i></button>
          <button className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado" type="button"><u>U</u></button>
          <button className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado" type="button"><s>S</s></button>
        </div>
        <div className="toolbar-sep" />
        <div className="toolbar-group">
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1" type="button">H1</button>
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2" type="button">H2</button>
          <button className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3" type="button">H3</button>
        </div>
        <div className="toolbar-sep" />
        <div className="toolbar-group">
          <button className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista" type="button">&#8226; Lista</button>
          <button className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada" type="button">1. Lista</button>
        </div>
        <div className="toolbar-sep" />
        <div className="toolbar-group">
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinear izquierda" type="button">&#8676;</button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrar" type="button">&#8660;</button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinear derecha" type="button">&#8677;</button>
          <button className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justificar" type="button">&#8803;</button>
        </div>
        <div className="toolbar-sep" />
        <div className="toolbar-group">
          <button className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`} onClick={setLink} title="Agregar enlace" type="button">&#128279; Link</button>
          <button className="toolbar-btn" onClick={addImage} title="Agregar imagen" type="button">&#128247; Imagen</button>
          <button className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita" type="button">&#8220; Cita</button>
          <button className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Código" type="button">&lt;/&gt;</button>
        </div>
        <div className="toolbar-sep" />
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Deshacer" type="button">&#8630;</button>
          <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Rehacer" type="button">&#8631;</button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
