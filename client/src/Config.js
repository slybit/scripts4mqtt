import React from "react";
import axios from 'axios';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';

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


    render() {
        return (
            <div className="container_editor_area">
            <Editor
                value={this.state.config}
                onValueChange={config => this.setState({ config })}
                highlight={config => highlight(config, languages.js)}
                padding={10}
                className="container__editor"
            />
            </div>
        );
    }


}

