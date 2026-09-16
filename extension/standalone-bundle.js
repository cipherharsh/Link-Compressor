/**
 * @file Self-contained LinkZip compression engine for browser extension (IIFE).
 * Bundles alphabets and compression engine so it can run without ES modules.
 */
(function (global) {
  "use strict";

  // ────────────────────────────────────────────────────────────────────────────
  // Alphabets & Dictionaries
  // ────────────────────────────────────────────────────────────────────────────

  const subalphabets = [
    /* 0 */ "0123456789-_",
    /* 1 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZ-_",
    /* 2 */ "abcdefghijklmnopqrstuvwxyz-_",
    /* 3 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_",
    /* 4 */ "abcdefghijklmnopqrstuvwxyz0123456789-_",
    /* 5 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
    /* 6 */ "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    /* 7 */ "!#$&'()*+,-.0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]_abcdefghijklmnopqrstuvwxyz~%"
  ];

  const outputAlphabetASCII =
    "!#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]_abcdefghijklmnopqrstuvwxyz~".split("");

  const outputAlphabetQR =
    "$*+-./:0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  function buildHuffmanTable(symbols) {
    const n = symbols.length;
    if (n === 0) return { encode: {}, decode: {} };
    if (n === 1) return { encode: { [symbols[0]]: "0" }, decode: { "0": symbols[0] } };

    let nodes = symbols.map((s, i) => ({ freq: 1 / (i + 1), symbol: s }));

    while (nodes.length > 1) {
      nodes.sort((a, b) => a.freq - b.freq);
      const left  = nodes.shift();
      const right = nodes.shift();
      nodes.push({ freq: left.freq + right.freq, left, right });
    }

    const encode = {};
    const decode = {};

    (function walk(node, code) {
      if (node.symbol !== undefined) {
        const c = code || "0";
        encode[node.symbol] = c;
        decode[c] = node.symbol;
        return;
      }
      if (node.left)  walk(node.left,  code + "0");
      if (node.right) walk(node.right, code + "1");
    })(nodes[0], "");

    return { encode, decode };
  }

  const TLD_LIST = [
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

  const DOMAIN_LIST = [
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

  const PATH_SEGMENT_LIST = [
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

  const tldHuffman     = buildHuffmanTable(TLD_LIST);
  const domainHuffman  = buildHuffmanTable(DOMAIN_LIST);
  const pathSegHuffman = buildHuffmanTable(PATH_SEGMENT_LIST);

  const VERSION = 0;

  // ────────────────────────────────────────────────────────────────────────────
  // Bit I/O
  // ────────────────────────────────────────────────────────────────────────────

  class BitWriter {
    constructor() { this.bits = []; }
    write(value, n) {
      for (let i = n - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
    }
    writeBit(b) { this.bits.push(b & 1); }
    writeString(s) { for (const ch of s) this.bits.push(+ch); }
    writeVarLen(len) {
      if (len < 32) {
        this.writeBit(0);
        this.write(len, 5);
      } else {
        this.writeBit(1);
        this.write(len, 8);
      }
    }
    get length() { return this.bits.length; }
    toArray() { return this.bits.slice(); }
  }

  class BitReader {
    constructor(bits) { this.bits = bits; this.pos = 0; }
    read(n) {
      let v = 0;
      for (let i = 0; i < n; i++) v = (v << 1) | (this.bits[this.pos++] || 0);
      return v;
    }
    readBit() { return this.bits[this.pos++] || 0; }
    readVarLen() {
      const flag = this.readBit();
      return flag === 0 ? this.read(5) : this.read(8);
    }
    hasMore() { return this.pos < this.bits.length; }
  }

  function cheapestAlphabet(str) {
    outer: for (let i = 0; i < subalphabets.length; i++) {
      const alpha = subalphabets[i];
      for (const ch of str) {
        if (!alpha.includes(ch)) continue outer;
      }
      return i;
    }
    return -1;
  }

  function bitsPerChar(n) { return Math.ceil(Math.log2(n)); }

  function encodeSegmentWith(writer, segment, alphaIdx) {
    const alpha = subalphabets[alphaIdx];
    const bpc   = bitsPerChar(alpha.length);
    writer.write(alphaIdx, 3);
    writer.writeVarLen(segment.length);
    for (const ch of segment) {
      const idx = alpha.indexOf(ch);
      writer.write(idx === -1 ? 0 : idx, bpc);
    }
  }

  function encodeSegment(writer, segment) {
    const alphaIdx = cheapestAlphabet(segment);
    encodeSegmentWith(writer, segment, alphaIdx === -1 ? 7 : alphaIdx);
  }

  function decodeSegment(reader) {
    const alphaIdx = reader.read(3);
    const len      = reader.readVarLen();
    const alpha    = subalphabets[alphaIdx];
    const bpc      = bitsPerChar(alpha.length);
    let out = "";
    for (let i = 0; i < len; i++) out += alpha[reader.read(bpc)] || "?";
    return out;
  }

  function huffmanEncode(writer, value, huffTable) {
    const code = huffTable.encode[value];
    if (code !== undefined) {
      writer.writeBit(1);
      writer.writeString(code);
      return true;
    }
    writer.writeBit(0);
    return false;
  }

  function huffmanDecode(reader, huffTable) {
    const hit = reader.readBit();
    if (hit === 1) {
      let code = "";
      while (true) {
        code += reader.readBit();
        if (huffTable.decode[code] !== undefined) return huffTable.decode[code];
        if (code.length > 30) throw new Error("Huffman decode: code too long");
      }
    }
    return null;
  }

  function parseURL(url) {
    const result = {
      isHttps: true, hasWWW: false, hasIndexHtml: false,
      hasPort: false, port: 0, hasQuery: false, hasTrailingSlash: false,
      tld: "", domain: "", subdomain: "",
      pathSegments: [], query: "", fragment: "",
    };

    let s = url.trim();

    if (s.startsWith("https://"))      { result.isHttps = true;  s = s.slice(8); }
    else if (s.startsWith("http://"))  { result.isHttps = false; s = s.slice(7); }
    else if (s.startsWith("//"))       { s = s.slice(2); }

    const hashIdx = s.indexOf("#");
    if (hashIdx !== -1) { result.fragment = s.slice(hashIdx + 1); s = s.slice(0, hashIdx); }

    const qIdx = s.indexOf("?");
    if (qIdx !== -1) { result.query = s.slice(qIdx + 1); result.hasQuery = true; s = s.slice(0, qIdx); }

    const slashIdx = s.indexOf("/");
    let host, path;
    if (slashIdx !== -1) {
      host = s.slice(0, slashIdx);
      path = s.slice(slashIdx + 1);
      if (path === "") {
        result.hasTrailingSlash = true;
      }
    } else {
      host = s;
      path = "";
    }

    if (path.endsWith("index.html")) {
      result.hasIndexHtml = true;
      path = path.slice(0, -10);
      if (path.endsWith("/")) path = path.slice(0, -1);
    }

    if (path.endsWith("/")) {
      result.hasTrailingSlash = true;
      path = path.slice(0, -1);
    }

    result.pathSegments = path ? path.split("/") : [];

    const colonIdx = host.lastIndexOf(":");
    if (colonIdx !== -1) {
      const maybePort = host.slice(colonIdx + 1);
      if (/^\d+$/.test(maybePort)) {
        result.port = parseInt(maybePort, 10);
        const defaultPort = result.isHttps ? 443 : 80;
        if (result.port !== defaultPort) { result.hasPort = true; }
        host = host.slice(0, colonIdx);
      }
    }

    if (host.startsWith("www.")) { result.hasWWW = true; host = host.slice(4); }

    const parts = host.split(".");
    if (parts.length >= 2) {
      const last2 = parts.slice(-2).join(".");
      if (tldHuffman.encode[last2] !== undefined && parts.length >= 3) {
        result.tld    = last2;
        result.domain = parts[parts.length - 3];
        result.subdomain = parts.slice(0, -3).join(".");
      } else {
        result.tld    = parts[parts.length - 1];
        result.domain = parts[parts.length - 2];
        result.subdomain = parts.slice(0, -2).join(".");
      }
    } else {
      result.domain = host;
    }

    return result;
  }

  function buildURL(p) {
    let url = p.isHttps ? "https://" : "http://";
    if (p.hasWWW) url += "www.";
    if (p.subdomain) url += p.subdomain + ".";
    url += p.domain;
    if (p.tld) url += "." + p.tld;
    if (p.hasPort) url += ":" + p.port;
    if (p.pathSegments.length > 0) url += "/" + p.pathSegments.join("/");
    if (p.hasTrailingSlash) url += "/";
    if (p.hasIndexHtml) {
      if (p.hasTrailingSlash) {
        url += "index.html";
      } else {
        url += "/index.html";
      }
    }
    if (p.hasQuery) url += "?" + p.query;
    if (p.fragment) url += "#" + p.fragment;
    return url;
  }

  function compress(url) {
    const parsed = parseURL(url);
    const writer = new BitWriter();
    const analytics = { stages: [], totalOriginalBits: url.length * 8 };

    writer.write(VERSION, 3);

    writer.writeBit(parsed.isHttps ? 1 : 0);
    writer.writeBit(parsed.hasWWW ? 1 : 0);
    writer.writeBit(parsed.hasIndexHtml ? 1 : 0);
    writer.writeBit(parsed.hasPort ? 1 : 0);
    writer.writeBit(parsed.hasQuery ? 1 : 0);
    writer.writeBit(parsed.hasTrailingSlash ? 1 : 0);

    analytics.stages.push({
      name: "Protocol & flags",
      bitsUsed: writer.length,
      saved: (parsed.isHttps ? 8 : 7) + (parsed.hasWWW ? 4 : 0) + (parsed.hasIndexHtml ? 10 : 0),
      method: "flag bits",
    });

    if (parsed.hasPort) {
      writer.write(parsed.port, 16);
      analytics.stages.push({ name: "Port", bitsUsed: 16, method: "16‑bit raw" });
    }

    const tldStart = writer.length;
    const tldHit   = huffmanEncode(writer, parsed.tld, tldHuffman);
    if (!tldHit) {
      encodeSegment(writer, parsed.tld);
    }
    analytics.stages.push({
      name: `TLD: "${parsed.tld}"`,
      bitsUsed: writer.length - tldStart,
      hit: tldHit,
      method: tldHit ? "huffman" : "raw",
      saved: tldHit ? Math.max(0, parsed.tld.length * 8 - (writer.length - tldStart)) : 0,
    });

    const domStart = writer.length;
    const domHit   = huffmanEncode(writer, parsed.domain, domainHuffman);
    if (!domHit) {
      encodeSegment(writer, parsed.domain);
    }
    analytics.stages.push({
      name: `Domain: "${parsed.domain}"`,
      bitsUsed: writer.length - domStart,
      hit: domHit,
      method: domHit ? "huffman" : "subalphabet",
      saved: domHit ? Math.max(0, parsed.domain.length * 8 - (writer.length - domStart)) : 0,
    });

    const subStart = writer.length;
    writer.writeBit(parsed.subdomain ? 1 : 0);
    if (parsed.subdomain) {
      const subParts = parsed.subdomain.split(".");
      writer.writeVarLen(subParts.length);
      for (const part of subParts) encodeSegment(writer, part);
      analytics.stages.push({
        name: `Subdomain: "${parsed.subdomain}"`,
        bitsUsed: writer.length - subStart,
        method: "subalphabet",
      });
    }

    const pathStart = writer.length;
    writer.writeVarLen(parsed.pathSegments.length);

    for (const seg of parsed.pathSegments) {
      const segHit = huffmanEncode(writer, seg, pathSegHuffman);
      if (!segHit) {
        encodeSegment(writer, seg);
      }
    }
    analytics.stages.push({
      name: `Path (${parsed.pathSegments.length} segments)`,
      bitsUsed: writer.length - pathStart,
      method: "huffman+subalphabet",
    });

    if (parsed.hasQuery) {
      const qStart = writer.length;
      encodeSegment(writer, parsed.query);
      analytics.stages.push({
        name: "Query string",
        bitsUsed: writer.length - qStart,
        method: "subalphabet",
      });
    }

    const fragStart = writer.length;
    writer.writeBit(parsed.fragment ? 1 : 0);
    if (parsed.fragment) {
      encodeSegment(writer, parsed.fragment);
      analytics.stages.push({
        name: "Fragment",
        bitsUsed: writer.length - fragStart,
        method: "subalphabet",
      });
    }

    analytics.totalCompressedBits = writer.length;
    return { bits: writer.toArray(), analytics };
  }

  function decompress(bits) {
    const reader = new BitReader(bits);
    const p = {
      isHttps: true, hasWWW: false, hasIndexHtml: false,
      hasPort: false, port: 0, hasQuery: false, hasTrailingSlash: false,
      tld: "", domain: "", subdomain: "",
      pathSegments: [], query: "", fragment: "",
    };

    const version = reader.read(3);
    if (version !== VERSION) throw new Error(`Unsupported version: ${version}`);

    p.isHttps          = reader.readBit() === 1;
    p.hasWWW           = reader.readBit() === 1;
    p.hasIndexHtml     = reader.readBit() === 1;
    p.hasPort          = reader.readBit() === 1;
    p.hasQuery         = reader.readBit() === 1;
    p.hasTrailingSlash = reader.readBit() === 1;

    if (p.hasPort) p.port = reader.read(16);

    const tldResult = huffmanDecode(reader, tldHuffman);
    if (tldResult !== null) {
      p.tld = tldResult;
    } else {
      p.tld = decodeSegment(reader);
    }

    const domResult = huffmanDecode(reader, domainHuffman);
    if (domResult !== null) {
      p.domain = domResult;
    } else {
      p.domain = decodeSegment(reader);
    }

    const hasSub = reader.readBit();
    if (hasSub) {
      const subCount = reader.readVarLen();
      const subParts = [];
      for (let i = 0; i < subCount; i++) subParts.push(decodeSegment(reader));
      p.subdomain = subParts.join(".");
    }

    const pathCount = reader.readVarLen();
    for (let i = 0; i < pathCount; i++) {
      const segResult = huffmanDecode(reader, pathSegHuffman);
      if (segResult !== null) {
        p.pathSegments.push(segResult);
      } else {
        p.pathSegments.push(decodeSegment(reader));
      }
    }

    if (p.hasQuery) {
      p.query = decodeSegment(reader);
    }

    const hasFrag = reader.readBit();
    if (hasFrag) {
      p.fragment = decodeSegment(reader);
    }

    return buildURL(p);
  }

  function bitsToString(bits, alphabet) {
    const withSentinel = [1, ...bits];
    let num = 0n;
    for (const b of withSentinel) num = (num << 1n) | BigInt(b);

    const base = BigInt(alphabet.length);
    if (num === 0n) return alphabet[0];

    const chars = [];
    while (num > 0n) {
      chars.push(alphabet[Number(num % base)]);
      num /= base;
    }
    chars.reverse();
    return chars.join("");
  }

  function stringToBits(str, alphabet) {
    const base = BigInt(alphabet.length);
    const charMap = new Map();
    alphabet.forEach((ch, i) => charMap.set(ch, BigInt(i)));

    let num = 0n;
    for (const ch of str) {
      const val = charMap.get(ch);
      if (val === undefined) throw new Error(`Invalid character in compressed string: "${ch}"`);
      num = num * base + val;
    }

    const bits = [];
    while (num > 0n) {
      bits.push(Number(num & 1n));
      num >>= 1n;
    }
    bits.reverse();

    if (bits.length > 0 && bits[0] === 1) bits.shift();
    return bits;
  }

  function encode(url, mode = "ascii") {
    const alphabet = mode === "qr" ? outputAlphabetQR : outputAlphabetASCII;
    const { bits, analytics } = compress(url);
    const encoded = bitsToString(bits, alphabet);
    analytics.originalLength   = url.length;
    analytics.compressedLength = encoded.length;
    analytics.ratio = 1 - encoded.length / url.length;
    return { encoded, analytics };
  }

  function decode(str, mode = "ascii") {
    const alphabet = mode === "qr" ? outputAlphabetQR : outputAlphabetASCII;
    const bits = stringToBits(str, alphabet);
    return decompress(bits);
  }

  // Export to global
  global.LinkZip = {
    encode,
    decode,
    compress,
    decompress,
    bitsToString,
    stringToBits,
    parseURL,
    buildURL,
    subalphabets,
    outputAlphabetASCII,
    outputAlphabetQR,
  };
})(typeof self !== "undefined" ? self : globalThis);
