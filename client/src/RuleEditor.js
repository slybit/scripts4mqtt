import React from "react";
import { Title, Container, AppContent, AppMain } from "./containers";
import { Button } from 'reactstrap';
import Sortly, { add } from 'react-sortly';
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
                this.setState({
                    ruleId: response.data.id,
                    ontrue: response.data.ontrue ? addIds(response.data.ontrue) : [],
                    onfalse: response.data.onfalse ? addIds(response.data.onfalse) : [],
                    flatConditions: addIds(flattenConditions(response.data.condition))
                });
            })
            .catch((error) => {
                console.log(error);
            });
    }

    /* 
      Pushes one or more fields of a rule to the server.
      Item should be an object with one or more of these fields:
      - name
      - condition
      - ontrue
      - onfalse
    */
    updateRuleToServer(id, item) {

    }





    handleEditableItemClick = (index, itemType, model) => {
        const cloned = {
            ontrue: Object.assign([], this.state.ontrue),
            onfalse: Object.assign([], this.state.onfalse),
            flatConditions: Object.assign([], this.state.flatConditions)
        }
        this.clearMarkers(cloned);
        cloned[itemType][index].isMarked = true;
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

    //TODO: move to utils
    clearMarkers(cloned) {
        for (let A of Object.values(cloned)) {
            for (let i of A) {
                i.isMarked = false;
            }
        }
    }



    //TODO: move to utils
    checkConditionOptions(options) {
        try {
            JSON.parse(options);
            return true;
        } catch (e) {
            return false;
        }
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
        if (!parent || (parent.type == 'or' || parent.type == 'and')) {
            return true;
        } else {
            return false;
        }
    }

    handleClickAddNewItem = () => {
        const items = this.state.flatConditions;
        const newItemData = { "id": 20, "type": "and", "path": [] };
        this.props.handleChange(add(items, newItemData));


        //this.setState({ items: add(this.state.items, newItemData) });
        //this.setState({ activeItemId: id });
        console.log(JSON.stringify(add(items, newItemData)));
    }

    renderItem = props => (
        <ItemRenderer
            {...props}
            onEditableItemClick={this.handleEditableItemClick}
        />
    )

    /* -------  Callback methods of ConditionEditor  ------- */

    // TODO: create validator for generic editor
    handleConditionSaveClick = () => {
        // check if all is ok
        let optionsValid = this.checkConditionOptions(this.state.condition.options);
        // update the UI so that the user can see that the input is invalid
        this.setState({ condition: { ...this.state.condition, optionsValid: optionsValid } });
        if (optionsValid) {
            // copy the flatConditions from state
            let cloned = Object.assign([], this.state.flatConditions);
            let c = cloned.find(condition => condition.id === this.state.condition.id);
            if (c !== undefined) {
                c.type = this.state.condition.type;
                c.options = JSON.parse(this.state.condition.options);
            }
            // put back in state        
            this.setState({ flatConditions: cloned });
            console.log(JSON.stringify(cloned, undefined, 4));
        }
    }

    // TODO: create generic editorItem delete
    handleConditionDeleteClick = () => {
        //if (window.confirm('Are you sure you want to save this thing into the database?')) {
        // Save it!
        //} else {
        // Do nothing!
        //}
        this.setState({ flatConditions: deleteCondition(this.state.flatConditions, this.state.condition.id), condition: { ...this.defaultCondition } });
    }

    editorHandleCancelClick = () => {
        this.setState({ editorAlertVisible: false, editorVisible: false });
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
                                let cloned = Object.assign([], this.state[this.state.editorItemType]);        
                                cloned[this.state.editorItemIndex] = newData;
                                this.setState({ [this.state.editorItemType]: cloned, editorAlertVisible: false, editorVisible: false });
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
        // copy the relevant array from state
        let cloned = Object.assign([], this.state[this.state.editorItemType]);
        // update the relevant item
        cloned[this.state.editorItemIndex] = newData;
        // because of the stripIds(), item will be a real deep copy        
        let item = {};
        if (this.state.editorItemType === 'flatConditions') {
            item = { condition: buildTree(stripIds(cloned)) }
        }
        else
            item = { [this.state.editorItemType]: stripIds(cloned) }
        return axios.put('/api/rule/' + this.state.ruleId, item);
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


                    <Container>
                        <Button onClick={this.handleClickAddNewItem}>Add New Item</Button>
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

                    {true && <pre className='code'>{JSON.stringify(this.state, undefined, 4)}</pre>}


                </AppContent>

                {this.state.editorVisible &&
                    <DynamicEditor
                        title={this.state.editorTitle}
                        editorData={this.state.editorData}
                        model={this.state.editorModel}
                        key={this.state.editorData._id}                        
                        alertVisible={this.state.editorAlertVisible}
                        alert={this.state.editorAlertMessage}
                        editorHandleSaveClick={this.editorHandleSaveClick}
                        editorHandleCancelClick={this.editorHandleCancelClick}
                    />
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




class ItemRenderer extends React.Component {

    constructor(props) {
        super(props);
    }

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

        const el = <div style={style} onClick={this.handleClick}>{label}</div>;
        return connectDragSource(connectDropTarget(el));
    }

}




