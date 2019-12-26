import React from "react";
import { Title, Container, HorizontalContainer, AppContent, AppMain, AppEditor, Header } from "./containers";
import { Button, FormGroup, Label, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, InputGroupAddon, Input } from 'reactstrap';
import Icon from '@mdi/react'
import { mdiPencilOutline, mdiCancel, mdiCheck, mdiClose } from '@mdi/js'
import update from 'immutability-helper';
import ReactJson from 'react-json-view';
import format from 'string-format';
import Sortly, { remove, findDescendants } from 'react-sortly';
import { addIds, stripIds, flattenConditions, buildTree, staticData, isNewItem } from './utils';
import { DynamicEditor } from './DynamicEditor'
import axios from 'axios';


export class AliasEditor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            topic: ""
        };

    }


    handleTopicCancelClick = () => {
        this.setState({ topic: "" });
    }

    handleTopicSaveClick = () => {
        this.props.addTopic(this.state.topic);
        this.setState({ topic: "" });
    }

    onTopicChange = (e) => {
        this.setState({ topic: e.target.value });
    }




    render() {

        let items = this.props.topics.map((item, index) => {
            return (
                <Button key={item} color="dark" outline className="aliasButton">{item}<Icon path={mdiClose} size={1} color="gray" onClick={() => { this.props.deleteTopic(index); }} /></Button>
            )
        });


        return (
            <AppMain>
                <AppContent>
                    <Container>
                        <Title>{this.props.selectedAlias}</Title>
                    </Container>

                    <FormGroup>
                        <Label for="topic">New topic:</Label>
                        <InputGroup>
                            <Input id="topic" key="topic"
                                value={this.state.topic}
                                onChange={this.onTopicChange}
                                onKeyPress={event => {
                                    if (event.key === "Enter") {
                                        this.handleTopicSaveClick();
                                    }
                                }}>
                            </Input>
                            {this.state.topic !== "" && <InputGroupAddon addonType="append">
                                <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={this.handleTopicSaveClick} /></Button>
                                <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={this.handleTopicCancelClick} /></Button>
                            </InputGroupAddon>}
                        </InputGroup>
                    </FormGroup>


                   

                </AppContent>
                <AppEditor>
                {items}
                </AppEditor>
            </AppMain>


        );
    }
}










