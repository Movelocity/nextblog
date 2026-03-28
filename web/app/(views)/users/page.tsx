'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useToast } from '@/app/components/layout/ToastHook';
import {
  adminCreateUser, adminListUsers, adminUpdateUser,
  adminCreateToken, adminListTokens, adminRevokeToken,
  type AccessToken, type CreateUserPayload,
} from '@/app/services/admin';
import type { UserInfo } from '@/app/services/auth';
import { copyToClipboard } from '@/app/services/utils';
import Modal from '@/app/components/ui/Modal';
import {
  FiUsers, FiUserPlus, FiKey, FiCopy, FiCheck, FiTrash2,
  FiTerminal, FiRefreshCw, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';

// ─── style constants ──────────────────────────────────────────────────────────

const inputCls  = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
const labelCls  = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
const btnCls    = "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm";
const btnSecCls = "flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm";

// ─── helpers ──────────────────────────────────────────────────────────────────

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    editor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    user:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[role] ?? map.user}`}>
      {role}
    </span>
  );
};

// ─── CodeBlock ────────────────────────────────────────────────────────────────

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg bg-gray-900 dark:bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 text-xs text-gray-400">
        <span>{lang}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-white transition-colors">
          {copied ? <FiCheck className="w-3.5 h-3.5 text-green-400" /> : <FiCopy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── TokenDisplay ─────────────────────────────────────────────────────────────

function TokenDisplay({ token, serverUrl }: { token: string; serverUrl: string }) {
  const [copied, setCopied] = useState<'token' | 'cmd' | null>(null);
  const loginCmd = `nblog config set-server ${serverUrl || '<SERVER_URL>'} && nblog login --token ${token}`;

  const copy = async (text: string, kind: 'token' | 'cmd') => {
    await copyToClipboard(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-4 space-y-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Token issued — share this with the agent:</p>

      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
          {token}
        </code>
        <button onClick={() => copy(token, 'token')} className={btnSecCls}>
          {copied === 'token' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </div>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">One-liner for the agent:</p>
        <div className="flex items-start gap-2">
          <code className="flex-1 px-3 py-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-gray-100 break-all">
            {loginCmd}
          </code>
          <button onClick={() => copy(loginCmd, 'cmd')} className={btnSecCls}>
            {copied === 'cmd' ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TokenRow ─────────────────────────────────────────────────────────────────

function TokenRow({ t, onRevoke }: { t: AccessToken; onRevoke: (token: string) => void }) {
  const expired = new Date(t.expiresAt) < new Date();
  const status = t.used ? 'used' : expired ? 'expired' : 'valid';
  const statusColor = {
    valid:   'text-green-600 dark:text-green-400',
    used:    'text-gray-400',
    expired: 'text-yellow-600 dark:text-yellow-400',
  }[status];
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-3">
      <div className="min-w-0 flex-1">
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{t.token.slice(0, 20)}…</span>
        {t.label && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({t.label})</span>}
        <div className="text-xs text-gray-400 mt-0.5">Expires {new Date(t.expiresAt).toLocaleString()}</div>
      </div>
      <span className={`text-xs font-medium shrink-0 ${statusColor}`}>{status}</span>
      {!t.used && (
        <button onClick={() => onRevoke(t.token)} className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded">
          <FiTrash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── CreateUserModal ──────────────────────────────────────────────────────────

function CreateUserModal({
  isOpen, onClose, onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (form: CreateUserPayload) => Promise<void>;
}) {
  const [form, setForm]       = useState<CreateUserPayload>({ username: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await onCreate(form);
      setForm({ username: '', email: '', password: '', role: 'user' });
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create User" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className={labelCls}>Username</label>
          <input className={inputCls} placeholder="alice" value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input className={inputCls} type="email" placeholder="alice@example.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input className={inputCls} type="password" placeholder="••••••••" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <select className={inputCls} value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="user">user — read + own content</option>
            <option value="editor">editor — create / edit posts</option>
            <option value="admin">admin — full access</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className={btnSecCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnCls} disabled={creating}>
            <FiUserPlus className="w-4 h-4" />
            {creating ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── InstallGuideModal ────────────────────────────────────────────────────────

function InstallGuideModal({ isOpen, onClose, serverBase }: { isOpen: boolean; onClose: () => void; serverBase: string }) {
  const installSnippet = `# requires Node.js ≥ 18\nnpm install -g @hollway/nextblog-cli`;

  const setupSnippet =
`# point the CLI at your server (one time)
nblog config set-server ${serverBase || '<SERVER_URL>'}

# login with a short token issued by an admin
nblog login --token <SHORT_TOKEN>

# verify
nblog whoami`;

  const agentSnippet =
`# list posts
nblog posts list

# list notes (auth required)
nblog notes list

# upload a file
nblog assets upload report.pdf

# full help
nblog --help`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CLI Installation Guide" size="md">
      <div className="p-5 space-y-5 text-sm text-gray-700 dark:text-gray-300 overflow-y-auto max-h-[70vh]">
        <div>
          <p className="font-medium mb-2">1 · Install the CLI</p>
          <CodeBlock code={installSnippet} />
        </div>

        <div>
          <p className="font-medium mb-2">2 · Configure and login with a short token</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Issue a token from a user row, then paste the one-liner into your agent&apos;s setup script:
          </p>
          <CodeBlock code={setupSnippet} />
        </div>

        <div>
          <p className="font-medium mb-2">3 · Available commands</p>
          <CodeBlock code={agentSnippet} />
        </div>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
          <span className="font-semibold">Note:</span> Short tokens are single-use — consumed on first login and cannot be reused.
          Issue a new token per agent instance, or use{' '}
          <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">nblog login -e &lt;email&gt;</code>{' '}
          for long-lived password-based sessions.
        </div>
      </div>
    </Modal>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { isAuthenticated, isLoading, openLoginModal } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers]               = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showGuideModal, setShowGuideModal]     = useState(false);

  // token panel — keyed by user id
  const [openTokenPanel, setOpenTokenPanel] = useState<number | null>(null);
  const [tokensByUser, setTokensByUser]     = useState<Record<number, AccessToken[]>>({});
  const [tokenForm, setTokenForm]           = useState({ label: '', expiresIn: '168h' });
  const [issuingToken, setIssuingToken]     = useState(false);
  const [newToken, setNewToken]             = useState<string | null>(null);

  const serverUrl = typeof window !== 'undefined'
    ? ((window as any).__RUNTIME_CONFIG__?.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
    : '';
  const serverBase = serverUrl.replace(/\/api$/, '');

  useEffect(() => { document.title = 'Users & Agents'; }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) openLoginModal();
  }, [isLoading, isAuthenticated, openLoginModal]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { users } = await adminListUsers();
      setUsers(users);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) fetchUsers();
  }, [isAuthenticated, fetchUsers]);

  const handleCreateUser = async (form: CreateUserPayload) => {
    try {
      await adminCreateUser(form);
      showToast(`User "${form.username}" created`, 'success');
      fetchUsers();
    } catch (err) {
      showToast((err as Error).message, 'error');
      throw err; // re-throw so modal keeps spinner state
    }
  };

  const toggleTokenPanel = async (userId: number) => {
    if (openTokenPanel === userId) {
      setOpenTokenPanel(null);
      setNewToken(null);
      return;
    }
    setOpenTokenPanel(userId);
    setNewToken(null);
    try {
      const { tokens } = await adminListTokens(userId);
      setTokensByUser(prev => ({ ...prev, [userId]: tokens }));
    } catch {
      showToast('Failed to load tokens', 'error');
    }
  };

  const handleIssueToken = async (userId: number) => {
    setIssuingToken(true);
    try {
      const t = await adminCreateToken(userId, tokenForm);
      setNewToken(t.token);
      setTokensByUser(prev => ({ ...prev, [userId]: [t, ...(prev[userId] ?? [])] }));
      showToast('Token issued', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIssuingToken(false);
    }
  };

  const handleRevokeToken = async (userId: number, token: string) => {
    try {
      await adminRevokeToken(token);
      setTokensByUser(prev => ({ ...prev, [userId]: (prev[userId] ?? []).filter(t => t.token !== token) }));
      if (newToken === token) setNewToken(null);
      showToast('Token revoked', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleToggleActive = async (user: UserInfo) => {
    try {
      await adminUpdateUser(user.id, { active: !user.active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  // ── guards ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <button className="text-gray-300" onClick={() => openLoginModal()}>LOGIN</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Users card ───────────────────────────────────────────────────── */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-card">

        {/* header row */}
        <div className="flex items-center gap-3 mb-5">
          <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">Users</h2>

          <button className={btnSecCls} onClick={() => setShowGuideModal(true)}>
            <FiTerminal className="w-4 h-4" />
            CLI Guide
          </button>
          <button className={btnCls} onClick={() => setShowCreateModal(true)}>
            <FiUserPlus className="w-4 h-4" />
            Create User
          </button>
          <button className={btnSecCls} onClick={fetchUsers} disabled={loadingUsers} aria-label="Refresh">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* user list */}
        {loadingUsers ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No users yet.</p>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">

                {/* user row */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{user.username}</span>
                      {roleBadge(user.role)}
                      {!user.active && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        user.active
                          ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-500'
                          : 'border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => toggleTokenPanel(user.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors ${
                        openTokenPanel === user.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <FiKey className="w-3.5 h-3.5" />
                      Tokens
                      {openTokenPanel === user.id
                        ? <FiChevronUp className="w-3 h-3" />
                        : <FiChevronDown className="w-3 h-3" />
                      }
                    </button>
                  </div>
                </div>

                {/* expandable token panel */}
                {openTokenPanel === user.id && (
                  <div className="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className={labelCls}>Label <span className="text-gray-400">(optional)</span></label>
                        <input className={inputCls} placeholder="gpt-agent-prod" value={tokenForm.label}
                          onChange={e => setTokenForm(p => ({ ...p, label: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelCls}>Expires in</label>
                        <select className={inputCls} value={tokenForm.expiresIn}
                          onChange={e => setTokenForm(p => ({ ...p, expiresIn: e.target.value }))}>
                          <option value="24h">24 hours</option>
                          <option value="72h">3 days</option>
                          <option value="168h">7 days</option>
                          <option value="720h">30 days</option>
                        </select>
                      </div>
                      <button className={btnCls} onClick={() => handleIssueToken(user.id)} disabled={issuingToken}>
                        <FiKey className="w-4 h-4" />
                        {issuingToken ? 'Issuing…' : 'Issue Token'}
                      </button>
                    </div>

                    {newToken && openTokenPanel === user.id && (
                      <TokenDisplay token={newToken} serverUrl={serverBase} />
                    )}

                    {(tokensByUser[user.id] ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Existing tokens
                        </p>
                        {(tokensByUser[user.id] ?? []).map(t => (
                          <TokenRow key={t.token} t={t} onRevoke={tok => handleRevokeToken(user.id, tok)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateUser}
      />
      <InstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        serverBase={serverBase}
      />
    </div>
  );
}
