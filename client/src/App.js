import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { AppContainer, AppNav, AppBody, AppEditor, AppFooter, Title, AppContent } from "./containers";
import { RuleList } from './RuleList';
import { EditRule } from './EditRule';
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    this.state = {
      rules: [],
      selectedRule: undefined,
      rule: {}
    };
  }

  loadRuleListFromServer() {
    axios.get('/api/rules')
    .then((response) => {
      this.setState( { rules: response.data });
    })
    .catch((error) => {
      console.log(error);
    });
  }

  loadRuleFromServer(key) {
    axios.get('/api/rule/' + key)
    .then((response) => {
      this.setState( { rule: response.data });
    })
    .catch((error) => {
      console.log(error);
    });
  }

  componentDidMount() {
    this.loadRuleListFromServer();
  }

  handleRuleClick(key) {
    this.setState({selectedRule: key});
    this.loadRuleFromServer(key);
  }

  handleChange(items) {
    // copy rule from state
    let cloned = Object.assign({}, this.state.rule);
    // adapt and put back in state
    cloned.flatConditions = items ;
    this.setState({ rule: cloned});
    console.log(items);
  }

  render() {
    return (
      <AppContainer>
        <AppBody>
          <AppNav>
              <Title>Rules</Title>
              <RuleList data={this.state.rules} onClick={this.handleRuleClick.bind(this)}/>
          </AppNav>          
          <EditRule id={this.state.selectedRule} rule={this.state.rule} handleChange={this.handleChange.bind(this)}/>          
        </AppBody>
        <AppFooter>footer</AppFooter>
      </AppContainer>
    );
  }
}

export default DragDropContext(HTML5Backend)(App);
