import React from 'react';

import css from './Loader.less';

import classNames from 'classnames';

export default function Loader(props) {

  const {
    shown,
    children
  } = props;

  return (
    <div className={ classNames(css.Loader, { shown }) }>
      { children }
    </div>
  );
}