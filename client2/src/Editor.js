import React, { Component } from 'react';
import { LeftColumn, AppBody, Title, HorizontalContainer } from "./containers";
import { Button, Input } from 'reactstrap';
import { staticData, showError } from './utils';
import { RuleList } from './RuleList';
import { RuleEditor } from './RuleEditor';
import axios from 'axios';
import update from 'immutability-helper';

class Editor extends Component {
  constructor() {
    super();
    this.state = {
      rules: {},
      filter: "",
      selectedRule: undefined,
      rule: {},
    };
  }

  // load the rule list as soon as the DOM is ready
  componentDidMount() {
    this.loadRuleListFromServer();
  }

  /* --------------------------------------------------------------------------------------------------
  Server interaction
  -------------------------------------------------------------------------------------------------- */

  // load the rule list (categories object) from the server
  loadRuleListFromServer = (updatedRule = undefined) => {
    axios.get('/api/rules')
      .then((response) => {
        this.updateRuleList(response.data, updatedRule);
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
  }


  /* --------------------------------------------------------------------------------------------------
  Rule list management
  -------------------------------------------------------------------------------------------------- */


  updateRuleList(ruleList, updatedRule = undefined) {
    console.log(updatedRule);
    if (updatedRule) {
      this.setState({
        rules: update(ruleList, { [updatedRule.category]: { isOpen: { $set: true } } }),
        selectedRule: updatedRule.id
      });
    } else {
      this.setState({
        rules: ruleList,
        selectedRule: undefined
      });
    }
  }

  updateFilter = (event) => {
    this.setState({
      filter: event.target.value,
    });

    for (let category of Object.keys(this.state.rules)) {
      this.setState((state) => ({
        rules: update(state.rules, { [category]: { isOpen: { $set: true } } })
      }));
    }
  }

  filterList = () => {
    let filtered = {};
    let filter = this.state.filter;
    for (let category of Object.keys(this.state.rules)) {
      filtered[category] = {
        isOpen: this.state.rules[category].isOpen,
        rules: []
      };
      filtered[category].rules = this.state.rules[category].rules.filter(function (item) {
        return item.name.toLowerCase().search(
          filter.toLowerCase()) !== -1;
      });
    }
    return filtered;
  }


  /* --------------------------------------------------------------------------------------------------
  UI handlers
  -------------------------------------------------------------------------------------------------- */

  handleRuleClick = (key) => {
    console.log("Rule clicked: " + key);
    this.setState({ selectedRule: key });
  }

  handleCategoryClick = (category) => {
    this.setState({ rules: update(this.state.rules, { [category]: { $toggle: ['isOpen'] } }) });
  }

  handleDeleteRuleClick = (key) => {
    axios.delete('/api/rule/' + key)
      .then((response) => {
        if (response.data.success) {
          this.loadRuleListFromServer(false);
        } else {
          showError("Deletion not handled by script4mqtt service.", response.data);
          console.log(response.data);
        }
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
  }

  handleEnableRuleClick = (key, newEnabledState) => {
    axios.put('/api/rule/' + key, { enabled: newEnabledState })
      .then((response) => {
        // update the state
        if (response.data.success) {
          this.loadRuleListFromServer(false);
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
          this.loadRuleListFromServer(response.data.newrule);
        } else {
          showError("New rule action not handled by script4mqtt service.", response.data);
          console.log(response.data);
        }
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
  }

  /* --------------------------------------------------------------------------------------------------
  Render
  -------------------------------------------------------------------------------------------------- */

  render() {
    return (
      <AppBody>
        <LeftColumn>
          <HorizontalContainer>
            <Title>Rules</Title>
            <Button onClick={this.handleAddRuleClick}>Add</Button>
          </HorizontalContainer>
          <Input placeholder="Filter rules..." value={this.state.filter} onChange={this.updateFilter} />
          <br></br>
          <RuleList
            data={this.filterList()}
            selectedRule={this.state.selectedRule}
            onClick={this.handleRuleClick.bind(this)}
            onDeleteClick={this.handleDeleteRuleClick}
            onEnableClick={this.handleEnableRuleClick}
            onCategoryClick={this.handleCategoryClick}
          />
        </LeftColumn>
        {this.state.selectedRule && false &&
            <div id={this.state.selectedRule} refreshNames={() => { this.loadRuleListFromServer(false) }} />
          }
          {this.state.selectedRule &&
            <RuleEditor id={this.state.selectedRule} refreshNames={() => { this.loadRuleListFromServer(false) }} />
          }
      </AppBody>
    );
  }
}

export default Editor;
