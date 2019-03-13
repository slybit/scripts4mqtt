import React from "react";
import { Title, Container, AppEditor, AppContent, AppMain } from "./containers";
import { Button, Form, FormGroup, Label, Input, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Sortly, { convert, add, insert, remove } from 'react-sortly';
import axios from 'axios';

export class EditRule extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedConditionOptions: {},
            selectedConditionId: undefined,
            rule: {},
            typeDropdownValue: '?',
            typeDropdownOptions: [
                {
                    name: 'Select…',
                    value: null,
                },
                {
                    name: 'A',
                    value: 'a',
                },
                {
                    name: 'B',
                    value: 'b',
                },
                {
                    name: 'C',
                    value: 'c',
                },
            ],
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
                this.setState({ selectedConditionOptions: {}, selectedConditionId: undefined });
            })
            .catch((error) => {
                console.log(error);
            });
    }

    handleConditionClick(id) {
        console.log(id);
        this.findCondition(id);
        if (window.confirm('Are you sure you want to save this thing into the database?')) {
            // Save it!
        } else {
            // Do nothing!
        }
    }

    findCondition(id) {
        for (let c of this.state.rule.flatConditions) {
            if (c.id == id) {
                console.log("set state");
                console.log(JSON.stringify(c.options));
                this.setState({ selectedConditionOptions: c.options, selectedConditionId: id });
            }
        }
    }

    handleTypeDropdownChange = (event) => {
        this.setState({ typeDropdownValue: event.target.value });
    }


    render() {
        console.log(this.props);
        console.log(this.state.selectedCondition);
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
                        <ConditionTree data={this.state.rule.flatConditions} handleChange={this.props.handleChange} handleConditionClick={this.handleConditionClick.bind(this)} />
                    }


                </AppContent>
                <AppEditor>
                    <Form>
                        <FormGroup >
                            <Label for="typeDropdown">Condition Type:</Label>
                            <select id="typeDropdown" className="form-control col-sm-4" onChange={this.handleTypeDropdownChange} value={this.state.typeDropdownValue}>
                                {this.state.typeDropdownOptions.map(item => (
                                    <option key={item.value} value={item.value}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup>
                            <Label for="exampleFormControlTextarea1">Condition Options</Label>
                            <Input type="textarea" id="exampleFormControlTextarea1" rows="10" value={JSON.stringify(this.state.selectedConditionOptions, undefined, 4)}></Input>
                        </FormGroup>
                        <Button color="primary">Save</Button>{' '}<Button color="danger">Cancel</Button>
                    </Form>
                </AppEditor>
            </AppMain>
        );
    }
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




class ConditionTree extends React.Component {

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

    ItemRenderer = (props) => {
        const {
            type, path, id, connectDragSource, connectDropTarget,
            isDragging, isClosestDragging
        } = props;
        const style = {
            ...itemStyle,
            ...(isDragging || isClosestDragging ? muteStyle : null),
            marginLeft: path.length * 30,
        };

        const handleClick = () => {
            console.log(id);
            this.props.handleConditionClick(id);
        }

        const el = <div style={style} onClick={handleClick}>{type}</div>;
        return connectDragSource(connectDropTarget(el));
    };



    render() {
        const items = this.props.data;
        return (

            <Container>
                <Button onClick={this.handleClickAddNewItem}>Add New Item</Button>
                <Sortly
                    items={items}
                    itemRenderer={this.ItemRenderer}
                    onChange={this.handleChange}
                    onMove={this.handleMove}
                />
            </Container>

        );
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
