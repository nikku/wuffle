import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Home from './Home';
import Taskboard from './Taskboard';

import "antd/dist/antd.css";
import './App.css';

const App = () => (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route exact path="/board" component={Taskboard} />
  </Switch>
);

export default App;
