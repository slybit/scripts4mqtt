import React from "react";
import { Title, Container, AppEditor, AppContent, AppMain } from "./containers";
import { Button, Form, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import Sortly, { convert, add, insert, remove } from 'react-sortly';
import { flattenConditions } from './utils';
import axios from 'axios';

export class EditRule extends React.Component {

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
                    onTrue: response.data.ontrue,
                    onFalse:  response.data.onfalse,
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
        //if (window.confirm('Are you sure you want to save this thing into the database?')) {
        // Save it!
        //} else {
        // Do nothing!
        //}
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

    handleTypeDropdownChange = (event) => {
        this.setState({ condition: { ...this.state.condition, type: event.target.value } });
    }

    handleConditionOptionsChange = (event) => {
        this.setState({ condition: { ...this.state.condition, options: event.target.value } });
    }

    handleConditionSaveClick = () => {
        // check if all is ok
        let optionsValid = this.checkConditionOptions(this.state.condition.options);
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

        // parent must be OR or AND and not the root (so "no parent" is not allowed)
        if (!parent || (parent.type !== 'or' && parent.type !== 'and')) {
            return false;
        } else {
            return true;
        }
    }

    handleClickAddNewItem = () => {
        const items = this.props.data;
        const newItemData = { "id": 20, "type": "and", "path": [] };
        this.props.handleChange(add(items, newItemData));


        //this.setState({ items: add(this.state.items, newItemData) });
        //this.setState({ activeItemId: id });
        console.log(JSON.stringify(add(items, newItemData)));
    }

    renderItem = stuff => (
        <ItemRenderer
            {...stuff}
            handleConditionClick={this.handleConditionClick}
        />
    )


    render() {
        return (
            <AppMain>
                <AppContent>
                    <Title>
                        <Button>Delete Rule</Button>
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
                    
                    <pre className='code'>
                        {JSON.stringify(this.state.flatConditions, undefined, 4)}
                    </pre>


                </AppContent>
                <AppEditor>
                    <Form className="form">
                        <FormGroup >
                            <Label for="typeDropdown">Condition Type:</Label>
                            <select disabled={this.state.condition.disabled} id="typeDropdown" className="form-control col-sm-4" onChange={this.handleTypeDropdownChange} value={this.state.condition.type}>
                                {this.props.static.conditions.map(item => (
                                    <option key={item.value} value={item.value}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup>
                            <Label for="exampleFormControlTextarea1">Condition Options</Label>
                            <Input disabled={this.state.condition.disabled} invalid={!this.state.condition.optionsValid} style={textInputStyle} type="textarea" id="exampleFormControlTextarea1" rows="10" value={this.state.condition.options} onChange={this.handleConditionOptionsChange}></Input>
                            <FormFeedback>Oh noes! that name is already taken</FormFeedback>
                        </FormGroup>
                        <Button disabled={this.state.condition.disabled} color="primary" onClick={this.handleConditionSaveClick}>Save</Button>{' '}
                        <Button disabled={this.state.condition.disabled} color="danger">Cancel</Button>
                    </Form>
                </AppEditor>
            </AppMain>
        );
    }
}

/* --------------------------------------------------------------------------------------------------------------------
  Styles
-------------------------------------------------------------------------------------------------------------------- */


const textInputStyle = {
    fontFamily: 'monospace',
    fontSize: '1.1rem'
}

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
    border: '3px solid green',
}







class ItemRenderer extends React.Component {

    constructor(props) {
        super(props);
    }

    handleClick = () => {
        this.props.handleConditionClick(this.props.id);
    }

    render() {
        const {
            type, path, isMarked, connectDragSource, connectDropTarget,
            isDragging, isClosestDragging
        } = this.props;

        const style = {
            ...itemStyle,
            ...(isDragging || isClosestDragging ? muteStyle : null),
            ...(isMarked ? selectedStyle : null),
            marginLeft: path.length * 30,
        };

        const el = <div style={style} onClick={this.handleClick}>{type} {isMarked ? "Y" : "N"}</div>;
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
