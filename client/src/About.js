import React from "react";
import {
    Card,
    CardBody,
    CardText,
    CardTitle,
    Container
} from 'reactstrap';
import axios from 'axios';
import { showError } from './utils.js';

export class About extends React.Component {

    constructor() {
        super();
        this.state = {
            meta: ""
        }
    }


    componentDidMount() {
        this.loadMetaFromServer();
    }

    loadMetaFromServer = () => {
        axios.get('/api/meta')
            .then((response) => {
                this.setState({ meta: response.data.meta });
            })
            .catch((error) => {
                // TODO: inform user
                console.log(error);
            });
    }

    render() {
        return (
            <Container>
            <Card >
                <CardBody>
                    <CardTitle>Scripts4MQTT</CardTitle>
                    <CardText>
                        <p>Build: {this.state.meta.build}</p>
                        <p>Build date: {this.state.meta.date}</p>
                    </CardText>

                </CardBody>
            </Card>
            </Container>
        );
    }


}

