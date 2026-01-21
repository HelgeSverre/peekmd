export function getScripts(): string {
  return `
    // Keep server alive on refresh
    fetch('/ping');

    window.addEventListener('beforeunload', () => { fetch('/close'); });

    // Dark mode
    const toggle = document.getElementById('darkToggle');
    const setDark = (dark) => {
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('dark', dark);
      if (window.updateMermaidTheme) window.updateMermaidTheme(dark);
    };
    const stored = localStorage.getItem('dark');
    setDark(stored !== null ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches);
    toggle.addEventListener('click', () => setDark(!document.documentElement.classList.contains('dark')));

    // File tree collapse state
    const fileTree = document.querySelector('details.Box');
    if (fileTree) {
      const storedTree = localStorage.getItem('fileTreeOpen');
      if (storedTree !== null) {
        fileTree.open = storedTree === 'true';
      }
      fileTree.addEventListener('toggle', () => {
        localStorage.setItem('fileTreeOpen', fileTree.open);
      });
    }
  `;
}

export function getMermaidInit(): string {
  return `
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    const darkMode = localStorage.getItem('dark') === 'true' ||
      (localStorage.getItem('dark') === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    mermaid.initialize({
      startOnLoad: true,
      theme: darkMode ? 'dark' : 'default'
    });
    window.updateMermaidTheme = async (isDark) => {
      mermaid.initialize({ theme: isDark ? 'dark' : 'default' });
      const diagrams = document.querySelectorAll('.mermaid');
      for (const el of diagrams) {
        const code = el.getAttribute('data-mermaid-src') || el.textContent;
        el.setAttribute('data-mermaid-src', code);
        el.removeAttribute('data-processed');
        el.innerHTML = code;
      }
      await mermaid.run({ nodes: diagrams });
    };
  `;
}
