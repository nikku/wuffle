import React from 'react';

import { Icon } from 'antd';


export default function PrefixIcon(props) {

  const { type } = props;

  return <Icon type={ type } style={ { color: 'rgba(0,0,0,.25)' } } />;
}