import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { AppContainer, AppNav, AppBody, AppEditor, AppFooter, Title, AppContent } from "./containers";
import { RuleList } from './RuleList';
import { RuleEditor } from './RuleEditor';
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
      console.log(response.data);
      this.setState( {         
        rules: response.data,
        selectedRule: response.data[0].key
      });
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
    //this.loadRuleFromServer(key);
  }

 

  render() {
    return (
      <AppContainer>
        <AppBody>
          <AppNav>
              <Title>Rules</Title>
              <RuleList data={this.state.rules} onClick={this.handleRuleClick.bind(this)}/>
          </AppNav>
          {this.state.selectedRule &&          
            <RuleEditor id={this.state.selectedRule} />          
          }
        </AppBody>
        
      </AppContainer>
    );
  }
}

export default DragDropContext(HTML5Backend)(App);
