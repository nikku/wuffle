import React from 'react';
import { Route, Switch } from 'react-router-dom';

import Home from './home/Home';
import Taskboard from './board/Taskboard';

import './App.less';

const App = () => (
  <Switch>
    <Route exact path="/" component={ Home } />
    <Route exact path="/board" component={ Taskboard } />
  </Switch>
);

export default App;
