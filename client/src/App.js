import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { AppContainer, AppNav, AppBody, Title, HorizontalContainer, AppFooter } from "./containers";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { staticData } from './utils';
import { RuleList } from './RuleList';
import { RuleEditor } from './RuleEditor';
import { LogTable } from './LogTable';
import axios from 'axios';
import update from 'immutability-helper';

class App extends Component {
  constructor() {
    super();
    this.state = {
      rules: [],
      selectedRule: undefined,
      rule: {},
      logs: [],
      logsVisible: false
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

  handleEnableRuleClick = (index) => {
    axios.put('/api/rule/' + this.state.rules[index].key, {enabled: !this.state.rules[index].enabled})
        .then((response) => {
            // update the state
            if (response.data.success) {
                this.setState({ rules: update(this.state.rules, {[index]: { $toggle : ['enabled'] }}) });
            } else {
                // TODO: alert user, editor is not visible!
                console.log(response.data);
            }
        })
        .catch((error) => {
            // TODO: alert user
            console.log(error);
        });



  }

  handleAddRuleClick = () => {
    axios.post('/api/rules', staticData.newItems.rule)
      .then((response) => {
        console.log(response);
        this.loadRuleListFromServer(false);
      })
      .catch((error) => {
        // TODO: inform user
        console.log(error);
      });
  }

  handleLogsClick = () => {
    axios.get('/api/logs')
      .then((response) => {        
        this.setState({logs: response.data, logsVisible: true});
      })
      .catch((error) => {
        // TODO: inform user
        console.log(error);
      });
  }

  hideLogs = () => {
    this.setState({logs: [], logsVisible: false});
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
              <Button onClick={this.handleLogsClick}>Logs</Button>
              <Button onClick={this.handleAddRuleClick}>Add</Button>
            </HorizontalContainer>
            {!this.state.selectedRule && <Title>No rules defined. Create one...</Title>}
            <RuleList
              data={this.state.rules}
              selectedRule={this.state.selectedRule}
              onClick={this.handleRuleClick.bind(this)}
              onDeleteClick={this.handleDeleteRuleClick}
              onEnableClick={this.handleEnableRuleClick}
            />
          </AppNav>
          {this.state.selectedRule &&
            <RuleEditor id={this.state.selectedRule} refreshNames={() => { this.loadRuleListFromServer(false) }} />
          }          
        </AppBody>
        <Modal isOpen={this.state.logsVisible} toggle={this.hideLogs} size="xl">
          <ModalHeader toggle={this.hideLogs}>Modal title</ModalHeader>
          <ModalBody>
            <LogTable data={this.state.logs} />
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.hideLogs}>Do Something</Button>{' '}
            <Button color="secondary" onClick={this.hideLogs}>Cancel</Button>
          </ModalFooter>
        </Modal>

      </AppContainer>
    );
  }
}

export default DragDropContext(HTML5Backend)(App);
