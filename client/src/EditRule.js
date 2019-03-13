import React from "react";
import { Title, Container, AppEditor, AppContent, AppMain } from "./containers";
import { Button, Form, FormGroup, Label, Input,  FormFeedback } from 'reactstrap';
import Sortly, { convert, add, insert, remove } from 'react-sortly';
import axios from 'axios';

export class EditRule extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            condition: {         },
            rule: {},
        };
    }

    componentDidMount() {
        console.log(this.props.id);
        this.loadRuleFromServer(this.props.id);
    }

    componentDidUpdate(prevProps) {
        console.log(this.props.id);
        if (prevProps.id !== this.props.id) {
            this.loadRuleFromServer(this.props.id);
        }
    }

    loadRuleFromServer(key) {
        axios.get('/api/rule/' + key)
            .then((response) => {
                this.setState({ rule: response.data });
                this.setState({ condition: {optionsValid: true} });

            })
            .catch((error) => {
                console.log(error);
            });
    }

    handleConditionClick(id) {
        console.log(id);
        this.findCondition(id);
        //if (window.confirm('Are you sure you want to save this thing into the database?')) {
            // Save it!
        //} else {
            // Do nothing!
        //}
    }

     

    findCondition(id) {
        for (let c of this.state.rule.flatConditions) {
            if (c.id == id) {                
                this.setState({
                    condition: {
                        id: id,
                        type: c.type,
                        options: JSON.stringify(c.options, undefined, 4),
                        optionsValid: true                        
                    }
                });
                break;
            }
        }
    }

    handleTypeDropdownChange = (event) => {
        this.setState({ condition: { ...this.state.condition, type: event.target.value} });        
    }

    handleConditionOptionsChange = (event) => {
        this.setState({ condition: { ...this.state.condition, options: event.target.value} });
    }

    handleConditionSaveClick = () => {
        // check if all is ok
        let optionsValid = this.checkConditionOptions(this.state.condition.options);        
        this.setState({ condition: { ...this.state.condition, optionsValid: optionsValid} });
        if (optionsValid) {
            // copy rule from state
            let cloned = Object.assign({}, this.state.rule);
            for (let c of cloned.flatConditions) {
                if (c.id == this.state.condition.id) {
                    c.type = this.state.condition.type;
                    c.options = JSON.parse(this.state.condition.options);
                    break;
                }
            }
            // put back in state        
            this.setState({ rule: cloned});
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


    render() {
        console.log(this.props);
        return (
            <AppMain>
                <AppContent>
                    <Title>
                        <Button>Delete Rule</Button>
                        {this.props.id ? this.props.id : 'Please select a rule from the list to edit or create a new rule.'}
                    </Title>
                    <pre className='code'>
                        {JSON.stringify(this.state.rule.flatConditions, undefined, 4)}
                    </pre>

                    {false && this.state.rule &&
                        <_Condition data={this.state.rule.condition} />
                    }


                    {this.state.rule.name &&
                        <ConditionTree selectedId={this.state.condition.id} data={this.state.rule.flatConditions} handleChange={this.props.handleChange} handleConditionClick={this.handleConditionClick.bind(this)} />
                    }


                </AppContent>
                <AppEditor>
                    <Form className="form">
                        <FormGroup >
                            <Label for="typeDropdown">Condition Type:</Label>
                            <select id="typeDropdown" className="form-control col-sm-4" onChange={this.handleTypeDropdownChange} value={this.state.condition.type}>
                                {this.props.static.conditions.map(item => (
                                    <option key={item.value} value={item.value}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup>
                            <Label for="exampleFormControlTextarea1">Condition Options</Label>
                            <Input invalid={!this.state.condition.optionsValid} style={textInputStyle} type="textarea" id="exampleFormControlTextarea1" rows="10" value={this.state.condition.options} onChange={this.handleConditionOptionsChange}></Input>
                            <FormFeedback>Oh noes! that name is already taken</FormFeedback>
                        </FormGroup>
                        <Button color="primary" onClick={this.handleConditionSaveClick}>Save</Button>{' '}<Button color="danger">Cancel</Button>
                    </Form>
                </AppEditor>
            </AppMain>
        );
    }
}

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




class ConditionTree extends React.Component {

    constructor(props) {
        super(props);
    }


    handleChange = (items) => {
        this.props.handleChange(items);
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

    renderItem = props => (
        <ItemRenderer
          {...props}
          isMarked={props.id === this.props.selectedId}
          handleConditionClick={this.props.handleConditionClick}      
        />
      )



    render() {
        console.log("Render called");
        const items = this.props.data;
        return (

            <Container>
                <Button onClick={this.handleClickAddNewItem}>Add New Item</Button>
                <Sortly
                    items={items}
                    itemRenderer={this.renderItem}
                    onChange={this.handleChange}
                    onMove={this.handleMove}
                />
            </Container>

        );
    }
}



class ItemRenderer extends React.Component {

    handleClick = () => {        
        console.log("is marked:" + this.props.isMarked);
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

        const el = <div style={style} onClick={this.handleClick}>{type} {isMarked}</div>;
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
