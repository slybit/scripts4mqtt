import React from "react";
import { Title, Container } from "./containers";
import { Button } from 'reactstrap';
import Sortly from 'react-sortly';


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
        isDragging, isClosestDragging,
    } = props;
    const style = {
        ...itemStyle,
        ...(isDragging || isClosestDragging ? muteStyle : null),
        marginLeft: path.length * 30,
    };
    const el = <div style={style}>{type}</div>;
    return connectDragSource(connectDropTarget(el));
};


class MyApp extends React.Component {

    handleChange = (items) => {
        this.props.handleChange( items );
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

    render() {
        const items = this.props.data;
        return (
            <Container>
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



export class EditRule extends React.Component {
    render() {
        console.log(this.props);
        return (
            <div>
                <Title>
                    <Button>Delete Rule</Button>
                    {this.props.id ? this.props.id : 'Please select a rule from the list to edit or create a new rule.'}
                </Title>
                <pre className='code'>
                    {JSON.stringify(this.props.rule.flatConditions, undefined, 4)}
                </pre>

                {this.props.rule.name &&
                        <_Condition data={this.props.rule.condition} />
                }


                {this.props.rule.name &&
                        <MyApp data={this.props.rule.flatConditions} handleChange={this.props.handleChange} />
                }


            </div>
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
