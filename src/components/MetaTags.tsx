import { useEffect } from 'react'

interface MetaTagsProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function MetaTags({ title, description, image, url }: MetaTagsProps) {
  useEffect(() => {
    if (title) document.title = title

    const setMeta = (property: string, content: string) => {
      let el =
        document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        if (property.startsWith('og:')) {
          el.setAttribute('property', property)
        } else {
          el.setAttribute('name', property)
        }
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (title) {
      setMeta('og:title', title)
      setMeta('twitter:title', title)
    }
    if (description) {
      setMeta('description', description)
      setMeta('og:description', description)
      setMeta('twitter:description', description)
    }
    if (image) {
      setMeta('og:image', image)
      setMeta('twitter:image', image)
      setMeta('twitter:card', 'summary_large_image')
    }
    if (url) {
      setMeta('og:url', url)
    }
  }, [title, description, image, url])

  return null
}
