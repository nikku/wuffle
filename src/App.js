import React from 'react';
import { Route, Switch } from 'react-router-dom';

import Home from './Home';
import Taskboard from './Taskboard';

import './App.less';

const App = () => (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route exact path="/board" component={Taskboard} />
  </Switch>
);

export default App;
