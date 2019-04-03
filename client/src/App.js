import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { AppContainer, AppNav, AppBody, Title, HorizontalContainer } from "./containers";
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, InputGroupAddon, Input } from 'reactstrap';
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

  loadRuleListFromServer = (refreshEditor = true) => {
    axios.get('/api/rules')
      .then((response) => {
        console.log(response.data);
        this.updateRuleList(response.data, refreshEditor);
      })
      .catch((error) => {
        console.log(error);
      });
  }



  componentDidMount() {
    this.loadRuleListFromServer();
  }

  handleRuleClick(key) {
    this.setState({ selectedRule: key });
    //this.loadRuleFromServer(key);
  }

  handleDeleteRuleClick = (key) => {
    axios.delete('/api/rule/' + key)
      .then((response) => {
        this.updateRuleList(this.state.rules.filter((item) => item.key !== key));
      })
      .catch((error) => {
        // TODO: inform user
        console.log(error);
      });
  }

  newRule = {
    name: "new_rule",
    condition: []
  }

  handleAddRuleClick = () => {
    axios.post('/api/rules', this.newRule)
      .then((response) => {
        console.log(response);
        this.loadRuleListFromServer(false);
      })
      .catch((error) => {
        // TODO: inform user
        console.log(error);
      });
  }


  updateRuleList(list, refreshEditor = true) {
    if (refreshEditor) {
      this.setState({
        rules: list,
        selectedRule: list.length > 0 ? list[0].key : undefined
      });
    } else {
      this.setState({
        rules: list
      });
    }
  }



  render() {
    return (
      <AppContainer>
        <AppBody>
          <AppNav>
            <HorizontalContainer>
              <Title>Rules</Title>
              <Button onClick={this.handleAddRuleClick}>Add</Button>
            </HorizontalContainer>
            {!this.state.selectedRule && <Title>No rules defined. Create one...</Title>}
            <RuleList
              data={this.state.rules}
              selectedRule={this.state.selectedRule}
              onClick={this.handleRuleClick.bind(this)}
              onDeleteClick={this.handleDeleteRuleClick}
            />
          </AppNav>
          {this.state.selectedRule &&
            <RuleEditor id={this.state.selectedRule} refreshNames={() => { this.loadRuleListFromServer(false) }} />
          }
        </AppBody>

      </AppContainer>
    );
  }
}

export default DragDropContext(HTML5Backend)(App);
