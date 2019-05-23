import React from "react";
import ReactTable from 'react-table'
import axios from 'axios';

export class RulesLogTable extends React.Component {

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
        axios.get('/api/logs/rules')
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
                id:  'timestamp',
                Header: 'Timestamp',
                accessor: 'timestamp',
                width: 150
            },
            {
                id: 2,
                Header: 'Rule name',
                accessor: 'ruleName',
                width: 200
            },
            {
                id: 3,
                Header: 'Type',
                accessor: 'type',
                width: 100
            },
            {
                id: 4,
                Header: 'Subtype',
                accessor: 'subtype',
                width: 100
            },
            {
                id: 5,
                Header: 'Level',
                accessor: 'level',
                width: 100
            },
            {
                id: 6,
                Header: 'Details',
                accessor: 'details'
            }]

        return <ReactTable
            data={this.state.logs}
            columns={columns}
            className="-striped -highlight grid"
            defaultSorted={[
                {
                  id: "timestamp",
                  desc: true
                }
              ]}
        />

    }


}

