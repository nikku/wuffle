import React from 'react';

import './WithPrefix.css';


export default function WithPrefix(props) {

  const {
    prefix,
    children
  } = props;

  return (
    <div className="with-prefix ant-input-affix-wrapper">
      <div className="ant-input-prefix">
        { prefix }
      </div>
      { children }
    </div>
  );
}