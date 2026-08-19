import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Momente entry screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>MCM Memory Tag — 나의 전시 기억<\/title>/i);
  assert.match(html, /<main class="momente-entry-screen">/);
  assert.match(html, /<img src="\/mcm-entry-logo\.png" alt="MCM"\/>/);
  assert.match(html, /<h1>MOMENTE<\/h1>/);
  assert.match(html, /<a href="\/home">Enter Exhibition »<\/a>/);
});

test("keeps entry navigation connected to the authenticated app route", async () => {
  const [app, rootPage, catchAllPage] = await Promise.all([
    readFile(new URL("../app/MemoryTagApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[...route]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /if \(pathname === "\/"\) \{\s*return <EntryScreen \/>;\s*\}/);
  assert.match(app, /<a href="\/home">Enter Exhibition »<\/a>/);
  assert.doesNotMatch(app, /from "next\/link"/);
  assert.match(app, /홈:\s*"\/home"/);
  assert.match(rootPage, /<MemoryTagApp \/>/);
  assert.match(catchAllPage, /<MemoryTagApp \/>/);
});
