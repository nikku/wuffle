import React from 'react';

import {
  Drawer
} from 'antd';

import {
  IssueUpdateForm
} from '../forms';


export default function IssueUpdateDrawer(props) {

  const {
    onClose,
    onUpdate,
    visible
  } = props;

  const drawerTitle = (
    <div style={ {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    } }>
      <span>Issue <a href="#"><strong>1231</strong></a></span>

      <span style={ { color: '#888' } }>bpmn-io/bpmn-js</span>
    </div>
  );

  return (
    <Drawer
      title={ drawerTitle }
      placement="right"
      closable={ false }
      onClose={ onClose }
      visible={ typeof visible === 'number' }
      width={ 500 }
    >
      <IssueUpdateForm onSubmit={ onUpdate } onCancel={ onClose } />
    </Drawer>
  );
}