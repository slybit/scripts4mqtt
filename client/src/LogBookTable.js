import React from "react";
import ReactTable from 'react-table'
import axios from 'axios';

export class LogBookTable extends React.Component {

    constructor() {
        super();
        this.state = {
            logbook: []
        }
    }


    componentDidMount() {
        this.loadLogsFromServer();
    }

    loadLogsFromServer = () => {
        axios.get('/api/logbook')
            .then((response) => {
                this.setState({ logbook: response.data });
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
                Header: 'Message',
                accessor: 'message',                
                Cell: row => (
                    <span title={row.value}>
                        {row.value}
                    </span>
                  )
            }];

        return <div><ReactTable
            data={this.state.logbook}
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

