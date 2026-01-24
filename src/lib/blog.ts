import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'src/content/blog')

export interface Post {
    slug: string
    title: string
    date: string
    excerpt: string
    coverImage: string
    author: string
    tags: string[]
    content: string
}

export function getPostSlugs() {
    // Determine if directory exists first to avoid crashes on fresh deploy
    if (!fs.existsSync(postsDirectory)) {
        return []
    }
    return fs.readdirSync(postsDirectory)
}

export function getPostBySlug(slug: string, fields: string[] = []) {
    const realSlug = slug.replace(/\.md$/, '')
    const fullPath = path.join(postsDirectory, `${realSlug}.md`)

    try {
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        const items: any = {}

        // Ensure only the minimal needed data is exposed
        fields.forEach((field) => {
            if (field === 'slug') {
                items[field] = realSlug
            }
            if (field === 'content') {
                items[field] = content
            }

            if (typeof data[field] !== 'undefined') {
                items[field] = data[field]
            }
        })

        return items
    } catch (e) {
        return null
    }
}

export function getAllPosts(fields: string[] = []) {
    const slugs = getPostSlugs()
    const posts = slugs
        .map((slug) => getPostBySlug(slug, fields))
        .filter(post => post !== null)
        // sort posts by date in descending order
        .sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
    return posts
}

export function getRelatedPosts(currentSlug: string, limit = 3) {
    const allPosts = getAllPosts(['title', 'date', 'slug', 'coverImage', 'excerpt'])
    // Filter out current post
    const otherPosts = allPosts.filter((post) => post.slug !== currentSlug)
    // Shuffle or just return first N
    // Simple shuffle
    const shuffled = otherPosts.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, limit)
}
