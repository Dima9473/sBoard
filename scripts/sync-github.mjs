/**
 * Автосинхронизация с GitHub (без браузера и open_resource).
 *
 * Переменная: GITHUB_PERSONAL_ACCESS_TOKEN
 *
 * Classic PAT — scope repo (полный доступ к репозиториям).
 * Fine-grained — Account: Administration (read/write), Repository: Contents (read/write),
 *   доступ «All repositories» или к конкретному sBoard.
 *
 * Запуск: npm run sync:github
 * Агент в Cursor: только Shell + этот скрипт (не MCP open_resource).
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const REPO_NAME = process.env.GITHUB_REPO_NAME ?? "sBoard";
const REPO_DESC =
  process.env.GITHUB_REPO_DESCRIPTION ??
  "Pixi.js + Skia (CanvasKit): dual render, events, vector PDF export";
const IS_PRIVATE = process.env.GITHUB_REPO_PRIVATE === "true";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";

const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN?.trim();
if (!token) {
  console.error(
    "GITHUB_PERSONAL_ACCESS_TOKEN не задан. Задайте в Windows (User) и перезапустите терминал/Cursor.",
  );
  process.exit(1);
}

/** @param {string} method */
/** @param {string} path */
/** @param {object} [body] */
async function github(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "sboard-sync-github-script",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { ok: res.ok, status: res.status, data };
}

function run(cmd, opts = {}) {
  execSync(cmd, {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf8",
    ...opts,
  });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function ensureGit() {
  if (!existsSync(resolve(ROOT, ".git"))) {
    console.log("→ git init");
    run(`git init -b ${BRANCH}`);
  }

  const status = runCapture("git status --porcelain");
  if (status) {
    console.log("→ git add + commit");
    run("git add -A");
    run('git commit -m "chore: sync to GitHub"');
  } else {
    console.log("→ рабочая копия чистая, коммит не нужен");
  }
}

async function ensureRemote(owner) {
  const remoteUrl = `https://github.com/${owner}/${REPO_NAME}.git`;
  let remotes = "";
  try {
    remotes = runCapture("git remote");
  } catch {
    /* no remotes */
  }
  if (!remotes.includes("origin")) {
    console.log(`→ git remote add origin ${remoteUrl}`);
    run(`git remote add origin ${remoteUrl}`);
  } else {
    run(`git remote set-url origin ${remoteUrl}`);
  }
  return remoteUrl;
}

async function ensureRepo(owner) {
  const get = await github("GET", `/repos/${owner}/${REPO_NAME}`);
  if (get.ok) {
    console.log(`→ репозиторий уже есть: ${get.data.html_url}`);
    return get.data.html_url;
  }
  if (get.status !== 404) {
    console.error("GET repo:", get.status, get.data?.message ?? get.data);
    process.exit(1);
  }

  console.log(`→ создаём репозиторий ${owner}/${REPO_NAME}`);
  const create = await github("POST", "/user/repos", {
    name: REPO_NAME,
    description: REPO_DESC,
    private: IS_PRIVATE,
    auto_init: false,
  });

  if (!create.ok) {
    console.error("POST /user/repos:", create.status, create.data?.message ?? create.data);
    if (create.status === 403) {
      console.error(
        "\nТокен не может создавать репозитории. Добавьте scope repo (classic) или\n" +
          "Administration (write) у fine-grained PAT: https://github.com/settings/tokens",
      );
    }
    process.exit(1);
  }

  console.log(`→ создан: ${create.data.html_url}`);
  return create.data.html_url;
}

function push(owner) {
  const pushUrl = `https://x-access-token:${encodeURIComponent(token)}@github.com/${owner}/${REPO_NAME}.git`;
  console.log(`→ git push ${BRANCH}`);
  const r = spawnSync(
    "git",
    ["push", pushUrl, `HEAD:${BRANCH}`],
    { cwd: ROOT, stdio: "inherit", encoding: "utf8" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);

  try {
    run(`git branch -u origin/${BRANCH} ${BRANCH}`);
  } catch {
    run(`git push -u origin ${BRANCH}`);
  }
}

async function main() {
  const me = await github("GET", "/user");
  if (!me.ok) {
    console.error("API /user:", me.status, me.data?.message ?? me.data);
    process.exit(1);
  }
  const owner = me.data.login;
  console.log(`→ GitHub: ${owner}`);

  const htmlUrl = await ensureRepo(owner);
  ensureGit();
  await ensureRemote(owner);
  push(owner);

  console.log(`\nГотово: ${htmlUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
