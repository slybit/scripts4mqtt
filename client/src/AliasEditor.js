import React from "react";
import { Title, Container, HorizontalContainer, AppContent, AppMain, AppEditor, Header } from "./containers";
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, InputGroupAddon, Input } from 'reactstrap';
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
            aliasName: this.props.selectedAlias,
            aliasPrevName: this.props.selectedAlias,
            stateNameHasChanged: false
        };

    }

    componentDidUpdate(prevProps) {
        if (prevProps.selectedAlias !== this.props.selectedAlias) {
            this.setState({
                aliasName: this.props.selectedAlias,
                aliasPrevName: this.props.selectedAlias,
                aliasNameHasChanged: false
            });
        }
    }

    handleAliasNameCancelClick = () => {
        this.setState({ aliasName: this.state.aliasPrevName, aliasNameHasChanged: false });
    }

    handleAliasNameSaveClick = () => {
        axios.put('/api/rule/' + this.state.ruleId, { name: this.state.ruleName })
            .then((response) => {
                // update the state
                if (response.data.success) {
                    this.setStateFromServerData(response.data.newrule);
                    this.props.refreshNames();
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

    onAliasNameChange = (e) => {
        this.setState({ aliasName: e.target.value, aliasNameHasChanged: true });
    }




    render() {

        let items = this.props.aliases[this.props.selectedAlias].map((item, index) => {
            return (
                <Button key={item} color="dark" outline className="aliasButton">{item}<Icon path={mdiClose} size={1} color="gray" /></Button>
            )
        });

        return (
            <AppMain>
                <AppContent>
                    <Container>
                        Name:
                        <InputGroup>
                            <Input value={this.state.aliasName} onChange={this.onAliasNameChange} />
                            {this.state.aliasNameHasChanged && <InputGroupAddon addonType="append">
                                <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={this.handleAliasNameSaveClick} /></Button>
                                <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={this.handleAliasNameCancelClick} /></Button>
                            </InputGroupAddon>}
                        </InputGroup>
                    </Container>
                    {items}
                </AppContent>
            </AppMain>


        );
    }
}










