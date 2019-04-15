import React from "react";
import ReactTable from 'react-table'

export class LogTable extends React.Component {

    constructor(props) {
        super(props);
        console.log(props.data);
    }


    render() {
        const columns = [{
            Header: 'Rule ID',
            accessor: 'ruleId' // String-based value accessors!
        },
            {
            Header: 'Type',
            accessor: 'type' // String-based value accessors!
        }, {
            Header: 'Subtype',
            accessor: 'subtype',
        }, {
            Header: 'Level',
            accessor: 'level'
        }, {
            Header: 'Details',
            accessor: 'details'
        }]

        return <ReactTable
            data={this.props.data}
            columns={columns}
        />

    }


}

