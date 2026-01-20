import { test, expect, describe } from "bun:test";
import { processAlerts, ALERT_ICONS, isAlertType } from "../../src/markdown/plugins/alerts.ts";

describe("processAlerts", () => {
  test("converts NOTE blockquote to alert", () => {
    const input = '<blockquote><p>[!NOTE]\nThis is a note.</p></blockquote>';
    const output = processAlerts(input);

    expect(output).toContain('class="markdown-alert markdown-alert-note"');
    expect(output).toContain('class="markdown-alert-title"');
    expect(output).toContain("Note");
    expect(output).toContain("This is a note.");
  });

  test("converts TIP blockquote to alert", () => {
    const input = '<blockquote><p>[!TIP]\nThis is a tip.</p></blockquote>';
    const output = processAlerts(input);

    expect(output).toContain('class="markdown-alert markdown-alert-tip"');
    expect(output).toContain("Tip");
  });

  test("converts IMPORTANT blockquote to alert", () => {
    const input = '<blockquote><p>[!IMPORTANT]\nThis is important.</p></blockquote>';
    const output = processAlerts(input);

    expect(output).toContain('class="markdown-alert markdown-alert-important"');
    expect(output).toContain("Important");
  });

  test("converts WARNING blockquote to alert", () => {
    const input = '<blockquote><p>[!WARNING]\nThis is a warning.</p></blockquote>';
    const output = processAlerts(input);

    expect(output).toContain('class="markdown-alert markdown-alert-warning"');
    expect(output).toContain("Warning");
  });

  test("converts CAUTION blockquote to alert", () => {
    const input = '<blockquote><p>[!CAUTION]\nThis is caution.</p></blockquote>';
    const output = processAlerts(input);

    expect(output).toContain('class="markdown-alert markdown-alert-caution"');
    expect(output).toContain("Caution");
  });

  test("leaves regular blockquotes unchanged", () => {
    const input = '<blockquote><p>This is a regular quote.</p></blockquote>';
    const output = processAlerts(input);

    expect(output).toBe(input);
  });

  test("handles case-insensitive alert types", () => {
    const input = '<blockquote><p>[!note]\nLowercase note.</p></blockquote>';
    const output = processAlerts(input);

    expect(output).toContain('class="markdown-alert markdown-alert-note"');
  });
});

describe("ALERT_ICONS", () => {
  test("has all alert type icons", () => {
    expect(ALERT_ICONS.note).toBeDefined();
    expect(ALERT_ICONS.tip).toBeDefined();
    expect(ALERT_ICONS.important).toBeDefined();
    expect(ALERT_ICONS.warning).toBeDefined();
    expect(ALERT_ICONS.caution).toBeDefined();
  });

  test("icons are SVG elements", () => {
    expect(ALERT_ICONS.note).toContain("<svg");
    expect(ALERT_ICONS.note).toContain("</svg>");
  });
});

describe("isAlertType", () => {
  test("returns true for valid alert types", () => {
    expect(isAlertType("note")).toBe(true);
    expect(isAlertType("tip")).toBe(true);
    expect(isAlertType("important")).toBe(true);
    expect(isAlertType("warning")).toBe(true);
    expect(isAlertType("caution")).toBe(true);
  });

  test("returns false for invalid types", () => {
    expect(isAlertType("error")).toBe(false);
    expect(isAlertType("info")).toBe(false);
    expect(isAlertType("")).toBe(false);
  });
});
