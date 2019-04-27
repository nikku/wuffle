import React from 'react';

import { Select as BaseSelect } from 'antd';

import styles from './Select.less';

import classNames from 'classnames';


const Select = React.forwardRef(function(props, ref) {
  const {
    prefix,
    children,
    ...otherProps
  } = props;

  if (!prefix) {
    return <BaseSelect { ...otherProps }>{ children }</BaseSelect>;
  }

  return (
    <div className={ classNames(styles.Select, 'ant-input-affix-wrapper') }>
      <div className="ant-input-prefix">
        { prefix }
      </div>
      <BaseSelect { ...otherProps } ref={ ref }>
        { children }
      </BaseSelect>
    </div>
  );
});

export default Select;

Select.Option = BaseSelect.Option;