import React from "react";
import { Title, Container, HorizontalContainer, AppContent, AppMain, AppEditor } from "./containers";
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Icon from '@mdi/react'
import { mdiPencilOutline } from '@mdi/js'
import update from 'immutability-helper';
import ReactJson from 'react-json-view'
import Sortly, { add, remove, findDescendants } from 'react-sortly';
import { addIds, stripIds, flattenConditions, buildTree, deleteCondition, staticData } from './utils';
import { DynamicEditor } from './DynamicEditor'
import axios from 'axios';

export class RuleEditor extends React.Component {



    constructor(props) {
        super(props);
        this.state = {
            ruleId: undefined,
            ontrue: [],
            onfalse: [],
            flatConditions: [],
            editorVisible: false
        };
        console.log(this.state.condition);
    }

    componentDidMount() {
        console.log(this.props.id);
        this.loadRuleFromServer(this.props.id);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.id !== this.props.id) {
            console.log("Loading from server: " + this.props.id);
            this.loadRuleFromServer(this.props.id);
        }
    }

    loadRuleFromServer(id) {
        axios.get('/api/rule/' + id)
            .then((response) => {
                console.log(response.data);
                this.setStateFromServerData(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    setStateFromServerData(data) {
        this.setState({
            source: JSON.parse(JSON.stringify(data)), // taking independant copy of the data
            ruleId: data.id,
            ontrue: data.ontrue ? addIds(data.ontrue) : [],
            onfalse: data.onfalse ? addIds(data.onfalse) : [],
            flatConditions: addIds(flattenConditions(data.condition)),
            editorVisible: false,
            editorItemIndex: -1,
            editorAlertVisible: false,
        });
    }





    handleEditableItemClick = (index, itemType, model) => {
        // set the marker without mutating the state
        let cloned = { ontrue: this.state.ontrue, onfalse: this.state.onfalse, flatConditions: this.state.flatConditions };
        for (let key of Object.keys(cloned)) {
            cloned[key] = cloned[key].map((item, i) => {
                return Object.assign({}, item, { isMarked: (key === itemType && i === index) });
            });
        }
        // set the state
        this.setState({
            editorVisible: true,
            editorData: this.state[itemType][index],
            editorModel: model,
            editorItemIndex: index,
            editorItemType: itemType,
            editorTitle: itemType,
            editorAlertVisible: false,
            ...cloned
        });
    }





    handleChange = (items) => {
        this.setState({ flatConditions: items });
        console.log(items);
    }

    handleMove = (items, index, newIndex) => {
        if (this.state.editorVisible) return false;
        const { path } = items[newIndex];
        const parent = items.find(item => item.id === path[path.length - 1]);
        // parent must be OR or AND or root (so "no parent")
        if (!parent || (parent.type === 'or' || parent.type === 'and')) {
            return true;
        } else {
            return false;
        }
    }


    renderItem = props => (
        <ItemRenderer
            {...props}
            onEditableItemClick={this.handleEditableItemClick}
        />
    )

    /* -------  Callback methods of ConditionEditor  ------- */

    addNewItem = (itemType, model) => {
        // set the state
        /*
        this.setState({
            editorVisible: true,
            editorData: this.state[itemType][0],
            editorModel: model,
            editorItemIndex: index,
            editorItemType: itemType,
            editorTitle: itemType,
            editorAlertVisible: false,
            ...cloned
        });*/
    }




    editorHandleCancelClick = () => {
        this.setState({ editorAlertVisible: false, editorVisible: false, editorItemIndex: -1 });
    }

    editorHandleDeleteClick = () => {
        let itemUpdate = undefined;
        if (this.state.editorItemType === 'flatConditions') {
            const children = findDescendants(this.state.flatConditions, this.state.editorItemIndex);
            if (children.length === 0 || (children.length > 0 && window.confirm('Delete this logic block together with its children?'))) {
                itemUpdate = { condition: buildTree(stripIds(remove(this.state.flatConditions, this.state.editorItemIndex))) };
            }
        } else {
            itemUpdate = {
                [this.state.editorItemType]: stripIds(
                    update(this.state[this.state.editorItemType], { $splice: [[this.state.editorItemIndex, 1]] })
                )
            };
        }

        if (itemUpdate) {
            axios.put('/api/rule/' + this.state.ruleId, itemUpdate)
                .then((response) => {
                    // update the state
                    if (response.data.success) {
                        this.setStateFromServerData(response.data.newrule);
                    } else {
                        this.setState({ editorAlertMessage: response.data.message, editorAlertVisible: true });
                        console.log(response.data);
                    }
                })
                .catch((error) => {
                    // TODO: alert user
                    console.log(error);
                });
        }
    }

    editorHandleSaveClick = (newData) => {
        // first let server validate
        axios.post('/api/validate/', { editorItemType: this.state.editorItemType, ...newData })
            .then((response) => {
                if (!response.data.success) {
                    this.setState({ editorAlertMessage: response.data.message, editorAlertVisible: true });
                    console.log(response.data);
                    return;
                } else {
                    this.pushUpdateToServer(newData)
                        .then((response) => {
                            // update the state
                            if (response.data.success) {
                                this.setStateFromServerData(response.data.newrule);
                            } else {
                                this.setState({ editorAlertMessage: response.data.message, editorAlertVisible: true });
                                console.log(response.data);
                            }
                        })
                        .catch((error) => {
                            // TODO: alert user
                            console.log(error);
                        });
                }
            })
            .catch((error) => {
                // TODO: alert user
                console.log(error);
            });
    }

    pushUpdateToServer = (newData) => {
        // create update of the relevant section of state without mutating state
        let itemUpdate = {};
        const cloned = update(this.state[this.state.editorItemType],
            { [this.state.editorItemIndex]: { $set: newData } }
        )
        if (this.state.editorItemType === 'flatConditions') {
            itemUpdate = { condition: buildTree(stripIds(cloned)) }
        }
        else
            itemUpdate = { [this.state.editorItemType]: stripIds(cloned) }
        // push item to the server
        return axios.put('/api/rule/' + this.state.ruleId, itemUpdate);
    }


    render() {
        const ontrueActions = this.state.ontrue.map((action, index) => (
            <li className="list-group-item"
                key={action._id} id={action._id}
                style={action.isMarked ? selectedStyle : {}}
                onClick={() => this.handleEditableItemClick(index, "ontrue", staticData.editor.action[action.type])}>
                {action.type}
            </li>
        ));

        const onfalseActions = this.state.onfalse.map((action, index) => (
            <li className="list-group-item" key={action._id} id={action._id} onClick={() => this.handleEditableItemClick(index, "onfalse", staticData.editor.action[action.type])}>
                {action.type}
            </li>
        ));

        return (
            <AppMain>

                <AppContent>
                    <Title>
                        {this.props.id ? this.props.id : 'Please select a rule from the list to edit or create a new rule.'}
                    </Title>
                    <HorizontalContainer>

                        <UncontrolledDropdown>
                            <DropdownToggle caret>
                                Add Condition
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem header>Logical</DropdownItem>
                                <DropdownItem onClick={() => {console.log("OR")}}>OR</DropdownItem>
                                <DropdownItem>AND</DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem header>Condition</DropdownItem>
                                <DropdownItem>MQTT</DropdownItem>
                                <DropdownItem>Cron</DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        {' '}
                        <UncontrolledDropdown>
                            <DropdownToggle caret>
                                Add Action
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem>MQTT</DropdownItem>
                                <DropdownItem>Script</DropdownItem>
                                <DropdownItem>Email</DropdownItem>
                                <DropdownItem>Pushover</DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>


                    </HorizontalContainer>


                    <Container>

                        <Sortly
                            items={this.state.flatConditions}
                            itemRenderer={this.renderItem}
                            onChange={this.handleChange}
                            onMove={this.handleMove}
                        />
                    </Container>
                    <Container>
                        <p><b>On True:</b></p>
                        <ul className="list-group">
                            {ontrueActions}
                        </ul>
                        <p><b>On False:</b></p>
                        <ul className="list-group">
                            {onfalseActions}
                        </ul>
                    </Container>

                    {false && <pre className='code'>{JSON.stringify(this.state, undefined, 4)}</pre>}


                </AppContent>
                <AppEditor>
                    <ReactJson src={this.state.source} displayDataTypes={false} enableClipboard={false} displayObjectSize={false} name={false} />
                </AppEditor>


                {this.state.editorVisible && <DynamicEditor
                    visible={this.state.editorVisible}
                    editorData={this.state.editorData}
                    title={this.state.editorTitle}
                    model={this.state.editorModel}
                    key={this.state.editorData._id}
                    alertVisible={this.state.editorAlertVisible}
                    alert={this.state.editorAlertMessage}
                    editorHandleSaveClick={this.editorHandleSaveClick}
                    editorHandleCancelClick={this.editorHandleCancelClick}
                    editorHandleDeleteClick={this.editorHandleDeleteClick} />
                }
            </AppMain>
        );
    }
}

/* --------------------------------------------------------------------------------------------------------------------
  Styles
-------------------------------------------------------------------------------------------------------------------- */


const itemStyle = {
    border: '1px solid #ccc',
    cursor: 'move',
    padding: 10,
    marginBottom: 4,
};

const muteStyle = {
    opacity: .3,
}

const selectedStyle = {
    background: '#e2edff',
    color: 'blue',
    fontWeight: 600,
}


const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};





class ItemRenderer extends React.Component {

    handleClick = () => {
        console.log(this.props.type);
        this.props.onEditableItemClick(this.props.index, "flatConditions", staticData.editor.condition[this.props.type]);
    }

    handleDeleteClick = (e) => {
        e.stopPropagation();
        // TODO: generic delete
        this.props.handleConditionDeleteClick(this.props.id);
    }

    render() {
        const {
            type, path, isMarked, connectDragSource, connectDropTarget,
            isDragging, isClosestDragging
        } = this.props;

        let label = "";
        switch (type) {
            case "and":
                label = "AND"
                break;
            case "or":
                label = "OR";
                break;
            default:
                label = staticData.conditions[type];
                break;
        }

        const style = {
            ...itemStyle,
            ...(isDragging || isClosestDragging ? muteStyle : null),
            ...(isMarked ? selectedStyle : null),
            marginLeft: path.length * 30,
        };

        const el = <div style={style}>
            {label}
            <span style={pushRightStyle}>
                <Icon path={mdiPencilOutline} size={1} color="grey" onClick={this.handleClick} />
            </span></div>;
        return connectDragSource(connectDropTarget(el));
    }

}




