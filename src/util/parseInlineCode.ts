export function parseInlineCode(text: string): string {
    return text.replace(
        /`([^`]+)`/g,
        '<code class="inline-code bg-light-gray rounded-sm text-[95%]">$1</code>',
    );
}
