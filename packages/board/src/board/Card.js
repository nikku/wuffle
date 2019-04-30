import React, { Fragment } from 'react';

import {
  Avatar,
  Icon,
  Input,
  Tag,
  Tooltip
} from 'antd';

import Octicon, {
  GitPullRequest,
  IssueOpened,
  CircleSlash,
  Bookmark,
  PrimitiveDot,
  Info
} from '@githubprimer/octicons-react';

import classNames from 'classnames';

import css from './Card.less';


export default class Card extends React.PureComponent {

  render() {
    const {
      item,
      connected,
      onOpen,
      onNameUpdate,
      className,
      ...remainingProps
    } = this.props;

    const repository = item.repository.full_name;

    const milestone = item.milestone ? item.milestone.title : null;

    return (
      <div className={ classNames(css.Card, className) } { ...remainingProps }>
        <div className="card">

          <div className="header">
            {
              getIssueTypeIcon(item)
            }
            <a
              href={ `https://github.com/${repository}/issues/${item.number}` }
              target="_blank"
              rel="noopener noreferrer"
              className="issue-number"
              onClick={ (e) => {

                if (typeof onOpen === 'function') {

                  if (!hasModifier(e)) {
                    onOpen(item);

                    e.preventDefault();
                  }
                }
              } }
            >
              { item.number }
            </a>
            <span className="repository" title={ repository }>{ repository }</span>
            <span className="spacer"></span>
            {
              item.assignee
                ? (
                  <Tooltip placement="top" title={ `${ item.assignee.login } Assigned` }>
                    <a className="assignee" href="#">
                      <Avatar src={ item.assignee.avatar_url } size={ 20 } shape="square" />
                    </a>
                  </Tooltip>
                )
                : <Icon type="user" />
            }
          </div>

          <div className="title">
            <Input.TextArea autosize value={ item.title } onChange={ (event) => {
              const newValue = event.target.value;

              if (typeof onNameUpdate === 'function') {
                onNameUpdate(item, newValue);
              }
            } } />
          </div>

          <div className="footer">
            {
              milestone && <Tag className="label" key="milestone">{ milestone }</Tag>
            }
            {
              (item.labels || []).map((label) => {

                const {
                  name,
                  color
                } = label;

                return (
                  <Tag className={ classNames('label', { 'inverted': isLight(`#${ color }`) }) } key={ name } color={ `#${ color }` }>{ name }</Tag>
                );
              })
            }
            <div className="links">
              <Tooltip placement="bottom" title="View on GitHub">
                <a
                  href={ item.html_url }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon type="github" />
                </a>
              </Tooltip>
            </div>
          </div>
          {
            connected && <CardLinks
              item={ item }
              connected={ connected }
            />
          }
        </div>
        {
          connected && <CardImpls
            item={ item }
            connected={ connected }
          />
        }
      </div>
    );
  }

}

function getIssueTypeIcon(item) {
  const isPullRequest = item.type === 'pull-request';

  if (isPullRequest) {
    return <Icon className="issue-type issue-type-pull-request" component={
      () => { return <Octicon icon={ GitPullRequest } />; }
    } />;
  }

  return null;
}


function hasModifier(event) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function isLight(color) {
  color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

  const r = color >> 16,
        g = (color >> 8) & 255,
        b = color & 255;

  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );

  return hsp > 127.5;
}


function CardLinks(props) {

  const {
    item,
    connected
  } = props;

  return (
    <Fragment>
      {
        connected.filter(c => c.type !== 'pull-request').map(c => {
          return (
            <CardLink
              key={ `${c.type}-${c.number}` }
              item={ item }
              connected={ c }
              onFilter={ f => console.log('FILTER %s', f) }
            />
          );
        })
      }
    </Fragment>
  );
}


function CardImpls(props) {

  const {
    item,
    connected
  } = props;

  return (
    <Fragment>
      {
        connected.filter(c => c.type === 'pull-request').map(c => {
          return (
            <CardImpl
              key={ `${c.type}-${c.number}` }
              item={ item }
              connected={ c }
              onFilter={ f => console.log('FILTER %s', f) }
            />
          );
        })
      }
    </Fragment>
  );
}

function linkIcon(type) {
  if (type === 'required-by') {
    return IssueOpened;
  }

  if (type === 'depends-on') {
    return CircleSlash;
  }

  if (type === 'part-of') {
    return Bookmark;
  }

  if (type === 'parent-of') {
    return PrimitiveDot;
  }

  if (type === 'related-to') {
    return Info;
  }

  return Info;
}

function CardLink(props) {

  const {
    item,
    connected,
    onFilter
  } = props;

  const {
    type,
    number
  } = connected;

  function onClick(e) {
    e.preventDefault();

    onFilter(type, item.number, number);
  }

  return (
    <div className="card-link">
      <Icon
        className={ classNames('link-type', `link-${type}`) }
        component={
          () => { return <Octicon icon={ linkIcon(type) } verticalAlign="middle" />; }
        }
      />{ type } <a onClick={ onClick } href="#">#{number}</a>
    </div>
  );
}


function CardImpl(props) {

  const {
    item,
    connected,
    onFilter
  } = props;


  function onClick(e) {
    e.preventDefault();

    onFilter(connected.type, item.number, connected.number);
  }

  return (
    <div className="card-impl">
      <Icon className="issue-type issue-type-pull-request" component={
        () => { return <Octicon icon={ GitPullRequest } />; }
      } /> { connected.type } <a onClick={ onClick } href="#">#{connected.number}</a>
    </div>
  );
}