import React, { Component, useState, useEffect } from "react";
import { Button, Form, FormGroup, Label, Input, Alert, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { AppBody, Title, HorizontalContainer, AppContent, AppMain } from "./containers";
import { LeftColumn, RightColumn, Header, AppColumn10, Column, TopRow, BottomRow } from "./containers";
import { AliasList } from './AliasList';
import { staticData, showError, showNotification } from './utils';
import axios from 'axios';
import update from 'immutability-helper';



export class Aliases extends Component {

    constructor() {
        super();
        this.data = {};                 // data as received by the server
        this.state = {
            newAliasModalVisible: false,
            newAliasNameAlert: false,
            topics: [],                   // list of topics related to the current alias
            topicsAsText: "",
            aliasList: [],                // list of aliases
            selectedAlias: undefined,     // current alias
        };
    }

    componentDidMount() {
        this.loadAliasesFromServer();
    }


    /* -----------------------------------------------------------------------------------------------------------------------
    API interactions
    ----------------------------------------------------------------------------------------------------------------------- */

    loadAliasesFromServer() {
        axios.get('/api/aliases')
            .then((response) => {
                this.initState(response.data);
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
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


    initState(data) {
        // the selected alias name is either indiciated by the server or the first in the sorted list
        let name = data.name ? data.name : (Object.keys(data.aliases).length > 0 ? Object.keys(data.aliases).sort()[0] : undefined);
        this.data = data;
        this.setState({
            newAliasModalVisible: false,
            newAliasNameAlert: false,
            aliasList: Object.keys(data.aliases).sort(),
            topics: data.aliases[name],
            topicsAsText: this.topics2String(data.aliases[name]),
            selectedAlias: name
        });
    }

    topics2String(topics) {
        let text = "";
        for (let t of topics.sort()) text = text + "\n" + t;
        return text.trim();
    }

    string2topics(text) {
        let topics = [];
        var parts = text.split('\n');
        for (let t of parts) {
            if (!this.validateTopic(t)) throw new Error('Invalid topic: ' + t);
            topics.push(t.trim());
        }
        return topics;
    }


    // Validate a topic to see if it's valid or not.

    validateTopic(topic) {
        var parts = topic.split('/')
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === '+') {
                continue
            }
            if (parts[i] === '#') {
                // for Rule #2
                return i === parts.length - 1
            }
            if (parts[i].indexOf('+') !== -1 || parts[i].indexOf('#') !== -1) {
                return false
            }
        }
        return true
    }






    /* -----------------------------------------------------------------------------------------------------------------------
    New alias editor callbacks
    ----------------------------------------------------------------------------------------------------------------------- */

    aliasNameEditorHandleAliasNameChange = (e) => {
        this.setState({
            newAliasName: e.target.value,
            newAliasNameAlertVisible: this.state.aliasList.includes(e.target.value),
            newAliasNameAlert: "Alias name already in use. It will be overwritten!"
        });
    }

    aliasNameEditorHandleCancelClick = () => {
        this.setState({
            newAliasModalVisible: false
        });
    }

    aliasNameEditorHandleSaveClick = () => {
        let newAlias = {};
        newAlias[this.state.newAliasName] = ["REPLACE/ME"];
        this.pushAliasUpdateToServer(newAlias);
    }

    /* -----------------------------------------------------------------------------------------------------------------------
    Topic editor callbacks
    ----------------------------------------------------------------------------------------------------------------------- */

    topicsEditorHandleSaveClick = () => {
        try {
            let topics = this.string2topics(this.state.topicsAsText);
            let updatedAlias = {};
            updatedAlias[this.state.selectedAlias] = update(this.state.topics,  { $set: topics } );
            this.pushAliasUpdateToServer(updatedAlias);
            showNotification("Success", "Topic list updated", 'success');
        } catch (err) {
            //window.alert(err);
            showNotification("Topic list not saved", err.message, 'warning');
        }

    };

    topicsEditorHandleTopicAsTexChange = (e) => {
        this.setState({ topicsAsText: e.target.value });
    }



    /* -----------------------------------------------------------------------------------------------------------------------
    Aliast list callbacks
    ----------------------------------------------------------------------------------------------------------------------- */

    setCurrentAlias(name) {
        this.setState({
            newAliasModalVisible: false,
            topics: this.data.aliases[name],
            topicsAsText: this.topics2String(this.data.aliases[name]),
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

    handleDeleteAliasClick = (aliasId) => {
        axios.delete('/api/alias/' + aliasId)
            .then((response) => {
                if (response.data.success) {
                    this.initState(response.data);
                } else {
                    showNotification("Alias deletion not accepted by the server", response.data.error, 'warning');
                }
            })
            .catch((error) => {
                showNotification("Cannot access the server", error.message, 'danger');
            });
    }



    /* -----------------------------------------------------------------------------------------------------------------------
    Main UI Render
    ----------------------------------------------------------------------------------------------------------------------- */

    render() {
        return (
            <AppBody>
                {this.state.newAliasModalVisible && <AliasNameInput
                    aliasName={this.state.newAliasName}
                    handleCancelClick={this.aliasNameEditorHandleCancelClick}
                    handleSaveClick={this.aliasNameEditorHandleSaveClick}
                    onAliasNameChange={this.aliasNameEditorHandleAliasNameChange}
                    alertVisible={this.state.newAliasNameAlertVisible}
                    alert={this.state.newAliasNameAlert}
                />}

                <LeftColumn>
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
                </LeftColumn>
                {this.state.selectedAlias &&
                    <TopicsEditor
                        topicsAsText={this.state.topicsAsText}
                        selectedAlias={this.state.selectedAlias}
                        handleSaveClick={this.topicsEditorHandleSaveClick}
                        onTopicsAsTextChange={this.topicsEditorHandleTopicAsTexChange}
                    />
                }


            </AppBody>
        );
    }

}


/* -----------------------------------------------------------------------------------------------------------------------
  New Alias Name Input Render
----------------------------------------------------------------------------------------------------------------------- */

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
                <Alert color="danger" isOpen={props.alertVisible}>
                    {props.alert}
                </Alert>
            </ModalBody>
            <ModalFooter>
                <FormGroup style={spacerStyle}>
                    &nbsp;
                    <span>
                        <Button color="primary" outline={true} onClick={props.handleCancelClick}>Cancel</Button>{' '}
                        <Button color="primary" onClick={props.handleSaveClick}>&nbsp;&nbsp;Save&nbsp;&nbsp;</Button>
                    </span>
                </FormGroup>
            </ModalFooter>


        </Modal>
    );

}

/* -----------------------------------------------------------------------------------------------------------------------
  Topics Input Render
----------------------------------------------------------------------------------------------------------------------- */


function TopicsEditor(props) {

    return (

        <RightColumn>

            <Column>
                <TopRow>
                    <Title>{props.selectedAlias}</Title>
                    <FormGroup style={{ margin: "0 15px" }}>
                        <span>
                            <Button color="primary" onClick={props.handleSaveClick}>&nbsp;&nbsp;Save&nbsp;&nbsp;</Button>
                        </span>
                    </FormGroup>

                </TopRow>
                <BottomRow>
                    <Form style={{ height: '100%', padding: '15px' }}>
                        <FormGroup style={{ height: '100%' }}>
                            <Input style={{ height: '100%', resize: 'none', 'font-family': 'monospace' }} type="textarea" name="topicsAsText" id="topicsAsText" value={props.topicsAsText} onChange={props.onTopicsAsTextChange} />
                        </FormGroup>
                    </Form>
                </BottomRow>
            </Column>

        </RightColumn>


    );
}



