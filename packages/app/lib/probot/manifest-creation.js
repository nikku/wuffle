const { ProbotOctokit } = require('probot/lib/octokit/probot-octokit');
const {
  ManifestCreation: ProbotManifestCreation
} = require('probot/lib/manifest-creation');


class ManifestCreation extends ProbotManifestCreation {

  /**
   * Overrides original createAppFromCode to store GITHUB_CLIENT_ID
   * and GITHUB_CLIENT_SECRETS, too.
   *
   * @param {any} code
   */
  async createAppFromCode(code) {
    const octokit = new ProbotOctokit();
    const options = {
      code,
      mediaType: {
        previews: ['fury'] // needed for GHES 2.20 and older
      },
      ...(process.env.GHE_HOST && {
        baseUrl: `${process.env.GHE_PROTOCOL || 'https'}://${
          process.env.GHE_HOST
        }/api/v3`
      })
    };
    const response = await octokit.request(
      'POST /app-manifests/:code/conversions',
      options
    );

    /* <modified> */

    const { id, webhook_secret, pem, client_id, client_secret } = response.data;
    await this.updateEnv({
      APP_ID: id.toString(),
      PRIVATE_KEY: `'${pem}'`,
      WEBHOOK_SECRET: webhook_secret,
      GITHUB_CLIENT_ID: client_id,
      GITHUB_CLIENT_SECRET: client_secret
    });

    /* </modified> */

    return response.data.html_url;
  }
}

module.exports = {
  ManifestCreation
};