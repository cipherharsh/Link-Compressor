export default [
  // Simple domains
  'https://google.com',
  'https://github.com',
  'http://example.com',
  'https://apple.com',
  'https://microsoft.com',
  'https://amazon.com',
  'https://facebook.com',
  'https://twitter.com',
  'https://instagram.com',
  'https://linkedin.com',
  
  // With paths
  'https://github.com/user/repo',
  'https://en.wikipedia.org/wiki/Main_Page',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'https://nodejs.org/en/docs/',
  'https://reactjs.org/docs/getting-started.html',
  
  // With query strings
  'https://www.google.com/search?q=hello+world&hl=en',
  'https://www.youtube.com/results?search_query=javascript+tutorial',
  'https://twitter.com/search?q=webdev&src=typed_query',
  'https://example.com/api/data?userId=123&type=premium',
  
  // With fragments
  'https://example.com/page#section-1',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#instance_methods',
  'https://en.wikipedia.org/wiki/URL#History',
  
  // With ports
  'http://localhost:8080/api/v1/users',
  'http://127.0.0.1:3000',
  'https://example.com:8443/secure',
  
  // IP addresses
  'http://192.168.1.1/admin',
  'http://10.0.0.1/',
  'https://1.1.1.1/dns/',
  
  // Long paths
  'https://example.com/a/b/c/d/e/f/g',
  'https://github.com/microsoft/TypeScript/blob/main/src/compiler/parser.ts',
  'https://www.reddit.com/r/programming/comments/12345/a_very_long_post_title_with_many_words_in_it/',
  
  // Unicode in path (percent-encoded)
  'https://example.com/caf%C3%A9',
  'https://en.wikipedia.org/wiki/%E6%97%A5%E6%9C%AC',
  'https://example.com/search?q=%F0%9F%98%80',
  
  // Empty path
  'https://example.com',
  'http://test.com',
  
  // With www
  'https://www.example.com',
  'https://www.yahoo.com',
  'http://www.bing.com',
  
  // HTTP
  'http://example.com',
  'http://neverssl.com',
  'http://info.cern.ch',
  
  // With index.html
  'https://example.com/index.html',
  'http://test.com/about.html',
  
  // Complex query strings
  'https://example.com/search?q=test&page=1&sort=date&order=desc',
  'https://amazon.com/s?k=laptop&crid=12345&sprefix=laptop%2Caps%2C123&ref=nb_sb_noss_2',
  
  // YouTube
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  
  // Reddit
  'https://www.reddit.com/r/programming/comments/abc123/title',
  'https://old.reddit.com/r/webdev/',
  
  // Amazon
  'https://www.amazon.com/dp/B08N5WRWNW',
  'https://www.amazon.co.uk/product/dp/B08N5WRWNW',
  
  // Twitter/X
  'https://twitter.com/user/status/123456789',
  'https://x.com/elonmusk/status/123456789',
  
  // Edge cases
  'https://a.co',
  'https://t.co/12345',
  'https://bit.ly/12345',
  'https://tinyurl.com/12345',
  'https://g.co/12345',
  
  // Random / Various Domains
  'https://stackoverflow.com/questions/123456/how-to-do-something',
  'https://news.ycombinator.com/item?id=123456',
  'https://www.netflix.com/title/123456',
  'https://www.spotify.com/us/premium/',
  'https://open.spotify.com/track/123456',
  'https://discord.com/channels/123/456',
  'https://slack.com/workspace',
  'https://zoom.us/j/123456789',
  'https://www.twitch.tv/ninja',
  'https://www.apple.com/iphone-14/',
  'https://www.samsung.com/us/smartphones/',
  'https://www.bbc.com/news/world-123456',
  'https://www.cnn.com/2023/01/01/world/index.html',
  'https://www.nytimes.com/2023/01/01/world/index.html',
  'https://www.theguardian.com/world/2023/jan/01/news',
  'https://www.washingtonpost.com/world/2023/01/01/news',
  'https://www.wsj.com/articles/news-123456',
  'https://www.forbes.com/sites/user/2023/01/01/news/',
  'https://www.bloomberg.com/news/articles/2023-01-01/news',
  'https://www.reuters.com/world/news-123456/',
  'https://www.cnbc.com/2023/01/01/news.html',
  'https://www.foxnews.com/world/news',
  'https://www.npr.org/2023/01/01/123456/news',
  'https://www.pbs.org/newshour/world/news',
  'https://www.aljazeera.com/news/2023/1/1/news',
  'https://www.bbc.co.uk/news/world-123456',
  'https://www.imdb.com/title/tt1234567/',
  'https://www.rottentomatoes.com/m/movie_title',
  'https://www.metacritic.com/movie/movie-title',
  'https://www.ign.com/articles/news',
  'https://www.gamespot.com/articles/news/123456/',
  'https://www.pcgamer.com/news/',
  'https://www.polygon.com/2023/1/1/123456/news',
  'https://www.theverge.com/2023/1/1/123456/news',
  'https://www.engadget.com/news-123456.html',
  'https://techcrunch.com/2023/01/01/news/',
  'https://www.wired.com/story/news/',
  'https://arstechnica.com/gadgets/2023/01/news/',
  'https://www.vice.com/en/article/123456/news',
  'https://www.buzzfeed.com/user/news',
  'https://www.huffpost.com/entry/news_123456',
  'https://www.medium.com/@user/article-123456',
  'https://dev.to/user/article',
  'https://hashnode.com/post/article',
  'https://www.quora.com/What-is-this',
  'https://answers.yahoo.com/question/index?qid=123456',
  'https://www.wikipedia.org/',
  'https://wikimediafoundation.org/',
  'https://www.w3.org/',
  'https://html.spec.whatwg.org/multipage/',
  'https://tc39.es/ecma262/',
  'https://caniuse.com/?search=flexbox',
  'https://css-tricks.com/almanac/properties/a/align-items/',
  'https://smashingmagazine.com/2023/01/article/',
  'https://alistapart.com/article/title/',
  'https://csswizardry.com/2023/01/article/',
  'https://bradfrost.com/blog/post/title/',
  'https://kentcdodds.com/blog/title',
  'https://overreacted.io/a-complete-guide-to-useeffect/',
  'https://martinheinz.dev/blog/1',
  'https://joshwcomeau.com/react/useeffect/',
  'https://bobbyhadz.com/blog/javascript-error',
  'https://flaviocopes.com/javascript/',
  'https://javascript.info/',
  'https://eloquentjavascript.net/',
  'https://youmightnotneedjquery.com/',
  'https://bundlephobia.com/package/react@18.2.0',
  'https://www.npmjs.com/package/express',
  'https://yarnpkg.com/package/lodash',
  'https://pnpm.io/',
  'https://deno.land/x/oak@v11.1.0/mod.ts',
  'https://bun.sh/docs',
  'https://go.dev/doc/',
  'https://rust-lang.org/learn',
  'https://python.org/downloads/',
  'https://docs.oracle.com/en/java/',
  'https://learn.microsoft.com/en-us/dotnet/csharp/',
  'https://php.net/manual/en/index.php',
  'https://ruby-lang.org/en/documentation/',
  'https://elixir-lang.org/learning.html',
  'https://kotlinlang.org/docs/home.html',
  'https://swift.org/documentation/',
  'https://dart.dev/guides',
  'https://flutter.dev/docs',
  'https://reactnative.dev/docs/getting-started',
  'https://angular.io/docs',
  'https://vuejs.org/guide/introduction.html',
  'https://svelte.dev/docs',
  'https://astro.build/docs',
  'https://nextjs.org/docs',
  'https://remix.run/docs/en/v1',
  'https://nuxtjs.org/docs',
  'https://gatsbyjs.com/docs/',
  
  // No matches
  'https://random-unknown-domain-12345.xyz/path/to/thing',
  
  // Very long URL (200+ chars)
  'https://example.com/very/long/path/that/keeps/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going/and/going?with=lots&of=query&parameters=that&make=the&url=even&longer&and=longer&and=longer&and=longer&and=longer&and=longer&and=longer',
  
  // Specific match types
  'https://co.uk',
  'https://wikipedia.org'
];
