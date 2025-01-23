export const blogInfo = {
  // CHANGED: was "SaaS Starter Blog"
  name: "AutoCRM Blog",
  description: "Our official blog with the latest updates from AutoCRM",
}

export type BlogPost = {
  link: string
  date: string
  title: string
  description: string
  parsedDate?: Date
}

// Updated the first blog post to remove template references
const blogPosts: BlogPost[] = [
  {
    // CHANGED: removed "with this template"
    title: "How we built a 41kb AI CRM website",
    // CHANGED: new description with no mention of "template"
    description:
      "We share our approach for building a small, fast AI CRM site.",
    link: "/blog/how_we_built_our_41kb_saas_website",
    date: "2024-03-10",
  },
  {
    title: "Example Blog Post 2",
    description: "Even more example content!",
    link: "/blog/awesome_post",
    date: "2022-9-23",
  },
  {
    title: "Example Blog Post",
    description: "A sample blog post, showing our blog engine",
    link: "/blog/example_blog_post",
    date: "2023-03-13",
  },
]

// (Rest of the file remains unchanged)
for (const post of blogPosts) {
  if (!post.parsedDate) {
    const dateParts = post.date.split("-")
    post.parsedDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
    )
  }
}

export const sortedBlogPosts = blogPosts.sort(
  (a, b) => (b.parsedDate?.getTime() ?? 0) - (a.parsedDate?.getTime() ?? 0),
)
