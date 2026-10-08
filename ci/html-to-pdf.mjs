#!/usr/bin/env node
/**
 * Converte o relatório HTML consolidado em PDF (A4) usando o Chromium do Playwright.
 * Uso: node html-to-pdf.mjs <entrada.html> <saida.pdf>
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Uso: node html-to-pdf.mjs <entrada.html> <saida.pdf>");
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: "load" });
  await page.pdf({
    path: output,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="font-size:8px;color:#636c76;width:100%;padding:0 14mm;display:flex;justify-content:space-between;">
      <span>Relatório do Pipeline de Qualidade</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
  });
  console.log(`PDF gerado: ${path.resolve(output)}`);
} finally {
  await browser.close();
}
