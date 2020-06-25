import React, { useState, useEffect } from "react";
import { Table, Button, Container, Row, Col } from 'reactstrap';
import { AppContainer, AppFooter, AppBody, AppNav, AppColumn2, AppColumn10, RightColumn } from './containers.js';
import axios from 'axios';
import styled from 'styled-components'
import { useTable, usePagination, useFilters } from 'react-table'

//✓☑✅' : '☐❌✗'

const Styles = styled.div`
  /* This is required to make the table full-width */
  display: block;
  max-width: 100%;



  table {
    /* Make sure the inner table is always as wide as needed */
    width: 100%;
    border-spacing: 0;
    border: 2px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      /* The secret sauce */
      /* Each cell should grow equally */
      width: 1%;
      /* But "collapsed" cells should be as small as possible */
      &.narrow {
        width: 0.0000000001%;
      }

      :last-child {
        border-right: 0;
      }
    }
  }


`



// Define a default UI for filtering
function DefaultColumnFilter({
    column: { filterValue, preFilteredRows, setFilter },
}) {
    const count = preFilteredRows.length

    return (
        <input
            value={filterValue || ''}
            onChange={e => {
                setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
            }}
            placeholder={`Search ...`}
        />
    )
}

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
    column: { filterValue, setFilter, preFilteredRows, id },
}) {
    // Calculate the options for filtering
    // using the preFilteredRows
    const options = React.useMemo(() => {
        const options = new Set()
        preFilteredRows.forEach(row => {
            if (row.values[id] !== undefined) options.add(row.values[id])
        })
        return [...options.values()]
    }, [id, preFilteredRows])

    // Render a multi-select box
    return (
        <select
            value={filterValue}
            onChange={e => {
                setFilter(e.target.value || undefined)
            }}
        >
            <option value="">All</option>
            {options.map((option, i) => (
                <option key={i} value={option}>
                    {option}
                </option>
            ))}
        </select>
    )
}


function TheTable({ columns, data }) {

    const defaultColumn = React.useMemo(
        () => ({
            // Let's set up our default Filter UI
            Filter: DefaultColumnFilter
        }),
        []
    )


    // Use the state and functions returned from useTable to build your UI
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        page, // Instead of using 'rows', we'll use page,
        // which has only the rows for the active page

        // The rest of these things are super handy, too ;)
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data,
            defaultColumn,
            initialState: { pageIndex: 0, pageSize: 20 },
        },
        useFilters,
        usePagination
    );



    // Render the UI for your table
    return (
        <AppColumn10>
            <pre>
                <code>
                    {JSON.stringify(
                        {
                            pageIndex,
                            pageSize,
                            pageCount,
                            canNextPage,
                            canPreviousPage,
                        },
                        null,
                        2
                    )}
                </code>
            </pre>
            <Table striped  {...getTableProps()}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th
                                    {...column.getHeaderProps({
                                        className: column.narrow ? 'narrow' : '',
                                    })}
                                >
                                    {column.render('Header')}
                                    {/* Render the columns filter UI */}
                                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row, i) => {
                        prepareRow(row)
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map(cell => {
                                    return <td
                                        {...cell.getCellProps({
                                            className: cell.column.narrow ? 'narrow' : '',
                                        })}
                                    >
                                        {cell.render('Cell')}
                                    </td>
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </Table>
            {/*
            Pagination can be built however you'd like.
            This is just a very basic UI implementation:
          */}
            <div className="pagination">
                <Button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                    {'<<'}
                </Button>{' '}
                <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
                    {'<'}
                </Button>{' '}
                <Button onClick={() => nextPage()} disabled={!canNextPage}>
                    {'>'}
                </Button>{' '}
                <Button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                    {'>>'}
                </Button>{' '}
                <span>
                    Page{' '}
                    <strong>
                        {pageIndex + 1} of {pageOptions.length}
                    </strong>{' '}
                </span>
                <span>
                    | Go to page:{' '}
                    <input
                        type="number"
                        defaultValue={pageIndex + 1}
                        onChange={e => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0
                            gotoPage(page)
                        }}
                        style={{ width: '100px' }}
                    />
                </span>{' '}
                <select
                    value={pageSize}
                    onChange={e => {
                        setPageSize(Number(e.target.value))
                    }}
                >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </AppColumn10>
    )
}


export function RulesLogTable() {

    const [data, setData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const response = await axios.get('/api/logs/rules');

            setData(response.data);
        };
        fetchData();
    }, []);

    const columns = [
        {
            Header: 'Timestamp',
            accessor: 'timestamp',
            narrow: true
        },
        {
            Header: 'Rule name',
            accessor: 'ruleName',
            Filter: SelectColumnFilter,
            filter: 'includes',
            narrow: true,
        },
        {
            Header: 'Type',
            accessor: 'type',
            Filter: SelectColumnFilter,
            filter: 'equals',
            narrow: true,
        },
        {
            Header: 'Subtype',
            accessor: 'subtype',
            Filter: SelectColumnFilter,
            filter: 'equals',
            narrow: true,
        },
        {
            Header: 'Old State',
            accessor: 'oldState',
            Filter: SelectColumnFilter,
            filter: 'equals',
            narrow: true,
            Cell: ({ cell }) => {
                return (<div style={{textAlign: 'center'}}>{cell.value === undefined ? null : cell.value === 'true' ? '✓' : '✗'}</div>);
            }
        },
        {
            Header: 'State',
            accessor: 'state',
            Filter: SelectColumnFilter,
            filter: 'equals',
            narrow: true,
            Cell: ({ cell }) => {
                return (<div style={{textAlign: 'center'}}>{cell.value === undefined ? null : cell.value === 'true' ? '✓' : '✗'}</div>);
            }
        },
        {
            Header: 'Triggered',
            accessor: 'triggered',
            Filter: SelectColumnFilter,
            filter: 'equals',
            narrow: true,
            Cell: ({ cell }) => {
                return (<div style={{textAlign: 'center'}}>{cell.value === undefined ? null : cell.value === 'true' ? '✅' : '✗'}</div>);
            }
        },
        {
            Header: 'Details',
            accessor: 'details'
        }];

    return (

        <Styles>
            <TheTable columns={columns} data={data} />
        </Styles>


    )



}




