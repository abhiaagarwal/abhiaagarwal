interface Window {
    THEME_KEY: string;
    THEMES: readonly ["light", "dark", "system"];
    applyEffectiveTheme: (theme: string) => void;
    setThemePreference: (theme: string | null) => void;
}
