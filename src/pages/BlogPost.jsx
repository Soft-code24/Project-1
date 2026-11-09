import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { EmptyState } from '../components/ui/Form.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SEO } from '../components/SEO.jsx'

export default function BlogPost() {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // This is a client-rendered page; for full SEO, add a Next.js/SSR route or
  // prerender these pages at build time. Meta tags are set below as a fallback.
  useEffect(() => {
    document.title = 'Story | SavorBite'
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'SavorBite stories — behind the scenes from the Lagos kitchen.')
  }, [])

  async function loadPost(slug) {
    try {
      setLoading(true)
      const { post } = await api.getBlogPost(slug)
      setPost(post)
      document.title = `${post.title} | SavorBite`
      document.querySelector('meta[name="description"]')?.setAttribute('content', post.excerpt || 'SavorBite story')
    } catch (err) {
      setError(err.message || 'Post not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // slug is not passed by React Router here because this page is rendered
    // client-side; the slug is read from the URL.
    const slug = window.location.pathname.replace('/blog/', '')
    if (slug) loadPost(slug)
  }, [])

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading story…</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <>
      <SEO title="Story not found | SavorBite" />
      <div className="container-page py-16">
        <EmptyState
          icon={PackageCheck}
          title="Story not found"
          description={error || "We couldn't find this story."}
          action={<Button to="/blog">Back to stories</Button>}
        />
      </div>
    </>
    )
  }

  return (
    <>
    <SEO
      title={`${post.title} | SavorBite`}
      description={post.excerpt}
      image={post.cover_image}
      path={`/blog/${post.slug}`}
    />
    <div className="container-page py-8 max-w-3xl">
      <article>
        {post.cover_image && (
          <div className="mb-6 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-container-low">
            <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <span className="text-label-sm font-semibold text-primary">
          {new Date(post.created_at).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <h1 className="mt-3 font-display text-headline-lg text-text-primary">{post.title}</h1>
        <p className="mt-2 text-body-md text-text-secondary">{post.excerpt}</p>
        <div className="mt-6 prose prose-lg text-text-secondary">
          {post.content.split('\n\n').map((para, i) => (
            <p key={i} className="mb-4">{para}</p>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-2">
          <Link to="/blog" className="text-label-md font-medium text-primary hover:underline">
            ← Back to stories
          </Link>
        </div>
      </article>
    </div>
    </>
  )
}
