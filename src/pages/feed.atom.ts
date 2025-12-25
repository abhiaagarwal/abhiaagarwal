import type { APIRoute } from "astro";
import { FeedGenerator } from "../util/feedGenerator";

export const GET: APIRoute = async ({ site }) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const siteUrl = site!.toString();

    const feedGenerator = await FeedGenerator.create();
    const feedContent = await feedGenerator.generateMainFeed(siteUrl, "atom");

    return new Response(feedContent, {
        headers: {
            "Content-Type": "application/atom+xml; charset=utf-8",
        },
    });
};
