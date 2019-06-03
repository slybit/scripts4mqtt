import React from "react";
import ReactTable from 'react-table'
import axios from 'axios';

export class MqttLogTable extends React.Component {

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
        axios.get('/api/logs/mqtt')
            .then((response) => {
                this.setState({ logs: response.data });
            })
            .catch((error) => {
                // TODO: inform user
                console.log(error);
            });
    }


    render() {
        const columns = [
            {
                id: 'timestamp',
                Header: 'Timestamp',
                accessor: 'timestamp',                
                width: 150
            },
            {
                id: 2,
                Header: 'Topic',
                accessor: 'topic',
                width: 300,
                Cell: row => (
                    <span title={row.value}>
                        {row.value}
                    </span>
                  )
            },
            {
                id: 3,
                Header: 'Message',
                accessor: 'msg'
            }]

        return <div><ReactTable
            data={this.state.logs}
            filterable
            defaultFilterMethod={(filter, row) =>
                String(row[filter.id]).includes(filter.value)}
            columns={columns}
            className="-striped -highlight grid"
            defaultSorted={[
                {
                  id: "timestamp",
                  desc: true
                }
              ]}
        /></div>

    }


}

