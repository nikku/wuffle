/* global InstanceType:true */

import type { ExpressSession } from 'express-session';

import type {
  ProbotOctokit,
  Probot as ProbotApp,
  Logger
} from 'probot';

import type {
  Router
} from 'express';

export type Octokit = InstanceType<typeof ProbotOctokit>;

import type { Injector } from 'async-didi';

export {
  Logger,
  ExpressSession,
  Router,
  Octokit,
  Injector,
  ProbotApp
};

export type DidiModule = {
  __init__?: Array<String>,
  __depends__?: Array<String>,
  [propName: string]: any,
};

export type GitHubUser = {
  last_checked: number,
  access_token: string,
  avatar_url: string,
  login: string
};

export type LoginFlow = {
  state: string,
  redirectTo: string
};

export type WuffleSessionData = {
  loginFlow?: LoginFlow,
  githubUser?: GitHubUser
};

export type Session = ExpressSession & WuffleSessionData;