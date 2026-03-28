import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { readConfig, setConfig } from './config.js';
import * as api from './api.js';
import type { Post, Note, Asset } from './api.js';

program
  .name('nblog')
  .description('CLI for managing posts, notes, and assets on a nextblog server')
  .version('1.0.1');

// ─── config ──────────────────────────────────────────────────────────────────

const config = program.command('config').description('Manage CLI configuration');

config
  .command('set-server <url>')
  .description('Set the remote server URL  (e.g. http://localhost:8666)')
  .action((url: string) => {
    setConfig('server', url.replace(/\/$/, ''));
    console.log(chalk.green('✓'), 'Server set to', chalk.cyan(url));
  });

config
  .command('set-token <token>')
  .description('Set a JWT bearer token directly')
  .action((token: string) => {
    setConfig('token', token);
    console.log(chalk.green('✓'), 'Token saved');
  });

config
  .command('show')
  .description('Print current configuration')
  .action(() => {
    const cfg = readConfig();
    const token = cfg.token ? cfg.token.slice(0, 12) + '…' : chalk.gray('(not set)');
    console.log('server :', chalk.cyan(cfg.server ?? chalk.gray('(not set)')));
    console.log('token  :', chalk.yellow(token));
  });

// ─── login ───────────────────────────────────────────────────────────────────

program
  .command('login')
  .description('Authenticate with the server and save the JWT token')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <pass>', 'Password')
  .action(async (opts: { email?: string; password?: string }) => {
    const answers = await prompts([
      { type: opts.email ? null : 'text',        name: 'email',    message: 'Email',    initial: opts.email },
      { type: opts.password ? null : 'password', name: 'password', message: 'Password' },
    ]);
    const email    = opts.email    ?? answers.email as string | undefined;
    const password = opts.password ?? answers.password as string | undefined;
    if (!email || !password) { console.error('Cancelled'); process.exit(1); }

    const spin = ora('Logging in…').start();
    try {
      const data = await api.login(email, password);
      setConfig('token', data.token);
      spin.succeed(`Logged in as ${chalk.bold(data.user?.username ?? email)}`);
    } catch (e) {
      spin.fail(`Login failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('whoami')
  .description('Show the currently authenticated user')
  .action(async () => {
    const spin = ora('Fetching profile…').start();
    try {
      const user = await api.getProfile();
      spin.stop();
      console.log(chalk.bold(user.username), chalk.gray(`<${user.email}>`), chalk.blue(`[${user.role}]`));
    } catch (e) {
      spin.fail((e as Error).message);
      process.exit(1);
    }
  });

// ─── posts ───────────────────────────────────────────────────────────────────

const posts = program.command('posts').description('Read and search blog posts');

posts
  .command('list')
  .description('List posts')
  .option('-p, --page <n>',     'Page number',    '1')
  .option('-l, --limit <n>',    'Items per page', '20')
  .option('--published',        'Only published posts')
  .option('--tag <tag>',        'Filter by tag')
  .option('--category <cat>',   'Filter by category')
  .action(async (opts: { page: string; limit: string; published?: boolean; tag?: string; category?: string }) => {
    const spin = ora('Fetching posts…').start();
    try {
      const data = await api.listPosts({
        page: Number(opts.page),
        limit: Number(opts.limit),
        published: opts.published ? true : undefined,
        tag: opts.tag,
        category: opts.category,
      });
      spin.stop();
      printPostList((data.posts ?? data) as Post[]);
      if (data.total != null) console.log(chalk.gray(`\nTotal: ${data.total}`));
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

posts
  .command('get <id>')
  .description('Show a single post')
  .option('--no-content', 'Omit full content body')
  .action(async (id: string, opts: { content: boolean }) => {
    const spin = ora('Fetching post…').start();
    try {
      const post = await api.getPost(id);
      spin.stop();
      printPost(post, opts.content);
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

posts
  .command('search <query>')
  .description('Full-text search posts')
  .option('-p, --page <n>',  'Page number',    '1')
  .option('-l, --limit <n>', 'Items per page', '20')
  .action(async (query: string, opts: { page: string; limit: string }) => {
    const spin = ora('Searching…').start();
    try {
      const data = await api.searchPosts(query, { page: Number(opts.page), limit: Number(opts.limit) });
      spin.stop();
      printPostList((data.posts ?? data) as Post[]);
      if (data.total != null) console.log(chalk.gray(`\nTotal: ${data.total}`));
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

// ─── notes ───────────────────────────────────────────────────────────────────

const notes = program.command('notes').description('Read and search notes (auth required)');

notes
  .command('list')
  .description('List notes')
  .option('-p, --page <n>',  'Page number',    '1')
  .option('-l, --limit <n>', 'Items per page', '20')
  .action(async (opts: { page: string; limit: string }) => {
    const spin = ora('Fetching notes…').start();
    try {
      const data = await api.listNotes({ page: Number(opts.page), limit: Number(opts.limit) });
      spin.stop();
      printNoteList((data.notes ?? data) as Note[]);
      if (data.total != null) console.log(chalk.gray(`\nTotal: ${data.total}`));
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

notes
  .command('get <id>')
  .description('Show a single note')
  .action(async (id: string) => {
    const spin = ora('Fetching note…').start();
    try {
      const note = await api.getNote(id);
      spin.stop();
      printNote(note);
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

notes
  .command('search <query>')
  .description('Search notes by keyword')
  .option('-p, --page <n>',  'Page number',    '1')
  .option('-l, --limit <n>', 'Items per page', '20')
  .action(async (query: string, opts: { page: string; limit: string }) => {
    const spin = ora('Searching…').start();
    try {
      const data = await api.searchNotes(query, { page: Number(opts.page), limit: Number(opts.limit) });
      spin.stop();
      printNoteList((data.notes ?? data) as Note[]);
      if (data.total != null) console.log(chalk.gray(`\nTotal: ${data.total}`));
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

// ─── assets ──────────────────────────────────────────────────────────────────

const assets = program.command('assets').description('Download and upload file assets (auth required)');

assets
  .command('list')
  .description('List uploaded assets')
  .option('-p, --page <n>',  'Page number',    '1')
  .option('-l, --limit <n>', 'Items per page', '20')
  .action(async (opts: { page: string; limit: string }) => {
    const spin = ora('Fetching assets…').start();
    try {
      const data = await api.listAssets({ page: Number(opts.page), limit: Number(opts.limit) });
      spin.stop();
      const items = (data.assets ?? data) as Asset[];
      if (!items.length) { console.log(chalk.gray('No assets found.')); return; }
      for (const a of items) {
        const size = formatSize(a.size);
        console.log(
          chalk.bold(a.id),
          chalk.gray('·'),
          chalk.cyan(a.originalName ?? a.filename ?? ''),
          chalk.gray(`(${size}, ${a.mimeType ?? ''})`)
        );
      }
      if (data.total != null) console.log(chalk.gray(`\nTotal: ${data.total}`));
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

assets
  .command('download <fileId>')
  .description('Download an asset by its file ID')
  .option('-o, --output <path>', 'Output file path (defaults to <fileId>)')
  .action(async (fileId: string, opts: { output?: string }) => {
    const dest = opts.output ?? fileId;
    const spin = ora(`Downloading ${fileId}…`).start();
    try {
      await api.downloadAsset(fileId, dest);
      spin.succeed(`Saved to ${chalk.cyan(dest)}`);
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

assets
  .command('upload <file>')
  .description('Upload a local file as an asset')
  .action(async (filePath: string) => {
    const spin = ora(`Uploading ${basename(filePath)}…`).start();
    try {
      const fd = new FormData();
      const bytes = readFileSync(filePath);
      fd.append('file', new Blob([bytes]), basename(filePath));
      const data = await api.uploadAsset(fd);
      spin.succeed(`Uploaded: ${chalk.bold(data.id ?? data.fileId ?? JSON.stringify(data))}`);
    } catch (e) {
      spin.fail((e as Error).message); process.exit(1);
    }
  });

// ─── Formatters ──────────────────────────────────────────────────────────────

function printPostList(posts: Post[]): void {
  if (!posts?.length) { console.log(chalk.gray('No posts found.')); return; }
  for (const p of posts) {
    const pub = p.published ? chalk.green('●') : chalk.gray('○');
    const tags = p.tags?.length ? chalk.gray(` [${p.tags.join(', ')}]`) : '';
    console.log(`${pub} ${chalk.bold(p.id)}  ${p.title}${tags}`);
    if (p.description) console.log(`   ${chalk.gray(p.description.slice(0, 100))}`);
  }
}

function printPost(post: Post, showContent = true): void {
  console.log(chalk.bold.white(post.title));
  console.log(chalk.gray(`ID: ${post.id}  |  ${post.published ? chalk.green('published') : 'draft'}  |  ${post.updatedAt}`));
  if (post.tags?.length)       console.log(chalk.gray('Tags:'), post.tags.join(', '));
  if (post.categories?.length) console.log(chalk.gray('Categories:'), post.categories.join(', '));
  if (post.description)        console.log('\n' + chalk.italic(post.description));
  if (showContent && post.content) {
    console.log('\n' + '─'.repeat(60));
    console.log(post.content);
  }
}

function printNoteList(notes: Note[]): void {
  if (!notes?.length) { console.log(chalk.gray('No notes found.')); return; }
  for (const n of notes) {
    const vis = n.isPublic ? chalk.cyan('public') : chalk.gray('private');
    const arc = n.isArchived ? chalk.yellow(' [archived]') : '';
    const preview = (n.data ?? '').replace(/\n/g, ' ').slice(0, 80);
    console.log(`${chalk.bold(n.id)}  ${vis}${arc}`);
    console.log(`   ${chalk.gray(preview)}`);
  }
}

function printNote(note: Note): void {
  console.log(chalk.bold(note.id), '·', note.isPublic ? chalk.cyan('public') : chalk.gray('private'));
  console.log(chalk.gray(`Created: ${note.createdAt}  Updated: ${note.updatedAt}`));
  if (note.tags?.length) console.log(chalk.gray('Tags:'), note.tags.join(', '));
  console.log('\n' + note.data);
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

program.parse();
