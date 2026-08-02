export async function openBrowser(url: string): Promise<void> {
  const { execSync } = await import("child_process");

  const commands: Record<NodeJS.Platform, string | null> = {
    darwin: `open "${url}"`,
    win32: `start "" "${url}"`,
    linux: `xdg-open "${url}"`,
    aix: null,
    android: null,
    freebsd: `xdg-open "${url}"`,
    haiku: null,
    openbsd: `xdg-open "${url}"`,
    sunos: `xdg-open "${url}"`,
    cygwin: null,
    netbsd: null,
  };

  const command = commands[process.platform];
  if (!command) return;

  try {
    execSync(command, { stdio: "ignore" });
  } catch {
    console.log(
      "[peekmd] Could not open browser automatically. Please open the URL manually.",
    );
  }
}
