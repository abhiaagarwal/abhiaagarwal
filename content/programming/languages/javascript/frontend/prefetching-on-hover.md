---
title: Prefetching on hover in pure Javascript
description: The best way to fake a fast website is to simplify anticipate what the user is doing.
tags: [thoughts]
published: 2025-06-01T16:38:00-04:00
---
If you visit the /about page of my blog, there's an easter egg. That easter egg features a few images, but the browser only fetches the images on viewport, which can cause a flash of content. Traditionally, the best way to solve this problem is to signal to the browser to load some assets with a `<link rel="prefetch">` in the `<head>`. However, I don't necessarily want to prefetch these images immediately as it is not necessarily a guarantee that the user will click the button leading them to an image, and I'd rather preserve my reader's bandwidth wherever possible.

I'm spoiled by react frameworks, and in particular, [`Tanstack Router`](https://tanstack.com/router/latest), which has the ability to fetch whenever an user hovers over a `<Link>` element. I use this, combined with `react-query`, to make my SPAs feel instantaneous to the end user by aggressively prefetching. But in the case of this blog, it's written in pure Javascript/Astro. How can I do that?

Surprisingly, it's quite easy: find the component you're interested in, attach an `mouseenter` listener, and then take the desired asset and append a `<link prefetch>` to the head dynamically.

```html
<html>
    <body>
        <button id="my-button">
            Hover me!
        </button>
    </body>
    <script type="module">
        const myButton = document.getElementById("my-button");
        myButton.addEventListener("mouseenter", () => {
            if (myButton.dataset.prefetched === "true") {
                return;
            }

            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = "https://example.com/image.png";
            document.head.appendChild(link);
            myButton.dataset.prefetched = "true";
        });
    </script>
</html>
```

Note that I add the `prefetched` data flag to the button, so that I don't prefetch the image multiple times if the user is feeling particularly indecisive.

Note that I'm using `rel="prefetch"` instead of `rel="preload"`. This is because `rel="preload"` is used to preload "high-importance" assets, while `rel="prefetch"` signals to the browser that the image is lower-priority. As much as I value these assets, I think I can be reasonable and say they are more of a "prefetch" then a "preload".