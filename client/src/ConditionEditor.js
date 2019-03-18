import React from "react";
import { AppEditor, Title } from "./containers";
import { Button, Form, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { staticData } from './utils'

/* --------------------------------------------------------------------------------------------------------------------
  Styles
-------------------------------------------------------------------------------------------------------------------- */

const textInputStyle = {
    fontFamily: 'monospace',
    fontSize: '1.1rem'
}

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};

const spacerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
};

/* --------------------------------------------------------------------------------------------------------------------
  Main Component
-------------------------------------------------------------------------------------------------------------------- */

export class ConditionEditor extends React.Component {

    constructor(props) {
        super(props);
        console.log(this.props.condition);
    }

    renderLogicEditor() {
        return (
            <div>
                <Label for=""> Logic Condition Type:</Label>
                <FormGroup >
                    <Button disabled={this.props.condition.disabled} color="primary" onClick={this.props.handleConditionSaveClick}>AND</Button>{' '}
                    <Button disabled={this.props.condition.disabled} color="primary" >&nbsp;OR&nbsp;</Button>
                </FormGroup>
            </div>
        );
    }

    renderStandardEditor() {
        return (
            <div>
                <FormGroup >
                    <Label for="typeDropdown">Condition Type:</Label>
                    <select disabled={this.props.condition.disabled} id="typeDropdown" className="form-control col-sm-4" onChange={this.props.handleConditionTypeDropdownChange} value={this.props.condition.type}>
                        {Object.keys(staticData.conditions).map(key => (
                            <option key={key} value={key}>
                                {staticData.conditions[key]}
                            </option>
                        ))}
                    </select>
                </FormGroup>
                <FormGroup>
                    <Label for="exampleFormControlTextarea1">Condition Options</Label>
                    <Input disabled={this.props.condition.disabled} invalid={!this.props.condition.optionsValid} style={textInputStyle} type="textarea" id="exampleFormControlTextarea1" rows="10" value={this.props.condition.options} onChange={this.props.handleConditionOptionsChange}></Input>
                    <FormFeedback>Oh noes! that name is already taken</FormFeedback>
                </FormGroup>
            </div>
        );
    }

    render() {
        return (
            <AppEditor>
                <Title>Edit condition</Title>
                <Form className="form">
                    { (this.props.condition.type == "or" || this.props.condition.type == "and") && this.renderLogicEditor()}
                    { !(this.props.condition.type == "or" || this.props.condition.type == "and") && this.renderStandardEditor()}
                    <FormGroup style={spacerStyle}>
                        <Button disabled={this.props.condition.disabled} color="danger" onClick={this.props.handleConditionDeleteClick}>Delete</Button>
                        <span>
                            <Button disabled={this.props.condition.disabled} color="primary" onClick={this.props.handleConditionSaveClick}>Save</Button>{' '}
                            <Button disabled={this.props.condition.disabled} color="primary" outline={true}>Cancel</Button>
                        </span>
                    </FormGroup>
                </Form>
            </AppEditor>
        );
    }

}