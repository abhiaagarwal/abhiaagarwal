export function parseInlineCode(text: string): string {
    return text.replace(
        /`([^`]+)`/g,
        '<code class="inline-code font-medium bg-light-gray rounded-sm text-[95%] not-italic">$1</code>',
    );
}
