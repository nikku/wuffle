import React from 'react';

import classNames from 'classnames';

import {
  Layout,
  Menu,
  Button
} from 'antd';

import css from './Home.less';

const {
  Header,
  Content,
  Footer
} = Layout;

class Home extends React.Component {
  render() {
    return (
      <Layout className={ classNames(css.Home, 'layout') }>
        <Header>
          <div className="logo">
          </div>

          <Menu
            theme="light"
            mode="horizontal"
            className="menu"
          >
            <Menu.Item key="features"><a href="#features">Features</a></Menu.Item>
            <Menu.Item key="github" className="menu-right"><a href="https://github.com/nikku/wuffle" target="_blank">GitHub</a></Menu.Item>
          </Menu>
        </Header>
        <Content className="content">

          <div className="well">
            <img src="/favicon.svg" width="155" className="logo" />

            <h1>Track all your GitHub projects on a unified task board.</h1>

            <Button href="./board" size="large" type="primary">
              See Board
            </Button>

            &nbsp; or <a href="https://github.com/nikku/wuffle">view on GitHub</a>.
          </div>


          <a id="features" className="section-link">features</a>

          <section>
            <h1>Maps your Development Cycle to Columns</h1>

            <p>

            </p>
          </section>


          <section>
            <h1>Tight integration with the <a href="https://guides.github.com/introduction/flow/">GitHub flow</a></h1>

            <p>
            </p>
          </section>


          <section>
            <h1>Publicly accessible</h1>

            <p>
            </p>
          </section>


          <section>
            <h1>Open Source and Self-Hostable.</h1>
          </section>

        </Content>

        <Footer className="footer">
          Wuffle is a project by Nico Rehwaldt © 2019 / <a href="https://github.com/nikku/wuffle">view on GitHub</a>
        </Footer>

      </Layout>
    );
  }
}

export default Home;
