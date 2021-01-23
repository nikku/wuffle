export type Installation = {
  account: {
    id: number;
    login: string;
    node_id: string;
    url: string;
  };
  app_id: number;
  events: Array<string>;
  html_url: string;
  id: number;
  permissions: {
    contents: string;
    issues: string;
    metadata: string;
    single_file: string;
  };
};