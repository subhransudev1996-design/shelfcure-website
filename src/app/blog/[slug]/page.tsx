import { BLOG_POSTS } from "@/lib/blog-data";
import BlogPostContent from "./BlogPostContent";

// Required for static export - tells Next.js which slugs to pre-render
export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <BlogPostContent slug={resolvedParams.slug} />;
}
