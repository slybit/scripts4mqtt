import React from "react";
import axios from 'axios';
import { showError } from './utils.js';

export class About extends React.Component {

    constructor() {
        super();
        this.state = {
            about: ""
        }
    }


    componentDidMount() {
        this.loadAboutFromServer();
    }

    loadAboutFromServer = () => {
        axios.get('/api/about')
            .then((response) => {
                this.setState({ about: response.data.about });
            })
            .catch((error) => {
                // TODO: inform user
                console.log(error);
            });
    }

    render() {
        return (
            <div>About
            </div>
        );
    }


}

