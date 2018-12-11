import React, { Component } from 'react';
import { SideNav, Nav } from 'react-sidenav'
import logo from './logo.svg';
import './App.css';
import { AppContainer, Navigation, ExampleBody, Body, Title } from "./containers";
import { Basic } from "./Basic";

const AppNavigation = () => (
  <SideNav defaultSelectedPath="1">
      <Nav id="1">Item 1</Nav>
      <Nav id="2">Item 2</Nav>
      <Nav id="3">Item 3</Nav>
  </SideNav>
)

class App extends Component {
  render() {
    return (
      <AppContainer>
        <Navigation>
          <Basic />
        </Navigation>
        <ExampleBody>
        This simple example shows how you can use react-sidenav to create a
          tree like structure
        </ExampleBody>









      </AppContainer>
    );
  }
}

export default App;
