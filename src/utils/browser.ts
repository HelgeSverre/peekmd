export function showToast(message: string): void {
  console.log(`[peekmd] ${message}`);
}

export async function openBrowser(url: string): Promise<void> {
  const { execSync } = await import("child_process");
  const platform = process.platform;

  try {
    if (platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } else if (platform === "win32") {
      execSync(`start "" "${url}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: "ignore" });
    }
  } catch {
    showToast(
      "Could not open browser automatically. Please open the URL manually.",
    );
  }
}
