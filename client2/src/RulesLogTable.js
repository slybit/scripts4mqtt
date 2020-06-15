import React, { useState, useEffect } from "react";
import { Table, Button, Container, Row, Col } from 'reactstrap';
import { AppContainer, AppFooter, AppBody, AppNav, AppColumn2, AppColumn10 } from './containers.js';
import axios from 'axios';
import styled from 'styled-components'
import { useTable, usePagination  } from 'react-table'


function TheTable({ columns, data }) {
    // Use the state and functions returned from useTable to build your UI
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
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
          initialState: { pageIndex: 2, pageSize: 50 },
        },
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
          <Table striped bordered  size="sm" {...getTableProps()}>
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()}>{column.render('Header')}</th>
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
                      return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
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
        console.log(response.data);
        setData(response.data);
      };
      fetchData();
    }, []);

    const columns = [
        {
            id: 'timestamp',
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
            id: 6,
            Header: 'Details',
            accessor: 'details'
        }];

        return (

              <TheTable columns={columns} data={data} />

          )



}




