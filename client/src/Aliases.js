import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input, Alert, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { AppNav, AppBody, Title, HorizontalContainer, AppContent, AppMain } from "./containers";
import { AliasList } from './AliasList';
import { AliasEditor } from './AliasEditor';
import { staticData, showError } from './utils';
import axios from 'axios';
import update from 'immutability-helper';


export class Aliases extends Component {

  constructor() {
    super();
    this.state = {
      aliases: [],
      selectedAlias: undefined,
    };
  }

  componentDidMount() {
    this.loadAliasListFromServer();
  }

  loadAliasListFromServer() {
    axios.get('/api/aliases')
      .then((response) => {
        this.updateAliasList(response.data);
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
  }





  handleAliasClick(key) {
    this.setState({ selectedAlias: key });
  }





  handleAddAliasClick = () => {
    console.log("add alias");
    this.setState({
      newAliasModalVisible: true,
      newAliasName: "",
      newAliasNameAlertVisible: false,
      newAliasNameAlert: ""
    });
  }



  updateAliasList(data) {
      this.setState({
        newAliasModalVisible: false,
        aliases: data.aliases,
        selectedAlias: data.name ? data.name : (Object.keys(data.aliases).length > 0 ? Object.keys(data.aliases).sort()[0] : undefined)
      });
  }


  onAliasNameChange = (e) => {
    this.setState({ newAliasName: e.target.value });
  }

  aliasNameEditorHandleCancelClick = () => {
    this.setState({
      newAliasModalVisible: false
    });
  }

  aliasNameEditorHandleSaveClick = () => {
    console.log("creating new alias: " + this.state.newAliasName);
    let newAlias = {};
    newAlias[this.state.newAliasName] = [];
    axios.post('/api/aliases', newAlias)
    .then((response) => {
      if (response.data.success) {
        this.updateAliasList(response.data, true);
      } else {
        showError("New rule action not handled by script4mqtt service.", response.data);
        console.log(response.data);
      }
    })
    .catch((error) => {
      showError("Cannot access the script4mqtt service.", error);
    });

  }



  render() {
    return (
      <AppBody>
      {this.state.newAliasModalVisible && <AliasNameInput
          aliasName={this.state.newAliasName}
          handleCancelClick={this.aliasNameEditorHandleCancelClick}
          handleSaveClick={this.aliasNameEditorHandleSaveClick}
          onAliasNameChange={this.onAliasNameChange}
          alertVisible={this.newAliasNameAlertVisible}
          alert={this.newAliasNameAlert}
        />}

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
        {this.state.selectedAlias &&
          <AliasEditor
            aliases={this.state.aliases}
            selectedAlias={this.state.selectedAlias}
            refreshNames={() => { this.loadAliasListFromServer() }}
            onAliasNameChange={this.onAliasNameChange} />
        }


      </AppBody>
    );
  }

}

const spacerStyle = {
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
};


function AliasNameInput(props) {
  return (
    <Modal isOpen={true} fade={false} toggle={props.handleCancelClick} size="lg">
      <ModalHeader toggle={props.handleCancelClick}>New Alias Name</ModalHeader>
      <ModalBody>
        <Form className="form">
          <FormGroup>
            <Label for="newAliasName" >New alias name:</Label>
            <Input id="newAliasName" value={props.aliasName} onChange={props.onAliasNameChange} />
          </FormGroup>
        </Form>
        <Alert color="primary" isOpen={true}>
          Alias names cannot be changed later and must be unique.
        </Alert>
        <Alert color="danger" isOpen={props.alertVisible === true}>
          {props.alert}
        </Alert>
      </ModalBody>
      <ModalFooter>
        <FormGroup style={spacerStyle}>
          &nbsp;
          <span>
            <Button color="primary" outline={true} onClick={props.handleCancelClick}>Cancel</Button>{' '}
            <Button color="primary" onClick={props.handleSaveClick}>Save</Button>
          </span>
        </FormGroup>
      </ModalFooter>


    </Modal>
  );
}

