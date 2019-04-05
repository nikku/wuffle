import React from 'react';

import {
  Button,
  Checkbox,
  Collapse,
  Dropdown,
  Input,
  Menu,
  Radio
} from 'antd';

const Panel = Collapse.Panel,
      RadioButton = Radio.Button,
      RadioGroup = Radio.Group;

class FilterCategory extends React.Component {
  constructor() {
    super();

    this.state = {
      filterString: '',
      options: []
    };
  }

  onFilterStringChange = (e) => {
    const { value } = e.target;

    this.setState({
      filterString: value
    });
  }

  toggleOption = (option) => () => {
    const { onChange } = this.props;

    const { options } = this.state;

    let newOptions;

    if (options.includes(option)) {
      newOptions = options.filter(o => o !== option);
    } else {
      newOptions = [
        ...options,
        option
      ];
    }

    this.setState({
      options: newOptions
    });

    onChange(newOptions);
  }

  clear = () => {
    const { onChange } = this.props;

    this.setState({
      filterString: '',
      options: []
    });

    onChange([]);
  }
  
  render() {
    const {
      placeholder,
      filterOptions
    } = this.props;

    const {
      filterString,
      options
    } = this.state;

    return (
      <React.Fragment>
        <p>
          <Input value={ filterString } placeholder={ placeholder } allowClear onChange={ this.onFilterStringChange } />
        </p>
        <p>
          <Button block onClick={ this.clear }>Clear Filter</Button>
        </p>
        <div className="Taskboard-filter-list">
          {
            filterOptions.map((option) => {
              if (!option.includes(filterString)) {
                return null;
              }

              const checked = options.includes(option);

              return (
                <p onClick={ this.toggleOption(option) } key={ option }>
                  <Checkbox className="Taskboard-filter-list-item" defaultChecked={ false } checked={ checked } />
                  { option }
                </p>
              );
            })
          }
        </div>
      </React.Fragment>
    );
  }
}

export class Filter extends React.Component {
  constructor() {
    super();

    this.state = {
      visible: false
    };
  }

  handleMenuClick = () => {
    this.setState({ visible: true });
  }

  handleVisibleChange = (flag) => {
    this.setState({ visible: flag });
  }

  onAssigneeChange = (assignees) => {
    const { onFilterChange } = this.props;

    onFilterChange({
      assignees
    });
  }

  onLabelChange = (labels) => {
    const { onFilterChange } = this.props;

    onFilterChange({
      labels
    });
  }

  onMilestoneChange = (milestones) => {
    const { onFilterChange } = this.props;

    onFilterChange({
      milestones
    });
  }

  onPullrequestsIssuesChange = (e) => {
    const { onFilterChange } = this.props;

    const { value } = e.target;

    onFilterChange({
      pullrequestsIssues: value
    });
  }

  clear = () => {
    const { onFilterChange } = this.props;

    onFilterChange({
      assignees: [],
      labels: [],
      milestones: [],
      pullrequestsIssues: 'both'
    });
  }

  getAssignees = () => {
    const { issues } = this.props;

    return Object.values(issues).reduce((allAssignees, issue) => {
      if (!issue.assignees.length) {
        return allAssignees;
      }

      issue.assignees.forEach((assignee) => {
        if (!allAssignees.includes(assignee.login)) {
          allAssignees = [
            ...allAssignees,
            assignee.login
          ];
        }
      });

      return allAssignees
    }, []).sort();
  }

  getLabels = () => {
    const { issues } = this.props;

    return Object.values(issues).reduce((allLabels, issue) => {
      if (!issue.labels.length) {
        return allLabels;
      }

      issue.labels.forEach((label) => {
        if (!allLabels.includes(label.name)) {
          allLabels = [
            ...allLabels,
            label.name
          ];
        }
      });

      return allLabels
    }, []).sort();
  }

  getMilestones = () => {
    const { issues } = this.props;

    return Object.values(issues).reduce((allMilestones, issue) => {
      if (!issue.milestone) {
        return allMilestones;
      }

      if (!allMilestones.includes(issue.milestone.title)) {
        allMilestones = [
          ...allMilestones,
          issue.milestone.title
        ];
      }

      return allMilestones
    }, []).sort();
  }

  render() {
    const { issuesFilter } = this.props;

    const {
      pullrequestsIssues
    } = issuesFilter;

    const { visible } = this.state;

    const assignees = this.getAssignees(),
          labels = this.getLabels(),
          milestones = this.getMilestones();

    const overlay = (
      <Menu onClick={this.handleMenuClick} className="Taskboard-filter-menu">
        <Menu>
          <Menu.Item>
            <Button onClick={ this.clear } block>Clear All</Button>
          </Menu.Item>
          <Menu.Item>
            <Collapse>
              <Panel header="Assignee">
                <FilterCategory placeholder="Filter Assignees" filterOptions={ assignees } onChange={ this.onAssigneeChange } />
              </Panel>
            </Collapse>
          </Menu.Item>
          <Menu.Item>
            <Collapse>
              <Panel header="Labels">
                <FilterCategory placeholder="Filter Labels" filterOptions={ labels } onChange={ this.onLabelChange } />
              </Panel>
            </Collapse>
          </Menu.Item>
          <Menu.Item>
            <Collapse>
              <Panel header="Milestones">
              <FilterCategory placeholder="Filter Milestones" filterOptions={ milestones } onChange={ this.onMilestoneChange } />
              </Panel>
            </Collapse>
          </Menu.Item>
          <Menu.Item>
            <RadioGroup onChange={ this.onPullrequestsIssuesChange } value={ pullrequestsIssues || 'both' } defaultValue="both">
              <RadioButton value="pullrequests">PRs only</RadioButton>
              <RadioButton value="both">PRs and Issues</RadioButton>
              <RadioButton value="issues">Issues only</RadioButton>
            </RadioGroup>
          </Menu.Item>
        </Menu>
      </Menu>
    );

    return(
      <Dropdown
        overlay={ overlay }
        placement="bottomRight"
        trigger={ [ 'click' ] }
        onVisibleChange={ this.handleVisibleChange }
        visible={ visible }>
        <Button icon="filter" type="primary"></Button>
      </Dropdown>
    );
  }
}