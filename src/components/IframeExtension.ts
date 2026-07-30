import { Node, mergeAttributes } from '@tiptap/core'

export const IframeExtension = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      frameborder: { default: '0' },
      allowfullscreen: { default: true },
      allow: { default: 'encrypted-media' },
      style: { default: 'width: 100%; aspect-ratio: 16 / 9;' },
      'data-oembed-url': { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure.wysiwyg-media',
        getAttrs: (element) => {
          const iframe = (element as HTMLElement).querySelector('iframe')
          const div = (element as HTMLElement).querySelector('div')
          return {
            src: iframe?.getAttribute('src') ?? null,
            'data-oembed-url': div?.getAttribute('data-oembed-url') ?? null,
          }
        },
      },
      { tag: 'iframe' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      { class: 'wysiwyg-media' },
      [
        'div',
        { 'data-oembed-url': HTMLAttributes['data-oembed-url'] ?? '' },
        ['iframe', mergeAttributes(HTMLAttributes)],
      ],
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const figure = document.createElement('figure')
      figure.className = 'wysiwyg-media'
      figure.style.margin = '16px 0'
      figure.style.position = 'relative'

      const div = document.createElement('div')

      const iframe = document.createElement('iframe')
      iframe.src = node.attrs.src ?? ''
      iframe.frameBorder = '0'
      iframe.allowFullscreen = true
      iframe.style.cssText = 'width: 100%; aspect-ratio: 16 / 9;'

      const deleteBtn = document.createElement('button')
      deleteBtn.innerHTML = '🗑️ Eliminar video'
      deleteBtn.style.cssText = 'position:absolute;top:8px;right:8px;background:#e24b4a;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;z-index:10;'
      deleteBtn.addEventListener('click', () => {
        figure.remove()
      })

      div.appendChild(iframe)
      figure.appendChild(div)
      figure.appendChild(deleteBtn)

      return {
        dom: figure,
        update: () => false,
      }
    }
  },
})
