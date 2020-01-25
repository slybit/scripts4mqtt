import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { AppNav, AppBody, Title, HorizontalContainer } from "./containers";
import { Button } from 'reactstrap';
import { staticData, showError } from './utils';
import { RuleList } from './RuleList';
import { RuleEditor } from './RuleEditor';
import axios from 'axios';
import update from 'immutability-helper';

class Editor extends Component {
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
        this.updateRuleList(response.data, refreshEditor);
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
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
        if (response.data.success) {
          this.updateRuleList(this.state.rules.filter((item) => item.key !== key));
        } else {
          showError("Deletion not handled by script4mqtt service.", response.data);
          console.log(response.data);
        }
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
  }

  handleEnableRuleClick = (index) => {
    axios.put('/api/rule/' + this.state.rules[index].key, { enabled: !this.state.rules[index].enabled })
      .then((response) => {
        // update the state
        if (response.data.success) {
          this.setState({ rules: update(this.state.rules, { [index]: { $toggle: ['enabled'] } }) });
        } else {
          showError("Rule update not handled by script4mqtt service.", response.data);
          console.log(response.data);
        }
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });



  }

  handleAddRuleClick = () => {
    axios.post('/api/rules', staticData.newItems.rule)
      .then((response) => {
        if (response.data.success) {
          this.loadRuleListFromServer(false);
        } else {
          showError("New rule action not handled by script4mqtt service.", response.data);
          console.log(response.data);
        }
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
  }



  hideLogs = () => {
    this.setState({ logs: [], logsVisible: false });
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
              onEnableClick={this.handleEnableRuleClick}
            />
          </AppNav>
          {this.state.selectedRule &&
            <RuleEditor id={this.state.selectedRule} refreshNames={() => { this.loadRuleListFromServer(false) }} />
          }
        </AppBody>

    );
  }
}

export default DragDropContext(HTML5Backend)(Editor);
