import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, PackageCheck, Utensils } from 'lucide-react'
import { api } from '../lib/api.js'
import { EmptyState } from '../components/ui/Form.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SEO } from '../components/SEO.jsx'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.listBlogPosts()
      .then(({ posts }) => {
        setPosts(posts)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load posts')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading stories…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={PackageCheck}
          title="Could not load stories"
          description={error}
          action={<Button to="/">Back to home</Button>}
        />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={PackageCheck}
          title="No stories yet"
          description="Check back soon for updates from the SavorBite kitchen."
          action={<Button to="/">Back to home</Button>}
        />
      </div>
    )
  }

  return (
    <>
    <SEO title="SavorBite Stories | SavorBite" description="Behind the scenes, kitchen stories, and what's new on the menu from SavorBite Lagos." path="/blog" />
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-headline-lg text-text-primary">SavorBite Stories</h1>
      <p className="mb-8 text-body-md text-text-secondary">
        Behind the scenes, kitchen stories, and what’s new on the menu.
      </p>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.id} className="group rounded-2xl border border-border-subtle bg-white shadow-card overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
              {post.cover_image ? (
                <img src={post.cover_image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <Utensils size={32} aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="p-5">
              <span className="text-label-sm font-semibold text-primary">
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <Link to={`/blog/${post.slug}`} className="block mt-2">
                <h2 className="font-display text-headline-md text-text-primary group-hover:text-primary line-clamp-2">{post.title}</h2>
              </Link>
              <p className="mt-2 text-body-md text-text-secondary line-clamp-3">{post.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
    </>
  )
}
