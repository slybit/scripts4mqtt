import React from "react";
import Icon from '@mdi/react'
import { mdiProgressClock, mdiOwl, mdiDelete, mdiUnfoldMoreVertical } from '@mdi/js'
import { Title, Container, AppEditor, AppContent, AppMain } from "./containers";
import { Button } from 'reactstrap';
import Sortly, { convert, add, insert, remove } from 'react-sortly';
import { flattenConditions, deleteCondition, staticData } from './utils';
import { ConditionEditor } from './ConditionEditor'
import axios from 'axios';

export class RuleEditor extends React.Component {

    defaultCondition = {
        disabled: true,
        optionsValid: true,
        id: undefined,
        options: '',
        type: undefined
    }

    constructor(props) {
        super(props);
        this.state = {
            ruleId: undefined,
            onTrue: [],
            onFalse:  [],
            flatConditions: [],
            condition: { ...this.defaultCondition }            
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

    loadRuleFromServer(key) {
        axios.get('/api/rule/' + key)
            .then((response) => {
                console.log(response.data);
                this.setState({ 
                    ruleId: response.data.id,
                    onTrue: response.data.ontrue ? response.data.ontrue : [],
                    onFalse:  response.data.onfalse ? response.data.onfalse : [],
                    flatConditions: flattenConditions(response.data.condition),
                    condition: { ...this.defaultCondition }
                });                
            })
            .catch((error) => {
                console.log(error);
            });
    }

    handleConditionClick = (id) => {
        console.log(id);
        this.selectCondition(id);
    }

    


    selectCondition = (id) => {
        let condition = {};
        let cloned = Object.assign([], this.state.flatConditions);
        for (let c of cloned) {
            if (c.id == id) {
                c.isMarked = true;                
                condition = {
                    id: id,
                    type: c.type,
                    options: JSON.stringify(c.options, undefined, 4),
                    optionsValid: true,
                    disabled: false
                };
            } else {
                c.isMarked = false;
            }
        }
        this.setState({ flatConditions: cloned, condition: condition });
    }

    

    checkConditionOptions(options) {
        try {
            JSON.parse(options);
            return true;
        } catch (e) {
            return false;
        }
    }



    handleChange = (items) => {
        // copy rule from state
        //let cloned = Object.assign({}, this.state.flatConditions);
        // adapt and put back in state
        //cloned.flatConditions = items;
        this.setState({ flatConditions: items });
        console.log(items);
    }

    handleMove = (items, index, newIndex) => {
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
            handleConditionClick={this.handleConditionClick}
        />
    )    

    /* -------  Callback methods of ConditionEditor  ------- */

    handleConditionTypeDropdownChange = (event) => {
        this.setState({ condition: { ...this.state.condition, type: event.target.value } });
    }

    handleConditionOptionsChange = (event) => {
        this.setState({ condition: { ...this.state.condition, options: event.target.value } });
    }

    handleConditionSaveClick = () => {
        // check if all is ok
        let optionsValid = this.checkConditionOptions(this.state.condition.options);
        // update the UI so that the user can see that the input is invalid
        this.setState({ condition: { ...this.state.condition, optionsValid: optionsValid } });
        if (optionsValid) {
            // copy rule from state
            let cloned = Object.assign([], this.state.flatConditions);
            for (let c of cloned) {
                if (c.id == this.state.condition.id) {
                    c.type = this.state.condition.type;
                    c.options = JSON.parse(this.state.condition.options);
                    break;
                }
            }
            // put back in state        
            this.setState({ flatConditions: cloned });
            console.log(JSON.stringify(cloned, undefined, 4));
        }
    }

    handleConditionDeleteClick = () => {
        //if (window.confirm('Are you sure you want to save this thing into the database?')) {
        // Save it!
        //} else {
        // Do nothing!
        //}
        this.setState({ flatConditions: deleteCondition(this.state.flatConditions, this.state.condition.id), condition: { ...this.defaultCondition } });
    }




    render() {
        const onTrueActions = this.state.onTrue.map((action, index) => (
            <li className="list-group-item" key={index} id={index}> 
                {action.type}             
            </li>
        ));
        
        const onFalseActions = this.state.onFalse.map((action, index) => (
            <li className="list-group-item" key={index} id={index}> 
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
                            {onTrueActions}                
                        </ul>
                        <p><b>On False:</b></p>
                        <ul className="list-group">
                            {onFalseActions}                
                        </ul>
                    </Container>
                    
                    {false && <pre className='code'>{JSON.stringify(this.state.flatConditions, undefined, 4)}</pre>}


                </AppContent>
                { !this.state.condition.disabled &&
                    <ConditionEditor 
                        condition={this.state.condition}
                        handleConditionTypeDropdownChange={this.handleConditionTypeDropdownChange}
                        handleConditionOptionsChange={this.handleConditionOptionsChange}
                        handleConditionSaveClick={this.handleConditionSaveClick}
                        handleConditionDeleteClick={this.handleConditionDeleteClick}
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
    border: '1px solid black',
    background: 'orange'
}




class ItemRenderer extends React.Component {

    constructor(props) {
        super(props);
    }

    handleClick = () => {
        this.props.handleConditionClick(this.props.id);
    }

    handleDeleteClick = (e) => {
        e.stopPropagation();
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




class _Condition extends React.Component {

    renderUI() {
        if (!this.props.data) {
            return (<div>No condition</div>);
        }
        if (this.props.data.type === 'or' || this.props.data.type === 'and') {
            let ui = [];
            for (let i in this.props.data.condition) {
                ui.push(<_Condition key={i} data={this.props.data.condition[i]} />);
            }
            return ui;
        }
    }

    render() {
        return (
            <Container>
                {this.props.data.type}
                {this.renderUI()}
            </Container>
        );
    }
}
