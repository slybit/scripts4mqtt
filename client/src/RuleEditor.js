import React from "react";
import { Title, Container, HorizontalContainer, AppContent, AppMain, AppEditor, Header } from "./containers";
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Icon from '@mdi/react'
import { mdiPencilOutline } from '@mdi/js'
import update from 'immutability-helper';
import ReactJson from 'react-json-view';
import format from 'string-format';
import Sortly, { add, remove, findDescendants } from 'react-sortly';
import { addIds, stripIds, flattenConditions, buildTree, deleteCondition, staticData, isNewItem } from './utils';
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




    /* -------  Callback methods of ConditionEditor  ------- */

    /*
    itemType: ontrue, onfalse, flatConditions
    subType: either one of the action types or condition types
    */
    addNewItem = (itemType, subType) => {
        let itemUpdate = undefined;
        if (itemType === 'flatConditions') {
            let newItem = staticData.newItems.condition[subType];
            if (subType === "or")
                newItem = { type: "or", condition: [] };
            else if (subType === "and")
                newItem = { type: "and", condition: [] };
            itemUpdate = { condition: buildTree(stripIds(this.state.flatConditions)).concat(newItem) };
        } else {
            const newItem = staticData.newItems.action[subType];
            itemUpdate = { [itemType]: stripIds(this.state[itemType]).concat(newItem) };
        }

        if (itemUpdate) {
            axios.put('/api/rule/' + this.state.ruleId, itemUpdate)
                .then((response) => {
                    // update the state
                    if (response.data.success) {
                        this.setStateFromServerData(response.data.newrule);
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
            // TODO: can be simplified by first applying stripIds (as this creates a hard copy)
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



    ConditionItemRenderer = props => (
        <ConditionItemRendererClass
            {...props}
            onEditableItemClick={this.handleEditableItemClick}
        />
    )

    render() {
        const newConditions = Object.keys(staticData.newItems.condition).map((condition) => (
            <DropdownItem key={condition} onClick={() => { this.addNewItem("flatConditions", condition) }}>{staticData.conditions[condition]}</DropdownItem>
        ));

        const newOntrueActions = Object.keys(staticData.newItems.action).map((action) => (
            <DropdownItem key={action} onClick={() => { this.addNewItem("ontrue", action) }}>{staticData.actions[action]}</DropdownItem>
        ));

        const newOnfalseActions = Object.keys(staticData.newItems.action).map((action) => (
            <DropdownItem key={action} onClick={() => { this.addNewItem("onfalse", action) }}>{staticData.actions[action]}</DropdownItem>
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
                                <DropdownItem onClick={() => { this.addNewItem("flatConditions", "or") }}>OR</DropdownItem>
                                <DropdownItem onClick={() => { this.addNewItem("flatConditions", "and") }}>AND</DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem header>Condition</DropdownItem>
                                {newConditions}
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        {' '}
                        <UncontrolledDropdown>
                            <DropdownToggle caret>
                                Add OnTrue Action
                            </DropdownToggle>
                            <DropdownMenu>
                                {newOntrueActions}
                            </DropdownMenu>
                        </UncontrolledDropdown>


                    </HorizontalContainer>


                    <Container>

                        <Sortly
                            items={this.state.flatConditions}
                            itemRenderer={this.ConditionItemRenderer}
                            onChange={this.handleChange}
                            onMove={this.handleMove}
                        />
                    </Container>
                    <Container>
                        <HorizontalContainer>
                            <Header>On True:</Header>
                            <UncontrolledDropdown>
                                <DropdownToggle caret>
                                    Add OnTrue Action
                                </DropdownToggle>
                                <DropdownMenu>
                                    {newOntrueActions}
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </HorizontalContainer>
                        <ul className="list-group">
                            <ActionItemRendererClass
                                actions={this.state.ontrue}
                                type="ontrue"
                                handleEditableItemClick={this.handleEditableItemClick}
                            />
                        </ul>

                        <HorizontalContainer>
                            <Header>On False:</Header>
                            <UncontrolledDropdown>
                                <DropdownToggle caret>
                                    Add OnFalse Action
                                </DropdownToggle>
                                <DropdownMenu>
                                    {newOnfalseActions}
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </HorizontalContainer>
                        <ul className="list-group">
                            <ActionItemRendererClass
                                actions={this.state.onfalse}
                                type="onfalse"
                                handleEditableItemClick={this.handleEditableItemClick}
                            />
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

const newStyle = {
    background: '#e8ffbc',
    color: 'green',
    fontWeight: 600,
}

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};



/* --------------------------------------------------------------------------------------------------------------------
  Condition and Action item renderers
-------------------------------------------------------------------------------------------------------------------- */

class ActionItemRendererClass extends React.Component {
    render() {

       

        const ontrueActions = this.props.actions.map((action, index) => {
            const isNew = isNewItem(action, "action", action.type);  
            const style = {                
                ...(isNew ? newStyle : null)                
            };          
            return (
                <li className="list-group-item"
                    key={action._id} id={action._id}
                    style={style}
                    onClick={() => this.props.handleEditableItemClick(index, this.props.type, staticData.editor.action[action.type])}>
                    {isNew ? "* " : ""} {action.type}
                </li>
            )
        }
        );
        return ontrueActions;
    }
}

class ConditionItemRendererClass extends React.Component {

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
        let isNew = false;
        switch (type) {
            case "and":
                label = "AND"
                break;
            case "or":
                label = "OR";
                break;
            case "mqtt":
                isNew = isNewItem(this.props, "condition", type);
                const { topic } = this.props;
                label = format("MQTT [{}]", topic);
                break;
            case "cron":
                isNew = isNewItem(this.props, "condition", type);
            //const { on, off } = this.props;
            //isNew = (on === staticData.newItems.condition.cron.on) && (off === undefined);
            default:
                label = staticData.conditions[type];
                break;
        }
        if (isNew) {
            label = "* " + label;
        }

        const style = {
            ...itemStyle,
            ...(isDragging || isClosestDragging ? muteStyle : null),
            ...(isMarked ? selectedStyle : null),
            ...(isNew ? newStyle : null),
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




