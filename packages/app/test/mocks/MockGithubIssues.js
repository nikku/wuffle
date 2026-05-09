import { mock } from 'sinon';


/**
 * Fake GithubIssues that records calls for test verification.
 */
export default function MockGithubIssues() {

  /**
   * @param {any} context
   * @param {any} issue
   * @param {any} newColumn
   * @param {any} [newAssignee]
   */
  this.moveIssue = mock();

  /**
   * @param {any} context
   * @param {any} issue
   * @param {any} newColumn
   * @param {any} [newAssignee]
   */
  this.moveReferencedIssues = mock();

  /**
   * @param {any} context
   * @param {number} number
   * @param {any} newColumn
   * @param {any} [newAssignee]
   * @param { (any) => boolean } [test]
   */
  this.findAndMoveIssue = mock();

}
