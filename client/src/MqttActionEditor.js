import React from "react";
import { AppEditor, Title } from "./containers";
import { Col, Button, Form, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { staticData } from './utils'

/* --------------------------------------------------------------------------------------------------------------------
  Styles

  https://github.com/rajeshpillai/react-dynamic-form/blob/master/src/App.js
  https://reactstrap.github.io/components/form/
  https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#recommendation-fully-controlled-component

-------------------------------------------------------------------------------------------------------------------- */

const textInputStyle = {
    fontFamily: 'monospace',
    fontSize: '1.1rem'
}

const spacerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
};

/* --------------------------------------------------------------------------------------------------------------------
  Main Component
-------------------------------------------------------------------------------------------------------------------- */

export class MqttActionEditor extends React.Component {

    constructor(props) {
        super(props);
        console.log(props);
        this.state = {};
        Object.assign(this.state, props.action);        
        console.log(this.state);
    }

    onChange = (e, key,type="single") => {
        console.log(`${key} changed ${e.target.value} type ${type}`);
        if (type === "single") {
            this.setState({
                [key]: e.target.value  
            });
        }
    }



    render() {
        return (
            <AppEditor>
                <Title>MQTT Action</Title>
                <FormGroup row>
                    <Label for="topic" sm={2}>Topic</Label>
                    <Col sm={10}>
                        <Input  type="text" id="topic" value={this.state.topic} onChange={(e)=>{this.onChange(e, "topic")}}></Input>
                    </Col>
                </FormGroup>
                <FormGroup row>
                    <Label for="value" sm={2}>Value</Label>
                    <Col sm={10}>
                        <Input  type="text" id="value" value={this.state.val} onChange={(e)=>{this.onChange(e, "val")}}></Input>                    
                    </Col>
                </FormGroup>
                <Form className="form">                    
                    <FormGroup style={spacerStyle}>
                        <Button color="danger" outline >Delete</Button>
                        <span>
                            <Button color="primary" >Save</Button>{' '}
                            <Button color="primary" outline={true}>Cancel</Button>
                        </span>
                    </FormGroup>
                </Form>
            </AppEditor>
        );
    }

}