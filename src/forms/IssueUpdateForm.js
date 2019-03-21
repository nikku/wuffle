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
  Select,
  Spin
} from 'antd';

import WithPrefix from './WithPrefix';
import PrefixIcon from './PrefixIcon';

import './Form.css';


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
      <Form layout="vertical" className="condensed-form" onSubmit={onSubmit}>
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
            <WithPrefix prefix={<PrefixIcon type="usergroup-add" />}>
              <Select
                mode="multiple"
                labelInValue
                placeholder="Select assignees"
                notFoundContent={fetching ? <Spin size="small" /> : null}
                filterOption={false}
                onSearch={fetchUser}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
              </Select>
            </WithPrefix>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('tags', {
            rules: []
          })(
            <WithPrefix prefix={<PrefixIcon type="tags" />}>
              <Select
                mode="tags"
                labelInValue
                placeholder="Select tags"
                notFoundContent={fetching ? <Spin size="small" /> : null}
                filterOption={false}
                onSearch={fetchUser}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
              </Select>
            </WithPrefix>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('milestone', {
            rules: []
          })(
            <WithPrefix prefix={<PrefixIcon type="schedule" />}>
              <Select
                showSearch
                labelInValue
                placeholder="Select milestone"
                notFoundContent={fetching ? <Spin size="small" /> : null}
                filterOption={false}
                onSearch={fetchUser}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
              </Select>
            </WithPrefix>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('column', {
            rules: []
          })(
            <WithPrefix prefix={<PrefixIcon type="layout" />}>
              <Select
                showSearch
                labelInValue
                placeholder="Select column"
                notFoundContent={fetching ? <Spin size="small" /> : null}
                filterOption={false}
                optionLabelProp="children"
                onSearch={fetchUser}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                {data.map(d => <Select.Option key={d.value}>{d.text}</Select.Option>)}
              </Select>
            </WithPrefix>
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