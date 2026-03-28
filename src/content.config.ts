import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    layout: z.string().optional(),
    title: z.string(),
    date: z.date().or(z.string()).transform((val) => new Date(val)),
    description: z.string().optional(),
    author: z.string().default('Q-Hung'),
    image: z.string().optional(),
    tags: z.array(z.string()).or(z.string().transform(s => [s])).optional(),
    categories: z.array(z.string()).or(z.string().transform(s => [s])).optional(),
    permalink: z.string().optional(),
    published: z.boolean().default(true),
    comments: z.boolean().default(true),
  }),
});

export const collections = { blog };
