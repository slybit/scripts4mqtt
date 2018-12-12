import React from "react";
import { Title } from "./containers";

export class EditRule extends React.Component {
    render() {
        return (
            <div>
                <Title>
                    {this.props.id ? this.props.id : 'Please select a rule from the list to edit or create a new rule.'}
                </Title>
                <pre className='code'>
                    {JSON.stringify(this.props.rule, undefined, 4)}
                </pre>
            </div>
        );
    }
}
