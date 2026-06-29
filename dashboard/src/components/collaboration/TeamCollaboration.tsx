import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  role: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  mentions: string[];
  reactions?: { emoji: string; count: number }[];
  replies?: Comment[];
}

interface FindingThread {
  id: string;
  findingId: string;
  findingTitle: string;
  status: 'OPEN' | 'RESOLVED' | 'IN_PROGRESS';
  assignee?: TeamMember;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

const teamMembers: TeamMember[] = [
  { id: 'u1', name: 'Alice Chen', email: 'alice@company.com', status: 'online', role: 'Lead Engineer' },
  { id: 'u2', name: 'Bob Martinez', email: 'bob@company.com', status: 'online', role: 'Security Engineer' },
  { id: 'u3', name: 'Carol Williams', email: 'carol@company.com', status: 'away', role: 'DevOps' },
  { id: 'u4', name: 'Dave Kim', email: 'dave@company.com', status: 'offline', role: 'Frontend Dev' },
];

const mockThreads: FindingThread[] = [
  {
    id: 't1',
    findingId: 'f1',
    findingTitle: 'SQL Injection in search endpoint',
    status: 'IN_PROGRESS',
    assignee: teamMembers[1],
    createdAt: '2026-06-28T10:00:00Z',
    updatedAt: '2026-06-28T14:30:00Z',
    comments: [
      {
        id: 'c1',
        authorId: 'u1',
        authorName: 'Alice Chen',
        content: 'This is a critical issue. @bob can you take a look at the fix suggestion? I think we should use parameterized queries here.',
        timestamp: '2026-06-28T10:05:00Z',
        mentions: ['bob'],
        reactions: [{ emoji: '👍', count: 2 }],
        replies: [
          {
            id: 'c1r1',
            authorId: 'u2',
            authorName: 'Bob Martinez',
            content: 'On it! The suggested fix looks good. I\'ll apply it and add some regression tests.',
            timestamp: '2026-06-28T10:15:00Z',
            mentions: [],
            reactions: [{ emoji: '🙏', count: 1 }],
          },
        ],
      },
      {
        id: 'c2',
        authorId: 'u3',
        authorName: 'Carol Williams',
        content: 'Should we also check the other endpoints for similar patterns? @dave can you run a scan on the user API?',
        timestamp: '2026-06-28T11:00:00Z',
        mentions: ['dave'],
        reactions: [],
      },
      {
        id: 'c3',
        authorId: 'u2',
        authorName: 'Bob Martinez',
        content: 'Fix applied and tested. Ready for review. @alice can you approve?',
        timestamp: '2026-06-28T14:30:00Z',
        mentions: ['alice'],
        reactions: [{ emoji: '🎉', count: 3 }],
      },
    ],
  },
  {
    id: 't2',
    findingId: 'f2',
    findingTitle: 'Null pointer dereference in auth service',
    status: 'OPEN',
    assignee: teamMembers[0],
    createdAt: '2026-06-28T09:00:00Z',
    updatedAt: '2026-06-28T12:00:00Z',
    comments: [
      {
        id: 'c4',
        authorId: 'u1',
        authorName: 'Alice Chen',
        content: 'The auto-fix has 94% confidence. I\'m going to approve it since the null check is straightforward.',
        timestamp: '2026-06-28T09:10:00Z',
        mentions: [],
        reactions: [{ emoji: '✅', count: 1 }],
      },
    ],
  },
  {
    id: 't3',
    findingId: 'f3',
    findingTitle: 'N+1 query in user listing',
    status: 'RESOLVED',
    assignee: teamMembers[3],
    createdAt: '2026-06-27T15:00:00Z',
    updatedAt: '2026-06-28T08:00:00Z',
    comments: [
      {
        id: 'c5',
        authorId: 'u4',
        authorName: 'Dave Kim',
        content: 'Fixed by adding a JOIN query. Performance improved by 85% on the listing page.',
        timestamp: '2026-06-28T08:00:00Z',
        mentions: [],
        reactions: [{ emoji: '🚀', count: 4 }, { emoji: '👍', count: 2 }],
      },
    ],
  },
];

export function TeamCollaboration() {
  const [threads, setThreads] = React.useState<FindingThread[]>(mockThreads);
  const [selectedThread, setSelectedThread] = React.useState<FindingThread | null>(threads[0]);
  const [newComment, setNewComment] = React.useState('');
  const [showMentions, setShowMentions] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('all');

  const filteredThreads = threads.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const addComment = () => {
    if (!newComment.trim() || !selectedThread) return;
    const mentions = newComment.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
    const comment: Comment = {
      id: `c${Date.now()}`,
      authorId: 'u1',
      authorName: 'Alice Chen',
      content: newComment,
      timestamp: new Date().toISOString(),
      mentions,
      reactions: [],
    };
    const updatedThread = {
      ...selectedThread,
      comments: [...selectedThread.comments, comment],
      updatedAt: new Date().toISOString(),
    };
    setSelectedThread(updatedThread);
    setThreads(threads.map(t => t.id === updatedThread.id ? updatedThread : t));
    setNewComment('');
  };

  const resolveThread = () => {
    if (!selectedThread) return;
    const updatedThread = { ...selectedThread, status: 'RESOLVED' as const, updatedAt: new Date().toISOString() };
    setSelectedThread(updatedThread);
    setThreads(threads.map(t => t.id === updatedThread.id ? updatedThread : t));
  };

  const handleCommentChange = (value: string) => {
    setNewComment(value);
    setShowMentions(value.endsWith('@'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Team Collaboration</h2>
          <p className="text-sm text-fg-muted mt-1">Comments, @mentions, threads, and resolution tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {teamMembers.map(m => (
              <Avatar key={m.id} fallback={m.name.split(' ').map(n => n[0]).join('')} size="sm" />
            ))}
          </div>
          <Badge variant="outline">{teamMembers.length} members</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-fg-muted">Active Threads</div>
          <div className="text-2xl font-bold text-fg mt-1">{threads.filter(t => t.status !== 'RESOLVED').length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted">Resolved Today</div>
          <div className="text-2xl font-bold text-green mt-1">{threads.filter(t => t.status === 'RESOLVED').length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted">Total Comments</div>
          <div className="text-2xl font-bold text-fg mt-1">{threads.reduce((sum, t) => sum + t.comments.length, 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted">Avg Response Time</div>
          <div className="text-2xl font-bold text-fg mt-1">23m</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
        {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              filterStatus === status ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
            )}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Thread List */}
        <div className="space-y-2">
          {filteredThreads.map(thread => (
            <Card
              key={thread.id}
              hover
              className={cn(
                'cursor-pointer',
                selectedThread?.id === thread.id && 'border-accent'
              )}
              onClick={() => setSelectedThread(thread)}
            >
              <CardContent padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={thread.status === 'RESOLVED' ? 'success' : thread.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                    size="sm"
                  >
                    {thread.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-[10px] text-fg-muted">
                    {new Date(thread.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-fg truncate">{thread.findingTitle}</h4>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {thread.assignee && (
                      <div className="flex items-center gap-1">
                        <Avatar fallback={thread.assignee.name.split(' ').map(n => n[0]).join('')} size="xs" />
                        <span className="text-[10px] text-fg-muted">{thread.assignee.name.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-fg-muted">{thread.comments.length} comments</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Thread Detail */}
        {selectedThread ? (
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedThread.findingTitle}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={selectedThread.status === 'RESOLVED' ? 'success' : selectedThread.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                    size="sm"
                  >
                    {selectedThread.status.replace('_', ' ')}
                  </Badge>
                  {selectedThread.assignee && (
                    <span className="text-xs text-fg-muted">
                      Assigned to {selectedThread.assignee.name}
                    </span>
                  )}
                </div>
              </div>
              {selectedThread.status !== 'RESOLVED' && (
                <Button size="sm" variant="outline" onClick={resolveThread}>Mark Resolved</Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Comments */}
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {selectedThread.comments.map(comment => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar fallback={comment.authorName.split(' ').map(n => n[0]).join('')} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-fg">{comment.authorName}</span>
                          <span className="text-[10px] text-fg-muted">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-fg-muted mt-1">{comment.content}</p>
                        {comment.reactions && comment.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {comment.reactions.map((r, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary rounded-full text-xs">
                                {r.emoji} {r.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Replies */}
                    {comment.replies?.map(reply => (
                      <div key={reply.id} className="flex items-start gap-3 ml-8 pl-3 border-l-2 border-border">
                        <Avatar fallback={reply.authorName.split(' ').map(n => n[0]).join('')} size="xs" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-fg">{reply.authorName}</span>
                            <span className="text-[10px] text-fg-muted">
                              {new Date(reply.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-fg-muted mt-1">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border-t border-border pt-4">
                <div className="relative">
                  <Input
                    value={newComment}
                    onChange={e => handleCommentChange(e.target.value)}
                    placeholder="Add a comment... (use @ to mention)"
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                  />
                  {showMentions && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden z-10">
                      {teamMembers.map(m => (
                        <button
                          key={m.id}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-hover text-left"
                          onClick={() => {
                            setNewComment(prev => prev + m.name.split(' ')[0] + ' ');
                            setShowMentions(false);
                          }}
                        >
                          <Avatar fallback={m.name.split(' ').map(n => n[0]).join('')} size="xs" />
                          <div>
                            <div className="text-sm text-fg">{m.name}</div>
                            <div className="text-[10px] text-fg-muted">{m.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>Post Comment</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2 flex items-center justify-center p-12">
            <div className="text-center text-fg-muted">
              <p className="text-sm">Select a thread to view comments</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TeamCollaboration;
