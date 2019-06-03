import React from "react";
import ReactTable from 'react-table'
import axios from 'axios';

export class StoreTable extends React.Component {

    constructor() {
        super();
        this.state = {
            store: []
        }
    }


    componentDidMount() {
        this.loadLogsFromServer();
    }

    loadLogsFromServer = () => {
        axios.get('/api/store')
            .then((response) => {
                this.setState({ store: response.data });
            })
            .catch((error) => {
                // TODO: inform user
                console.log(error);
            });
    }


    render() {
        const columns = [
            {
                id: 'topic',
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
                id: 2,
                Header: 'Value',
                accessor: 'value'
            }]

        return <div><ReactTable
            data={this.state.store}
            filterable
            defaultFilterMethod={(filter, row) =>
                String(row[filter.id]).includes(filter.value)}
            columns={columns}
            className="-striped -highlight grid"
            defaultSorted={[
                {
                  id: "topic",
                  desc: true
                }
              ]}
        /></div>

    }


}

