import React from 'react';

import {
  Avatar,
  Icon,
  Input,
  Tag,
  Tooltip
} from 'antd';

import classNames from 'classnames';


export function Task({ item, provided, snapshot }) {
  // TODO(nikku): normalize upfront
  const isPullRequest = item.type === 'pull-request';

  // TODO(nikku): normalize upfront

  const repository = item.repository_url ?
    item.repository_url.replace('https://api.github.com/repos/', '') :
    item.base.repo.full_name;

  const milestone = item.milestone ? item.milestone.title : null;

  return (
    <div className="Taskboard-item"
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={
        provided.draggableProps.style
      }
    >
      <div
        className="Taskboard-item-card"
        style={getItemStyle(
          snapshot.isDragging
        )}
      >

        <div className="Taskboard-item-header">
          {
            getIssueTypeIcon(item)
          }
          <a
            href={ `https://github.com/${item.repository}/issues/${item.number}` }
            className="Taskboard-item-issue-number"
            onClick={ (e) => {

              if (hasModifier(e)) {
                return;
              }

              this.showIssueUpdateDrawer(item.id);

              e.preventDefault();
            } }
          >{ item.number }</a>
          <span className="Taskboard-item-repository">{ repository }</span>
          <span className="spacer"></span>
          <Tooltip placement="top" title={ `${ item.user.login } Assigned` }>
            <a className="Taskboard-item-assignee" href="#">
              <Avatar src={ item.user.avatar_url } size={ 20 } shape="square" />
            </a>
          </Tooltip>
        </div>

        <div className="Taskboard-item-title">
          <Input.TextArea autosize value={item.title} onChange={ console.log }/>
        </div>

        <div className="Taskboard-item-footer">
          {
            milestone && <Tag className="Taskboard-item-label" key="milestone">{ milestone }</Tag>
          }
          {
            (item.labels || []).map((label) => {

              const {
                name,
                color
              } = label;

              return (
                <Tag className={classNames('Taskboard-item-label', { 'inverted': isLight(`#${ color }`) })} key={ name } color={ `#${ color }` }>{ name }</Tag>
              );
            })
          }
          <div className="Taskboard-item-links">
            <Tooltip placement="bottom" title="View in GitHub">
              <a href={ item.html_url } target="blank">
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
    return <Icon className="Taskboard-item-issue-type Taskboard-item-issue-type-pull-request" type="branches" rotate="180" />;
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