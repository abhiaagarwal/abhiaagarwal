import { execSync } from "child_process";
import type { Root } from "mdast";
import type { VFile } from "vfile";

export function remarkGitTimes() {
    return function (tree: Root, file: VFile) {
        const filepath = file.history[0];

        file.data.astro = file.data.astro ?? {};
        file.data.astro.frontmatter = file.data.astro.frontmatter ?? {};

        const createdTime = execSync(
            `git log --follow --format="%cI" --reverse -- "${filepath}"`,
            { encoding: "utf8" },
        )
            .toString()
            .split("\n")[0]
            .trim()
            .split(" ")[0];
        const modifiedTime = execSync(
            `git log -1 --format="%cI" -- "${filepath}"`,
            { encoding: "utf8" },
        )
            .toString()
            .split("\n")[0]
            .trim()
            .split(" ")[0];

        if (createdTime !== "") {
            file.data.astro.frontmatter.createdTime = createdTime;
            file.data.astro.frontmatter.lastModified =
                modifiedTime || createdTime;
        } else {
            // Fallback: if we can't get created time, use modified time
            file.data.astro.frontmatter.createdTime = modifiedTime;
        }
    };
}
