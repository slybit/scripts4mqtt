import React from "react";
import { Title, Container, AppEditor, AppContent, AppMain } from "./containers";
import { Button } from 'reactstrap';
import Sortly, { convert, add, insert, remove } from 'react-sortly';

export class EditRule extends React.Component {
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
                        {JSON.stringify(this.props.rule.flatConditions, undefined, 4)}
                    </pre>

                    {false && this.props.rule.name &&
                        <_Condition data={this.props.rule.condition} />
                    }


                    {this.props.rule.name &&
                        <ConditionTree data={this.props.rule.flatConditions} handleChange={this.props.handleChange} />
                    }


                </AppContent>
                <AppEditor>
                    <div className="form-group">
                        <label for="exampleFormControlTextarea1">Example textarea</label>
                        <textarea className="form-control" id="exampleFormControlTextarea1" rows="3">test123</textarea>
                    </div>
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

const ItemRenderer = (props) => {
    const {
        type, path, connectDragSource, connectDropTarget,
        isDragging, isClosestDragging, index
    } = props;
    const style = {
        ...itemStyle,
        ...(isDragging || isClosestDragging ? muteStyle : null),
        marginLeft: path.length * 30,
    };

    const handleClick = () => {
        console.log(index);
    }

    const el = <div style={style} onClick={handleClick}>{type}</div>;
    return connectDragSource(connectDropTarget(el));
};


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

    

    render() {
        const items = this.props.data;
        return (

            <Container>
                <button type="button" className="btn btn-primary" onClick={this.handleClickAddNewItem}>Add New Item</button>
                <Sortly
                    items={items}
                    itemRenderer={ItemRenderer}
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
