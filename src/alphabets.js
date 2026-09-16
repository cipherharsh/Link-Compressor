/**
 * @file Character sets, output alphabets, and Huffman dictionaries for URL compression.
 *
 * Subalphabets are ordered from smallest to largest. The encoder picks the
 * cheapest (smallest) alphabet that covers every character in a segment,
 * minimizing the bits‑per‑character cost.
 *
 * Huffman tables are built at module‑load time from frequency‑sorted symbol
 * lists using canonical Huffman coding.  The most common TLDs / domains /
 * path‑segments get the shortest codes.
 */

// ────────────────────────────────────────────────────────────────────────────
// Sub‑alphabets  – used for per‑segment packing
// Each includes hyphen and underscore as very common URL separators.
// ────────────────────────────────────────────────────────────────────────────
export const subalphabets = [
  /* 0 */ "0123456789-_",                                                          // 12 chars → 4 bits
  /* 1 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZ-_",                                          // 28 chars → 5 bits
  /* 2 */ "abcdefghijklmnopqrstuvwxyz-_",                                          // 28 chars → 5 bits
  /* 3 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_",                                // 38 chars → 6 bits
  /* 4 */ "abcdefghijklmnopqrstuvwxyz0123456789-_",                                // 38 chars → 6 bits
  /* 5 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",               // 54 chars → 6 bits
  /* 6 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",     // 64 chars → 6 bits
  /* 7 */ "!#$&'()*+,-.0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]_abcdefghijklmnopqrstuvwxyz~%" // 80 chars → 7 bits
];

// ────────────────────────────────────────────────────────────────────────────
// Output alphabets – used to convert the final bitstream into a string
// ────────────────────────────────────────────────────────────────────────────

/** 78‑char URL‑safe alphabet for link output. Avoids characters that need
 *  percent‑encoding in URL paths (no space, no ", no < > { } | \ ^ ` ).  */
export const outputAlphabetASCII =
  "!#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]_abcdefghijklmnopqrstuvwxyz~".split("");

/** 42‑char subset of the QR alphanumeric charset.  The full QR‑A set is
 *  0–9 A–Z SP $ % * + - . / :  (45 chars).  We drop space, %, and use
 *  a strict sub‑set so every character is safe in a URL path *and*
 *  guaranteed to stay in QR alphanumeric mode.                           */
export const outputAlphabetQR =
  "$*+-./:0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ────────────────────────────────────────────────────────────────────────────
// Huffman table builder
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build canonical Huffman encode / decode maps from a list of symbols
 * sorted by descending frequency.  Uses Zipf‑like synthetic frequencies
 * (1/(rank+1)) to drive code‑length assignment.
 *
 * @param {string[]} symbols  Symbols sorted most‑frequent‑first.
 * @returns {{ encode: Object<string,string>, decode: Object<string,string> }}
 */
export function buildHuffmanTable(symbols) {
  const n = symbols.length;
  if (n === 0) return { encode: {}, decode: {} };
  if (n === 1) return { encode: { [symbols[0]]: "0" }, decode: { "0": symbols[0] } };

  // ── Build tree bottom‑up ──────────────────────────────────────────────
  /** @typedef {{ freq:number, symbol?:string, left?:object, right?:object }} Node */
  let nodes = symbols.map((s, i) => ({ freq: 1 / (i + 1), symbol: s }));

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left  = nodes.shift();
    const right = nodes.shift();
    nodes.push({ freq: left.freq + right.freq, left, right });
  }

  // ── Traverse tree to assign codes ─────────────────────────────────────
  const encode = {};
  const decode = {};

  (function walk(node, code) {
    if (node.symbol !== undefined) {
      const c = code || "0"; // single‑symbol edge case
      encode[node.symbol] = c;
      decode[c] = node.symbol;
      return;
    }
    if (node.left)  walk(node.left,  code + "0");
    if (node.right) walk(node.right, code + "1");
  })(nodes[0], "");

  return { encode, decode };
}

// ────────────────────────────────────────────────────────────────────────────
// TLD list  –  sorted by global registration / popularity
// ────────────────────────────────────────────────────────────────────────────
export const TLD_LIST = [
  "com","org","net","ru","de","uk","jp","br","it","fr",
  "au","nl","cn","ca","in","pl","es","eu","ch","se",
  "cz","be","at","info","me","us","edu","gov","tv","io",
  "co","cc","za","kr","mx","ar","tr","cl","pt","tw",
  "dk","hu","no","fi","nz","sk","ro","ua","bg","il",
  "hk","ie","sg","gr","th","my","lt","lv","ee","si",
  "hr","is","lu","cy","ph","vn","id","ng","ke","eg",
  "pk","bd","sa","ae","xyz","online","site","club","pro","biz",
  "app","dev","tech","store","live","world","today","space","fun","top",
  "icu","link","click","news","rocks","win","mobi","name","asia","cat",
  "tel","travel","jobs","mil","int","museum","coop","aero","xxx","pw"
];

// ────────────────────────────────────────────────────────────────────────────
// Domain list  –  most popular second‑level domains
// ────────────────────────────────────────────────────────────────────────────
export const DOMAIN_LIST = [
  "google","youtube","facebook","amazon","twitter","instagram","linkedin",
  "reddit","wikipedia","netflix","apple","microsoft","github","stackoverflow",
  "wordpress","tumblr","pinterest","dropbox","medium","quora","twitch",
  "spotify","yahoo","bing","ebay","bbc","nytimes","cnn","theguardian",
  "reuters","bloomberg","wsj","forbes","techcrunch","wired","arstechnica",
  "gitlab","bitbucket","npm","pypi","docker","aws","azure","heroku",
  "vercel","netlify","cloudflare","digitalocean","godaddy","namecheap",
  "squarespace","wix","shopify","etsy","walmart","target","bestbuy",
  "costco","homedepot","ikea","nike","adidas","samsung","sony","dell",
  "hp","lenovo","intel","amd","nvidia","cisco","oracle","ibm",
  "salesforce","adobe","figma","canva","notion","slack","discord","zoom",
  "whatsapp","telegram","signal","snapchat","tiktok","vimeo","soundcloud",
  "uber","lyft","airbnb","booking","expedia","tripadvisor","yelp",
  "stripe","paypal","chase","wellsfargo","capitalone","imdb","hulu",
  "disneyplus","crunchyroll","openai","anthropic","huggingface","kaggle",
  "coursera","udemy","edx","khanacademy","duolingo","grammarly",
  "stackoverflow","trello","asana","jira","confluence","miro","loom",
  "calendly","mailchimp","hubspot","zendesk","intercom","datadog",
  "splunk","elastic","grafana","prometheus","terraform","ansible",
  "kubernetes","nginx","apache","wordpress","drupal","magento",
  "firebase","supabase","planetscale","neon","vercel","railway",
  "render","fly","deno","bun","svelte","react","angular","vue",
  "nextjs","nuxt","remix","gatsby","astro","vite","webpack","babel",
  "eslint","prettier","jest","vitest","playwright","cypress","selenium",
  "storybook","chromatic","lottie","threejs","d3js","chartjs",
  "mapbox","leaflet","cesium","unity","unrealengine","godotengine",
  "blender","gimp","inkscape","audacity","obs","vlc","ffmpeg",
  "handbrake","calibre","keepass","bitwarden","protonmail","tutanota",
  "mullvad","wireguard","tailscale","zerotier","syncthing","restic",
  "rclone","borg","timeshift","ventoy","rufus","etcher","raspberry"
];

// ────────────────────────────────────────────────────────────────────────────
// Common path segments
// ────────────────────────────────────────────────────────────────────────────
export const PATH_SEGMENT_LIST = [
  "watch","search","wiki","api","v1","v2","v3","docs","help","about",
  "contact","login","signup","register","profile","settings","dashboard",
  "admin","users","user","posts","post","comments","comment","articles",
  "article","products","product","categories","category","tags","tag",
  "pages","page","images","image","files","file","uploads","upload",
  "downloads","download","assets","static","public","shared","status",
  "releases","release","issues","issue","pulls","pull","commits","commit",
  "branches","branch","raw","blob","tree","edit","delete","create",
  "new","update","view","list","index","home","feed","explore","trending",
  "popular","latest","featured","archive","blog","news","events","shop",
  "cart","checkout","orders","order","payment","pricing","plans","support",
  "faq","terms","privacy","security","en","es","fr","de","ja","zh",
  "ko","pt","ru","it","nl","pl","ar","hi","src","lib","bin","pkg",
  "dist","build","config","data","tmp","log","test","tests","spec",
  "app","main","server","client","web","mobile","desktop","embed"
];

// ────────────────────────────────────────────────────────────────────────────
// Pre‑built Huffman tables  (generated once at module load)
// ────────────────────────────────────────────────────────────────────────────
export const tldHuffman     = buildHuffmanTable(TLD_LIST);
export const domainHuffman  = buildHuffmanTable(DOMAIN_LIST);
export const pathSegHuffman = buildHuffmanTable(PATH_SEGMENT_LIST);
