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
    this.data = {};                 // data as received by the server
    this.state = {
      newAliasModalVisible: false,
      topics: [],                   // list of topics related to the current alias
      aliasList: [],                // list of aliases
      selectedAlias: undefined,     // current alias
    };
  }

  componentDidMount() {
    this.loadAliasesFromServer();
  }

  loadAliasesFromServer() {
    axios.get('/api/aliases')
      .then((response) => {
        this.initState(response.data);
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });
  }

  initState(data) {
    // the selected alias name is either indiciated by the server or the first in the sorted list
    let name = data.name ? data.name : (Object.keys(data.aliases).length > 0 ? Object.keys(data.aliases).sort()[0] : undefined);
    this.data = data;
    this.setState({
      newAliasModalVisible: false,
      aliasList: Object.keys(data.aliases).sort(),
      topics: data.aliases[name],
      selectedAlias: name
    });
  }


  setCurrentAlias(name) {
    this.setState({
      newAliasModalVisible: false,
      topics: this.data.aliases[name],
      selectedAlias: name,
    });
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



  


  onAliasNameChange = (e) => {
    this.setState({ newAliasName: e.target.value });
  }

  aliasNameEditorHandleCancelClick = () => {
    this.setState({
      newAliasModalVisible: false
    });
  }

  aliasNameEditorHandleSaveClick = () => {
    let newAlias = {};
    newAlias[this.state.newAliasName] = [];
    this.pushAliasUpdateToServer(newAlias);
  }

  handleDeleteAliasClick = (aliasId) => {
    axios.delete('/api/alias/' + aliasId)
      .then((response) => {
        if (response.data.success) {
          this.initState(response.data);
        } else {
          showError("Alias deletion not accepted by script4mqtt service.", response.data.error);
          console.log(response.data);
        }
      })
      .catch((error) => {
        showError("Cannot access the script4mqtt service.", error);
      });

  }

  
  deleteTopic = (index) => {
    let updatedAlias = {};
    updatedAlias[this.state.selectedAlias] = update(this.state.topics,  { $splice: [[index, 1]] } );
    this.pushAliasUpdateToServer(updatedAlias);
  }

  addTopic = (topic) => {
    let updatedAlias = {};
    updatedAlias[this.state.selectedAlias] = update(this.state.topics,  { $push: [topic] } );
    this.pushAliasUpdateToServer(updatedAlias);
  }

  pushAliasUpdateToServer = (updatedAlias) => {
    axios.post('/api/aliases', updatedAlias)
      .then((response) => {
        if (response.data.success) {
          this.initState(response.data);
        } else {
          showError("Alias update not accepted by script4mqtt service.", response.data.error);
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
            data={this.state.aliasList}
            selectedAlias={this.state.selectedAlias}
            onClick={this.setCurrentAlias.bind(this)}
            onDeleteClick={this.handleDeleteAliasClick}
          />
        </AppNav>
        {this.state.selectedAlias && 
          <AliasEditor
            topics={this.state.topics}
            selectedAlias={this.state.selectedAlias}
            deleteTopic={this.deleteTopic}
            addTopic={this.addTopic}
          />
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

