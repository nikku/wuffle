const ExpressSession = import('express-session').Session;

export type Logger = import('probot').Logger;

export type Router = import('express').Router;

export type Injector = import('async-didi').Injector;

export type DidiModule = {
  __init__?: Array<String>,
  __depends__?: Array<String>,
  [propName: string]: any,
};

export type ProbotApp = import('probot').Application;

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