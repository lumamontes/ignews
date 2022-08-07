import * as prismic from '@prismicio/client'

export const repositoryName = 'ig-news-ignt'

export const client = prismic.createClient(repositoryName, {
  accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  routes: [],
})