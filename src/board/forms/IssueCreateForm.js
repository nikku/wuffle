import React from 'react';

import {
  Button,
  Input,
  Form,
  Spin
} from 'antd';

import {
  Select,
  PrefixIcon
} from '../primitives';

import styles from './Form.less';


class IssueCreateForm extends React.Component {

  handleSubmit = (e) => {
    e.preventDefault();

    const {
      onSubmit,
      form
    } = this.props;

    form.validateFieldsAndScroll((err, values) => {
      if (err) {
        return console.error(err);
      }

      console.log('Received values of form: ', values);

      onSubmit(values);
    });
  }

  render() {

    const data = [
      { text: 'A', value: 'a' }, { text: 'B', value: 'b' }, { text: 'C', value: 'c' }
    ];

    const fetching = false;

    const handleChange = () => {};

    const fetchUser = () => {
      return Promise.resolve([ ]);
    };

    const {
      form
    } = this.props;

    const {
      getFieldDecorator,
    } = form;

    return (
      <Form layout="vertical" className={ styles.CondensedForm } onSubmit={ this.handleSubmit }>
        <Form.Item>
          {getFieldDecorator('title', {
            rules: [{ required: true, message: 'Please provide a title' }]
          })(
            <Input placeholder="Enter title" size="large" autoFocus />
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('description')(
            <Input.TextArea autosize={ { minRows: 5, maxRows: 12 } } placeholder="Enter description" />
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
              notFoundContent={ fetching ? <Spin size="small" /> : null }
              filterOption={ false }
              onSearch={ fetchUser }
              onChange={ handleChange }
              prefix={ <PrefixIcon type="usergroup-add" /> }
              style={ { width: '100%' } }
            >
              {data.map(d => <Select.Option key={ d.value }>{d.text}</Select.Option>)}
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
              notFoundContent={ fetching ? <Spin size="small" /> : null }
              filterOption={ false }
              onSearch={ fetchUser }
              onChange={ handleChange }
              prefix={ <PrefixIcon type="tags" /> }
              style={ { width: '100%' } }
            >
              {data.map(d => <Select.Option key={ d.value }>{d.text}</Select.Option>)}
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
              notFoundContent={ fetching ? <Spin size="small" /> : null }
              filterOption={ false }
              onSearch={ fetchUser }
              onChange={ handleChange }
              prefix={ <PrefixIcon type="schedule" /> }
              style={ { width: '100%' } }
            >
              {data.map(d => <Select.Option key={ d.value }>{d.text}</Select.Option>)}
            </Select>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('column', {
            rules: [{ required: true, message: 'Please specify a column' }]
          })(
            <Select
              showSearch
              labelInValue
              placeholder="Select column"
              notFoundContent={ fetching ? <Spin size="small" /> : null }
              filterOption={ false }
              optionLabelProp="children"
              onSearch={ fetchUser }
              onChange={ handleChange }
              prefix={ <PrefixIcon type="layout" /> }
              style={ { width: '100%' } }
            >
              {data.map(d => <Select.Option key={ d.value }>{d.text}</Select.Option>)}
            </Select>
          )}
        </Form.Item>
        <Form.Item style={ { marginTop: 20 } }>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    );
  }

}


export default Form.create({ name: 'create_issue' })(IssueCreateForm);