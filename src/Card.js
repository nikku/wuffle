import React from 'react';

import {
  Avatar,
  Icon,
  Input,
  Tag,
  Tooltip
} from 'antd';

import Octicon, {GitPullRequest} from '@githubprimer/octicons-react'

import classNames from 'classnames';

import css from './Card.less';


export default function Task(props) {

  const {
    item,
    provided,
    snapshot,
    onEdit,
    onNameUpdate,
    onAssigneeUpdate
  } = props;


  // TODO(nikku): normalize upfront

  const repository = item.repository_url ?
    item.repository_url.replace('https://api.github.com/repos/', '') :
    item.base.repo.full_name;

  const milestone = item.milestone ? item.milestone.title : null;

  return (
    <div className={ css.Card }
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={
        provided.draggableProps.style
      }
    >
      <div
        className="card"
        style={getItemStyle(
          snapshot.isDragging
        )}
      >

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

              if (typeof onEdit === 'function') {

                if (!hasModifier(e)) {
                  onEdit(item);

                  e.preventDefault();
                }
              }
            } }
          >
            { item.number }
          </a>
          <span className="repository">{ repository }</span>
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
          <Input.TextArea autosize value={item.title} onChange={ (event) => {
            const newValue = event.target.value;

            if (typeof onNameUpdate === 'function') {
              onNameUpdate(item, newValue);
            }
          } }/>
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
                <Tag className={classNames('label', { 'inverted': isLight(`#${ color }`) })} key={ name } color={ `#${ color }` }>{ name }</Tag>
              );
            })
          }
          <div className="links">
            <Tooltip placement="bottom" title="View in GitHub">
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
      </div>
    </div>
  );
}

function getIssueTypeIcon(item) {
  const isPullRequest = item.type === 'pull-request';

  if (isPullRequest) {
    return <Icon className="issue-type issue-type-pull-request" component={
      () => { return <Octicon icon={ GitPullRequest } /> }
    } />;
  }

  return null;
}


function getItemStyle(isDragging) {
  return {
    userSelect: 'none'
  }
}

function hasModifier(event) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function isLight(color) {
  color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

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