import React from "react";
import {
    Card,
    CardBody,
    CardText,
    CardTitle,
    Container
} from 'reactstrap';

const metaData = require('./metadata.json');

export class About extends React.Component {

    render() {
        return (
            <Container>
                <Card >
                    <CardBody>
                        <CardTitle>Scripts4MQTT</CardTitle>
                        <CardText>
                            <p>Build: {metaData.build}</p>
                            <p>Build date: {metaData.date}</p>
                        </CardText>
                    </CardBody>
                </Card>
            </Container>
        );
    }


}

