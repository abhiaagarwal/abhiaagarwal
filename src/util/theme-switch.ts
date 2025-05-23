window.THEME_KEY = "theme-preference";
window.THEMES = ["light", "dark", "system"];

window.applyEffectiveTheme = (theme: string) => {
    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
};

window.setThemePreference = (theme: string | null) => {
    const initialPreference =
        theme && window.THEMES.includes(theme as (typeof window.THEMES)[number])
            ? theme
            : "system";

    document.documentElement.dataset.themePreference = initialPreference;

    window.applyEffectiveTheme(initialPreference);
};
const storedPreference = localStorage.getItem(window.THEME_KEY);
window.setThemePreference(storedPreference);
