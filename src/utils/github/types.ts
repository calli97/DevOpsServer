export interface Enterprise {
  id: number;
  slug: string;
  name: string;
  node_id: string;
  avatar_url: string;
  description: string | null;
  website_url: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  login: string;
  id: number;
  node_id: string;
  url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issue_url: string;
  members_url: string;
  public_members_url: string;
  avatar_url: string;
  description: string | null;
}

export interface Repository {
  id: number;
  name: string;
  [key: string]: any;
}

export interface GithubUser {
  login?: string;
  id?: number;
  node_id?: string;
  avatar_url?: string;
  gravatar_id?: string;
  url?: string;
  html_url?: string;
  followers_url?: string;
  following_url?: string;
  gists_url?: string;
  starred_url?: string;
  subscriptions_url?: string;
  organizations_url?: string;
  repos_url?: string;
  events_url?: string;
  received_event_url?: string;
  type?: string;
  site_admin?: boolean;
  [key: string]: any;
}

export interface Commit {
  id: string;
  tree_id: string;
  distinc: boolean;
  message: string;
  timestamp: string;
  url: string;
  author: {
    name: string;
    email: string;
    username: string; //The github user login
  };
  committer: {
    name: string;
    email: string;
    username: string; //The github user login
  };
  [key: string]: any;
}

//Payloads
export interface WebhookPayload {
  repository?: Repository;
  action?:
    | "edited"
    | "created"
    | "opened"
    | "converted"
    | "assigned"
    | "unassigned"
    | "labeled"
    | "unlabeled"
    | "milestoned"
    | "demilestoned"
    | "reordered"
    | "deleted"
    | "archived"
    | "reopened"
    | "closed";
  changes?: any;
  sender: GithubUser;
  [key: string]: any;
}

export interface WebhookPayloadPushCommit {
  ref: string;
  before: string;
  after: string;
  repository: Repository;
  pusher: {
    name: string; //Github login
    email: string; //A email variant?????
  };
  organization: Organization;
  enterprise: Enterprise;
  sender: GithubUser;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  base_ref: any;
  compare: string;
  commits: Array<Commit>;
  head_commit: Commit;
}
