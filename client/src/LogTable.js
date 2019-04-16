import React from "react";
import ReactTable from 'react-table'
import axios from 'axios';

export class LogTable extends React.Component {

    constructor() {
        super();
        this.state = {
            logs: []
        }
    }


    componentDidMount() {
        this.loadLogsFromServer();
    }

    loadLogsFromServer = () => {
        axios.get('/api/logs')
            .then((response) => {
                this.setState({ logs: response.data, logsVisible: true });
            })
            .catch((error) => {
                // TODO: inform user
                console.log(error);
            });
    }


    render() {
        const columns = [
            {
                Header: 'Timestamp',
                accessor: 'timestamp',
                width: 150
            },
            {
                Header: 'Rule name',
                accessor: 'ruleName',
                width: 200
            },
            {
                Header: 'Type',
                accessor: 'type',
                width: 100
            }, {
                Header: 'Subtype',
                accessor: 'subtype',
                width: 100
            }, {
                Header: 'Level',
                accessor: 'level',
                width: 100
            }, {
                Header: 'Details',
                accessor: 'details'
            }]

        return <ReactTable
            data={this.state.logs}
            columns={columns}
            className="-striped -highlight"
            defaultSorted={[
                {
                  id: "timestamp",
                  desc: true
                }
              ]}
        />

    }


}

