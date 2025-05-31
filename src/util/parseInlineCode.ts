export function parseInlineCode(text: string): string {
    return text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
}
