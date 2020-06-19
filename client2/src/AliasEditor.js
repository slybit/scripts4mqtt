import React from "react";
import { Title, Container, AppContent, AppMain, AppEditor, RightColumn} from "./containers";
import { Button, FormGroup, Label, InputGroup, InputGroupAddon, Input } from 'reactstrap';
import Icon from '@mdi/react'
import { mdiCancel, mdiCheck, mdiClose } from '@mdi/js'




export class AliasEditor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            topic: ""
        };

    }


    handleTopicCancelClick = () => {
        this.setState({ topic: "" });
    }

    handleTopicSaveClick = () => {
        this.props.addTopic(this.state.topic);
        this.setState({ topic: "" });
    }

    onTopicChange = (e) => {
        this.setState({ topic: e.target.value });
    }




    render() {

        let items = this.props.topics.map((item, index) => {
            return (
                <Button key={item} color="dark" outline className="aliasButton">{item}<Icon path={mdiClose} size={1} color="gray" onClick={() => { this.props.deleteTopic(index); }} /></Button>
            )
        });


        return (
            <RightColumn>
                <AppContent>
                    <Container>
                        <Title>{this.props.selectedAlias}</Title>
                    </Container>

                    <FormGroup>
                        <Label for="topic">New topic:</Label>
                        <InputGroup>
                            <Input id="topic" key="topic"
                                value={this.state.topic}
                                onChange={this.onTopicChange}
                                onKeyPress={event => {
                                    if (event.key === "Enter") {
                                        this.handleTopicSaveClick();
                                    }
                                }}>
                            </Input>
                            {this.state.topic !== "" && <InputGroupAddon addonType="append">
                                <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={this.handleTopicSaveClick} /></Button>
                                <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={this.handleTopicCancelClick} /></Button>
                            </InputGroupAddon>}
                        </InputGroup>
                    </FormGroup>




                </AppContent>
                <AppEditor>
                {items}
                </AppEditor>
            </RightColumn>


        );
    }
}










