import React from 'react';

import {
  Dropdown,
  Menu,
  Button,
  Icon,
  Input,
  Tag,
  Drawer,
  Form,
  Spin
} from 'antd';

import {
  Select,
  PrefixIcon
} from '../primitives';

import styles from './Form.less';


class IssueUpdateForm extends React.Component {

  render() {

    const value = "FOO";

    const data = [
      { text: 'A', value: 'a' }, { text: 'B', value: 'b' }, { text: 'C', value: 'c' }
    ];

    const fetching = false;

    const handleChange = () => {};

    const fetchUser = () => {
      return Promise.resolve([  ]);
    };

    const {
      onSubmit,
      form
    } = this.props;

    const {
      getFieldDecorator,
    } = form;

    return (
      <Form layout="vertical" className={ styles.CondensedForm } onSubmit={onSubmit}>
        <Form.Item>
          {getFieldDecorator('title', {
            rules: [{ required: true, message: 'Please enter a title' }]
          })(
            <Input placeholder="Enter title" size="large" autoFocus />
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('description', {
            rules: [{ required: true, message: 'Please enter a description' }]
          })(
            <Input.TextArea autosize={{ minRows: 5, maxRows: 12 }} placeholder="Enter description" />
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('assignee', {
            rules: []
          })(
            <Select
              mode="multiple"
              labelInValue
              placeholder="Select assignees"
              notFoundContent={fetching ? <Spin size="small" /> : null}
              filterOption={false}
              onSearch={fetchUser}
              onChange={handleChange}
              prefix={<PrefixIcon type="usergroup-add" />}
              style={{ width: '100%' }}
            >
              {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
            </Select>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('tags', {
            rules: []
          })(
            <Select
              mode="tags"
              labelInValue
              placeholder="Select tags"
              notFoundContent={fetching ? <Spin size="small" /> : null}
              filterOption={false}
              onSearch={fetchUser}
              onChange={handleChange}
              prefix={<PrefixIcon type="tags" />}
              style={{ width: '100%' }}
            >
              {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
            </Select>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('milestone', {
            rules: []
          })(
            <Select
              showSearch
              labelInValue
              placeholder="Select milestone"
              notFoundContent={fetching ? <Spin size="small" /> : null}
              filterOption={false}
              onSearch={fetchUser}
              onChange={handleChange}
              prefix={<PrefixIcon type="schedule" />}
              style={{ width: '100%' }}
            >
              {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
            </Select>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('column', {
            rules: []
          })(
            <Select
              showSearch
              labelInValue
              placeholder="Select column"
              notFoundContent={fetching ? <Spin size="small" /> : null}
              filterOption={false}
              optionLabelProp="children"
              onSearch={fetchUser}
              onChange={handleChange}
              prefix={<PrefixIcon type="layout" />}
              style={{ width: '100%' }}
            >
              {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
            </Select>
          )}
        </Form.Item>
        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" htmlType="submit">
            Update
          </Button>
        </Form.Item>
      </Form>
    );
  }

}


export default Form.create({ name: 'update_issue' })(IssueUpdateForm);