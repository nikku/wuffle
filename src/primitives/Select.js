import React from 'react';

import { Select as _Select } from 'antd';

import styles from './Select.less';

import classNames from 'classnames';


const Select = React.forwardRef(function(props, ref) {
  const {
    prefix,
    children,
    ...otherProps
  } = props;

  if (!prefix) {
    return <_Select {...otherProps}>{ children }</_Select>
  }

  return (
    <div className={ classNames(styles.Select, 'ant-input-affix-wrapper') }>
      <div className="ant-input-prefix">
        { prefix }
      </div>
      <_Select {...otherProps} ref={ ref }>
        { children }
      </_Select>
    </div>
  );
});

export default Select;

Select.Option = _Select.Option;