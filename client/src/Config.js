import React from "react";
import { Button } from 'reactstrap';
import axios from 'axios';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import { showError } from './utils.js';
//import 'prismjs/components/prism-clike';
require('prismjs/components/prism-yaml');
//import 'prismjs/components/prism-json';


export class Config extends React.Component {

    constructor() {
        super();
        this.state = {
            config: ""
        }
    }


    componentDidMount() {
        this.loadConfigFromServer();
    }

    loadConfigFromServer = () => {
        axios.get('/api/config')
            .then((response) => {
                this.setState({ config: response.data.config });
            })
            .catch((error) => {
                // TODO: inform user
                console.log(error);
            });
    }

    pushConfigToServer = () => {
        axios.post('/api/config', {config : this.state.config})
            .then((response) => {
                // update the state
                if (!response.data.success) {
                    console.log(response.data);
                    showError("Could not save config file.", response.data.error);
                } else {
                    showError("New configuration saved to server.", "Server has been restarted.");
                }
            })
            .catch((error) => {
                // TODO: alert user
                console.log(error);
            });
    }



    render() {
        return (
            <div>
                <div style={{ margin: "20px" }}>
                    <Button color="primary" onClick={this.pushConfigToServer}>&nbsp;&nbsp;&nbsp;Save&nbsp;&nbsp;&nbsp;</Button>
                </div>

                <div className="container_editor_area">
                    <Editor
                        value={this.state.config}
                        onValueChange={config => this.setState({ config })}
                        highlight={config => highlight(config, languages.yaml)}
                        padding={10}
                        className="container__editor"
                    />
                </div>
            </div>
        );
    }


}

