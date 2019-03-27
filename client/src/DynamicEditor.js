import React from "react";
import { AppEditor, Title } from "./containers";
import { Button, Form, FormGroup, Label, Input, Alert, FormFeedback } from 'reactstrap';


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

export class DynamicEditor extends React.Component {

    constructor(props) {
        super(props);
        console.log(props);
        this.state = {};
        Object.assign(this.state, props.editorData);        
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

    handleSaveClick = () => {
        this.props.editorHandleSaveClick(this.state);
    }

    renderForm = () => {
        const model = this.props.model;

        const formUI = model.map( (m) => {
            let key = m.key;
            let type = m.type || "text";
            let props = m.props || {};
            let label= m.label;
            let target = key;  
            let value = this.state[target];

            let input = (<div></div>);
            if (type == "text" || type == "textarea") {
                input = <Input {...props}
                    type={type}                
                    id={key}
                    name={key}
                    value={value}
                    onChange={(e)=>{this.onChange(e, target)}}
                    />;
            } else if (type == "select") {
                const options = m.options.map((o) => {                                
                    return (<option key={o.value} value={o.value}>{o.label}</option>);
                });                
                //console.log("Select default: ", value);
                input = <select className="form-control" value={value} onChange={(e)=>{this.onChange(e, target)}}>{options}</select>;
            }
           
            
            return (
                <FormGroup key={'g' + key}>
                    <Label for={key}>{label}</Label>
                    {input}                    
                </FormGroup>
            );
        });

        return formUI;
    }



    render() {
        return (            
            <AppEditor>
                <Title>{this.props.title}</Title>                
                <Form className="form">                    
                    {this.renderForm()}
                    <Alert color="danger" isOpen={this.props.alertVisible === true}>
                        {this.props.alert}
                    </Alert>
                    <FormGroup style={spacerStyle}>
                        <Button color="danger" outline onClick={this.props.editorHandleDeleteClick}>Delete</Button>
                        <span>
                            <Button color="primary" onClick={this.handleSaveClick}>Save</Button>{' '}
                            <Button color="primary" outline={true} onClick={this.props.editorHandleCancelClick}>Cancel</Button>
                        </span>
                    </FormGroup>
                </Form>
            </AppEditor>            
        );
    }

}

