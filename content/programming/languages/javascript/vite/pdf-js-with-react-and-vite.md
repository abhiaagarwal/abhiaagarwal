---
title: Using `pdf.js` with vite
description: How to import and use pdf.js, instantiate the webworker, and use wasm.
tags: [thoughts]
---

I recently had the problem of rasterizing PDFs on the frontend. Implementing the logic wasn't too difficult, but getting pdf.js working was what I wasted several hours on.

Let's assume you have a SPA, bundled with vite. The relevant NPM package you're looking for is [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist). From there, you're going to import 