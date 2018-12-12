import React, { Component } from 'react';
import { AppContainer, AppNav, AppBody, Title, AppContent } from "./containers";
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

  render() {
    return (
      <AppContainer>
        <AppBody>
          <AppNav>
              <Title>Rules</Title>
              <RuleList data={this.state.rules} onClick={this.handleRuleClick.bind(this)}/>
          </AppNav>
          <AppContent>
            <EditRule id={this.state.selectedRule} rule={this.state.rule}/>
          </AppContent>
        </AppBody>
      </AppContainer>
    );
  }
}

export default App;
