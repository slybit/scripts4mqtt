import React, { Component } from 'react';
import { SideNav, Nav } from 'react-sidenav'
import { AppContainer, AppNav, ExampleBody, AppBody, Title, AppContent } from "./containers";
import { RuleList } from './RuleList';
import RULELISTDATA from './data';
import axios from 'axios';

const AppNavigation = () => (
  <SideNav defaultSelectedPath="1">
      <Nav id="1">Item 1</Nav>
      <Nav id="2">Item 2</Nav>
      <Nav id="3">Item 3</Nav>
  </SideNav>
)

class App extends Component {
  constructor() {
    super();
    this.state = {
      data: [{key:"1", name:"a"}],
    };
  }

  loadRuleListFromServer() {
    axios.get('/api/rules')
    .then((response) => {
      this.setState( { data: response.data });
    })
    .catch((error) => {
      console.log(error);
    });
  }

  componentDidMount() {
    this.loadRuleListFromServer();
  }

  render() {
    return (
      <AppContainer>
        <AppBody>
          <AppNav>
              <Title>Rules</Title>
              <RuleList data={this.state.data}/>
          </AppNav>
          <AppContent>

            This simple example shows how you can use react-sidenav to create a
              tree like structure

          </AppContent>
        </AppBody>
      </AppContainer>
    );
  }
}

export default App;
