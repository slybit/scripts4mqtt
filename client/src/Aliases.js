import React, { Component } from 'react';
import { AppNav, AppBody, Title, HorizontalContainer, AppContent, AppMain } from "./containers";
import { Button } from 'reactstrap';
import { AliasList } from './AliasList';
import { staticData, showError } from './utils';
import axios from 'axios';
import update from 'immutability-helper';
import Icon from '@mdi/react'
import { mdiClose } from '@mdi/js'

export class Aliases extends Component {
  constructor() {
    super();
    this.state = {
      aliases: [],
      selectedAlias: undefined,
    };
  }

  loadAliasListFromServer = (refreshEditor = true) => {
    /*
    axios.get('/api/aliases')
      .then((response) => {
        console.log(response.data);
        this.updateAliasList(response.data, refreshEditor);
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
      */
     //var aliases = [{key: "AliasOne"}, {key: "AliasTwo"}];
     var aliases = {"AliasOne":["1/1/2","2/3/4","4/12/4"],"AliasAAATwo":["10/1/2","20/3/4","40/12/4"]};
     this.updateAliasList(aliases, refreshEditor);

  }



  componentDidMount() {
    this.loadAliasListFromServer();
  }

  handleAliasClick(key) {
    this.setState({ selectedAlias: key });
  }

  /*
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
  */

  /*
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
  */

  /*
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
  */



  updateAliasList(list, refreshEditor = true) {
    if (refreshEditor) {
      this.setState({
        aliases: list,
        selectedAlias: Object.keys(list).length > 0 ? Object.keys(list).sort()[0] : undefined
      });
    } else {
      this.setState({
        aliases: list
      });
    }
  }



  render() {
    let items = [];
    if (this.state.selectedAlias) {
      items = this.state.aliases[this.state.selectedAlias].map((item, index) => {
        return (
          <Button key={item} color="dark" outline className="aliasButton">{item}<Icon path={mdiClose} size={1} color="gray"/></Button>
        )
      });
    }


    return (
        <AppBody>
          <AppNav>
            <HorizontalContainer>
              <Title>Aliases</Title>
              <Button onClick={this.handleAddAliasClick}>Add</Button>
            </HorizontalContainer>
            {!this.state.selectedAlias && <Title>No aliases defined. Create one...</Title>}
            <AliasList
              data={this.state.aliases}
              selectedAlias={this.state.selectedAlias}
              onClick={this.handleAliasClick.bind(this)}
              onDeleteClick={this.handleDeleteAliasClick}
              onEnableClick={this.handleEnableAliasClick}
            />
          </AppNav>
          <AppMain>
              <AppContent>
                  {items}
              </AppContent>
          </AppMain>
        </AppBody>

    );
  }
}


