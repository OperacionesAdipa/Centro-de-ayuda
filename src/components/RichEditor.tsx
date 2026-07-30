'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import { useEffect, useCallback, useState } from 'react'
import { ImageAnnotator } from './ImageAnnotator'

interface Props {
  content: string
  onChange: (html: string) => void
}

interface ImageMenu {
  src: string
  x: number
  y: number
}

export function RichEditor({ content, onChange }: Props) {
  const [annotatingUrl, setAnnotatingUrl] = useState<string | null>(null)
  const [imageMenu, setImageMenu] = useState<ImageMenu | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Escribe el contenido del artículo...' }),
      Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'rich-editor-content' },
      handleClickOn: (view, pos, node, nodePos, event) => {
        if (node.type.name === 'image') {
          const rect = (event.target as HTMLElement).getBoundingClientRect()
          setImageMenu({
            src: node.attrs.src,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          })
          return true
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content])

  useEffect(() => {
    function handleClickOutside() {
      setImageMenu(null)
    }
    if (imageMenu) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 100)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [imageMenu])

  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addVideo = useCallback(() => {
    const url = window.prompt('URL del video (Vimeo o YouTube):')
    if (!url || !editor) return
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      const vimeoId = vimeoMatch[1]
      const iframeHtml = `<div style="padding:56.25% 0 0 0;position:relative;margin:16px 0;"><iframe src="https://player.vimeo.com/video/${vimeoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`
      const currentHtml = editor.getHTML()
      const newHtml = currentHtml + iframeHtml
      editor.commands.setContent(newHtml, false)
      onChange(newHtml)
    } else {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const url = window.prompt('URL del enlace:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  function handleAnnotationSave(annotatedUrl: string) {
    if (!editor || !annotatingUrl) return
    const html = editor.getHTML()
    const newHtml = html.replace(
      new RegExp('src="' + annotatingUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g'),
      'src="' + annotatedUrl + '"'
    )
    editor.commands.setContent(newHtml, false)
    onChange(newHtml)
    setAnnotatingUrl(null)
  }

  function handleDeleteImage(src: string) {
    if (!editor) return
    if (!confirm('¿Eliminar esta imagen?')) return
    const html = editor.getHTML()
    const newHtml = html
      .replace(new RegExp('<figure[^>]*>\\s*<img[^>]*src="' + src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>\\s*</figure>', 'g'), '')
      .replace(new RegExp('<img[^>]*src="' + src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>', 'g'), '')
    editor.commands.setContent(newHtml, false)
    onChange(newHtml)
    setImageMenu(null)
  }

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
          <button className="toolbar-btn" onClick={addVideo} title="Agregar video" type="button">&#127916; Video</button>
          <button className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita" type="button">&#8220; Cita</button>
          <button className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Código" type="button">&lt;/&gt;</button>
        </div>
        <div className="toolbar-sep" />
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Deshacer" type="button">&#8630;</button>
          <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Rehacer" type="button">&#8631;</button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', padding: '4px 8px', background: '#f8f8fc', borderBottom: '0.5px solid var(--border)' }}>
          Haz clic en una imagen para editarla o eliminarla
        </p>
        <EditorContent editor={editor} />
      </div>

      {imageMenu && (
        <div
          style={{
            position: 'fixed',
            top: imageMenu.y,
            left: imageMenu.x,
            transform: 'translate(-50%, -100%)',
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setAnnotatingUrl(imageMenu.src); setImageMenu(null) }}
            style={{ padding: '10px 20px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s', textAlign: 'left' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--lp)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            ✏️ Editar imagen
          </button>
          <div style={{ height: '0.5px', background: 'var(--border)' }} />
          <button
            onClick={() => handleDeleteImage(imageMenu.src)}
            style={{ padding: '10px 20px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#e24b4a', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s', textAlign: 'left' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            🗑️ Eliminar imagen
          </button>
        </div>
      )}

      {annotatingUrl && (
        <ImageAnnotator
          imageUrl={annotatingUrl}
          onSave={handleAnnotationSave}
          onClose={() => setAnnotatingUrl(null)}
        />
      )}
    </div>
  )
}
