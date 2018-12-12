import React from "react";
import { Title, Container } from "./containers";
import { Button } from 'reactstrap';

export class EditRule extends React.Component {
    render() {
        console.log(this.props);
        return (
            <div>
                <Title>
                    {this.props.id ? this.props.id : 'Please select a rule from the list to edit or create a new rule.'}
                </Title>
                <pre className='code'>
                    {JSON.stringify(this.props.rule.condition, undefined, 4)}
                </pre>
                <Container>
                    {this.props.rule.name && 
                        <Condition data={this.props.rule.condition}/>
                    }
                </Container>
                
            </div>
        );
    }
}

class Condition extends React.Component {

    renderUI() {
        if (!this.props.data) {
            return(<div>No condition</div>);
        }
        if (this.props.data.type === 'or' || this.props.data.type === 'and') {
            let ui = [];
            for (let i in this.props.data.condition) {                
                ui.push(<Condition key={i} data={this.props.data.condition[i]}/>);
            }
            return ui;
        } /*else {
            return (
                <div>{this.props.data.type}</div>
            );
        }*/
    }

    render() {
        return (
            <Container>
                {this.props.data.type}                
                { this.renderUI() }
            </Container>
        );
    }
}
